// ============================================
// Drishti Kavach — Activity Calendar Widget
// 30-day visual timeline of AI actions and threats
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Calendar, AlertCircle, Shield, MessageSquare, Activity } from 'lucide-react';

export default function ActivityCalendar() {
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const today = new Date();
      const last30Days = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(date.toISOString().split('T')[0]);
      }

      setCalendarData(last30Days.map(date => ({
        date,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        aiActions: 0
      })));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-600';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return level;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayIntensity = (day) => {
    const total = day.critical + day.high + day.medium + day.low + day.aiActions;
    if (total === 0) return 'bg-slate-800/40 border-slate-700/30';
    if (day.critical > 0 || (day.critical + day.high) > 3) return 'bg-red-900/30 border-red-700/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    if (day.high > 0 || (day.critical + day.high + day.medium) > 5) return 'bg-orange-900/30 border-orange-700/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
    if (day.medium > 0 || total > 3) return 'bg-yellow-900/30 border-yellow-700/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
    return 'bg-green-900/30 border-green-700/50';
  };

  if (loading) {
    return (
      <div className="dk-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-purple-400" size={18} />
          <h3 className="font-semibold text-purple-400">30-Day Activity Calendar</h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dk-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-purple-400" size={18} />
          <h3 className="font-semibold text-purple-400">30-Day Activity Calendar</h3>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-400">Normal</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs text-slate-500 py-1 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarData.map((day, index) => {
          const dayTotal = day.critical + day.high + day.medium + day.low + day.aiActions;
          const isSelected = selectedDate?.date === day.date;
          
          return (
            <div
              key={day.date}
              onClick={() => setSelectedDate(day)}
              className={`relative aspect-square rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${getDayIntensity(day)}`}
            >
              <div className="absolute top-1 left-2 text-[10px] text-slate-300">
                {new Date(day.date).getDate()}
              </div>
              
              {dayTotal > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {day.critical > 0 && (
                    <div className="w-1 h-1 rounded-full bg-red-500" title="Critical"></div>
                  )}
                  {day.high > 0 && (
                    <div className="w-1 h-1 rounded-full bg-orange-500" title="High"></div>
                  )}
                  {day.aiActions > 0 && (
                    <div className="w-1 h-1 rounded-full bg-purple-500" title="AI Actions"></div>
                  )}
                </div>
              )}
              
              {isSelected && (
                <div className="absolute inset-0 border-2 border-purple-400 rounded-lg animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <h4 className="text-sm text-slate-300 mb-2 font-medium">
            {formatDate(selectedDate.date)} — {selectedDate.date}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {selectedDate.critical > 0 && (
              <div className="flex items-center gap-2 bg-red-900/20 p-2 rounded">
                <AlertCircle className="text-red-400 w-4 h-4" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Critical Events</span>
                  <span className="text-sm font-bold text-red-400">{selectedDate.critical}</span>
                </div>
              </div>
            )}
            {selectedDate.aiActions > 0 && (
              <div className="flex items-center gap-2 bg-purple-900/20 p-2 rounded">
                <Activity className="text-purple-400 w-4 h-4" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">AI Actions</span>
                  <span className="text-sm font-bold text-purple-400">{selectedDate.aiActions}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
