import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { FiAlertTriangle, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../css/ASFMap.css";

// Fix for default icon in Leaflet 
const defaultIcon = L.icon({ 
    iconUrl: markerIcon, 
    shadowUrl: markerShadow, 
    iconSize: [25, 41], 
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34] 
});

// Custom smaller icon for hog owners
const hogOwnerIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [15, 25],  // Smaller than default
    iconAnchor: [7, 25],
    popupAnchor: [1, -20]
});

// Dummy hog owner data
const hogOwnersData = [
    { id: 1, name: "Juan Santos", lat: 13.9353, lng: 120.736, farmName: "Santos Piggery" },
    { id: 2, name: "Maria Reyes", lat: 13.9310, lng: 120.730, farmName: "Reyes Hog Farm" },
    { id: 3, name: "Pedro Lim", lat: 13.9380, lng: 120.726, farmName: "Lim's Swine" },
    { id: 4, name: "Ana Cruz", lat: 13.9290, lng: 120.735, farmName: "Cruz Farms" },
    { id: 5, name: "Jose Mendoza", lat: 13.9350, lng: 120.743, farmName: "Mendoza Piggery" },
    { id: 6, name: "Elena Tan", lat: 13.9400, lng: 120.723, farmName: "El-Tan Hogs" },
    { id: 7, name: "Manuel Garcia", lat: 13.9320, lng: 120.740, farmName: "Garcia Pig Ranch" },
    { id: 8, name: "Sophia Bautista", lat: 13.9270, lng: 120.731, farmName: "Bautista Livestock" },
    { id: 9, name: "Ricardo Flores", lat: 13.9370, lng: 120.745, farmName: "Flores Farms" },
    { id: 10, name: "Teresa Castro", lat: 13.9420, lng: 120.728, farmName: "Castro Piggery" },
];

// Map Events component to handle click events
const MapEvents = ({ onClick }) => {
    useMapEvents({
        click: onClick
    });
    return null;
};

// Component to force map to invalidate size when container changes
const MapResizer = () => {
    const map = useMap();
    
    useEffect(() => {
        // Force map to recalculate size immediately and after a delay
        map.invalidateSize();
        
        const timeoutId = setTimeout(() => {
            map.invalidateSize(true);
        }, 300);
        
        // Also set up a resize observer for continuous monitoring
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                map.invalidateSize();
            });
            
            const container = map.getContainer();
            if (container) {
                observer.observe(container);
            }
            
            return () => {
                clearTimeout(timeoutId);
                observer.disconnect();
            };
        }
        
        return () => clearTimeout(timeoutId);
    }, [map]);
    
    return null;
};

// Map Preview Component
const MapPreview = ({ onClick }) => {
    return (
        <div className="asf-map-preview" onDoubleClick={onClick}>
            <div className="asf-map-preview-label">
                Double-click to open
            </div>
        </div>
    );
};

// Zone Item component with dropdown functionality
const ZoneItem = ({ zone, affectedOwners }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="asf-zone-item" style={{ backgroundColor: zone.color }}>
            <div className="asf-zone-header" onClick={() => setIsOpen(!isOpen)}>
                <MdLocationPin className="asf-zone-icon" />
                <span>{zone.label}</span>
                <div className="asf-owners-count">
                    {affectedOwners.length > 0 ? `${affectedOwners.length} farms affected` : ''}
                    {affectedOwners.length > 0 && (
                        isOpen ? <FiChevronUp className="asf-dropdown-icon" /> : <FiChevronDown className="asf-dropdown-icon" />
                    )}
                </div>
            </div>
            <div className="asf-coords">🏠 Approx. within {zone.radius / 1000}KM</div>
            
            {isOpen && affectedOwners.length > 0 && (
                <div className="asf-affected-owners-list">
                    {affectedOwners.map(owner => (
                        <div key={owner.id} className="asf-owner-item">
                            <strong>{owner.name}</strong>
                            <div>{owner.farmName}</div>
                            <div className="asf-owner-coords">
                                📍 {owner.lat.toFixed(4)}, {owner.lng.toFixed(4)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Full ASF Map Content
const ASFMapContent = () => {
    const [position, setPosition] = useState([13.9333, 120.733]); // Default position
    const [hasSelected, setHasSelected] = useState(false);
    const [location, setLocation] = useState("Fetching location...");
    const mapContainerRef = useRef(null);
    
    const zones = [
        { label: "Depopulation Zone", radius: 500, color: "#ff4d4d" },
        { label: "Surveillance Zone", radius: 1000, color: "#ffd633" }
    ];

    // Calculate affected owners for each zone
    const getAffectedOwners = (zoneRadius) => {
        // Function to calculate distance between two points in meters
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371000; // Earth radius in meters
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        return hogOwnersData.filter(owner => {
            const distance = calculateDistance(
                position[0], position[1], 
                owner.lat, owner.lng
            );
            return distance <= zoneRadius;
        });
    };

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
        <div className="asf-map-wrapper">
            {/* Sidebar */}
            <div className="asf-sidebar">
                <h2 className="asf-title">ASF Detection System</h2>
                <div className="asf-section">
                    <FiAlertTriangle className="asf-icon" />
                    <span className="asf-section-text">ASF Outbreak Location</span>
                </div>
                <div className="asf-coord-box">
                    <strong>Latitude:</strong> {position[0].toFixed(5)}<br />
                    <strong>Longitude:</strong> {position[1].toFixed(5)}<br />
                    <strong>Location:</strong> {location}
                </div>
                <div className="asf-section">
                    <FiAlertTriangle className="asf-icon" />
                    <span className="asf-section-text">Affected Zones</span>
                </div>
                <div className="asf-zone-list">
                    {zones.map((zone, index) => (
                        <ZoneItem 
                            key={index} 
                            zone={zone} 
                            affectedOwners={getAffectedOwners(zone.radius)} 
                        />
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="asf-map-container" ref={mapContainerRef}>
                <MapContainer 
                    center={position} 
                    zoom={14} 
                    className="asf-leaflet-map" 
                    whenCreated={(map) => {
                        // Force map to recalculate size after render
                        setTimeout(() => {
                            map.invalidateSize(true);
                        }, 250);
                    }}
                >
                    <TileLayer 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        attribution="&copy; OpenStreetMap contributors" 
                    />
                    
                    <MapEvents onClick={handleMapClick} />
                    <MapResizer />
                    
                    {hasSelected && zones.map((zone, index) => (
                        <Circle 
                            key={index} 
                            center={position} 
                            radius={zone.radius} 
                            color={zone.color} 
                            fillOpacity={0.3} 
                        />
                    ))}
                    
                    {/* Main outbreak marker */}
                    <Marker 
                        position={position} 
                        icon={defaultIcon} 
                        draggable={true} 
                        eventHandlers={{ 
                            dragend: (e) => { 
                                setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]); 
                                setHasSelected(true); 
                            } 
                        }}
                    >
                        <Popup>
                            <b>ASF Outbreak Detected</b><br />
                            📍 {position[0].toFixed(4)}, {position[1].toFixed(4)}
                        </Popup>
                    </Marker>
                    
                    {/* Hog owner markers */}
                    {hogOwnersData.map(owner => (
                        <Marker 
                            key={owner.id} 
                            position={[owner.lat, owner.lng]} 
                            icon={hogOwnerIcon}
                        >
                            <Popup>
                                <b>{owner.name}</b><br />
                                <strong>{owner.farmName}</strong><br />
                                📍 {owner.lat.toFixed(4)}, {owner.lng.toFixed(4)}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="asf-modal-overlay">
            <div className="asf-modal-container" ref={modalRef}>
                <button className="asf-modal-close-btn" onClick={onClose}>
                    <FiX />
                </button>
                <div className="asf-modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Main Component
const ASFMap = () => {
    const [modalOpen, setModalOpen] = useState(false);

    const openModal = () => {
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <div className="asf-app-container">
            <h3>ASF MAP (SHOWS OUTBREAK ZONES)</h3>
            <MapPreview onClick={openModal} />
            
            <Modal isOpen={modalOpen} onClose={closeModal}>
                <ASFMapContent />
            </Modal>
        </div>
    );
};

export default ASFMap;