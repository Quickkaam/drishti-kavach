// ============================================
// Drishti Kavach — Auth Context
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import SessionTimeoutModal from '../components/ui/SessionTimeoutModal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dk_token'));
  const [loading, setLoading] = useState(true);

  // Session timeout state
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showTimeout, setShowTimeout] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 30 minutes total, show warning at 25 minutes
  const TIMEOUT_MS = 30 * 60 * 1000;
  const WARNING_MS = 25 * 60 * 1000;

  useEffect(() => {
    const savedToken = localStorage.getItem('dk_token');
    if (savedToken) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem('dk_token');
          localStorage.removeItem('dk_refresh');
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Update current time every second to check for timeout
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      if (now - lastActivity >= WARNING_MS) {
        setShowTimeout(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user, lastActivity]);

  // Track user activity
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeout(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity));
    return () => events.forEach(e => window.removeEventListener(e, resetActivity));
  }, [user, resetActivity]);

  const login = async (email, password, turnstileToken) => {
    const loginData = { email, password };
    if (turnstileToken) loginData.turnstile_token = turnstileToken;

    const { data } = await api.post('/auth/login', loginData);
    localStorage.setItem('dk_token', data.token);
    localStorage.setItem('dk_refresh', data.refresh_token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('dk_token');
    localStorage.removeItem('dk_refresh');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
      {user && showTimeout && (
        <SessionTimeoutModal
          onStayLoggedIn={resetActivity}
          onLogout={logout}
          showAtMs={lastActivity + WARNING_MS}
          timeoutAtMs={lastActivity + TIMEOUT_MS}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
