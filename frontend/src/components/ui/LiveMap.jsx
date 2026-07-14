import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, LayerGroup, Polyline } from 'react-leaflet';
import { useSocket } from '../../context/SocketContext';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SERVER = { lat: 19.076, lng: 72.877 };

// IP data structure for rendering
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

export default function LiveMap({ arcsData, mapStyle }) {
  const [ipData, setIpData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [mapPosition, setMapPosition] = useState([20, 70]);
  const { lastIncident } = useSocket();

  // Fetch user IP data from ipapi.co
  useEffect(() => {
    const fetchIPData = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // Only use ipapi.co response if we get valid data
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
          
          // Center map on user location
          if (data.latitude && data.longitude) {
            setMapPosition([data.latitude, data.longitude]);
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
      setMapPosition([lastIncident.latitude, lastIncident.longitude]);
    }
  }, [lastIncident]);

  const getMapTiles = () => {
    // MapTiler Satellite Plain (Dark Variant)
    return {
      name: 'Satellite Plain',
      url: 'https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=free',
    };
  };

  const mapTiles = getMapTiles();

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapPosition}
        zoom={4}
        zoomControl={true}
        attributionControl={true}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Satellite Plain" checked={mapStyle === 'satellite'}>
            <TileLayer
              url={mapTiles.url}
              attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Dark" checked={mapStyle === 'dark'}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              attribution='&copy; CARTODB'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Light" checked={mapStyle === 'light'}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              attribution='&copy; CARTODB'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Server location - Mumbai */}
        <Marker position={SERVER}>
          <Popup>
            <div className="text-center">
              <div className="text-lg mb-1">🛡️</div>
              <div className="font-bold text-green-500">Mumbai Server</div>
              <div className="text-sm text-slate-300">19.076, 72.877</div>
            </div>
          </Popup>
        </Marker>

        {/* User location (if available) */}
        {locationData?.latitude && locationData?.longitude && (
          <Marker position={[locationData.latitude, locationData.longitude]}>
            <Popup>
              <IPDataDisplay ipData={ipData} locationData={locationData} />
            </Popup>
          </Marker>
        )}

        {/* Attack arcs */}
        <LayerGroup>
          {arcsData.slice(-20).map((arc, i) => (
            <Polyline
              key={i}
              positions={[
                [arc.startLat, arc.startLng],
                [SERVER.lat, SERVER.lng],
              ]}
              color={arc.color}
              weight={2}
              opacity={0.7}
              dashArray="5, 10"
              dashOffset="0"
            />
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}
