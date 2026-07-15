import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export default function SystemHealthDashboard({ trends = [] }) {
  // Mock data if trends is empty
  const data = trends.length > 0 ? trends : [
    { time: '10:00', load: 20 },
    { time: '10:10', load: 25 },
    { time: '10:20', load: 40 },
    { time: '10:30', load: 30 },
    { time: '10:40', load: 60 },
    { time: '10:50', load: 45 },
    { time: '11:00', load: 35 },
  ];

  return (
    <div className="glass-panel rounded-lg p-4 bg-[#0a0a2e]/60 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]"></span>
        <p className="font-orbitron text-xs tracking-widest text-[#00d4ff] font-bold">SYSTEM HEALTH</p>
      </div>

      {/* Database Usage Progress Bar */}
      <div>
        <div className="flex justify-between font-mono text-[10px] text-text-secondary mb-1">
          <span>DATABASE USAGE</span>
          <span>120MB / 500MB</span>
        </div>
        <div className="w-full bg-[#040810] h-2 rounded-full overflow-hidden border border-white/5">
          <div className="bg-[#00ff88] h-full" style={{ width: '24%', boxShadow: '0 0 10px #00ff88' }}></div>
        </div>
      </div>

      {/* API Latency Progress Bar */}
      <div>
        <div className="flex justify-between font-mono text-[10px] text-text-secondary mb-1">
          <span>API LATENCY</span>
          <span className="text-[#f5b041]">85ms</span>
        </div>
        <div className="w-full bg-[#040810] h-2 rounded-full overflow-hidden border border-white/5">
          <div className="bg-[#f5b041] h-full" style={{ width: '15%', boxShadow: '0 0 10px #f5b041' }}></div>
        </div>
      </div>

      {/* 60 Min Load Sparkline */}
      <div className="mt-2 flex-1 min-h-[80px]">
        <p className="font-mono text-[10px] text-text-secondary mb-2">NETWORK LOAD (LAST 60M)</p>
        <div className="h-[60px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={[0, 'dataMax + 20']} hide />
              <Area 
                type="monotone" 
                dataKey="load" 
                stroke="#00d4ff" 
                fill="url(#loadGrad)" 
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
