// ============================================
// Drishti Kavach — Engagement Chart Component
// Uses Recharts for activity timeline visualization
// ============================================

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(4,12,26,0.9) 0%, rgba(2,4,8,0.85) 100%)',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: '0.5rem',
  padding: '1.5rem',
};

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#040c18', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '0.25rem' },
  labelStyle:   { color: '#00d4ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' },
  itemStyle:    { fontSize: '0.75rem' },
};

function formatHour(hourStr) {
  if (!hourStr) return '';
  const hour = parseInt(hourStr.slice(11, 13) || hourStr.slice(0, 2), 10);
  if (isNaN(hour)) return hourStr;
  return hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
}

export default function EngagementChart({ data, title = 'User Activity' }) {
  if (!data || data.length === 0) {
    return (
      <div style={CARD_STYLE}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginBottom: '1rem' }}>
          📈 {title}
        </h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8290', fontSize: '0.75rem', fontFamily: "'Orbitron', monospace" }}>
          NO DATA AVAILABLE
        </div>
      </div>
    );
  }

  // Only show every Nth label to avoid crowding
  const labelInterval = Math.max(1, Math.floor(data.length / 12));
  const chartData = data.map((d, i) => ({
    ...d,
    label: i % labelInterval === 0 ? formatHour(d.hour) : '',
  }));

  return (
    <div style={CARD_STYLE}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em' }}>
          📈 {title.toUpperCase()}
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ fontSize: '0.65rem', color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '8px', height: '2px', background: '#00d4ff', display: 'inline-block' }} />
            Page Views
          </span>
          <span style={{ fontSize: '0.65rem', color: '#f5b041', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '8px', height: '2px', background: '#f5b041', display: 'inline-block' }} />
            Sessions
          </span>
        </div>
      </div>
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="rgba(0,212,255,0.2)"
              tick={{ fill: '#7a8290', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(0,212,255,0.2)"
              tick={{ fill: '#7a8290', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="page_views"
              stroke="#00d4ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00d4ff', strokeWidth: 0 }}
              name="Page Views"
            />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#f5b041"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#f5b041', strokeWidth: 0 }}
              name="Sessions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
