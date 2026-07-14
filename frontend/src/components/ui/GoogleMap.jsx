import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

const SERVER = { lat: 19.076, lng: 72.877 };
const API_KEY = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';

export function IPDataDisplay({ ipData, locationData }) {
  if (!ipData && !locationData) {
    return <div className="text-center text-white/50 py-4">Loading IP data...</div>;
  }

  return (
    <div className="bg-navy-800/90 backdrop-blur-sm border border-royal-700/40 rounded-lg p-3 max-w-sm mx-auto text-sm">
      <h3 className="text-gold-400 font-semibold text-xs uppercase tracking-wider mb-2 border-b border-royal-700/30 pb-1">
        Network Profile
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ipData?.ip && (
          <div>
            <span className="text-slate-500 text-xs">IP Address</span>
            <div className="text-white font-mono text-sm">{ipData.ip}</div>
          </div>
        )}
        {locationData?.city && (
          <div>
            <span className="text-slate-500 text-xs">City</span>
            <div className="text-white">{locationData.city}</div>
          </div>
        )}
        {locationData?.region && (
          <div>
            <span className="text-slate-500 text-xs">Region</span>
            <div className="text-white">{locationData.region}</div>
          </div>
        )}
        {locationData?.country && (
          <div>
            <span className="text-slate-500 text-xs">Country</span>
            <div className="text-white">{locationData.country} {locationData.country_code}</div>
          </div>
        )}
        {ipData?.asn && (
          <div>
            <span className="text-slate-500 text-xs">ASN</span>
            <div className="text-white font-mono text-xs">{ipData.asn}</div>
          </div>
        )}
        {ipData?.org && (
          <div>
            <span className="text-slate-500 text-xs">ISP / Org</span>
            <div className="text-white">{ipData.org}</div>
          </div>
        )}
        {locationData?.latitude && locationData?.longitude && (
          <div>
            <span className="text-slate-500 text-xs">Coordinates</span>
            <div className="text-white font-mono text-xs">
              {locationData.latitude.toFixed(2)}, {locationData.longitude.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleMap({ arcsData, mapStyle }) {
  const mapRef = useRef(null);
  const [ipData, setIpData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [mapPosition, setMapPosition] = useState({ lat: 20, lng: 70 });
  const { lastIncident } = useSocket();

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!window.google || !window.google.maps) return;

    const mapOptions = {
      center: { lat: mapPosition.lat, lng: mapPosition.lng },
      zoom: 4,
      mapTypeId: mapStyle === 'satellite' ? 'satellite' : 
                mapStyle === 'hybrid' ? 'hybrid' :
                mapStyle === 'terrain' ? 'terrain' :
                mapStyle === 'dark' ? 'styled' : 'roadmap',
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControlOptions: {
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      },
    };

    mapRef.current = new window.google.maps.Map(document.getElementById('google-map'), mapOptions);

    // Add server marker
    new window.google.maps.Marker({
      position: SERVER,
      map: mapRef.current,
      title: 'Mumbai Server',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: '#00ff88',
        fillOpacity: 0.5,
        strokeColor: '#00ff88',
        strokeWeight: 2,
      },
    });

    // Add attack arcs (simplified as markers for demo)
    arcsData.slice(-10).forEach((arc, i) => {
      new window.google.maps.Marker({
        position: { lat: arc.startLat, lng: arc.startLng },
        map: mapRef.current,
        title: arc.label,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: arc.color,
          fillOpacity: 0.8,
          strokeColor: '#000',
          strokeWeight: 1,
        },
      });
    });
  };

  // Fetch user IP data from ipapi.co
  useEffect(() => {
    const fetchIPData = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data && data.ip) {
          setIpData(data);
          setLocationData({
            city: data.city,
            region: data.region,
            country: data.country_name,
            country_code: data.country_code,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone,
            postal: data.postal,
          });
          
          if (data.latitude && data.longitude) {
            setMapPosition({ lat: data.latitude, lng: data.longitude });
            if (mapRef.current) {
              mapRef.current.setCenter({ lat: data.latitude, lng: data.longitude });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch IP data:', err);
      }
    };
    
    fetchIPData();
  }, []);

  // Update map position when last incident occurs
  useEffect(() => {
    if (lastIncident && lastIncident.latitude && lastIncident.longitude) {
      setMapPosition({ lat: lastIncident.latitude, lng: lastIncident.longitude });
      if (mapRef.current) {
        mapRef.current.setCenter({ lat: lastIncident.latitude, lng: lastIncident.longitude });
      }
    }
  }, [lastIncident]);

  // Change map style when mapStyle changes
  useEffect(() => {
    if (mapRef.current) {
      const mapTypes = {
        satellite: 'satellite',
        hybrid: 'hybrid',
        terrain: 'terrain',
        dark: 'roadmap',
        light: 'roadmap',
      };
      mapRef.current.setMapTypeId(mapTypes[mapStyle] || 'roadmap');
    }
  }, [mapStyle]);

  return (
    <div className="w-full h-full relative">
      <div 
        id="google-map" 
        className="w-full h-full"
        style={{ zIndex: 0 }}
      />
      
      {/* User marker (if available) */}
      {locationData?.latitude && locationData?.longitude && mapRef.current && (
        <div className="absolute top-4 right-4 z-30">
          <IPDataDisplay ipData={ipData} locationData={locationData} />
        </div>
      )}
    </div>
  );
}
