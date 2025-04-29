import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { FiAlertTriangle, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../css/ASFMap.css";
import { getHogOwners, getAccounts } from "../services/api";

// Fix for default icon in Leaflet 
const defaultIcon = L.icon({ 
    iconUrl: markerIcon, 
    iconSize: [25, 41], 
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34] 
});

// Custom smaller icon for hog owners
const hogOwnerIcon = L.icon({
    iconUrl: markerIcon,
    iconSize: [15, 25],  // Smaller than default
    iconAnchor: [7, 25],
    popupAnchor: [1, -20]
});

// Custom icon for registered & verified users
const verifiedUserIcon = L.icon({
    iconUrl: markerIcon,
    iconSize: [18, 28],
    iconAnchor: [9, 28],
    popupAnchor: [1, -22],
    className: "verified-user-marker"
});

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
    const [selectedUser, setSelectedUser] = useState(null);
    const [location, setLocation] = useState("Select a marker to view details");
    const mapContainerRef = useRef(null);
    const [hogOwners, setHogOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verifiedUsers, setVerifiedUsers] = useState([]);

    const zones = [
        { label: "Depopulation Zone", radius: 500, color: "#ff4d4d" },
        { label: "Surveillance Zone", radius: 1000, color: "#ffd633" }
    ];

    useEffect(() => {
        async function fetchHogOwners() {
            setLoading(true);
            setError(null);
            try {
                const data = await getHogOwners();
                setHogOwners(data);
            } catch (err) {
                setError("Failed to load hog owners.");
            }
            setLoading(false);
        }
        fetchHogOwners();

        async function fetchVerifiedUsers() {
            try {
                const accounts = await getAccounts();
                const verified = accounts.filter(acc => acc.status && acc.status.toLowerCase() === 'verified' && acc.latitude && acc.longitude);
                setVerifiedUsers(verified.map(acc => ({
                    id: acc.uid,
                    name: acc.fullName,
                    lat: acc.latitude,
                    lng: acc.longitude,
                    email: acc.emailAddress,
                    status: acc.status,
                    phone: acc.contactNumber
                })));
            } catch (err) {
                // Optionally set error state
            }
        }
        fetchVerifiedUsers();
    }, []);

    // Update location info when marker is clicked
    const handleMarkerClick = async (user) => {
        setSelectedUser(user);
        // Fetch location from coordinates
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${user.lat}&lon=${user.lng}`);
            const data = await response.json();
            setLocation(data.display_name || "Unknown location");
        } catch (error) {
            setLocation("Location unavailable");
        }
    };

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
                    {selectedUser ? (
                        <>
                            <div><b>Latitude:</b> {selectedUser.lat}</div>
                            <div><b>Longitude:</b> {selectedUser.lng}</div>
                            <div><b>Location:</b> {location}</div>
                        </>
                    ) : (
                        <div>Select a marker to view coordinates and location.</div>
                    )}
                </div>
                <div className="asf-section">
                    <FiAlertTriangle className="asf-icon" />
                    <span className="asf-section-text">Affected Zones</span>
                </div>
                <div className="asf-zone-item" style={{ backgroundColor: '#ff4d4d' }}>
                    <div className="asf-zone-header">
                        <MdLocationPin className="asf-zone-icon" />
                        <span>Depopulation Zone</span>
                    </div>
                    <div className="asf-coords">Approx. within 0.5KM</div>
                </div>
                <div className="asf-zone-item" style={{ backgroundColor: '#ffd633' }}>
                    <div className="asf-zone-header">
                        <MdLocationPin className="asf-zone-icon" />
                        <span>Surveillance Zone</span>
                    </div>
                    <div className="asf-coords">Approx. within 1KM</div>
                </div>
            </div>

            {/* Map */}
            <div className="asf-map-container" ref={mapContainerRef}>
                {loading && <div>Loading hog owner locations...</div>}
                {error && <div className="error-message">{error}</div>}
                <MapContainer 
                    center={selectedUser ? [selectedUser.lat, selectedUser.lng] : [13.9333, 120.733]} 
                    zoom={14} 
                    style={{ height: "100%", width: "100%" }}
                    ref={mapContainerRef}
                >
                    <TileLayer 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        attribution="&copy; OpenStreetMap contributors" 
                    />
                    
                    <MapResizer />
                    
                    {/* Red & Yellow Zones for each verified user */}
                    {verifiedUsers.map(user => [
                        <Circle
                            key={`red-${user.id}`}
                            center={[user.lat, user.lng]}
                            radius={500}
                            color="#ff4d4d"
                            fillOpacity={0.2}
                        />, 
                        <Circle
                            key={`yellow-${user.id}`}
                            center={[user.lat, user.lng]}
                            radius={1000}
                            color="#ffd633"
                            fillOpacity={0.15}
                        />
                    ])}
                    
                    {/* Verified user markers */}
                    {verifiedUsers.map(user => (
                        <Marker 
                            key={user.id} 
                            position={[user.lat, user.lng]} 
                            icon={verifiedUserIcon}
                            eventHandlers={{ click: () => handleMarkerClick(user) }}
                        >
                            <Popup>
                                <div className="custom-popup">
                                    <b>{user.name}</b><br />
                                    <span>{user.email}</span><br />
                                    <span>Status: {user.status}</span><br />
                                    <span>Phone: {user.phone}</span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    
                    {/* Hog owner markers */}
                    {hogOwners.map(owner => (
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