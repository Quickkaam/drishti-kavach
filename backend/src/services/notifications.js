// ============================================
// Drishti Kavach — Role-Based Notification Service
// Handles notifications based on user roles and preferences
// ============================================

const supabase = require('../db/supabase');
const { sendAlert } = require('./alerts');
const { logError: logErrorLog } = require('./logging');

// User roles
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  CLIENT: 'client'
};

// Notification categories
const CATEGORIES = {
  SECURITY: 'security',
  DDOS: 'ddos',
  LOGIN: 'login',
  SYSTEM: 'system',
  AI: 'ai',
  INCIDENTS: 'incidents',
  FORMS: 'forms',
  USER: 'user'
};

// Notification types
const TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  SECURITY: 'security',
  DDOS: 'ddos',
  LOGIN: 'login',
  SYSTEM: 'system'
};

// Severity levels
const SEVERITY = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Role-based notification rules - what notifications each role receives
const ROLE_NOTIFICATION_RULES = {
  [ROLES.SUPERADMIN]: {
    // Superadmin gets ALL notifications
    all: true,
    categories: Object.values(CATEGORIES),
    minSeverity: SEVERITY.INFO
  },
  [ROLES.ADMIN]: {
    // Admin gets security, ddos, login, system, incidents, ai
    categories: [
      CATEGORIES.SECURITY,
      CATEGORIES.DDOS,
      CATEGORIES.LOGIN,
      CATEGORIES.SYSTEM,
      CATEGORIES.INCIDENTS,
      CATEGORIES.AI,
      CATEGORIES.FORMS
    ],
    minSeverity: SEVERITY.LOW
  },
  [ROLES.CLIENT]: {
    // Client gets only their own website notifications
    categories: [
      CATEGORIES.SECURITY,
      CATEGORIES.FORMS
    ],
    minSeverity: SEVERITY.LOW,
    ownOnly: true // Only notifications related to their own website
  }
};

// Severity to number mapping for comparison
const SEVERITY_LEVEL = {
  [SEVERITY.INFO]: 1,
  [SEVERITY.LOW]: 2,
  [SEVERITY.MEDIUM]: 3,
  [SEVERITY.HIGH]: 4,
  [SEVERITY.CRITICAL]: 5
};

/**
 * Get notification preferences for a user
 */
async function getNotificationPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[NOTIFICATIONS] Failed to get preferences:', error);
    }
    
    return data || null;
  } catch (err) {
    console.error('[NOTIFICATIONS] Error getting preferences:', err);
    return null;
  }
}

/**
 * Create default notification preferences for a user
 */
async function createDefaultPreferences(userId, role) {
  try {
    // Default preferences based on role
    let defaults = {
      user_id: userId,
      email_security: true,
      email_ddos: true,
      email_login: true,
      email_system: true,
      email_ai: true,
      email_incidents: true,
      email_forms: true,
      inapp_security: true,
      inapp_ddos: true,
      inapp_login: true,
      inapp_system: true,
      inapp_ai: true,
      inapp_incidents: true,
      inapp_forms: true,
      slack_security: true,
      slack_ddos: true,
      slack_login: false,
      slack_system: true,
      slack_ai: false,
      slack_incidents: true,
      slack_forms: false,
      telegram_security: true,
      telegram_ddos: true,
      telegram_login: false,
      telegram_system: true,
      telegram_ai: false,
      telegram_incidents: true,
      telegram_forms: false,
      min_email_severity: SEVERITY.LOW,
      min_slack_severity: SEVERITY.MEDIUM,
      min_telegram_severity: SEVERITY.MEDIUM,
      min_inapp_severity: SEVERITY.INFO,
      quiet_hours_enabled: false
    };
    
    // Adjust defaults based on role
    if (role === ROLES.CLIENT) {
      defaults.email_system = false;
      defaults.email_ai = false;
      defaults.email_login = false;
      defaults.email_ddos = false;
      defaults.email_incidents = false;
      defaults.slack_system = false;
      defaults.slack_ai = false;
      defaults.slack_login = false;
      defaults.slack_ddos = false;
      defaults.telegram_system = false;
      defaults.telegram_ai = false;
      defaults.telegram_login = false;
      defaults.telegram_ddos = false;
    }
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(defaults, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) {
      console.error('[NOTIFICATIONS] Failed to create preferences:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('[NOTIFICATIONS] Error creating preferences:', err);
    return null;
  }
}

/**
 * Update notification preferences for a user
 */
async function updateNotificationPreferences(userId, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('[NOTIFICATIONS] Failed to update preferences:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('[NOTIFICATIONS] Error updating preferences:', err);
    return { success: false, error: err };
  }
}

/**
 * Check if notification should be sent based on user role and preferences
 */
async function shouldNotify(userId, category, severity, options = {}) {
  try {
    // Get user to check role
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (!user) return false;
    
    const rules = ROLE_NOTIFICATION_RULES[user.role];
    if (!rules) return false;
    
    // Check if role receives this category
    if (!rules.all && !rules.categories.includes(category)) {
      return { shouldNotify: false, reason: 'category_not_in_role' };
    }
    
    // Check severity threshold for role
    const roleSeverityLevel = SEVERITY_LEVEL[rules.minSeverity] || SEVERITY_LEVEL[SEVERITY.LOW];
    const notificationSeverityLevel = SEVERITY_LEVEL[severity] || SEVERITY_LEVEL[SEVERITY.INFO];
    
    if (notificationSeverityLevel < roleSeverityLevel) {
      return { shouldNotify: false, reason: 'severity_below_role_threshold' };
    }
    
    // Get user preferences
    const prefs = await getNotificationPreferences(userId);
    if (!prefs) {
      // No preferences = use role defaults (notify)
      return { shouldNotify: true, reason: 'default_role_settings' };
    }
    
    // Check category-specific preference
    const categoryPrefKey = `inapp_${category}`;
    if (prefs[categoryPrefKey] === false) {
      return { shouldNotify: false, reason: 'user_preference_disabled' };
    }
    
    // Check severity threshold for in-app
    const inAppSeverityLevel = SEVERITY_LEVEL[prefs.min_inapp_severity] || SEVERITY_LEVEL[SEVERITY.INFO];
    if (notificationSeverityLevel < inAppSeverityLevel) {
      return { shouldNotify: false, reason: 'severity_below_user_threshold' };
    }
    
    // Check quiet hours
    if (prefs.quiet_hours_enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      const startParts = (prefs.quiet_hours_start || '22:00').split(':');
      const endParts = (prefs.quiet_hours_end || '08:00').split(':');
      const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      
      const inQuietHours = startTime > endTime 
        ? (currentTime >= startTime || currentTime < endTime)
        : (currentTime >= startTime && currentTime < endTime);
      
      if (inQuietHours) {
        return { shouldNotify: false, reason: 'quiet_hours' };
      }
    }
    
    return { shouldNotify: true, reason: 'allowed' };
  } catch (err) {
    console.error('[NOTIFICATIONS] Error checking notify permission:', err);
    return { shouldNotify: true, reason: 'error_default_allow' };
  }
}

/**
 * Create and send notification to users based on role
 */
async function sendNotification({ 
  title, 
  message, 
  type = TYPES.INFO, 
  severity = SEVERITY.INFO,
  category = CATEGORIES.SYSTEM,
  targetRoles = null, // null = all applicable roles
  targetUserId = null, // specific user
  websiteId = null,
  referenceType = null,
  referenceId = null,
  sendEmail = true,
  sendSlack = true,
  sendTelegram = true,
  sendInApp = true,
  io = null // Socket.io instance for real-time notifications
}) {
  try {
    const notificationsCreated = [];
    const externalAlerts = [];
    
    // Determine target users based on roles
    let targetUsers = [];
    
    if (targetUserId) {
      // Send to specific user only
      const { data: user } = await supabase
        .from('users')
        .select('id, role, email')
        .eq('id', targetUserId)
        .single();
      if (user) targetUsers = [user];
    } else if (targetRoles) {
      // Send to users with specific roles
      const { data: users } = await supabase
        .from('users')
        .select('id, role, email')
        .in('role', Array.isArray(targetRoles) ? targetRoles : [targetRoles])
        .eq('is_active', true);
      targetUsers = users || [];
    } else {
      // Send to all applicable users based on role rules
      const rules = ROLE_NOTIFICATION_RULES;
      const applicableRoles = Object.keys(rules).filter(role => 
        rules[role].categories.includes(category)
      );
      
      const { data: users } = await supabase
        .from('users')
        .select('id, role, email')
        .in('role', applicableRoles)
        .eq('is_active', true);
      targetUsers = users || [];
    }
    
    // Filter users based on role rules for this category/severity
    for (const user of targetUsers) {
      const { shouldNotify: notify, reason } = await shouldNotify(user.id, category, severity);
      
      if (!notify) {
        console.log(`[NOTIFICATIONS] Skipping user ${user.id} (role: ${user.role}): ${reason}`);
        continue;
      }
      
      // Get user preferences
      const prefs = await getNotificationPreferences(user.id) || {};
      
      // Create in-app notification
      if (sendInApp) {
        const notifData = {
          user_id: user.id,
          title,
          message,
          type,
          severity,
          category,
          reference_type: referenceType,
          reference_id: referenceId,
          created_at: new Date().toISOString()
        };
        
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert(notifData)
          .select()
          .single();
        
        if (error) {
          console.error('[NOTIFICATIONS] Failed to create notification:', error);
        } else {
          notificationsCreated.push(notification);
          
          // Emit real-time notification via WebSocket
          if (io && typeof io.emitNotification === 'function') {
            io.emitNotification(user.id, notification);
          }
        }
      }
      
      // Prepare external alerts (email, slack, telegram)
      const severityLevel = SEVERITY_LEVEL[severity] || SEVERITY_LEVEL[SEVERITY.INFO];
      const emailSeverityLevel = SEVERITY_LEVEL[prefs.min_email_severity] || SEVERITY_LEVEL[SEVERITY.LOW];
      const slackSeverityLevel = SEVERITY_LEVEL[prefs.min_slack_severity] || SEVERITY_LEVEL[SEVERITY.MEDIUM];
      const telegramSeverityLevel = SEVERITY_LEVEL[prefs.min_telegram_severity] || SEVERITY_LEVEL[SEVERITY.MEDIUM];
      
      const categoryKey = `${category}_${type}`;
      
      // Email notification
      if (sendEmail && prefs[`email_${category}`] !== false && severityLevel >= emailSeverityLevel) {
        externalAlerts.push({ type: 'email', userId: user.id, email: user.email });
      }
      
      // Slack notification
      if (sendSlack && process.env.SLACK_WEBHOOK_URL && prefs[`slack_${category}`] !== false && severityLevel >= slackSeverityLevel) {
        externalAlerts.push({ type: 'slack', userId: user.id });
      }
      
      // Telegram notification
      if (sendTelegram && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && prefs[`telegram_${category}`] !== false && severityLevel >= telegramSeverityLevel) {
        externalAlerts.push({ type: 'telegram', userId: user.id });
      }
    }
    
    // Send external alerts (batch for Slack/Telegram, queue emails)
    if (externalAlerts.length > 0) {
      const alertText = `*${title}*\n${message}`;
      
      for (const alert of externalAlerts) {
        if (alert.type === 'slack' || alert.type === 'telegram') {
          await sendAlert({
            title,
            message,
            severity,
            websiteId
          });
          break; // Only send one external alert (it's broadcast)
        }
      }
    }
    
    return {
      success: true,
      notificationsCreated: notificationsCreated.length,
      notifications: notificationsCreated
    };
  } catch (err) {
    console.error('[NOTIFICATIONS] Failed to send notification:', err);
    await logErrorLog({ 
      message: 'Notification send failed', 
      context: { error: err.message, title, category } 
    });
    return { success: false, error: err.message };
  }
}

/**
 * Send login notification
 */
async function notifyLogin(user, ip, location) {
  const locationStr = location ? `${location.city || ''}, ${location.country || ''}`.trim() : 'Unknown';
  
  return sendNotification({
    title: '🔐 User Login',
    message: `${user.username} (${user.role}) logged in from ${locationStr} (IP: ${ip})`,
    type: TYPES.SUCCESS,
    severity: SEVERITY.INFO,
    category: CATEGORIES.LOGIN,
    targetUserId: user.id,
    sendEmail: false,
    sendSlack: true,
    sendTelegram: false,
    sendInApp: true
  });
}

/**
 * Send security alert
 */
async function notifySecurityEvent({ title, message, severity, websiteId, eventId }) {
  return sendNotification({
    title,
    message,
    type: TYPES.SECURITY,
    severity,
    category: CATEGORIES.SECURITY,
    targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ANALYST],
    websiteId,
    referenceType: 'security_event',
    referenceId: eventId,
    sendEmail: severity === SEVERITY.CRITICAL || severity === SEVERITY.HIGH,
    sendSlack: true,
    sendTelegram: severity === SEVERITY.CRITICAL
  });
}

/**
 * Send DDoS alert
 */
async function notifyDDoS({ title, message, severity, websiteId, ddosId }) {
  return sendNotification({
    title,
    message,
    type: TYPES.DDOS,
    severity,
    category: CATEGORIES.DDOS,
    targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    websiteId,
    referenceType: 'ddos_event',
    referenceId: ddosId,
    sendEmail: severity === SEVERITY.CRITICAL,
    sendSlack: true,
    sendTelegram: true
  });
}

/**
 * Send incident notification
 */
async function notifyIncident({ title, message, severity, incidentId, assignTo }) {
  return sendNotification({
    title,
    message,
    type: TYPES.WARNING,
    severity,
    category: CATEGORIES.INCIDENTS,
    targetUserId: assignTo,
    targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    referenceType: 'incident',
    referenceId: incidentId,
    sendEmail: true,
    sendSlack: true,
    sendTelegram: severity === SEVERITY.CRITICAL
  });
}

/**
 * Send form submission notification
 */
async function notifyFormSubmission(websiteId, formData) {
  return sendNotification({
    title: '📝 New Form Submission',
    message: `New form submission on website ${formData.websiteName || 'ID: ' + websiteId}\nFrom: ${formData.email || 'Unknown'}`,
    type: TYPES.INFO,
    severity: SEVERITY.LOW,
    category: CATEGORIES.FORMS,
    targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ANALYST],
    websiteId,
    referenceType: 'form_submission',
    referenceId: formData.id,
    sendEmail: true,
    sendSlack: false,
    sendTelegram: false
  });
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', userId);
    
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Get notifications for a user
 */
async function getNotifications(userId, { page = 1, limit = 50, unreadOnly = false } = {}) {
  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    const { data, count, error } = await query;
    
    if (error) {
      console.error('[NOTIFICATIONS] Failed to get notifications:', error);
      return { notifications: [], total: 0, error };
    }
    
    return { 
      notifications: data || [], 
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (err) {
    console.error('[NOTIFICATIONS] Error getting notifications:', err);
    return { notifications: [], total: 0, error: err };
  }
}

/**
 * Get unread notification count
 */
async function getUnreadCount(userId) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    return { count: count || 0, error };
  } catch (err) {
    return { count: 0, error: err };
  }
}

/**
 * Delete old notifications (cleanup)
 */
async function cleanupOldNotifications(days = 30) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoff.toISOString());
    
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

module.exports = {
  ROLES,
  CATEGORIES,
  TYPES,
  SEVERITY,
  ROLE_NOTIFICATION_RULES,
  getNotificationPreferences,
  createDefaultPreferences,
  updateNotificationPreferences,
  shouldNotify,
  sendNotification,
  notifyLogin,
  notifySecurityEvent,
  notifyDDoS,
  notifyIncident,
  notifyFormSubmission,
  markAsRead,
  markAllAsRead,
  getNotifications,
  getUnreadCount,
  cleanupOldNotifications
};