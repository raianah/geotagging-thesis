import React, { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";
import "../css/Sidebar.css"; // Import the CSS file

const Sidebar = ({ position }) => {
    const [location, setLocation] = useState("Fetching location...");
    const zones = [{ label: "Depopulation Zone", radius: 500, color: "#ff4d4d" }, { label: "Surveillance Zone", radius: 1000, color: "#ffd633" }, { label: "Monitoring Zone", radius: 1500, color: "#33cc33" }];

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
        <div className="sidebar">
            <h2 className="title">ASF Detection System</h2>
            <div className="section"><FiAlertTriangle className="icon" /><span className="sectionText">ASF Outbreak Location</span></div>
            <div className="coordBox"><strong>Latitude:</strong> {position[0].toFixed(5)}<br /><strong>Longitude:</strong> {position[1].toFixed(5)}<br /><strong>Location:</strong> {location}</div>
            <div className="section"><FiAlertTriangle className="icon" /><span className="sectionText">Affected Zones</span></div>
            <div className="zoneList">
                {zones.map((zone, index) => <div key={index} className="zoneItem" style={{ backgroundColor: zone.color }}><MdLocationPin className="zoneIcon" /><span>{zone.label}</span><div className="coords">🏠 Approx. within {zone.radius / 1000}KM</div></div>)}
            </div>
        </div>
    );
};

export default Sidebar;
