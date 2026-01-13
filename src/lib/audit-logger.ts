/**
 * Audit Logging Service
 *
 * Provides comprehensive audit trail functionality for compliance and security.
 * Logs all API calls, data modifications, and user actions.
 */

import { createClient } from '@supabase/supabase-js';

// Action types for audit logging
export enum AuditAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  AUTH = 'auth',
  EXPORT = 'export',
  IMPORT = 'import',
  PUBLISH = 'publish',
  APPROVE = 'approve',
  REJECT = 'reject',
}

// Common resource types
export enum AuditResource {
  BLOG_POST = 'blog_post',
  CONTENT_BATCH = 'content_batch',
  CLIENT = 'client',
  VENDOR = 'vendor',
  WEBSITE = 'website',
  USER = 'user',
  API_KEY = 'api_key',
  WEBHOOK = 'webhook',
  REPORT = 'report',
  NEWSLETTER = 'newsletter',
  COMMENT = 'comment',
  FILE = 'file',
  BRAND_GUIDE = 'brand_guide',
}

export interface AuditLogEntry {
  userId?: string;
  apiKeyId?: string;
  actionType: AuditAction | string;
  resourceType: AuditResource | string;
  resourceId?: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  vendorId?: string;
  clientId?: string;
  actionType?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Audit Logger Class
 * Handles logging of all audit events
 */
export class AuditLogger {
  private supabase: any;
  private startTime?: number;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    // Use service role key for audit logging (bypasses RLS)
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  /**
   * Start timing a request (call this at the start of your API handler)
   */
  startTimer(): void {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time since startTimer was called
   */
  getElapsedTime(): number | undefined {
    if (this.startTime) {
      return Date.now() - this.startTime;
    }
    return undefined;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Calculate duration if not provided
      const durationMs = entry.durationMs ?? this.getElapsedTime();

      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId || null,
          api_key_id: entry.apiKeyId || null,
          action_type: entry.actionType,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId || null,
          endpoint: entry.endpoint,
          method: entry.method,
          status_code: entry.statusCode || null,
          changes: entry.changes || null,
          metadata: entry.metadata || null,
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent || null,
          session_id: entry.sessionId || null,
          duration_ms: durationMs || null,
          success: entry.success ?? (entry.statusCode ? entry.statusCode >= 200 && entry.statusCode < 400 : true),
          error_message: entry.errorMessage || null,
        });

      if (error) {
        console.error('Failed to write audit log:', error);
        // Don't throw - audit logging failures shouldn't break the application
      }
    } catch (err) {
      console.error('Audit logging error:', err);
      // Silently fail - audit logging shouldn't break the app
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: AuditLogFilter): Promise<any[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }

      // Pagination
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Failed to query audit logs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Audit query error:', err);
      return [];
    }
  }

  /**
   * Get audit history for a specific resource
   */
  async getResourceHistory(resourceType: string, resourceId: string): Promise<any[]> {
    return this.query({
      resourceType,
      resourceId,
      limit: 100,
    });
  }

  /**
   * Export audit logs (creates an export record)
   */
  async exportLogs(
    userId: string,
    vendorId: string,
    exportType: 'csv' | 'json' | 'pdf',
    filters: AuditLogFilter
  ): Promise<string | null> {
    try {
      // Create export record
      const { data: exportRecord, error: exportError } = await this.supabase
        .from('audit_log_exports')
        .insert({
          user_id: userId,
          vendor_id: vendorId,
          export_type: exportType,
          filters: filters,
          status: 'processing',
          record_count: 0,
        })
        .select()
        .single();

      if (exportError) {
        console.error('Failed to create export record:', exportError);
        return null;
      }

      // Query the logs with filters
      const logs = await this.query({ ...filters, limit: 10000 });

      // Update export record with count
      await this.supabase
        .from('audit_log_exports')
        .update({
          record_count: logs.length,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportRecord.id);

      return exportRecord.id;
    } catch (err) {
      console.error('Export error:', err);
      return null;
    }
  }
}

/**
 * Helper function to extract request context from Next.js Request
 */
export function getRequestContext(request: Request): {
  ipAddress?: string;
  userAgent?: string;
  endpoint: string;
  method: string;
} {
  const url = new URL(request.url);

  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    endpoint: url.pathname,
    method: request.method,
  };
}

/**
 * Create a standard audit logger instance
 */
export function createAuditLogger(): AuditLogger {
  return new AuditLogger();
}

/**
 * Middleware wrapper for automatic audit logging
 * Usage: wrap your API handler with this function
 */
export function withAuditLogging(
  handler: (request: Request, context: any) => Promise<Response>,
  options: {
    actionType: AuditAction | string;
    resourceType: AuditResource | string;
    getResourceId?: (request: Request, context: any) => string | undefined;
    getMetadata?: (request: Request, context: any) => Record<string, any> | undefined;
  }
) {
  return async (request: Request, context: any): Promise<Response> => {
    const logger = createAuditLogger();
    logger.startTimer();

    const requestContext = getRequestContext(request);
    let response: Response;
    let error: Error | null = null;

    try {
      response = await handler(request, context);
    } catch (err) {
      error = err as Error;
      response = new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from context if available
    const userId = context?.params?.userId || context?.user?.id;
    const resourceId = options.getResourceId ? options.getResourceId(request, context) : undefined;
    const metadata = options.getMetadata ? options.getMetadata(request, context) : undefined;

    // Log the audit event (async, don't await to avoid slowing down response)
    logger.log({
      userId,
      actionType: options.actionType,
      resourceType: options.resourceType,
      resourceId,
      endpoint: requestContext.endpoint,
      method: requestContext.method,
      statusCode: response.status,
      metadata,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      success: response.ok,
      errorMessage: error?.message,
    }).catch(err => {
      console.error('Failed to log audit event:', err);
    });

    return response;
  };
}
