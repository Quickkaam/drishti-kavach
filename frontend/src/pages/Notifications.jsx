// ============================================
// Drishti Kavach — Notifications Page
// ============================================

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Settings, Trash2, Filter, Mail, MessageSquare, Send } from 'lucide-react';
import api from '../api/client';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState({ unreadOnly: false, type: '' });
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'settings'
  const [preferences, setPreferences] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => { fetchNotifications(); }, [filter, pagination.page]);
  useEffect(() => { if (activeTab === 'settings') fetchPreferences(); }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 20, ...filter };
      const res = await api.get('/notifications', { params });
      setNotifications(res.data.notifications || []);
      setPagination({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      setPreferences(res.data.preferences);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post('/notifications/mark-read', { notificationId: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', preferences);
      alert('Preferences saved!');
    } catch (err) {
      alert('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await api.post('/notifications/test', { type: 'info', category: 'system' });
      alert('Test notification sent!');
    } catch (err) {
      alert('Failed to send test notification');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/5';
      case 'high': return 'border-l-orange-500 bg-orange-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'security': return '🛡️';
      case 'ddos': return '🚨';
      case 'login': return '🔐';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg"><Bell className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-gray-400">Manage your notifications and preferences</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-t-lg ${activeTab === 'list' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-t-lg ${activeTab === 'settings' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Preferences
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={filter.unreadOnly}
                onChange={(e) => setFilter({ ...filter, unreadOnly: e.target.checked })}
                className="rounded bg-gray-700 border-gray-600"
              />
              <span>Unread only</span>
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="bg-gray-700 text-white rounded px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              <option value="security">Security</option>
              <option value="ddos">DDoS</option>
              <option value="login">Login</option>
              <option value="system">System</option>
            </select>
            <button onClick={handleMarkAllRead} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No notifications</div>
            ) : (
              <>
                <div className="divide-y divide-gray-700">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-l-4 hover:bg-gray-700/30 ${getSeverityColor(notif.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getTypeIcon(notif.type)}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className={`font-medium ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>
                                {notif.title}
                              </h4>
                              {!notif.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="capitalize">{notif.category}</span>
                              <span className="capitalize">{notif.severity}</span>
                              <span>{new Date(notif.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notif.is_read && (
                            <button onClick={() => handleMarkRead(notif.id)} className="p-2 text-gray-400 hover:text-white" title="Mark as read">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(notif.id)} className="p-2 text-gray-400 hover:text-red-400" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">Showing {notifications.length} of {pagination.total}</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50 hover:bg-gray-600 text-white"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-gray-400">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50 hover:bg-gray-600 text-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'settings' && preferences && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
            <div className="space-x-2">
              <button
                onClick={handleTestNotification}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center inline-flex"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </button>
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* In-App Notifications */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                In-App Notifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['security', 'ddos', 'login', 'system', 'ai', 'incidents', 'forms'].map(cat => (
                  <label key={cat} className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences[`inapp_${cat}`] ?? true}
                      onChange={(e) => setPreferences({ ...preferences, [`inapp_${cat}`]: e.target.checked })}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    <span className="capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Notifications */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Notifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['security', 'ddos', 'login', 'system', 'ai', 'incidents', 'forms'].map(cat => (
                  <label key={cat} className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences[`email_${cat}`] ?? true}
                      onChange={(e) => setPreferences({ ...preferences, [`email_${cat}`]: e.target.checked })}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    <span className="capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Slack Notifications */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Slack Notifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['security', 'ddos', 'login', 'system', 'ai', 'incidents', 'forms'].map(cat => (
                  <label key={cat} className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences[`slack_${cat}`] ?? false}
                      onChange={(e) => setPreferences({ ...preferences, [`slack_${cat}`]: e.target.checked })}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    <span className="capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Severity Thresholds */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Severity Thresholds</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-400 mb-2">Min Email Severity</label>
                  <select
                    value={preferences.min_email_severity}
                    onChange={(e) => setPreferences({ ...preferences, min_email_severity: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="info">Info</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Min Slack Severity</label>
                  <select
                    value={preferences.min_slack_severity}
                    onChange={(e) => setPreferences({ ...preferences, min_slack_severity: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="info">Info</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Min In-App Severity</label>
                  <select
                    value={preferences.min_inapp_severity}
                    onChange={(e) => setPreferences({ ...preferences, min_inapp_severity: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="info">Info</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Quiet Hours</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={preferences.quiet_hours_enabled ?? false}
                    onChange={(e) => setPreferences({ ...preferences, quiet_hours_enabled: e.target.checked })}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <span>Enable quiet hours</span>
                </label>
                {preferences.quiet_hours_enabled && (
                  <>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start || '22:00'}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                      className="bg-gray-700 text-white rounded px-3 py-2"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end || '08:00'}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                      className="bg-gray-700 text-white rounded px-3 py-2"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;