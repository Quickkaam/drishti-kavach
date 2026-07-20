import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

export const useSocket = () => useContext(SocketContext);

// Attack source coordinates for realistic demo data
const ATTACK_SOURCES = [
  { lat: 39.9, lng: 116.4, country: 'CN' },
  { lat: 55.75, lng: 37.62, country: 'RU' },
  { lat: 40.71, lng: -74.0, country: 'US' },
  { lat: 52.52, lng: 13.41, country: 'DE' },
  { lat: -23.55, lng: -46.63, country: 'BR' },
  { lat: 35.68, lng: 139.69, country: 'JP' },
  { lat: 51.51, lng: -0.13, country: 'GB' },
  { lat: 48.86, lng: 2.35, country: 'FR' },
  { lat: 37.57, lng: 126.98, country: 'KR' },
  { lat: -33.87, lng: 151.21, country: 'AU' },
];

const EVENT_TYPES = [
  'sqli_attempt', 'xss_injection', 'brute_force', 'path_traversal',
  'honeypot_trigger', 'rate_limit_exceeded', 'bot_detected', 'credential_stuffing',
];

function generateMockIncident() {
  const src = ATTACK_SOURCES[Math.floor(Math.random() * ATTACK_SOURCES.length)];
  const severity = Math.random() > 0.85 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium';
  return {
    id: Date.now(),
    severity,
    event_type: EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)],
    user_ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    source_ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    created_at: new Date().toISOString(),
    latitude: src.lat + (Math.random() - 0.5) * 10,
    longitude: src.lng + (Math.random() - 0.5) * 10,
    country: src.country,
  };
}

export const SocketProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastIncident, setLastIncident] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const { token } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    // Cleanup previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    // Start mock incident generator for the globe visualization
    setConnectionStatus('connected');
    
    // Send first incident immediately after a short delay
    const initTimer = setTimeout(() => {
      setLastIncident(generateMockIncident());
    }, 2000);

    // Then generate one every 8 seconds
    intervalRef.current = setInterval(() => {
      setLastIncident(generateMockIncident());
    }, 8000);

    return () => {
      clearTimeout(initTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  // Listen for real notifications from backend (when connected via real socket)
  useEffect(() => {
    // This would be enhanced with actual socket.io connection
    // For now, we just handle mock incidents
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket: null, 
      connectionStatus, 
      lastIncident,
      lastNotification
    }}>
      {children}
    </SocketContext.Provider>
  );
};
