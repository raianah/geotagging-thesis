import { useEffect, useState, useRef } from "react";
import { FiAlertTriangle, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";
import { getVerifiedHogOwners } from "../services/api";
import "../css/ASFMap.css";

let defaultIcon = null;

let hogOwnerIcon = null;

const initializeIcons = async () => {
    if (typeof window !== 'undefined') {
        const L = (await import('leaflet')).default;
        const markerIcon = (await import('leaflet/dist/images/marker-icon.png')).default;
        const markerShadow = (await import('leaflet/dist/images/marker-shadow.png')).default;
        
        defaultIcon = L.icon({ 
            iconUrl: markerIcon, 
            shadowUrl: markerShadow, 
            iconSize: [25, 41], 
            iconAnchor: [12, 41], 
            popupAnchor: [1, -34] 
        });

        hogOwnerIcon = L.icon({
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
            iconSize: [15, 25],
            iconAnchor: [7, 25],
            popupAnchor: [1, -20]
        });
    }
};

// Map Events component to handle click events
const MapEvents = ({ onClick, useMapEvents }) => {
    if (!useMapEvents) return null;
    
    useMapEvents({
        click: onClick
    });
    return null;
};

// Component to force map to invalidate size when container changes
const MapResizer = ({ useMap }) => {
    const map = useMap();
    
    useEffect(() => {
        map.invalidateSize();
        
        const timeoutId = setTimeout(() => {
            map.invalidateSize(true);
        }, 300);
        
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

const ResponsiveMapHandler = ({ useMap }) => {
    const map = useMap();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setTimeout(() => {
                map.invalidateSize(true);
            }, 300);
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="asf-zone-item" style={{ backgroundColor: zone.color }}>
            <div className="asf-zone-header" onClick={() => setIsOpen(!isOpen)}>
                <MdLocationPin className="asf-zone-icon" />
                <span>{zone.label}</span>
                <div className="asf-owners-count">
                    {affectedOwners.length > 0 ? `${affectedOwners.length} farms` : ''}
                    {affectedOwners.length > 0 && (
                        isOpen ? <FiChevronUp className="asf-dropdown-icon" /> : <FiChevronDown className="asf-dropdown-icon" />
                    )}
                </div>
            </div>
            {isMobile && <div className="asf-coords">{zone.radius / 1000}KM radius</div>}
            
            {isOpen && affectedOwners.length > 0 && (
                <div className="asf-affected-owners-list">
                    {affectedOwners.map(owner => (
                        <div key={owner.id} className="asf-owner-item">
                            <strong>{owner.name}</strong>
                            <div>{owner.farmName}</div>
                            {!isMobile && owner.lat && owner.lng && (
                                <div className="asf-owner-coords">
                                    📍 {owner.lat.toFixed(4)}, {owner.lng.toFixed(4)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const OptimizedSidebar = ({ position, location, zones, getAffectedOwners, markers = [], notifications = [], onAddMarker, onRemoveMarker, onSetMarker,isMobile = false }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    
    return (
        <div className="asf-sidebar">
            <h2 className="asf-title">
                {isMobile ? "ASF Detection" : "ASF Detection System"}
            </h2>
            
            {/* Control Buttons */}
            <div className="asf-control-section">
                <button 
                    className="asf-control-btn asf-add-btn"
                    onClick={onAddMarker}
                >
                    Add New Outbreak Marker
                </button>
                
                {notifications.length > 0 && (
                    <button 
                        className="asf-control-btn asf-notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        🔔 Notifications ({notifications.length})
                    </button>
                )}
            </div>

            {/* Notifications Panel */}
            {showNotifications && notifications.length > 0 && (
                <div className="asf-notifications-panel">
                    <h4>Farm Alerts</h4>
                    {notifications.slice(-5).map(notification => (
                        <div 
                            key={notification.id} 
                            className={`asf-notification ${notification.zoneType}`}
                        >
                            <strong>{notification.zoneType === 'depopulation' ? '🚨' : '⚠️'}</strong>
                            <span>{notification.message}</span>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="asf-section">
                <FiAlertTriangle className="asf-icon" />
                <span className="asf-section-text">
                    {isMobile ? "Primary Outbreak" : "Primary ASF Outbreak Location"}
                </span>
            </div>
            <div className="asf-coord-box">
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

            {/* Additional Markers Section */}
            {markers.length > 0 && (
                <>
                    <div className="asf-section">
                        <FiAlertTriangle className="asf-icon" />
                        <span className="asf-section-text">Additional Outbreaks</span>
                    </div>
                    <div className="asf-markers-list">
                        {markers.map(marker => (
                            <div key={marker.id} className="asf-marker-item">
                                <div className="asf-marker-header">
                                    <span>Outbreak #{marker.id.slice(-4)}</span>
                                    <div className="asf-marker-controls">
                                        <button 
                                            className={`asf-marker-btn ${marker.isLocked ? 'locked' : 'unlocked'}`}
                                            onClick={() => onSetMarker(marker.id, !marker.isLocked)}
                                        >
                                            {marker.isLocked ? '🔒' : '🔓'}
                                        </button>
                                        <button 
                                            className="asf-marker-btn remove"
                                            onClick={() => onRemoveMarker(marker.id)}
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                                <div className="asf-marker-coords">
                                    📍 {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                                </div>
                                {marker.zones.map(zone => (
                                    <ZoneItem 
                                        key={zone.id}
                                        zone={zone} 
                                        affectedOwners={getAffectedOwners(zone.radius, marker.position)} 
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ClientOnlyMap = ({ children, ...props }) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        initializeIcons();
    }, []);

    if (!hasMounted) {
        return <div className="asf-loading">Loading map...</div>;
    }

    return children;
};

// Full ASF Map Content
const ASFMapContent = () => {
    const [mapComponents, setMapComponents] = useState(null);
    const [position, setPosition] = useState([13.9333, 120.733]); // Default position
    const [hasSelected, setHasSelected] = useState(false);
    const [location, setLocation] = useState("Fetching location...");
    const mapContainerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [hogOwners, setHogOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [showHogOwners, setShowHogOwners] = useState(false);
    const [zones, setZones] = useState([
        { id: 'zone1', label: 'Depopulation Zone', radius: 500, color: '#ff6b6b' },
        { id: 'zone2', label: 'High Risk Zone', radius: 1000, color: '#ff6b6b' },
    ]);
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    
    // ALL useEffect hooks must come before any early returns
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', checkMobile);
        checkMobile();
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        const loadMapComponents = async () => {
            if (typeof window !== 'undefined') {
                const leafletCSS = await import('leaflet/dist/leaflet.css');
                const { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } = await import('react-leaflet');
                
                setMapComponents({
                    MapContainer,
                    TileLayer,
                    Circle,
                    Marker,
                    Popup,
                    useMapEvents,
                    useMap
                });
            }
        };
        
        loadMapComponents();
    }, []);

    // Fetch verified hog owners - MOVED BEFORE EARLY RETURN
    useEffect(() => {
        if (!showHogOwners) return;

        const fetchHogOwners = async () => {
            try {
                setLoading(true);
                const response = await getVerifiedHogOwners();
                if (Array.isArray(response)) {
                    setHogOwners(response);
                    setError(null);
                } else {
                    setError('Invalid response format');
                    console.error('Invalid response format:', response);
                }
            } catch (err) {
                setError('Failed to fetch hog owner data');
                console.error('Error fetching hog owners:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHogOwners();
    }, [showHogOwners]);

    useEffect(() => {
        const fetchLocation = async () => {
            const [lat, lng] = position;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                const displayName = data.display_name || "Unknown location";
                
                // For mobile, truncate the location name to make it shorter
                if (isMobile && displayName.length > 80) {
                    setLocation(displayName.substring(0, 77) + "...");
                } else {
                    setLocation(displayName);
                }
            } catch (error) {
                setLocation("Location unavailable");
            }
        };
        fetchLocation();
    }, [position, isMobile]);

    // EARLY RETURN AFTER ALL HOOKS
    if (!mapComponents || !defaultIcon || !hogOwnerIcon) {
        return <div className="asf-loading">Loading map components...</div>;
    }

    const { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } = mapComponents;

    // Calculate affected owners for each zone
    const getAffectedOwners = (zoneRadius, markerPosition = position) => {
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371000;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        return hogOwners.filter(owner => {
            const distance = calculateDistance(
                markerPosition[0], markerPosition[1], 
                owner.latitude, owner.longitude
            );
            return distance <= zoneRadius;
        });
    };

    const handleMapClick = (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
        setHasSelected(true);
    };

    const addNewMarker = () => {
        const newId = Date.now().toString();
        const newMarker = {
            id: newId,
            position: [position[0] + 0.001, position[1] + 0.001], // Slightly offset from current
            isLocked: false,
            zones: getZonesForMarker(newId)
        };
        setMarkers([...markers, newMarker]);
        setActiveMarkerId(newId);
    };

    return (
        <div className="asf-map-wrapper">
            {/* Map - will appear on top on mobile due to CSS order property */}
            <div className="asf-map-container" ref={mapContainerRef}>
                <MapContainer 
                    center={position} 
                    zoom={14} 
                    className="asf-leaflet-map" 
                    whenCreated={(map) => {
                        setTimeout(() => {
                            map.invalidateSize(true);
                        }, 250);
                    }}
                >
                    <TileLayer 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        attribution="&copy; OpenStreetMap contributors" 
                    />
                    
                    <MapEvents onClick={handleMapClick} useMapEvents={useMapEvents} />
                    <MapResizer useMap={useMap} />
                    <ResponsiveMapHandler useMap={useMap} />
                    
                    {/* Main outbreak zones */}
                    {hasSelected && zones.map((zone, index) => (
                        <Circle 
                            key={index} 
                            center={position} 
                            radius={zone.radius} 
                            color={zone.color} 
                            fillOpacity={0.3} 
                        />
                    ))}
                    
                    {/* Additional marker zones */}
                    {markers.map(marker => 
                        marker.zones.map(zone => (
                            <Circle 
                                key={zone.id}
                                center={marker.position} 
                                radius={zone.radius} 
                                color={zone.color} 
                                fillOpacity={0.3} 
                            />
                        ))
                    )}
                    
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
                            <div>
                                <b>Primary ASF Outbreak</b><br />
                                📍 {position[0].toFixed(4)}, {position[1].toFixed(4)}<br />
                                <button 
                                    onClick={addNewMarker}
                                    style={{
                                        marginTop: '8px',
                                        padding: '4px 8px',
                                        backgroundColor: '#ff6b6b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Add New Marker
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                    
                    {/* Additional outbreak markers */}
                    {markers.map(marker => (
                        <Marker 
                            key={marker.id}
                            position={marker.position} 
                            icon={defaultIcon} 
                            draggable={!marker.isLocked}
                            eventHandlers={{ 
                                dragend: (e) => { 
                                    if (!marker.isLocked) {
                                        updateMarkerPosition(marker.id, [e.target.getLatLng().lat, e.target.getLatLng().lng]);
                                    }
                                } 
                            }}
                        >
                            <Popup>
                                <div>
                                    <b>ASF Outbreak #{marker.id}</b><br />
                                    📍 {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}<br />
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                                        <button 
                                            onClick={() => setMarkerLocked(marker.id, !marker.isLocked)}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: marker.isLocked ? '#2ecc71' : '#f39c12',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {marker.isLocked ? 'Unlock' : 'Set Marker'}
                                        </button>
                                        <button 
                                            onClick={() => removeMarker(marker.id)}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    
                    {/* Hog owner markers */}
                    {!loading && !error && hogOwners.map(owner => (
                        <Marker 
                            key={owner.uid} 
                            position={[owner.latitude, owner.longitude]} 
                            icon={hogOwnerIcon}
                        >
                            <Popup>
                                <b>{owner.name}</b><br />
                                📍 {owner.latitude.toFixed(4)}, {owner.longitude.toFixed(4)}<br />
                                {owner.address}
                            </Popup>
                        </Marker>
                    ))}

                    {/* Loading and Error states remain the same */}
                    {loading && (
                        <div className="asf-loading">
                            Loading hog owner data...
                        </div>
                    )}

                    {error && (
                        <div className="asf-error">
                            {error}
                        </div>
                    )}
                </MapContainer>
            </div>
            
            {/* Sidebar - will appear at bottom on mobile due to CSS order property */}
            <OptimizedSidebar 
                position={position}
                location={location}
                zones={zones}
                getAffectedOwners={getAffectedOwners}
                markers={markers}
                notifications={notifications}
                onAddMarker={addNewMarker}
                onRemoveMarker={removeMarker}
                onSetMarker={setMarkerLocked}
                isMobile={isMobile}
            />
        </div>
    );
};

const getZonesForMarker = (markerId) => {
    return [
        { id: `zone1-${markerId}`, label: 'Depopulation Zone', radius: 500, color: '#ff6b6b' },
        { id: `zone2-${markerId}`, label: 'High Risk Zone', radius: 1000, color: '#ff6b6b' }
    ];
};

const removeMarker = (markerId) => {
    setMarkers(markers.filter(m => m.id !== markerId));
    if (activeMarkerId === markerId) {
        setActiveMarkerId(null);
    }
    // Remove notifications for this marker
    setNotifications(notifications.filter(n => n.markerId !== markerId));
};

const setMarkerLocked = (markerId, locked) => {
    setMarkers(markers.map(marker => 
        marker.id === markerId 
            ? { ...marker, isLocked: locked }
            : marker
    ));
    
    if (locked) {
        checkFarmsInZones(markerId);
    }
};

const updateMarkerPosition = (markerId, newPosition) => {
    setMarkers(markers.map(marker => 
        marker.id === markerId 
            ? { ...marker, position: newPosition }
            : marker
    ));
};

const checkFarmsInZones = (markerId) => {
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const newNotifications = [];
    
    marker.zones.forEach(zone => {
        hogOwners.forEach(owner => {
            const distance = calculateDistance(
                marker.position[0], marker.position[1],
                owner.latitude, owner.longitude
            );
            
            if (distance <= zone.radius) {
                newNotifications.push({
                    id: `${markerId}-${zone.id}-${owner.uid}`,
                    markerId: markerId,
                    zoneType: zone.type,
                    farmName: owner.name,
                    message: `Farm "${owner.name}" is in ${zone.label}`,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });

    setNotifications(prev => [
        ...prev.filter(n => n.markerId !== markerId),
        ...newNotifications
    ]);
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
                <ClientOnlyMap>
                    <ASFMapContent />
                </ClientOnlyMap>
            </Modal>
        </div>
    );
};

export default ASFMap;