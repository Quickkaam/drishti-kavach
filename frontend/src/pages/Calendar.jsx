// ============================================
// Drishti Kavach — Security Activity Calendar
// Detailed tracking of all security events
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Calendar, AlertCircle, Shield, MessageSquare, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(4,12,26,0.9) 0%, rgba(2,4,8,0.85) 100%)',
  border: '1px solid rgba(138,43,226,0.25)',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  backdropFilter: 'blur(10px)',
};

function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const websiteId = user?.websites?.[0]?.id || 1;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  useEffect(() => {
    fetchCalendarData();
  }, [year, month, websiteId]);

  const fetchCalendarData = async () => {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const { data } = await api.get(`/ai/calendar?website_id=${websiteId}`);
      
      const calendarMap = {};
      data.calendar.forEach(day => {
        calendarMap[day.date] = day;
      });

      setCalendarData(calendarMap);

      // Fetch events for the current month
      const eventsRes = await api.get(`/security/events?limit=100&website_id=${websiteId}`);
      const filteredEvents = (eventsRes.data.events || []).filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      });
      setEvents(filteredEvents);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const getDayStatus = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData[dateStr];
    
    if (!dayData) return 'none';
    if (dayData.critical > 0 || dayData.high > 2) return 'critical';
    if (dayData.high > 0 || dayData.medium > 3) return 'high';
    if (dayData.medium > 0) return 'medium';
    if (dayData.aiActions > 0) return 'ai';
    return 'normal';
  };

  const getDayColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-600/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
      case 'high': return 'bg-orange-600/20 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]';
      case 'medium': return 'bg-yellow-600/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      case 'ai': return 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
      default: return 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50';
    }
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData[dateStr];
    
    if (dayData) {
      setSelectedDay({ day, dateStr, data: dayData });
    } else {
      setSelectedDay({ day, dateStr, data: null });
    }
  };

  if (loading) {
    return (
      <div style={{ ...CARD_STYLE, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.08em' }}>
            📅 SECURITY CALENDAR
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#7a8290', marginTop: '0.25rem' }}>
            Track all security events and AI actions over time
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={prevMonth}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.75rem',
              fontFamily: "'Orbitron', monospace",
              border: '1px solid rgba(138,43,226,0.3)',
              borderRadius: '0.375rem',
              background: 'rgba(138,43,226,0.1)',
              color: '#b388ff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← PREV
          </button>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.75rem',
              fontFamily: "'Orbitron', monospace",
              border: '1px solid rgba(138,43,226,0.3)',
              borderRadius: '0.375rem',
              background: 'rgba(138,43,226,0.1)',
              color: '#b388ff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            NEXT →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          <span className="text-xs text-slate-400">Critical Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
          <span className="text-xs text-slate-400">High Severity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          <span className="text-xs text-slate-400">Medium Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          <span className="text-xs text-slate-400">AI Actions</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ ...CARD_STYLE }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '0.625rem', color: '#7a8290', fontFamily: "'Orbitron', monospace" }}>
              {day}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {/* Empty days before first day of month */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: '1/1' }}></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const status = getDayStatus(day);
            const isSelected = selectedDay?.day === day && 
                               selectedDay?.data?.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
            
            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                style={{
                  aspectRatio: '1/1',
                  border: '1px solid rgba(138,43,226,0.3)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  ...(!isSelected && { ':hover': { transform: 'scale(1.05)' } })
                }}
                className={getDayColor(status)}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '0.25rem', 
                  left: '0.5rem', 
                  fontSize: '0.75rem',
                  fontWeight: status === 'critical' ? '900' : '700',
                  color: status === 'critical' ? '#fca5a5' : status === 'high' ? '#fdba74' : status === 'medium' ? '#fde68a' : status === 'ai' ? '#d8b4fe' : '#94a3b8'
                }}>
                  {day}
                </div>
                
                {/* Event indicators */}
                {status !== 'normal' && status !== 'none' && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '0.25rem', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    display: 'flex', 
                    gap: '2px' 
                  }}>
                    {status === 'critical' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>}
                    {status === 'high' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]"></div>}
                    {status === 'medium' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>}
                    {status === 'ai' && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div>}
                  </div>
                )}

                {/* Today indicator */}
                {isToday(day) && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                  }}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div style={{ ...CARD_STYLE, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em' }}>
              📊 {formatDate(new Date(selectedDay.dateStr))}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontFamily: "'Orbitron', monospace",
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.25rem',
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                cursor: 'pointer'
              }}
            >
              CLOSE
            </button>
          </div>

          {!selectedDay.data ? (
            <div style={{ textAlign: 'center', color: '#7a8290', padding: '2rem' }}>
              <Shield size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No security events recorded on this day.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {selectedDay.data.critical > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  <AlertCircle size={24} style={{ color: '#ef4444', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.625rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase' }}>
                    Critical Events
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', fontFamily: "'Orbitron', monospace" }}>
                    {selectedDay.data.critical}
                  </div>
                </div>
              )}
              {selectedDay.data.aiActions > 0 && (
                <div style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  <Activity size={24} style={{ color: '#a855f7', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.625rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase' }}>
                    AI Actions
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a855f7', fontFamily: "'Orbitron', monospace" }}>
                    {selectedDay.data.aiActions}
                  </div>
                </div>
              )}
              {selectedDay.data.high > 0 && (
                <div style={{
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.625rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase' }}>
                    High Severity
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f97316' }}>
                    {selectedDay.data.high}
                  </div>
                </div>
              )}
              {selectedDay.data.medium > 0 && (
                <div style={{
                  background: 'rgba(234,179,8,0.1)',
                  border: '1px solid rgba(234,179,8,0.3)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.625rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase' }}>
                    Medium Events
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>
                    {selectedDay.data.medium}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Events List for selected day */}
          {selectedDay.data && selectedDay.data.critical > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Recent Critical Events
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {events
                  .filter(e => e.created_at.startsWith(selectedDay.dateStr) && e.severity === 'critical')
                  .slice(0, 5)
                  .map((e, i) => (
                    <div key={i} style={{
                      padding: '0.75rem',
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>
                          {e.event_type || 'Security Event'}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: '#7a8290' }}>
                          Source: {e.user_ip || 'Unknown'} | {new Date(e.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                {events.filter(e => e.created_at.startsWith(selectedDay.dateStr) && e.severity === 'critical').length === 0 && (
                  <p style={{ color: '#7a8290', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                    No critical events on this day
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
