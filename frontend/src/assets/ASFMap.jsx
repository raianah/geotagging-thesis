import React, { useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const ASFMap = ({ position, setPosition }) => {
  const [hasSelected, setHasSelected] = useState(false); // Track user selection

  const zones = [
    { radius: 500, color: "red", fillOpacity: 0.5 },
    { radius: 1000, color: "yellow", fillOpacity: 0.3 },
    { radius: 1500, color: "green", fillOpacity: 0.2 },
  ];

  const handleMapClick = (e) => {
    setPosition([e.latlng.lat, e.latlng.lng]);
    setHasSelected(true); // Show zones after selecting
  };

  return (
    <MapContainer center={position} zoom={14} style={{ height: "100vh", width: "100%" }} onClick={handleMapClick}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      
      {/* Only show zones after user selects a location */}
      {hasSelected &&
        zones.map((zone, index) => (
          <Circle key={index} center={position} radius={zone.radius} color={zone.color} fillOpacity={zone.fillOpacity} />
        ))}

      <Marker
        position={position}
        icon={defaultIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]);
            setHasSelected(true);
          },
        }}
      >
        <Popup>
          <b>ASF Outbreak Detected</b><br />
          📍 {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default ASFMap;
