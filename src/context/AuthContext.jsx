// ============================================
// Drishti Kavach — Auth Context
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dk_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('dk_token');
    if (savedToken === 'demo_token') {
      setUser({ id: 1, username: 'admin_demo', email: 'demo@drishti.com', role: 'admin' });
      setToken('demo_token');
      setLoading(false);
      return;
    }
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

  const login = async (email, password, turnstileToken) => {
    // Demo mode — bypass auth for preview
    if (email === 'demo@drishti.com' && password === 'demo1234') {
      const demoUser = { id: 1, username: 'admin_demo', email, role: 'admin' };
      localStorage.setItem('dk_token', 'demo_token');
      localStorage.setItem('dk_refresh', 'demo_refresh');
      setToken('demo_token');
      setUser(demoUser);
      return demoUser;
    }

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
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
