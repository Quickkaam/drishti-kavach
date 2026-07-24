import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

export const useSocket = () => useContext(SocketContext);

import { io } from 'socket.io-client';

// Map of recent IPs to prevent duplicate globe events in short bursts
const recentIps = new Set();


export const SocketProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastIncident, setLastIncident] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [visitorEvent, setVisitorEvent] = useState(null); // New state for visitors

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConnectionStatus('disconnected');
      return;
    }

    // Connect to backend
    const backendUrl = import.meta.env.VITE_API_URL || 'https://drishti-kavach-backend.onrender.com';
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Try websocket first
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      // Admin dashboard listens to all websites or admin room
      newSocket.emit('join_admin'); 
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Real-time security attacks
    newSocket.on('security_alert', (data) => {
      setLastIncident({
        id: Date.now(),
        severity: data.severity || 'high',
        event_type: data.event_type || 'attack',
        user_ip: data.ip || 'UNKNOWN',
        source_ip: data.ip || 'UNKNOWN',
        created_at: new Date().toISOString(),
        latitude: data.location?.lat ? parseFloat(data.location.lat) : 0,
        longitude: data.location?.lon ? parseFloat(data.location.lon) : 0,
        country: data.location?.country_code || 'UN',
      });
    });

    // Real-time normal visitor traffic
    newSocket.on('ip_event', (data) => {
      // Prevent flood of globe animations for the same user repeatedly
      if (recentIps.has(data.ip)) return;
      recentIps.add(data.ip);
      setTimeout(() => recentIps.delete(data.ip), 10000); // 10 sec cooldown per IP

      setVisitorEvent({
        id: Date.now(),
        ip: data.ip || 'UNKNOWN',
        event_type: data.eventType || 'visit',
        latitude: data.location?.lat ? parseFloat(data.location.lat) : 0,
        longitude: data.location?.lon ? parseFloat(data.location.lon) : 0,
        country: data.location?.country_code || 'UN',
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connectionStatus, 
      lastIncident, // For attacks
      visitorEvent, // For normal visits
      lastNotification
    }}>
      {children}
    </SocketContext.Provider>
  );
};
