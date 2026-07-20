// ============================================
// Drishti Kavach — Comprehensive Logging Service
// Logs stored in database for 30 days (monthly partitioning)
// ============================================

const supabase = require('../db/supabase');
const crypto = require('crypto');

/**
 * Log level constants
 */
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  SUCCESS: 'success',
};

/**
 * Log categories
 */
const LOG_CATEGORIES = {
  AUTH: 'auth',
  API: 'api',
  SECURITY: 'security',
  SYSTEM: 'system',
  USER: 'user',
  DATABASE: 'database',
  NETWORK: 'network',
  AI: 'ai',
  EMAIL: 'email',
  DDOS: 'ddos',
};

/**
 * Default retention period in days (30 days as requested)
 */
const DEFAULT_RETENTION_DAYS = 30;

/**
 * Log an error event to error_logs table
 */
async function logError({ 
  error, 
  message, 
  context = {}, 
  websiteId = null, 
  userId = null,
  level = 'error' 
}) {
  try {
    const stackTrace = error instanceof Error ? error.stack : String(error);
    
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert({
        level,
        error_type: error?.name || 'Error',
        message: message || (error?.message || String(error)).substring(0, 1000),
        stack_trace: stackTrace?.substring(0, 10000),
        context: JSON.stringify(context),
        website_id: websiteId,
        user_id: userId,
        ip_address: context.ip || null,
        created_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('[LOG ERROR] Failed to insert error log:', insertError.message);
    }
    
    return { success: !insertError, error: insertError };
  } catch (loggingError) {
    console.error('[LOG ERROR] Failed to log error:', loggingError);
    return { success: false, error: loggingError };
  }
}

/**
 * Log a warning event
 */
async function logWarn({ message, context = {}, websiteId = null, userId = null }) {
  return logError({ 
    message, 
    context, 
    websiteId, 
    userId, 
    level: LOG_LEVELS.WARN 
  });
}

/**
 * Log an info event
 */
async function logInfo({ message, context = {}, websiteId = null, userId = null }) {
  return logError({ 
    message, 
    context, 
    websiteId, 
    userId, 
    level: LOG_LEVELS.INFO 
  });
}

/**
 * Log a debug event
 */
async function logDebug({ message, context = {}, websiteId = null, userId = null }) {
  return logError({ 
    message, 
    context, 
    websiteId, 
    userId, 
    level: LOG_LEVELS.DEBUG 
  });
}

/**
 * Log a success event
 */
async function logSuccess({ message, context = {}, websiteId = null, userId = null }) {
  return logError({ 
    message, 
    context, 
    websiteId, 
    userId, 
    level: LOG_LEVELS.SUCCESS 
  });
}

/**
 * Log authentication events to login_logs table
 */
async function logAuthEvent({ 
  type, 
  email, 
  ip, 
  success, 
  failureReason = null, 
  userId = null,
  userAgent = null,
  location = null
}) {
  try {
    const emailHash = crypto.createHash('sha512').update(email).digest('hex');
    
    const insertData = {
      user_id: userId,
      email,
      email_hash: emailHash,
      ip_address: ip,
      user_agent: userAgent,
      success,
      failure_reason: failureReason,
      location: location ? JSON.stringify(location) : null,
      created_at: new Date().toISOString(),
    };
    
    console.log('[LOG AUTH] Attempting to insert:', { email, ip, success, userId });
    
    const { data, error } = await supabase
      .from('login_logs')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('[LOG AUTH] Failed to insert auth log:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('[LOG AUTH] Successfully inserted auth log:', data?.[0]?.id);
    }
    
    return { success: !error, error };
  } catch (loggingError) {
    console.error('[LOG AUTH] Failed to log auth event:', loggingError);
    return { success: false, error: loggingError };
  }
}

/**
 * Log security events to system_audit_logs table
 */
async function logSecurityEvent({ 
  type, 
  severity, 
  description, 
  websiteId, 
  ip = null, 
  data = {} 
}) {
  try {
    const { error } = await supabase
      .from('system_audit_logs')
      .insert({
        action: `SECURITY_${type.toUpperCase()}`,
        entity_type: 'security',
        entity_id: websiteId,
        changed_by: 'system',
        old_values: JSON.stringify({ severity, description }),
        new_values: JSON.stringify({ ...data, ip, timestamp: new Date().toISOString() }),
        ip_address: ip,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[LOG SECURITY] Failed to insert security log:', error.message);
    }
    
    return { success: !error, error };
  } catch (loggingError) {
    console.error('[LOG SECURITY] Failed to log security event:', loggingError);
    return { success: false, error: loggingError };
  }
}

/**
 * Log API events to system_audit_logs table
 */
async function logApiEvent({ 
  endpoint, 
  method, 
  statusCode, 
  duration, 
  websiteId, 
  userId = null,
  ip = null,
  requestSize = null,
  responseSize = null 
}) {
  try {
    const { error } = await supabase
      .from('system_audit_logs')
      .insert({
        action: `API_${method.toUpperCase()}`,
        entity_type: 'api',
        entity_id: websiteId,
        changed_by: userId ? String(userId) : 'anonymous',
        old_values: JSON.stringify({ endpoint, method, ip }),
        new_values: JSON.stringify({ 
          status_code: statusCode,
          duration_ms: duration,
          request_size: requestSize,
          response_size: responseSize,
          timestamp: new Date().toISOString(),
        }),
        ip_address: ip,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[LOG API] Failed to insert API log:', error.message);
    }
    
    return { success: !error, error };
  } catch (loggingError) {
    console.error('[LOG API] Failed to log API event:', loggingError);
    return { success: false, error: loggingError };
  }
}

/**
 * Log user events to system_audit_logs table
 */
async function logUserEvent({ 
  action, 
  userId, 
  websiteId = null,
  details = {} 
}) {
  try {
    const { error } = await supabase
      .from('system_audit_logs')
      .insert({
        action,
        entity_type: 'user',
        entity_id: userId,
        changed_by: String(userId),
        old_values: JSON.stringify({}),
        new_values: JSON.stringify({ ...details, timestamp: new Date().toISOString() }),
        ip_address: details.ip || null,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[LOG USER] Failed to insert user log:', error.message);
    }
    
    return { success: !error, error };
  } catch (loggingError) {
    console.error('[LOG USER] Failed to log user event:', loggingError);
    return { success: false, error: loggingError };
  }
}

/**
 * Log database events to system_audit_logs table
 */
async function logDatabaseEvent({ 
  action, 
  table, 
  websiteId, 
  rowsAffected = 0,
  success = true 
}) {
  try {
    const { error } = await supabase
      .from('system_audit_logs')
      .insert({
        action: `DB_${action.toUpperCase()}`,
        entity_type: 'database',
        entity_id: websiteId,
        changed_by: 'database',
        old_values: JSON.stringify({ table, rows_affected: success ? rowsAffected : 0 }),
        new_values: JSON.stringify({ success, timestamp: new Date().toISOString() }),
        ip_address: null,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[LOG DATABASE] Failed to insert DB log:', error.message);
    }
    
    return { success: !error, error };
  } catch (loggingError) {
    console.error('[LOG DATABASE] Failed to log database event:', loggingError);
    return { success: false, error: loggingError };
  }
}

/**
 * Get logs with optional filters and pagination
 */
async function getLogs({ 
  category, 
  level, 
  websiteId, 
  userId, 
  startDate, 
  endDate, 
  page = 1, 
  limit = 50 
}) {
  try {
    let query = supabase
      .from('system_audit_logs')
      .select('*', { count: 'exact' });
    
    if (level) {
      query = query.ilike('action', `%${level.toUpperCase()}%`);
    }
    
    if (websiteId) {
      query = query.eq('entity_id', websiteId);
    }
    
    if (userId) {
      query = query.eq('changed_by', String(userId));
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end);
    
    if (error) {
      console.error('[GET LOGS] Failed to fetch logs:', error.message);
      return { logs: [], total: 0, error };
    }
    
    return { 
      logs: data || [], 
      total: count || 0, 
      page, 
      totalPages: Math.ceil((count || 0) / limit) 
    };
  } catch (loggingError) {
    console.error('[GET LOGS] Failed to get logs:', loggingError);
    return { logs: [], total: 0, error: loggingError };
  }
}

/**
 * Get error logs with pagination
 */
async function getErrorLogs({ 
  level, 
  websiteId, 
  startDate, 
  endDate, 
  page = 1, 
  limit = 50 
}) {
  try {
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' });
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (websiteId) {
      query = query.eq('website_id', websiteId);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end);
    
    if (error) {
      console.error('[GET ERROR LOGS] Failed to fetch error logs:', error.message);
      return { logs: [], total: 0, error };
    }
    
    return { 
      logs: data || [], 
      total: count || 0, 
      page, 
      totalPages: Math.ceil((count || 0) / limit) 
    };
  } catch (loggingError) {
    console.error('[GET ERROR LOGS] Failed to get error logs:', loggingError);
    return { logs: [], total: 0, error: loggingError };
  }
}

/**
 * Get login logs with pagination
 */
async function getLoginLogs({ 
  userId, 
  email, 
  websiteId, 
  startDate, 
  endDate, 
  page = 1, 
  limit = 50 
}) {
  try {
    let query = supabase
      .from('login_logs')
      .select('*', { count: 'exact' });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (email) {
      query = query.eq('email', email);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end);
    
    if (error) {
      console.error('[GET LOGIN LOGS] Failed to fetch login logs:', error.message);
      return { logs: [], total: 0, error };
    }
    
    return { 
      logs: data || [], 
      total: count || 0, 
      page, 
      totalPages: Math.ceil((count || 0) / limit) 
    };
  } catch (loggingError) {
    console.error('[GET LOGIN LOGS] Failed to get login logs:', loggingError);
    return { logs: [], total: 0, error: loggingError };
  }
}

/**
 * Get logs for a specific month
 */
async function getMonthlyLogs({ year, month, category }) {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    
    if (category === 'auth') {
      return getLoginLogs({ startDate, endDate });
    } else if (category === 'error') {
      return getErrorLogs({ startDate, endDate });
    } else {
      return getLogs({ startDate, endDate });
    }
  } catch (error) {
    console.error('[GET MONTHLY LOGS] Failed to get monthly logs:', error);
    return { logs: [], total: 0, error };
  }
}

/**
 * Get logs summary (aggregated stats)
 */
async function getLogsSummary({ startDate, endDate, websiteId }) {
  try {
    // Get error logs summary
    const { logs: errorLogs, total: errorCount } = await getErrorLogs({ 
      startDate, 
      endDate, 
      websiteId 
    });
    
    // Get login logs summary
    const { logs: loginLogs, total: loginCount } = await getLoginLogs({ 
      startDate, 
      endDate,
      websiteId 
    });
    
    // Calculate summaries
    const errorSummary = errorLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
    
    const loginSummary = loginLogs.reduce((acc, log) => {
      acc[log.success ? 'success' : 'failure'] = (acc[log.success ? 'success' : 'failure'] || 0) + 1;
      return acc;
    }, {});
    
    return {
      period: { startDate, endDate },
      errors: {
        total: errorCount,
        byLevel: errorSummary,
      },
      auth: {
        total: loginCount,
        bySuccess: loginSummary,
      },
    };
  } catch (error) {
    console.error('[GET LOGS SUMMARY] Failed to get logs summary:', error);
    return { error: error.message };
  }
}

/**
 * Delete old logs (older than retention period - 30 days)
 */
async function cleanupOldLogs({ days = DEFAULT_RETENTION_DAYS } = {}) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Delete error logs
    const { error: errorError } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    // Delete login logs
    const { error: loginError } = await supabase
      .from('login_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    // Delete system audit logs
    const { error: auditError } = await supabase
      .from('system_audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    const errors = [errorError, loginError, auditError].filter(e => e);
    
    return {
      success: errors.length === 0,
      deleted: {
        error_logs: errorError ? 0 : 'all',
        login_logs: loginError ? 0 : 'all',
        audit_logs: auditError ? 0 : 'all',
      },
      error: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error('[CLEANUP OLD LOGS] Failed to cleanup logs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export all log functions
 */
module.exports = {
  LOG_LEVELS,
  LOG_CATEGORIES,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logSuccess,
  logAuthEvent,
  logSecurityEvent,
  logApiEvent,
  logUserEvent,
  logDatabaseEvent,
  getLogs,
  getErrorLogs,
  getLoginLogs,
  getMonthlyLogs,
  getLogsSummary,
  cleanupOldLogs,
  DEFAULT_RETENTION_DAYS,
};