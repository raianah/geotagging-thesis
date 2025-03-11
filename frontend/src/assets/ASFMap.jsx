import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import { FiAlertTriangle } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../css/ASFMap.css";

const defaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });

const ASFMap = () => {
    const [position, setPosition] = useState([13.9333, 120.733]); // Default: Manila
    const [hasSelected, setHasSelected] = useState(false);
    const [location, setLocation] = useState("Fetching location...");
    
    const zones = [
        { label: "Depopulation Zone", radius: 500, color: "#ff4d4d" },
        { label: "Surveillance Zone", radius: 1000, color: "#ffd633" },
        { label: "Monitoring Zone", radius: 1500, color: "#33cc33" }
    ];

    const handleMapClick = (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
        setHasSelected(true);
    };

    useEffect(() => {
        const fetchLocation = async () => {
            const [lat, lng] = position;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                setLocation(data.display_name || "Unknown location");
            } catch (error) {
                setLocation("Location unavailable");
            }
        };
        fetchLocation();
    }, [position]);

    return (
        <div className="map-wrapper">
            {/* Sidebar */}
            <div className="sidebar">
                <h2 className="title">ASF Detection System</h2>
                <div className="section"><FiAlertTriangle className="icon" /><span className="sectionText">ASF Outbreak Location</span></div>
                <div className="coordBox">
                    <strong>Latitude:</strong> {position[0].toFixed(5)}<br />
                    <strong>Longitude:</strong> {position[1].toFixed(5)}<br />
                    <strong>Location:</strong> {location}
                </div>
                <div className="section"><FiAlertTriangle className="icon" /><span className="sectionText">Affected Zones</span></div>
                <div className="zoneList">
                    {zones.map((zone, index) => (
                        <div key={index} className="zoneItem" style={{ backgroundColor: zone.color }}>
                            <MdLocationPin className="zoneIcon" />
                            <span>{zone.label}</span>
                            <div className="coords">🏠 Approx. within {zone.radius / 1000}KM</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="map-container">
                <MapContainer center={position} zoom={14} className="map" onClick={handleMapClick}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    {hasSelected && zones.map((zone, index) => <Circle key={index} center={position} radius={zone.radius} color={zone.color} fillOpacity={0.3} />)}
                    <Marker position={position} icon={defaultIcon} draggable={true} eventHandlers={{ dragend: (e) => { setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]); setHasSelected(true); } }}>
                        <Popup><b>ASF Outbreak Detected</b><br />📍 {position[0].toFixed(4)}, {position[1].toFixed(4)}</Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
};

export default ASFMap;