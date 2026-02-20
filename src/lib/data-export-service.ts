/**
 * Data Export Service
 *
 * Allows users to export their data in various formats
 * - JSON format (complete data)
 * - CSV format (tabular data)
 * - Complies with GDPR data portability requirements
 */

import { createClient } from '@supabase/supabase-js';

export type ExportFormat = 'json' | 'csv';

export interface ExportRequest {
  user_id: string;
  format: ExportFormat;
  include_deleted?: boolean;
}

export interface ExportData {
  metadata: {
    exported_at: string;
    user_id: string;
    format: ExportFormat;
  };
  profile: any;
  clients: any[];
  blog_posts: any[];
  comments: any[];
  notifications: any[];
  analytics: any[];
  files: any[];
}

/**
 * Generate complete data export for a user
 */
export async function generateDataExport(
  supabaseUrl: string,
  supabaseServiceKey: string,
  request: ExportRequest
): Promise<{ success: boolean; data?: string; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const exportData: ExportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        user_id: request.user_id,
        format: request.format,
      },
      profile: null,
      clients: [],
      blog_posts: [],
      comments: [],
      notifications: [],
      analytics: [],
      files: [],
    };

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.user_id)
      .single();

    exportData.profile = profile;

    // Get vendor_id if available
    const vendorId = profile?.vendor_id;

    // Get clients
    if (vendorId) {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', request.user_id);

      exportData.clients = clients || [];
    }

    // Get blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('created_by', request.user_id);

    exportData.blog_posts = blogPosts || [];

    // Get comments
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', request.user_id);

    exportData.comments = comments || [];

    // Get notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', request.user_id)
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to last 1000 notifications

    exportData.notifications = notifications || [];

    // Get analytics events
    const { data: analytics } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', request.user_id)
      .order('created_at', { ascending: false })
      .limit(5000); // Limit to last 5000 events

    exportData.analytics = analytics || [];

    // Get files
    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('uploaded_by', request.user_id);

    exportData.files = files || [];

    // Format data based on requested format
    if (request.format === 'json') {
      return {
        success: true,
        data: JSON.stringify(exportData, null, 2),
      };
    } else if (request.format === 'csv') {
      const csv = convertToCSV(exportData);
      return {
        success: true,
        data: csv,
      };
    } else {
      return {
        success: false,
        error: 'Unsupported export format',
      };
    }
  } catch (error: any) {
    console.error('Error generating data export:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: ExportData): string {
  const sections: string[] = [];

  // Profile section
  if (data.profile) {
    sections.push('=== USER PROFILE ===');
    sections.push(objectToCSV([data.profile]));
    sections.push('');
  }

  // Clients section
  if (data.clients.length > 0) {
    sections.push('=== CLIENTS ===');
    sections.push(objectToCSV(data.clients));
    sections.push('');
  }

  // Blog posts section
  if (data.blog_posts.length > 0) {
    sections.push('=== BLOG POSTS ===');
    sections.push(objectToCSV(data.blog_posts));
    sections.push('');
  }

  // Comments section
  if (data.comments.length > 0) {
    sections.push('=== COMMENTS ===');
    sections.push(objectToCSV(data.comments));
    sections.push('');
  }

  // Files section
  if (data.files.length > 0) {
    sections.push('=== FILES ===');
    sections.push(objectToCSV(data.files));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Convert array of objects to CSV
 */
function objectToCSV(arr: any[]): string {
  if (arr.length === 0) {
    return '';
  }

  // Get all unique keys
  const keys = Array.from(
    new Set(arr.flatMap((obj) => Object.keys(obj)))
  );

  // Create header row
  const header = keys.join(',');

  // Create data rows
  const rows = arr.map((obj) => {
    return keys
      .map((key) => {
        const value = obj[key];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Request data export and send download link via email
 */
export async function requestDataExport(
  supabaseUrl: string,
  supabaseServiceKey: string,
  userId: string,
  email: string,
  format: ExportFormat
): Promise<{ success: boolean; export_id?: string; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create export request record
    const { data: exportRecord, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        format,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Queue export job (will be processed by background worker)
    await supabase.from('job_queue').insert({
      job_type: 'data_export',
      payload: {
        export_id: exportRecord.id,
        user_id: userId,
        email,
        format,
      },
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      export_id: exportRecord.id,
    };
  } catch (error: any) {
    console.error('Error requesting data export:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get export request status
 */
export async function getExportStatus(
  supabaseUrl: string,
  supabaseServiceKey: string,
  exportId: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', exportId)
    .single();

  if (error || !data) {
    return {
      status: 'failed',
      error: 'Export request not found',
    };
  }

  return {
    status: data.status,
    download_url: data.download_url,
  };
}

/**
 * Delete expired exports (GDPR: data minimization)
 */
export async function cleanupExpiredExports(
  supabaseUrl: string,
  supabaseServiceKey: string,
  daysToKeep: number = 7
): Promise<{ deleted: number; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const expiryDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    // Get expired exports
    const { data: expiredExports } = await supabase
      .from('data_export_requests')
      .select('id, file_path')
      .eq('status', 'completed')
      .lt('completed_at', expiryDate);

    if (!expiredExports || expiredExports.length === 0) {
      return { deleted: 0 };
    }

    // Delete files from storage
    for (const exportRecord of expiredExports) {
      if (exportRecord.file_path) {
        const { error } = await supabase.storage
          .from('exports')
          .remove([exportRecord.file_path]);

        if (error) {
          console.error(`Error deleting export file ${exportRecord.file_path}:`, error);
        }
      }
    }

    // Delete export records
    const { error: deleteError } = await supabase
      .from('data_export_requests')
      .delete()
      .in(
        'id',
        expiredExports.map((e) => e.id)
      );

    if (deleteError) {
      throw deleteError;
    }

    return { deleted: expiredExports.length };
  } catch (error: any) {
    console.error('Error cleaning up expired exports:', error);
    return {
      deleted: 0,
      error: error.message || 'Unknown error',
    };
  }
}
