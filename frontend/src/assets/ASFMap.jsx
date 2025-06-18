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
                    {zone.count} farms
                    {isOpen ? <FiChevronUp className="asf-dropdown-icon" /> : <FiChevronDown className="asf-dropdown-icon" />}
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

const OptimizedSidebar = ({
    outbreakLocation,
    asfPositiveFarmsList,
    affectedZonesData,
    visibleZones,
    isMobile = false
}) => {
    return (
        <div className="asf-sidebar">
            <h2 className="asf-title">
                ASF Map (Show Outbreak Zones)
            </h2>
            <div className="asf-section">
                <FiAlertTriangle className="asf-icon" />
                <span className="asf-section-text">
                    ASF Outbreak Location
                </span>
            </div>
            <div className="asf-coord-box">
                <strong>Location:</strong> {outbreakLocation || ''}
            </div>
            <div className="asf-section">
                <FiAlertTriangle className="asf-icon" />
                <span className="asf-section-text">Affected Zones</span>
            </div>
            <div className="asf-zone-list">
                {asfPositiveFarmsList.length === 0 && (
                    <div style={{ color: '#888', fontSize: 14, padding: '8px 0' }}>No confirmed ASF-positive farms.</div>
                )}
                {asfPositiveFarmsList.map((farm, idx) => (
                    <div key={farm.uid} className="asf-zone-item" style={{ backgroundColor: '#fff', border: '1px solid #eee', marginBottom: 10 }}>
                        <div className="asf-zone-header" style={{ cursor: 'default' }}>
                            <MdLocationPin className="asf-zone-icon" />
                            <span style={{ fontWeight: 600 }}>{farm.name}</span>
                        </div>
                        <div className="asf-owner-coords" style={{ fontSize: 12, marginBottom: 6 }}>
                            📍 {farm.location || `${Number(farm.latitude).toFixed(4)}, ${Number(farm.longitude).toFixed(4)}`}
                        </div>
                        {visibleZones[farm.uid]?.depopulation && (
                            <>
                                <div style={{ fontWeight: 500, color: '#ff6b6b', marginBottom: 2 }}>Depopulation Zone (500m):</div>
                                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                    {affectedZonesData[farm.uid]?.red.length === 0 ? (
                                        <li style={{ color: '#aaa' }}>No farms in red zone.</li>
                                    ) : affectedZonesData[farm.uid].red.map(f => (
                                        <li key={f.uid}>{f.name} <span style={{ color: '#888', fontSize: 11 }}>({f.location || `${Number(f.latitude).toFixed(4)}, ${Number(f.longitude).toFixed(4)}`})</span></li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {visibleZones[farm.uid]?.highRisk && (
                            <>
                                <div style={{ fontWeight: 500, color: '#ffd633', margin: '6px 0 2px 0' }}>High Risk Zone (1000m):</div>
                                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                    {affectedZonesData[farm.uid]?.yellow.length === 0 ? (
                                        <li style={{ color: '#aaa' }}>No farms in yellow zone.</li>
                                    ) : affectedZonesData[farm.uid].yellow.map(f => (
                                        <li key={f.uid}>{f.name} <span style={{ color: '#888', fontSize: 11 }}>({f.location || `${Number(f.latitude).toFixed(4)}, ${Number(f.longitude).toFixed(4)}`})</span></li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {!visibleZones[farm.uid]?.depopulation && !visibleZones[farm.uid]?.highRisk && (
                            <div style={{ color: '#aaa', fontSize: 13, margin: '6px 0' }}>No zones are currently shown for this farm.</div>
                        )}
                    </div>
                ))}
            </div>
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hogOwners, setHogOwners] = useState([]);
    const [showHogOwners, setShowHogOwners] = useState(true);
    const [position, setPosition] = useState([13.9374, 120.7335]);
    const [location, setLocation] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mapComponents, setMapComponents] = useState(null);
    const [hasSelected, setHasSelected] = useState(false);
    const mapContainerRef = useRef(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [visibleZones, setVisibleZones] = useState({});
    const [asfPositiveFarms, setAsfPositiveFarms] = useState(new Set());
    const [zones, setZones] = useState([
        { id: 'zone1', label: 'Depopulation Zone', radius: 500, color: '#ff6b6b', count: 0 },
        { id: 'zone2', label: 'High Risk Zone', radius: 1000, color: '#ffd633', count: 0 },
    ]);
    const [notifications, setNotifications] = useState([]);
    const [outbreakAddress, setOutbreakAddress] = useState("");
    
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
                setError(null);
                const response = await getVerifiedHogOwners();
                if (Array.isArray(response)) {
                    if (response.length === 0) {
                        setError('No verified hog owners found with location data');
                    } else {
                        setHogOwners(response);
                    }
                } else {
                    setError('Invalid response format from server');
                    console.error('Invalid response format:', response);
                }
            } catch (err) {
                const errorMessage = err.message === 'Session expired. Please login again.' 
                    ? 'Your session has expired. Please log in again.'
                    : 'Failed to fetch hog owner data. Please try again later.';
                setError(errorMessage);
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

    if (error) {
        return (
            <div className="asf-error">
                <FiAlertTriangle className="asf-error-icon" />
                <p>{error}</p>
                {error.includes('session') && (
                    <button 
                        onClick={() => window.location.href = '/login'}
                        className="asf-error-button"
                    >
                        Go to Login
                    </button>
                )}
            </div>
        );
    }

    if (loading) {
        return <div className="asf-loading">Loading hog owner data...</div>;
    }

    const { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } = mapComponents;

    const handleMapClick = (e) => {
        setHasSelected(true);
    };

    const handleMarkerClick = async (owner) => {
        setSelectedMarker(owner);
        setPosition([Number(owner.latitude), Number(owner.longitude)]);
        // Fetch real-world address using reverse geocoding
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${owner.latitude}&lon=${owner.longitude}`);
            const data = await response.json();
            setOutbreakAddress(data.display_name || `${Number(owner.latitude).toFixed(4)}, ${Number(owner.longitude).toFixed(4)}`);
        } catch (error) {
            setOutbreakAddress(`${Number(owner.latitude).toFixed(4)}, ${Number(owner.longitude).toFixed(4)}`);
        }
    };

    const confirmAsfPositive = (owner) => {
        setAsfPositiveFarms(prev => {
            const newSet = new Set(prev);
            newSet.add(owner.uid);
            return newSet;
        });
        setVisibleZones(prev => ({
            ...prev,
            [owner.uid]: {
                depopulation: true,
                highRisk: true
            }
        }));
    };

    const clearAsfStatus = (owner) => {
        setAsfPositiveFarms(prev => {
            const newSet = new Set(prev);
            newSet.delete(owner.uid);
            return newSet;
        });
        setVisibleZones(prev => {
            const newZones = { ...prev };
            delete newZones[owner.uid];
            return newZones;
        });
    };

    const toggleZone = (ownerId, zoneType) => {
        setVisibleZones(prev => ({
            ...prev,
            [ownerId]: {
                ...prev[ownerId],
                [zoneType]: !prev[ownerId]?.[zoneType]
            }
        }));
    };

    // Calculate outbreakLocation (blank by default, updates on marker click)
    const outbreakLocation = selectedMarker ? (outbreakAddress || "") : '';
    // List of confirmed ASF-positive farms
    const asfPositiveFarmsList = hogOwners.filter(owner => asfPositiveFarms.has(owner.uid));
    // Calculate affected zones for each ASF-positive farm
    const affectedZonesData = {};
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
    asfPositiveFarmsList.forEach(farm => {
        const red = [];
        const yellow = [];
        hogOwners.forEach(other => {
            if (other.uid === farm.uid) return;
            const dist = calculateDistance(Number(farm.latitude), Number(farm.longitude), Number(other.latitude), Number(other.longitude));
            if (dist <= 500) red.push(other);
            else if (dist <= 1000) yellow.push(other);
        });
        affectedZonesData[farm.uid] = { red, yellow };
    });

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
                    {/* Hog owner markers */}
                    {!loading && !error && showHogOwners && hogOwners.map((owner, index) => (
                        <Marker 
                            key={index} 
                            position={[Number(owner.latitude), Number(owner.longitude)]} 
                            icon={hogOwnerIcon}
                            eventHandlers={{
                                click: () => handleMarkerClick(owner)
                            }}
                        >
                            <Popup>
                                <div className="asf-popup-content">
                                <b>{owner.name}</b><br />
                                📍 {Number(owner.latitude).toFixed(4)}, {Number(owner.longitude).toFixed(4)}<br />
                                {owner.address}
                                    <div className="asf-zone-controls">
                                        {!asfPositiveFarms.has(owner.uid) ? (
                                            <button 
                                                className="asf-confirm-btn"
                                                onClick={() => confirmAsfPositive(owner)}
                                            >
                                                Confirm ASF-Positive
                                            </button>
                                        ) : (
                                            <div className="asf-status">
                                                <div className="asf-status-header">
                                                    <span className="asf-status-badge">ASF-Positive</span>
                                                    <button 
                                                        className="asf-clear-btn"
                                                        onClick={() => clearAsfStatus(owner)}
                                                    >
                                                        Clear Status
                                                    </button>
                                                </div>
                                                <div className="asf-zone-info">
                                                    <div className="asf-zone-info-item">
                                                        <span className="asf-zone-color red"></span>
                                                        Depopulation Zone (500m)
                                                    </div>
                                                    <div className="asf-zone-info-item">
                                                        <span className="asf-zone-color yellow"></span>
                                                        High Risk Zone (1000m)
                                                    </div>
                                                </div>
                                                <div className="asf-zone-toggles">
                                                    <button 
                                                        className={`asf-zone-toggle-btn ${visibleZones[owner.uid]?.depopulation ? 'active' : ''}`}
                                                        onClick={() => toggleZone(owner.uid, 'depopulation')}
                                                    >
                                                        {visibleZones[owner.uid]?.depopulation ? 'Hide' : 'Show'} Red Zone
                                                    </button>
                                                    <button 
                                                        className={`asf-zone-toggle-btn ${visibleZones[owner.uid]?.highRisk ? 'active' : ''}`}
                                                        onClick={() => toggleZone(owner.uid, 'highRisk')}
                                                    >
                                                        {visibleZones[owner.uid]?.highRisk ? 'Hide' : 'Show'} Yellow Zone
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                            {asfPositiveFarms.has(owner.uid) && (
                                <>
                                    {visibleZones[owner.uid]?.depopulation && (
                                        <Circle
                                            center={[Number(owner.latitude), Number(owner.longitude)]}
                                            radius={500}
                                            pathOptions={{ color: '#ff6b6b', fillColor: '#ff6b6b', fillOpacity: 0.2 }}
                                        />
                                    )}
                                    {visibleZones[owner.uid]?.highRisk && (
                                        <Circle
                                            center={[Number(owner.latitude), Number(owner.longitude)]}
                                            radius={1000}
                                            pathOptions={{ color: '#ffd633', fillColor: '#ffd633', fillOpacity: 0.2 }}
                                        />
                                    )}
                                </>
                            )}
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            {/* Sidebar - will appear at bottom on mobile due to CSS order property */}
            <OptimizedSidebar 
                outbreakLocation={outbreakLocation}
                asfPositiveFarmsList={asfPositiveFarmsList}
                affectedZonesData={affectedZonesData}
                visibleZones={visibleZones}
                isMobile={isMobile}
            />
        </div>
    );
};

const getZonesForMarker = (markerId) => {
    return [
        { id: `zone1-${markerId}`, label: 'Depopulation Zone', radius: 500, color: '#ff6b6b' },
        { id: `zone2-${markerId}`, label: 'High Risk Zone', radius: 1000, color: '#ffd633' }
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