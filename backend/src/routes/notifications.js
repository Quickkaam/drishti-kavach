// ============================================
// Drishti Kavach — Notification Routes
// ============================================

const express = require('express');
const { 
  getNotificationPreferences, 
  createDefaultPreferences, 
  updateNotificationPreferences,
  sendNotification,
  markAsRead,
  markAllAsRead,
  getNotifications,
  getUnreadCount,
  ROLES,
  CATEGORIES,
  TYPES,
  SEVERITY
} = require('../services/notifications');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/notifications - Get user's notifications
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, unreadOnly } = req.query;
    
    const result = await getNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    if (result.error) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('[NOTIFICATIONS] GET error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const result = await getUnreadCount(req.user.id);
    
    if (result.error) {
      return res.status(500).json({ error: 'Failed to get count' });
    }
    
    res.json({ count: result.count });
  } catch (err) {
    console.error('[NOTIFICATIONS] Count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/notifications/mark-read - Mark single notification as read
 */
router.post('/mark-read', async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }
    
    const result = await markAsRead(notificationId, req.user.id);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to mark as read' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[NOTIFICATIONS] Mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/notifications/mark-all-read - Mark all notifications as read
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const result = await markAllAsRead(req.user.id);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to mark all as read' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[NOTIFICATIONS] Mark all read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/notifications/preferences - Get notification preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    let prefs = await getNotificationPreferences(req.user.id);
    
    // Create default preferences if not exists
    if (!prefs) {
      prefs = await createDefaultPreferences(req.user.id, req.user.role);
    }
    
    res.json({ preferences: prefs });
  } catch (err) {
    console.error('[NOTIFICATIONS] Preferences error:', err);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * PUT /api/notifications/preferences - Update notification preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const updates = req.body;
    
    // Ensure user can only update their own preferences
    if (updates.user_id && updates.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Cannot update other user preferences' });
    }
    
    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    
    const result = await updateNotificationPreferences(req.user.id, updates);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
    
    res.json({ success: true, preferences: result.data });
  } catch (err) {
    console.error('[NOTIFICATIONS] Update preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/notifications/test - Send test notification (admin only)
 */
router.post('/test', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { type = 'info', category = 'system' } = req.body;
    
    const result = await sendNotification({
      title: '🧪 Test Notification',
      message: `This is a test notification sent to ${req.user.email} (${req.user.role})`,
      type,
      severity: SEVERITY.INFO,
      category,
      targetUserId: req.user.id
    });
    
    res.json(result);
  } catch (err) {
    console.error('[NOTIFICATIONS] Test error:', err);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

/**
 * DELETE /api/notifications/:id - Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supabase = require('../db/supabase');
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[NOTIFICATIONS] Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;