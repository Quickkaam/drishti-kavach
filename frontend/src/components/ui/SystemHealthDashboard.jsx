import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export default function SystemHealthDashboard({ trends = [] }) {
  const data = trends.length > 0 ? trends : [];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4 accent-line-top animate-border-glow slide-in-2"
      style={{
        background: 'linear-gradient(135deg, rgba(4, 12, 26, 0.95) 0%, rgba(10, 6, 30, 0.95) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.25)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="pulse-purple"></span>
        <p className="font-orbitron text-xs tracking-widest text-[#b388ff] font-bold">SYSTEM HEALTH</p>
      </div>

      {/* Database Usage Progress Bar */}
      <div>
        <div className="flex justify-between font-mono text-[10px] text-[#7a8290] mb-1">
          <span>DATABASE USAGE</span>
          <span style={{ color: '#00ff88' }}>120MB / 500MB</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden border border-purple-500/20"
             style={{ background: 'rgba(10, 6, 30, 0.8)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: mounted ? '24%' : '0%',
              background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
              boxShadow: '0 0 12px rgba(0, 255, 136, 0.5)',
              transition: 'width 1.2s ease-out',
            }}
          />
        </div>
      </div>

      {/* API Latency Progress Bar */}
      <div>
        <div className="flex justify-between font-mono text-[10px] text-[#7a8290] mb-1">
          <span>API LATENCY</span>
          <span style={{ color: '#f5b041' }}>85ms</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden border border-purple-500/20"
             style={{ background: 'rgba(10, 6, 30, 0.8)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: mounted ? '15%' : '0%',
              background: 'linear-gradient(90deg, #f5b041, #ff6b00)',
              boxShadow: '0 0 12px rgba(245, 176, 65, 0.5)',
              transition: 'width 1.4s ease-out',
            }}
          />
        </div>
      </div>

      {/* 60 Min Load Sparkline */}
      <div className="mt-2 flex-1 min-h-[80px]">
        <p className="font-mono text-[10px] text-[#7a8290] mb-2">NETWORK LOAD (LAST 60M)</p>
        <div className="h-[60px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="loadGradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8a2be2" stopOpacity={0.5}/>
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={[0, 'dataMax + 20']} hide />
              <Area 
                type="monotone" 
                dataKey="load" 
                stroke="#b388ff" 
                fill="url(#loadGradPurple)" 
                strokeWidth={1.5}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
