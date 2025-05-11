import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import CameraModal from "./CameraUD";
import { AlertCircle, Plus, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getDashboardData, getProfile, addFarm } from "../services/api";
import "../css/Navbar.css";
import "../css/UserDashboard.css";

const UserDashboard = ({ darkMode, setDarkMode }) => {
    const [newsItems, setNewsItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddBranchModal, setShowAddBranchModal] = useState(false);
    const [expandedNewsItem, setExpandedNewsItem] = useState(null);
    const [newBranchData, setNewBranchData] = useState({
        branchName: "",
        address: "",
        city: "Balayan",
        province: "Batangas",
        farmSize: "",
        farmType: "Backyard",
        latitude: null,
        longitude: null
    });
    const [accountData, setAccountData] = useState(null);
    const [farmData, setFarmData] = useState([]);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const [hogs, setHogs] = useState([]);
    const [showAddHogModal, setShowAddHogModal] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [geocamImage, setGeocamImage] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [notificationId, setNotificationId] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        Promise.all([
            getDashboardData(),
            getProfile()
        ])
        .then(([dashboard, profile]) => {
            setAccountData(dashboard.accountInfo || {});
            setFarmData(dashboard.farms || []);
            setNewsItems(dashboard.news || []);
            setProfile(profile);
            setIsLoading(false);
        })
        .catch(err => {
            setError("Failed to load dashboard data: " + err.message);
            setIsLoading(false);
        });
    }, []);

    const formatDateForInput = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
    
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
    
        return [year, month, day].join('-');
    };

    const [newHog, setNewHog] = useState({
        breed: "Native (Backyard)",
        gender: "Male",
        birthday: formatDateForInput(new Date()),
        photos: []
    });
    
    // Add these handler functions
    const handleHogInputChange = (e) => {
        const { name, value } = e.target;
        setNewHog({
            ...newHog,
            [name]: value
        });
    };
    
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 0) {
            // Limit to 2 photos
            const selectedFiles = files.slice(0, Math.min(files.length, 2 - newHog.photos.length));
            
            // Convert files to data URLs
            const filePromises = selectedFiles.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            });
            
            Promise.all(filePromises).then(dataUrls => {
                setNewHog({
                    ...newHog,
                    photos: [...newHog.photos, ...dataUrls].slice(0, 2) // Ensure max 2 photos
                });
            });
        }
    };
    
    const removePhoto = (index) => {
        const updatedPhotos = [...newHog.photos];
        updatedPhotos.splice(index, 1);
        setNewHog({
            ...newHog,
            photos: updatedPhotos
        });
    };
    
    const handleAddHog = () => {
        setHogs([...hogs, { ...newHog, id: Date.now() }]);
        setNewHog({
            breed: "Native (Backyard)",
            gender: "Male",
            birthday: formatDateForInput(new Date()),
            photos: []
        });
        setShowAddHogModal(false);
    };
    
    const removeHog = (id) => {
        setHogs(hogs.filter(hog => hog.id !== id));
    };

    const getCurrentLocation = () => {
        setIsGettingLocation(true);
        setLocationError(null);
        
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setIsGettingLocation(false);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Reverse geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await response.json();
                    
                    setNewBranchData({
                        ...newBranchData,
                        address: data.display_name || `${data.address?.road || ''} ${data.address?.house_number || ''}`.trim(),
                        city: data.address?.city || data.address?.town || data.address?.village || newBranchData.city,
                        province: data.address?.state || data.address?.province || newBranchData.province,
                        latitude,
                        longitude
                    });
                    setIsGettingLocation(false);
                } catch (err) {
                    setLocationError('Failed to get location details');
                    setIsGettingLocation(false);
                    console.error("Reverse geocoding error:", err);
                }
            },
            (error) => {
                setLocationError(`Error getting location: ${error.message}`);
                setIsGettingLocation(false);
                console.error("Geolocation error:", error);
            }
        );
    };
    
    const openGeoCamera = () => {
        setIsCameraOpen(true);
    };
    
    const handleCameraCapture = async (imageBlob) => {
        setIsCameraOpen(false);
        setIsGettingLocation(true);
        
        try {
            // Store the image
            const reader = new FileReader();
            reader.onload = (e) => {
                setGeocamImage(e.target.result);
            };
            reader.readAsDataURL(imageBlob);
            
            // In real implementation, you would extract EXIF data from the image
            // For demo, we'll just use current position
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // Same reverse geocoding logic as getCurrentLocation
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await response.json();
                    
                    setNewBranchData({
                        ...newBranchData,
                        address: data.display_name || `${data.address?.road || ''} ${data.address?.house_number || ''}`.trim(),
                        city: data.address?.city || data.address?.town || data.address?.village || newBranchData.city,
                        province: data.address?.state || data.address?.province || newBranchData.province,
                        latitude,
                        longitude
                    });
                    setIsGettingLocation(false);
                },
                (error) => {
                    setLocationError(`Error getting location from image: ${error.message}`);
                    setIsGettingLocation(false);
                }
            );
        } catch (err) {
            setLocationError('Failed to process image location');
            setIsGettingLocation(false);
        }
    };
    
    const closeCameraModal = () => {
        setIsCameraOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBranchData({
            ...newBranchData,
            [name]: value
        });
    };

    const showNotification = (message, type = 'info') => {
        const id = notificationId + 1;
        setNotificationId(id);
        
        const newNotification = {
            id,
            message,
            type,
            timestamp: new Date()
        };
        
        setNotifications([...notifications, newNotification]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(notifications => 
                notifications.filter(notification => notification.id !== id)
            );
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(notifications => 
            notifications.filter(notification => notification.id !== id)
        );
    };

    const handleAddBranch = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            // Add hogs array to the data being sent
            await addFarm({
                ...newBranchData,
                hogs: hogs
            });
            showNotification("New farm has been added successfully!", "success")
            setShowAddBranchModal(false);
            setNewBranchData({
                branchName: "",
                address: "",
                city: "Balayan",
                province: "Batangas",
                farmSize: "",
                farmType: "Backyard",
                latitude: null,
                longitude: null
            });
            setHogs([]);
            setGeocamImage(null);
            // Refresh dashboard data
            setIsLoading(true);
            const dashboard = await getDashboardData();
            setAccountData(dashboard.accountInfo || {});
            setFarmData(dashboard.farms || []);
            setNewsItems(dashboard.news || []);
            setIsLoading(false);
        } catch (err) {
            setError("Failed to add farm: " + err.message);
        }
    };

    const toggleNewsExpand = (id) => {
        setExpandedNewsItem(expandedNewsItem === id ? null : id);
    };

    // Utility for status badge
    const getStatusBadge = (status) => {
        if (!status) return <span className="status-badge pending">Pending</span>;
        const lower = status.toLowerCase();
        if (lower === 'verified') return <span className="status-badge verified">Verified</span>;
        if (lower === 'pending') return <span className="status-badge pending">Pending</span>;
        if (lower === 'rejected') return <span className="status-badge rejected">Rejected</span>;
        return <span className="status-badge">{status}</span>;
    };

    // Utility for date formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Split fullName into firstName and lastName for display
    const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : '';
    const lastName = profile?.fullName ? profile.fullName.split(' ').slice(1).join(' ') : '';

    return (
        <div className={`dashboard-wrapper ${darkMode ? 'dark-mode' : ''}`}>
            <Navbar 
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                currentUser={profile ? {
                    firstName: profile.fullName ? profile.fullName.split(' ')[0] : '',
                    lastName: profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : '',
                    email: profile.email,
                    phone: profile.phone,
                    profilePicture: profile.profilePicture,
                    accountType: accountData?.accountType || 'Hog Owner',
                    emailVerified: profile.emailVerified,
                    phoneVerified: profile.phoneVerified
                } : undefined}
            />

            <div className="slide-notification-container">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`slide-notification notification-${notification.type}`}
                    >
                        <div className="slide-notification-content">
                            {notification.message}
                        </div>
                        <button 
                            className="slide-notification-close"
                            onClick={() => removeNotification(notification.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {isLoading ? (
                <div className="loading-indicator">Loading...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <div className="user-dashboard-container">
                    <h1>Welcome, {firstName} {lastName}</h1>

                    <div className="dashboard-content">
                        {/* Account Status Card */}
                        <div className="account-status-card">
                            <div className="card-header">
                                <h2>Your Account</h2>
                                {/* Always show status badge, fallback to Pending if missing */}
                                {getStatusBadge(profile?.status)}
                            </div>
                            <div className="account-info">
                                <div className="info-row">
                                    <span className="info-label">Member Since</span>
                                    <span className="info-value">{formatDate(profile?.userCreated)}</span>
                                </div>
                                {/* Show location if available */}
                                {profile?.location && (
                                    <div className="info-row">
                                        <span className="info-label">Location</span>
                                        <span className="info-value">{profile.location}
                                            {typeof profile.latitude === 'number' && typeof profile.longitude === 'number' &&
                                                <> (<span style={{fontSize:'0.9em'}}>{profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}</span>)</>
                                            }
                                        </span>
                                    </div>
                                )}
                                <div className="info-row">
                                    <span className="info-label">Total Farms</span>
                                    <span className="info-value">{accountData?.totalFarms}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Total Pigs</span>
                                    <span className="info-value">{accountData?.totalHogs}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Account Valid Until</span>
                                    <span className="info-value">{accountData?.nextInspection}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Account Type</span>
                                    <span className="info-value">{accountData?.accountType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Farms Card */}
                        <div className="add-branch-card">
                            <h2>Your Farms</h2>
                            <div className="farms-summary">
                                {farmData.map(farm => (
                                    <div key={farm.id} className={`farm-card ${selectedFarm === farm.id ? 'selected' : ''}`} onClick={() => setSelectedFarm(selectedFarm === farm.id ? null : farm.id)}>
                                        <h3>{farm.name}</h3>
                                        <div className="farm-details">
                                            <p><strong>Location:</strong> {farm.location}</p>
                                            <p><strong>Pigs:</strong> {farm.pigCount}</p>
                                            <p><strong>Type:</strong> {farm.farmType}</p>
                                        </div>
                                        
                                        {selectedFarm === farm.id && farm.hogs && (
                                            <div className="farm-hogs-detail">
                                                <h4>Hogs Information</h4>
                                                <div className="hogs-list-detail">
                                                    {farm.hogs.map((hog, index) => (
                                                        <div key={hog.id || index} className="hog-detail-item">
                                                            <div className="hog-detail-info">
                                                                <span className="hog-detail-title">Hog #{index + 1}</span>
                                                                <span className="hog-detail-text">
                                                                    {hog.breed} • {hog.gender} • Born: {new Date(hog.birthday).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {hog.photos && hog.photos.length > 0 && (
                                                                <div className="hog-photos">
                                                                    {hog.photos.map((photo, photoIndex) => (
                                                                        <img 
                                                                            key={photoIndex}
                                                                            src={photo} 
                                                                            alt={`Hog ${index + 1} photo ${photoIndex + 1}`}
                                                                            className="hog-photo-thumbnail"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button className="add-branch-btn" onClick={() => setShowAddBranchModal(true)}>
                                <Plus size={16} />
                                Add New Farm
                            </button>
                        </div>

                        {/* News Feed Card */}
                        <div className="news-feed-card">
                            <div className="card-header">
                                <h2>Important News</h2>
                                <button className="refresh-btn" onClick={() => {
                                    setIsLoading(true);
                                    setError(null);
                                    Promise.all([
                                        getDashboardData(),
                                        getProfile()
                                    ])
                                    .then(([dashboard, profile]) => {
                                        setAccountData(dashboard.accountInfo || {});
                                        setFarmData(dashboard.farms || []);
                                        setNewsItems(dashboard.news || []);
                                        setProfile(profile);
                                        setIsLoading(false);
                                    })
                                    .catch(err => {
                                        setError("Failed to load dashboard data: " + err.message);
                                        setIsLoading(false);
                                    });
                                }} disabled={isLoading}>
                                    <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
                                </button>
                            </div>
                            {isLoading ? (
                                <div className="loading-indicator">Loading news...</div>
                            ) : (
                                <div className="news-list">
                                    {newsItems.map(item => (
                                        <div key={item.id} className="news-item">
                                            <div className="news-header">
                                                {item.isUrgent && (
                                                    <div className="urgent-tag">
                                                        <AlertCircle size={14} />
                                                        Urgent
                                                    </div>
                                                )}
                                                <h3 className="news-title">{item.title}</h3>
                                                <div className="news-meta">
                                                    <span>{item.date}</span>
                                                </div>
                                            </div>
                                            <p className="news-summary">{item.summary}</p>
                                            
                                            {expandedNewsItem === item.id && (
                                                <div className="news-content">{item.content}</div>
                                            )}
                                            
                                            <div className="news-actions">
                                                <button className="expand-btn" onClick={() => toggleNewsExpand(item.id)}>
                                                    {expandedNewsItem === item.id ? (
                                                        <>
                                                            <ChevronUp size={16} />
                                                            Show Less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown size={16} />
                                                            Read More
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Farm Modal */}
            {showAddBranchModal && (
                <div className="modal-overlay" onClick={() => setShowAddBranchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Farm</h2>
                            <button className="close-btn" onClick={() => setShowAddBranchModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddBranch}>
                            <div className="form-group">
                                <label htmlFor="branchName">Farm Name<span className="required">*</span></label>
                                <input
                                    type="text"
                                    id="branchName"
                                    name="branchName"
                                    value={newBranchData.branchName}
                                    onChange={handleInputChange}
                                    placeholder="Enter farm name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Address<span className="required">*</span></label>
                                <div className="location-input-group">
                                    {newBranchData.address && (
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={newBranchData.address}
                                            onChange={handleInputChange}
                                            disabled
                                            required
                                        />
                                    )}
                                    <div className="location-buttons">
                                        <button 
                                            type="button" 
                                            className="ud-location-btn" 
                                            onClick={getCurrentLocation}
                                            disabled={isGettingLocation}
                                        >
                                            {isGettingLocation ? 'Getting...' : 'Get Current Location'}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="ud-location-btn" 
                                            onClick={openGeoCamera}
                                            disabled={isGettingLocation}
                                        >
                                            GeoCamera
                                        </button>
                                    </div>
                                    {locationError && <p className="error-message">{locationError}</p>}
                                    {newBranchData.latitude && newBranchData.longitude && !newBranchData.address && (
                                        <p className="location-coords">
                                            Coordinates: {newBranchData.latitude.toFixed(4)}, {newBranchData.longitude.toFixed(4)}
                                        </p>
                                    )}
                                    
                                    {/* Display geocam image when available */}
                                    {geocamImage && (
                                        <div className="geocam-image-container">
                                            <h4>GeoCamera Image</h4>
                                            <img 
                                                src={geocamImage} 
                                                alt="Location photo from GeoCamera" 
                                                className="geocam-image"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Hogs List<span className="required">*</span></label>
                                <div className="hogs-list">
                                    {hogs.length === 0 ? (
                                        <p className="no-hogs">No hogs added yet. Click the button below to add a hog.</p>
                                    ) : (
                                        hogs.map((hog, index) => (
                                            <div key={hog.id} className="hog-item">
                                                <div className="hog-info">
                                                    <span className="hog-breed">Hog #{index + 1}</span>
                                                    <span className="hog-details">
                                                        {hog.breed} • {hog.gender} • Born: {new Date(hog.birthday).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className="remove-hog-btn" 
                                                    onClick={() => removeHog(hog.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    className="ud-add-hog-btn" 
                                    onClick={() => setShowAddHogModal(true)}
                                >
                                    <Plus size={16} />
                                    Add Hog
                                </button>
                            </div>
                            <div className="form-group">
                                <label htmlFor="farmSize">Farm Size (in hectares)<span className="required">*</span></label>
                                <input
                                    type="number"
                                    id="farmSize"
                                    name="farmSize"
                                    value={newBranchData.farmSize}
                                    onChange={handleInputChange}
                                    placeholder="Size in hectares"
                                    step="0.1"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="farmType">Farm Type<span className="required">*</span></label>
                                <select
                                    id="farmType"
                                    name="farmType"
                                    value={newBranchData.farmType}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="Backyard">Backyard</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Semi-Commercial">Semi-Commercial</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowAddBranchModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Add Farm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Hog Modal */}
            {showAddHogModal && (
                <div className="modal-overlay" onClick={() => setShowAddHogModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Hog</h2>
                            <button className="close-btn" onClick={() => setShowAddHogModal(false)}>×</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleAddHog();
                        }}>
                            <div className="form-group">
                                <label htmlFor="breed">Breed</label>
                                <select
                                    id="breed"
                                    name="breed"
                                    value={newHog.breed}
                                    onChange={handleHogInputChange}
                                    required
                                >
                                    <option value="Native (Backyard)">Native (Backyard)</option>
                                    <option value="Large White">Large White</option>
                                    <option value="Landrace">Landrace</option>
                                    <option value="Duroc">Duroc</option>
                                    <option value="Hampshire">Hampshire</option>
                                    <option value="Chester White">Chester White</option>
                                    <option value="Berkshire">Berkshire</option>
                                    <option value="Pietrain">Pietrain</option>
                                    <option value="Large Black">Large Black</option>
                                    <option value="Crossbreed">Crossbreed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={newHog.gender}
                                    onChange={handleHogInputChange}
                                    required
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="birthday">Birthday</label>
                                <input
                                    type="date"
                                    id="birthday"
                                    name="birthday"
                                    value={newHog.birthday}
                                    onChange={handleHogInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Photos (Max 2)</label>
                                <div className="photo-upload-container">
                                    {newHog.photos.length < 2 && (
                                        <div className="photo-upload-input">
                                            <input
                                                type="file"
                                                id="hogPhotos"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="hogPhotos" className="ud-location-btn">
                                                Upload Photo
                                            </label>
                                        </div>
                                    )}
                                    
                                    {newHog.photos.length > 0 && (
                                        <div className="photo-previews">
                                            {newHog.photos.map((photo, index) => (
                                                <div key={index} className="photo-preview">
                                                    <img src={photo} alt={`Hog photo ${index + 1}`} />
                                                    <button 
                                                        type="button" 
                                                        className="remove-photo-btn"
                                                        onClick={() => removePhoto(index)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {newHog.photos.length === 0 && (
                                        <p className="no-photos">No photos added yet. You must add at least 1 photo.</p>
                                    )}
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowAddHogModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={newHog.photos.length === 0}
                                >
                                    Add Hog
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Camera Modal Component */}
            <CameraModal 
                isOpen={isCameraOpen} 
                onCapture={handleCameraCapture} 
                onClose={closeCameraModal} 
            />

        </div>
    );
};

export default UserDashboard;