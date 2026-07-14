import React from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup } from 'react-leaflet';
import { Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SERVER = { lat: 19.076, lng: 72.877 };

export default function LiveMap({ arcsData, mapStyle }) {
  return (
    <MapContainer
      center={[20, 70]}
      zoom={4}
      zoomControl={true}
      attributionControl={true}
      style={{ width: '100%', height: '100%', zIndex: 0 }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Satellite Plain">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png"
            attribution='&copy; CARTODB'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Dark" checked={mapStyle === 'dark'}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            attribution='&copy; CARTODB'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Light">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            attribution='&copy; CARTODB'
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Server location */}
      <Circle
        center={SERVER}
        radius={50000}
        color="#00ff88"
        fillColor="#00ff88"
        fillOpacity={0.2}
        weight={2}
      >
        <div className="text-xs font-bold text-white bg-green-500/80 px-2 py-1 rounded">
          Mumbai Server
        </div>
      </Circle>

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
  );
}
