import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { AlertCircle, Plus, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import "../css/Navbar.css";
import "../css/UserDashboard.css";

// Gobbledygook Import
import { MdVerified } from "react-icons/md";
// End of Gobbledygook

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

    // Account data
    const accountData = {
        status: "Active",
        memberSince: "January 15, 2025",
        lastLogin: "April 12, 2025",
        totalFarms: 2,
        totalHogs: 34,
        nextInspection: "April 25, 2026",
        accountType: "Verified"
    };

    // Farm data - simplified
    const farmData = [
        {
            id: 1,
            name: "Diaz Farm #1",
            location: "Brgy. 2",
            pigCount: 24,
            type: "Commercial"
        },
        {
            id: 2,
            name: "Diaz Farm #2",
            location: "Brgy. Dilao",
            pigCount: 10,
            type: "Backyard"
        }
    ];

    useEffect(() => {
        // Simulate fetching news data
        fetchNews();
    }, []);

    const fetchNews = () => {
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            const mockNewsData = [
                {
                    id: 1,
                    title: "New Vaccination Schedule for Q2 2025",
                    date: "April 10, 2025",
                    source: "Balayan Agricultural Office",
                    summary: "The Balayan Agricultural Office has released the new vaccination schedule for all registered hog farms in the region.",
                    isUrgent: true,
                    content: "All registered hog farms in Balayan are required to participate in the Q2 2025 vaccination program. The schedule will run from May 1st to May 30th. Contact the Balayan Agricultural Office at (043) 123-4567 for your farm's scheduled date."
                },
                {
                    id: 2,
                    title: "Feed Costs Decreased by 5%",
                    date: "April 8, 2025",
                    source: "Feed Suppliers Association",
                    summary: "Good news for hog farmers as feed prices have decreased by 5% due to improved harvests this season.",
                    isUrgent: false,
                    content: "Feed prices will be lower starting April 15, 2025. This is a good time to stock up on quality feed for your pigs. Contact your local feed supplier for the new prices."
                },
                {
                    id: 3,
                    title: "Free Workshop: Better Hog Farming",
                    date: "April 5, 2025",
                    source: "Batangas Agricultural College",
                    summary: "Learn new techniques to improve your hog farm on April 28-29, 2025.",
                    isUrgent: false,
                    content: "Join this free two-day workshop to learn about waste management, water saving, and better feeding practices. Registration is free. Call (043) 765-4321 to reserve your spot before April 20."
                }
            ];
            
            setNewsItems(mockNewsData);
            setIsLoading(false);
        }, 1000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBranchData({
            ...newBranchData,
            [name]: value
        });
    };

    const handleAddBranch = (e) => {
        e.preventDefault();
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
    };

    const toggleNewsExpand = (id) => {
        setExpandedNewsItem(expandedNewsItem === id ? null : id);
    };

    return (
        <div className={`dashboard-wrapper ${darkMode ? 'dark-mode' : ''}`}>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="user-dashboard-container">
                <h1>Welcome, Virgilio Jr Diaz</h1>

                <div className="dashboard-content">
                    {/* Account Status Card */}
                    <div className="account-status-card">
                        <div className="card-header">
                            <h2>Your Account</h2>
                            <span className="status-badge active">Active</span>
                        </div>
                        <div className="account-info">
                            <div className="info-row">
                                <span className="info-label">Member Since</span>
                                <span className="info-value">{accountData.memberSince}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Total Farms</span>
                                <span className="info-value">{accountData.totalFarms}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Total Pigs</span>
                                <span className="info-value">{accountData.totalHogs}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Account Valid Until</span>
                                <span className="info-value">{accountData.nextInspection}</span>
                            </div>

                            {/* Gobbledygook Info - Might Remove Soon */}
                            <div className="info-row">
                                <span className="info-label">Account Status</span>
                                <span className="info-value"><MdVerified style={{ color: 'yellow' }} /> {accountData.accountType}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Favorite Relapse Song</span>
                                <span className="info-value">Cup of Joe - Multo</span>
                            </div>
                            {/* End of Gobbledygook */}

                        </div>
                        {/* Unlock this shit if you want buttons below */}
                        {/* <div className="account-actions">
                            <button className="action-button">Update Profile</button>
                            <button className="action-button">View Certificates</button>
                        </div> */}
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
                                        <p><strong>Type:</strong> {farm.type}</p>
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
                            <button className="refresh-btn" onClick={fetchNews} disabled={isLoading}>
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