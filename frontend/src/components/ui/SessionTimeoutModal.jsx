import React, { useState, useEffect } from 'react';

export default function SessionTimeoutModal({ onStayLoggedIn, onLogout, showAtMs, timeoutAtMs }) {
  const [timeLeft, setTimeLeft] = useState(timeoutAtMs - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = timeoutAtMs - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onLogout();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeoutAtMs, onLogout]);

  if (Date.now() < showAtMs) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="dk-card max-w-sm w-full space-y-4 text-center border-saffron-500/30">
        <div className="w-16 h-16 rounded-full bg-saffron-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold text-white">Session Expiring Soon</h2>
        <p className="text-slate-400 text-sm">
          You've been inactive for a while. For your security, you will be automatically logged out in:
        </p>
        <div className="text-3xl font-mono text-saffron-400 font-bold py-2">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="flex justify-center space-x-3 pt-4">
          <button onClick={onLogout} className="dk-btn border border-royal-700/50 hover:bg-royal-800/50 text-slate-300">
            Log Out Now
          </button>
          <button onClick={onStayLoggedIn} className="dk-btn-primary">
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
