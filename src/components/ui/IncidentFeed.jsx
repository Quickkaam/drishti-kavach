import React from 'react';
import { useSocket } from '../../context/SocketContext';

export default function IncidentFeed({ events = [] }) {
  const { lastIncident } = useSocket();
  const severityColor = { critical: '#ff3d3d', high: '#ff9933', medium: '#f5b041', low: '#00d4ff' };

  // Prepend live socket incident if exists
  const displayEvents = lastIncident ? [lastIncident, ...events] : events;

  return (
    <div className="glass-panel h-full rounded-lg flex flex-col bg-space-card/80">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff9933] shadow-[0_0_8px_#ff9933] animate-pulse"></span>
          <p className="font-orbitron text-xs tracking-widest text-[#ff9933] font-bold">INCIDENT FEED</p>
        </div>
        <span className="font-orbitron text-[10px] text-text-secondary">{displayEvents.length} EVENTS</span>
      </div>
      
      {/* Vertical scrolling list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {displayEvents.map((ev, i) => (
          <div key={ev.id || i} 
               className="relative pl-3 py-3 pr-4 bg-[#0a0a2e]/40 rounded border border-white/5 hover:bg-[#0a0a2e]/80 transition-colors cursor-pointer group"
          >
            {/* Left-aligned colored border strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l" style={{ backgroundColor: severityColor[ev.severity] || '#00d4ff' }} />
            
            <div className="flex justify-between items-start mb-1">
              <span className="font-orbitron text-[10px] uppercase font-bold tracking-wider" style={{ color: severityColor[ev.severity] || '#00d4ff' }}>
                {ev.severity || 'UNKNOWN'}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {new Date(ev.created_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            
            <p className="font-mono text-xs text-text-primary mb-1 truncate">
              {ev.event_type ? ev.event_type.replace(/_/g, ' ').toUpperCase() : 'ANOMALY DETECTED'}
            </p>
            <p className="font-mono text-[10px] text-[#00d4ff] opacity-70 group-hover:opacity-100 transition-opacity">
              SRC: {ev.user_ip || ev.source_ip || 'UNKNOWN'}
            </p>
          </div>
        ))}
        {/* Infinite Scroll Placeholder */}
        <div className="py-4 text-center">
          <span className="font-mono text-[10px] text-text-muted italic flex items-center justify-center gap-2">
            <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </div>
      </div>
    </div>
  );
}
