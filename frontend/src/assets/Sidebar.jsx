import React, { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";

const Sidebar = ({ position }) => {
  const [location, setLocation] = useState("Fetching location...");

  // Radius Zones - 500M for Depopulation, 1KM for Surveillance, 1.5KM for Monitoring
  const zones = [
    { label: "Depopulation Zone", radius: 500, color: "#ff4d4d" },
    { label: "Surveillance Zone", radius: 1000, color: "#ffd633" },
    { label: "Monitoring Zone", radius: 1500, color: "#33cc33" },
  ];

  // Fetching Exact Location - API Calls
  useEffect(() => {
    const fetchLocation = async () => {
      const [lat, lng] = position;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        if (data.display_name) {
          setLocation(data.display_name);
        } else {
          setLocation("Unknown location");
        }
      } catch (error) {
        setLocation("Location unavailable");
      }
    };

    fetchLocation();
  }, [position]);

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>ASF Detection System</h2>

      {/* Outbreak Info */}
      <div style={styles.section}>
        <FiAlertTriangle style={styles.icon} />
        <span style={styles.sectionText}>ASF Outbreak Location</span>
      </div>
      <div style={styles.coordBox}>
        <strong>Latitude:</strong> {position[0].toFixed(5)}
        <br />
        <strong>Longitude:</strong> {position[1].toFixed(5)}
        <br />
        <strong>Location:</strong> {location}
      </div>

      {/* Zones Information */}
      <div style={styles.section}>
        <FiAlertTriangle style={styles.icon} />
        <span style={styles.sectionText}>Affected Zones</span>
      </div>
      <div style={styles.zoneList}>
        {zones.map((zone, index) => (
          <div key={index} style={{ ...styles.zoneItem, backgroundColor: zone.color }}>
            <MdLocationPin style={styles.zoneIcon} />
            <span>{zone.label}</span>
            <div style={styles.coords}>
              🏠 Approx. within {zone.radius / 1000}KM
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: "300px",
    height: "100vh",
    background: "#222",
    color: "white",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1001,
    boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
  },
  title: {
    fontSize: "18px",
    fontWeight: "bold",
    textAlign: "center",
    paddingBottom: "15px",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  },
  section: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  icon: {
    fontSize: "20px",
    color: "#ffcc00",
  },
  sectionText: {
    color: "#ddd",
  },
  coordBox: {
    backgroundColor: "#333",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px",
    marginTop: "10px",
  },
  zoneList: {
    marginTop: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  zoneItem: {
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    color: "#222",
    fontWeight: "bold",
  },
  zoneIcon: {
    marginRight: "8px",
    fontSize: "18px",
  },
  coords: {
    fontSize: "12px",
    color: "#111",
    fontWeight: "normal",
    marginTop: "5px",
  },
};

export default Sidebar;
