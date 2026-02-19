/**
 * Security Action Logger
 *
 * Logs security-relevant actions for audit trails and monitoring.
 * In production, these logs should be sent to a centralized logging service.
 */

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  SIGNUP = 'auth.signup',
  PASSWORD_RESET_REQUEST = 'auth.password_reset.request',
  PASSWORD_RESET_COMPLETE = 'auth.password_reset.complete',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_DISABLED = 'auth.mfa.disabled',
  MFA_CHALLENGE = 'auth.mfa.challenge',

  // Authorization events
  UNAUTHORIZED_ACCESS = 'authz.access.denied',
  ROLE_CHANGE = 'authz.role.changed',
  PERMISSION_DENIED = 'authz.permission.denied',

  // Data access events
  DATA_EXPORT = 'data.export',
  DATA_DELETION = 'data.deletion',
  PII_ACCESS = 'data.pii.access',
  BULK_OPERATION = 'data.bulk_operation',

  // Security events
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  CSRF_DETECTED = 'security.csrf.detected',
  XSS_ATTEMPT = 'security.xss.attempt',
  SQL_INJECTION_ATTEMPT = 'security.sql_injection.attempt',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_ISSUED = 'payment.refund',

  // Admin events
  ADMIN_ACTION = 'admin.action',
  CONFIG_CHANGE = 'admin.config.changed',
  USER_IMPERSONATION = 'admin.impersonation',

  // Client portal events
  CLIENT_INVITE_SENT = 'client.invite.sent',
  CLIENT_INVITE_ACCEPTED = 'client.invite.accepted',
  CONTENT_APPROVED = 'client.content.approved',
  CONTENT_REJECTED = 'client.content.rejected'
}

export interface SecurityLogEntry {
  eventType: SecurityEventType;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  success: boolean;
  metadata?: Record<string, any>;
  timestamp: string;
  correlationId?: string;
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  details: Partial<SecurityLogEntry>
): void {
  const entry: SecurityLogEntry = {
    eventType,
    success: details.success ?? true,
    timestamp: new Date().toISOString(),
    ...details
  };

  // In production, send to centralized logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service (e.g., Datadog, LogRocket, Sentry)
    console.log('[SECURITY]', JSON.stringify(entry));
  } else {
    // Development: pretty print
    console.log('[SECURITY]', {
      event: eventType,
      user: entry.userEmail || entry.userId,
      success: entry.success,
      resource: entry.resource,
      timestamp: entry.timestamp
    });
  }

  // Store in database for audit trail (async, don't block)
  storeAuditLog(entry).catch(err => {
    console.error('Failed to store audit log:', err);
  });
}

/**
 * Store audit log in database
 */
async function storeAuditLog(entry: SecurityLogEntry): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { supabaseAdmin } = await import('./supabase');

    await supabaseAdmin.from('audit_logs').insert({
      event_type: entry.eventType,
      user_id: entry.userId || null,
      user_email: entry.userEmail || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      resource: entry.resource || null,
      action: entry.action || null,
      success: entry.success,
      metadata: entry.metadata || {},
      correlation_id: entry.correlationId || null,
      created_at: entry.timestamp
    });
  } catch (error) {
    // Fail silently - logging should never break the application
    if (process.env.NODE_ENV !== 'production') {
      console.error('Audit log storage failed:', error);
    }
  }
}

/**
 * Helper to extract client info from request
 */
export function getClientInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Convenience functions for common security events
 */

export function logLoginAttempt(
  email: string,
  success: boolean,
  request?: Request
): void {
  const clientInfo = request ? getClientInfo(request) : {};

  logSecurityEvent(
    success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    {
      userEmail: email,
      success,
      ...clientInfo
    }
  );
}

export function logUnauthorizedAccess(
  userId: string | undefined,
  resource: string,
  request?: Request
): void {
  const clientInfo = request ? getClientInfo(request) : {};

  logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
    userId,
    resource,
    success: false,
    ...clientInfo
  });
}

export function logDataExport(
  userId: string,
  resourceType: string,
  recordCount: number,
  request?: Request
): void {
  const clientInfo = request ? getClientInfo(request) : {};

  logSecurityEvent(SecurityEventType.DATA_EXPORT, {
    userId,
    resource: resourceType,
    success: true,
    metadata: { recordCount },
    ...clientInfo
  });
}

export function logRateLimitExceeded(
  identifier: string,
  endpoint: string,
  request?: Request
): void {
  const clientInfo = request ? getClientInfo(request) : {};

  logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
    success: false,
    resource: endpoint,
    metadata: { identifier },
    ...clientInfo
  });
}

export function logSuspiciousActivity(
  description: string,
  userId: string | undefined,
  request?: Request
): void {
  const clientInfo = request ? getClientInfo(request) : {};

  logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
    userId,
    success: false,
    metadata: { description },
    ...clientInfo
  });
}
