// ============================================
// Drishti Kavach — API Client
// ============================================

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const tokenExpired = err.response?.data?.code === 'TOKEN_EXPIRED';
    
    // If 401 and we have a refresh token, try to refresh
    if (err.response?.status === 401 && localStorage.getItem('dk_refresh') && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('dk_refresh');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
        localStorage.setItem('dk_token', data.token);
        localStorage.setItem('dk_refresh', data.refresh_token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
