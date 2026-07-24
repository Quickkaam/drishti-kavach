import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { useSocket } from '../../context/SocketContext';
import RouteMap from './RouteMap';
import api from '../../api/client';

// Approximate coordinates for country codes (fallback for historical sessions)
const COUNTRY_COORDS = {
  'IN': { lat: 20.5937, lng: 78.9629 },
  'US': { lat: 37.0902, lng: -95.7129 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'CA': { lat: 56.1304, lng: -106.3468 },
  'AU': { lat: -25.2744, lng: 133.7751 },
  'DE': { lat: 51.1657, lng: 10.4515 },
  'FR': { lat: 46.2276, lng: 2.2137 },
  'CN': { lat: 35.8617, lng: 104.1954 },
  'RU': { lat: 61.5240, lng: 105.3188 },
  'BR': { lat: -14.2350, lng: -51.9253 },
  'JP': { lat: 36.2048, lng: 138.2529 },
  'KR': { lat: 35.9078, lng: 127.7669 },
  'SG': { lat: 1.3521, lng: 103.8198 },
  'AE': { lat: 23.4241, lng: 53.8478 },
  'ZA': { lat: -30.5595, lng: 22.9375 },
};

// Map style options
const VIEW_MODES = {
  globe: { name: 'Globe' },
  map:   { name: 'Map' },
};

// Map style options
const MAP_STYLES = {
  'dark': {
    name: 'Dark',
    globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#00d4ff',
  },
  'blue': {
    name: 'Blue Marble',
    globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: null,
    atmosphereColor: '#4488ff',
  },
  'satellite': {
    name: 'Satellite Plain',
    globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-day.jpg',
    bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#88ccff',
  },
  'light': {
    name: 'Light',
    globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#4488ff',
  },
};

export default function LiveGlobe() {
  const globeRef = useRef();
  const [arcsData, setArcsData] = useState([]);
  const [pointsData, setPointsData] = useState([]);
  
  // Visitor arrays
  const [visitorArcs, setVisitorArcs] = useState([]);
  const [visitorPoints, setVisitorPoints] = useState([]);
  
  const [viewMode, setViewMode] = useState('globe');
  const [trafficType, setTrafficType] = useState('visitor'); // Default to visitor to show populated data
  const [mapStyle, setMapStyle] = useState('dark');
  const { lastIncident, visitorEvent, connectionStatus } = useSocket();

  // Server location — Mumbai
  const SERVER = { lat: 19.076, lng: 72.877 };

  // Fetch historical sessions & manually pinned IPs — use real lat/lon stored in the database
  useEffect(() => {
    Promise.all([
      api.get('/analytics/website/1/sessions?limit=50'),
      api.get('/security/map-pins')
    ])
      .then(([sessionsRes, pinsRes]) => {
        const sessions = sessionsRes.data || [];
        const pins = pinsRes.data || [];
        
        const initialArcs = [];
        const initialPoints = [];
        
        // 1. Plot normal sessions (Blue)
        sessions.forEach(session => {
          const lat = parseFloat(session.latitude);
          const lng = parseFloat(session.longitude);
          if (!lat || !lng || (lat === 0 && lng === 0)) return; 
          
          const color = '#00d4ff';
          initialArcs.push({
            startLat: lat, startLng: lng,
            endLat: SERVER.lat, endLng: SERVER.lng,
            color,
            label: `${session.user_ip} — ${session.city || ''}, ${session.country || ''}`.trim(),
          });
          initialPoints.push({
            lat, lng, size: 0.3, color,
            label: `${session.user_ip} — ${session.city || ''}, ${session.country || ''}`.trim(),
          });
        });

        // 2. Plot manually pinned IPs (Purple/Pink to distinguish them)
        pins.forEach(pin => {
          const lat = parseFloat(pin.latitude);
          const lng = parseFloat(pin.longitude);
          if (!lat || !lng) return;
          
          const color = '#ff00ff'; // Distinct color for manual pins
          initialArcs.push({
            startLat: lat, startLng: lng,
            endLat: SERVER.lat, endLng: SERVER.lng,
            color,
            label: `📍 PINNED: ${pin.ip} — ${pin.city || ''}, ${pin.country || ''}`.trim(),
          });
          initialPoints.push({
            lat, lng, size: 0.5, color, // slightly larger point
            label: `📍 PINNED: ${pin.ip} — ${pin.city || ''}, ${pin.country || ''}`.trim(),
          });
        });
        
        setVisitorArcs(initialArcs);
        setVisitorPoints(initialPoints);
      })
      .catch(err => console.error('[LiveGlobe] Failed to fetch initial data', err));
  }, []);

  // React to live incidents (Attacks)
  useEffect(() => {
    if (lastIncident && lastIncident.source_ip) {
      const lat = lastIncident.latitude || 0;
      const lng = lastIncident.longitude || 0;
      const isCritical = lastIncident.severity === 'critical' || lastIncident.severity === 'high';
      const color = isCritical ? '#ff3d3d' : '#f5b041';

      const newArc = {
        startLat: lat, startLng: lng,
        endLat: SERVER.lat, endLng: SERVER.lng,
        color,
        label: lastIncident.source_ip,
        severity: lastIncident.severity,
      };
      const newPoint = { lat, lng, size: isCritical ? 0.6 : 0.4, color, label: lastIncident.source_ip };

      setArcsData(prev => [...prev.slice(-49), newArc]); // Keep last 50
      setPointsData(prev => [...prev.slice(-49), newPoint]);
    }
  }, [lastIncident]);

  // React to live visitor events
  useEffect(() => {
    if (visitorEvent && visitorEvent.ip) {
      // location comes as { lat, lon, city, country, ... } from the backend socket
      const loc = visitorEvent.location || {};
      const lat = parseFloat(loc.lat) || 0;
      const lng = parseFloat(loc.lon) || 0;
      if (!lat && !lng) return; // Skip if no real coordinates
      
      const color = '#00d4ff'; // Blue for normal traffic
      const label = `${visitorEvent.ip} — ${loc.city || ''}, ${loc.country || ''}`.trim();

      const newArc = {
        startLat: lat, startLng: lng,
        endLat: SERVER.lat, endLng: SERVER.lng,
        color,
        label,
      };
      const newPoint = { lat, lng, size: 0.3, color, label };

      setVisitorArcs(prev => [...prev.slice(-49), newArc]);
      setVisitorPoints(prev => [...prev.slice(-49), newPoint]);
    }
  }, [visitorEvent]);

  // Globe init: auto-rotate, focus on India
  useEffect(() => {
    const g = globeRef.current;
    if (g) {
      g.controls().autoRotate = true;
      g.controls().autoRotateSpeed = 0.4;
      g.controls().enableZoom = true;
      g.pointOfView({ lat: 20, lng: 60, altitude: 2 }, 1000);
    }
  }, []);

  const severityCount = {
    critical: arcsData.filter(a => a.severity === 'critical').length,
    high: arcsData.filter(a => a.severity === 'high').length,
    medium: arcsData.filter(a => a.severity === 'medium').length,
  };

  const currentStyle = MAP_STYLES[mapStyle];

  return (
    <div
      className="w-full h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #040c1a 0%, #020408 100%)' }}
    >
      {/* ── HEADER ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-[#00ff88] shadow-[0_0_12px_#00ff88]' : 'bg-[#ff3d3d] shadow-[0_0_12px_#ff3d3d]'} animate-pulse`} />
        <span className="font-orbitron text-xs text-[#00d4ff] tracking-[0.2em] font-bold uppercase">
          Global Shield Monitor
        </span>
      </div>

      {/* ── VIEW MODE & MAP STYLE SELECTOR ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 bg-navy-900/80 backdrop-blur-sm border border-royal-700/30 rounded-lg p-1">
          {/* View Mode */}
          <div className="flex items-center gap-1 border-r border-royal-700/30 pr-2">
            {Object.entries(VIEW_MODES).map(([key, mode]) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === key
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>

          {/* Traffic Type Toggle */}
          <div className="flex items-center gap-1 border-r border-royal-700/30 pr-2 pl-1">
            <button
              onClick={() => setTrafficType('attack')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                trafficType === 'attack'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
              Attacks
            </button>
            <button
              onClick={() => setTrafficType('visitor')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                trafficType === 'visitor'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
              Visitors
            </button>
          </div>
          
          {/* Map Styles */}
          <div className="flex items-center gap-1 pl-1">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setMapStyle(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mapStyle === key
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ATTACK COUNTER BADGES (Only in Attack mode) ── */}
      {trafficType === 'attack' && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
          {[
            { label: 'CRITICAL', count: severityCount.critical, color: '#ff3d3d' },
            { label: 'HIGH',     count: severityCount.high,     color: '#ff6b00' },
            { label: 'MEDIUM',   count: severityCount.medium,   color: '#f5b041' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-2 px-2 py-1 rounded"
                 style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <span className="font-orbitron text-[9px] tracking-widest" style={{ color }}>{label}</span>
              <span className="font-orbitron text-[10px] font-bold ml-auto" style={{ color }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── GLOBE OR MAP ── */}
      <div className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing">
        {viewMode === 'globe' ? (
          <Globe
            ref={globeRef}
            width={undefined}
            height={undefined}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={currentStyle.globeImageUrl}
            bumpImageUrl={currentStyle.bumpImageUrl}
            atmosphereColor={currentStyle.atmosphereColor}
            atmosphereAltitude={0.15}
            arcsData={trafficType === 'attack' ? arcsData : visitorArcs}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.15}
            arcDashAnimateTime={2000}
            arcsTransitionDuration={800}
            arcStroke={0.6}
            arcAltitude={0.3}
            arcLabel="label"
            pointsData={trafficType === 'attack' ? pointsData : visitorPoints}
            pointColor="color"
            pointAltitude={0.01}
            pointRadius="size"
            pointsMerge={false}
            pointLabel="label"
            customLayerData={[{ lat: SERVER.lat, lng: SERVER.lng }]}
            customThreeObject={() => {
              const { SphereGeometry, MeshBasicMaterial, Mesh } = window.THREE || {};
              if (!SphereGeometry) return null;
              const geo = new SphereGeometry(0.5, 8, 8);
              const mat = new MeshBasicMaterial({ color: 0x00ff88 });
              return new Mesh(geo, mat);
            }}
            customThreeObjectUpdate={(obj, d) => {}}
          />
        ) : (
          <RouteMap arcsData={trafficType === 'attack' ? arcsData : visitorArcs} mapStyle={mapStyle} />
        )}
      </div>

      {/* ── BOTTOM LEGEND ── */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4">
        {[
          ['#ff3d3d', 'Critical'],
          ['#ff6b00', 'High'],
          ['#f5b041', 'Medium'],
          ['#00d4ff', 'Normal'],
          ['#00ff88', 'Server'],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            <span className="font-orbitron text-[9px] tracking-wider" style={{ color, opacity: 0.9 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── ARC COUNT ── */}
      <div className="absolute bottom-4 right-4 z-20">
        <span className="font-orbitron text-[9px] tracking-widest text-[#00d4ff] opacity-60">
          {trafficType === 'attack' ? arcsData.length : visitorArcs.length} ACTIVE VECTORS
        </span>
      </div>
    </div>
  );
}
