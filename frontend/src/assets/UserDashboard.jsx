import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { AlertCircle, Plus, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
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
        pigCount: "",
        farmSize: "",
        farmType: "Backyard"
    });
    const [accountData, setAccountData] = useState(null);
    const [farmData, setFarmData] = useState([]);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBranchData({
            ...newBranchData,
            [name]: value
        });
    };

    const handleAddBranch = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            // Call backend to add a new farm
            await addFarm(newBranchData);
            alert("New farm has been added successfully!");
            setShowAddBranchModal(false);
            setNewBranchData({
                branchName: "",
                address: "",
                city: "Balayan",
                province: "Batangas",
                pigCount: "",
                farmSize: "",
                farmType: "Backyard"
            });
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
                                    <div key={farm.id} className="farm-card">
                                        <h3>{farm.name}</h3>
                                        <div className="farm-details">
                                            <p><strong>Location:</strong> {farm.location}</p>
                                            <p><strong>Pigs:</strong> {farm.pigCount}</p>
                                            <p><strong>Type:</strong> {farm.farmType}</p>
                                        </div>
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
                                <label htmlFor="branchName">Farm Name</label>
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
                                <label htmlFor="address">Address</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={newBranchData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter street address"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="city">City/Town</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={newBranchData.city}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pigCount">Number of Pigs</label>
                                <input
                                    type="number"
                                    id="pigCount"
                                    name="pigCount"
                                    value={newBranchData.pigCount}
                                    onChange={handleInputChange}
                                    placeholder="How many pigs?"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="farmSize">Farm Size (hectares)</label>
                                <input
                                    type="number"
                                    id="farmSize"
                                    name="farmSize"
                                    value={newBranchData.farmSize}
                                    onChange={handleInputChange}
                                    placeholder="Size in hectares"
                                    step="0.1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="farmType">Farm Type</label>
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
        </div>
    );
};

export default UserDashboard;