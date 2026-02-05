/**
 * Audit logging utility for tracking sensitive operations
 * Logs admin actions, authentication events, and critical operations
 */

export enum AuditAction {
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  
  // Admin actions
  ADMIN_DELETE_CAMPAIGN = 'ADMIN_DELETE_CAMPAIGN',
  ADMIN_VIEW_ALL_CAMPAIGNS = 'ADMIN_VIEW_ALL_CAMPAIGNS',
  ADMIN_SEED_DATA = 'ADMIN_SEED_DATA',
  
  // Campaign actions
  CAMPAIGN_CREATE = 'CAMPAIGN_CREATE',
  CAMPAIGN_UPDATE = 'CAMPAIGN_UPDATE',
  CAMPAIGN_DELETE = 'CAMPAIGN_DELETE',
  CAMPAIGN_CLOSE = 'CAMPAIGN_CLOSE',
  
  // Sponsorship actions
  SPONSORSHIP_CREATE = 'SPONSORSHIP_CREATE',
  SPONSORSHIP_PAYMENT_STATUS_UPDATE = 'SPONSORSHIP_PAYMENT_STATUS_UPDATE',
  SPONSORSHIP_LOGO_APPROVE = 'SPONSORSHIP_LOGO_APPROVE',
  SPONSORSHIP_LOGO_REJECT = 'SPONSORSHIP_LOGO_REJECT',
  
  // Payment actions
  PAYMENT_INTENT_CREATE = 'PAYMENT_INTENT_CREATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  
  // Security events
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
}

export enum AuditLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

interface AuditLogEntry {
  timestamp: Date;
  action: AuditAction;
  level: AuditLevel;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  success: boolean;
  errorMessage?: string;
}

/**
 * Logs an audit event
 */
export const logAudit = (entry: Omit<AuditLogEntry, 'timestamp'>): void => {
  const logEntry: AuditLogEntry = {
    timestamp: new Date(),
    ...entry,
  };

  // Format log message
  const logMessage = formatAuditLog(logEntry);

  // Log to console (in production, this should go to a logging service)
  switch (entry.level) {
    case AuditLevel.CRITICAL:
    case AuditLevel.ERROR:
      console.error(logMessage);
      break;
    case AuditLevel.WARNING:
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }

  // In production, you would also:
  // 1. Write to a database table for audit trail
  // 2. Send to a logging service (e.g., CloudWatch, Datadog, Sentry)
  // 3. Alert on critical events
  
  // Example: Save to database (implement this in production)
  // await AuditLog.create(logEntry);
};

/**
 * Formats an audit log entry for display
 */
const formatAuditLog = (entry: AuditLogEntry): string => {
  const parts = [
    `[AUDIT]`,
    `[${entry.level}]`,
    `[${entry.timestamp.toISOString()}]`,
    `Action: ${entry.action}`,
  ];

  if (entry.userId) {
    parts.push(`User: ${entry.userId}`);
  }

  if (entry.userEmail) {
    parts.push(`Email: ${entry.userEmail}`);
  }

  if (entry.ipAddress) {
    parts.push(`IP: ${entry.ipAddress}`);
  }

  if (entry.resourceType && entry.resourceId) {
    parts.push(`Resource: ${entry.resourceType}/${entry.resourceId}`);
  }

  parts.push(`Success: ${entry.success}`);

  if (entry.errorMessage) {
    parts.push(`Error: ${entry.errorMessage}`);
  }

  if (entry.details) {
    parts.push(`Details: ${JSON.stringify(entry.details)}`);
  }

  return parts.join(' | ');
};

/**
 * Helper to extract IP address from request
 */
export const getClientIp = (req: any): string => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

/**
 * Helper to log authentication events
 */
export const logAuthEvent = (
  action: AuditAction,
  success: boolean,
  userId?: string,
  userEmail?: string,
  ipAddress?: string,
  errorMessage?: string
): void => {
  logAudit({
    action,
    level: success ? AuditLevel.INFO : AuditLevel.WARNING,
    userId,
    userEmail,
    ipAddress,
    success,
    errorMessage,
  });
};

/**
 * Helper to log admin actions
 */
export const logAdminAction = (
  action: AuditAction,
  userId: string,
  userEmail: string,
  ipAddress: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): void => {
  logAudit({
    action,
    level: AuditLevel.INFO,
    userId,
    userEmail,
    ipAddress,
    resourceType,
    resourceId,
    details,
    success: true,
  });
};

