// ============================================
// Drishti Kavach — Notification Bell Component
// ============================================

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import api from '../../api/client';

export default function NotificationBell({ onNotificationClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 10 } });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isOpen) {
      await fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.post('/notifications/mark-read', { notificationId });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
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
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-96 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-700/50 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-700/50">
            <h3 className="text-white font-bold tracking-wide">Notifications</h3>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-royal-400 hover:text-royal-300 font-medium flex items-center transition-colors"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="w-6 h-6 border-2 border-royal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-slate-400 text-sm">Loading alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">All caught up!</p>
                <p className="text-slate-500 text-xs mt-1">No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                    !notif.is_read ? 'bg-royal-500/5' : ''
                  }`}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 flex-shrink-0">
                      <span className="text-xl opacity-90 group-hover:scale-110 transition-transform inline-block">
                        {getTypeIcon(notif.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-semibold truncate ${notif.is_read ? 'text-slate-400' : 'text-slate-200'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-royal-400 rounded-full ml-2 flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${notif.is_read ? 'text-slate-500' : 'text-slate-400'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityColor(notif.severity)}`}>
                          {notif.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(notif.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-900/50 p-2 border-t border-slate-700/50">
            <button
              onClick={() => {
                setIsOpen(false);
                onNotificationClick?.();
              }}
              className="w-full py-2 text-center text-sm font-medium text-royal-400 hover:text-royal-300 hover:bg-slate-800/50 rounded-lg transition-all"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}