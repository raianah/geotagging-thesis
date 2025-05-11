import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import ASFMap from "./ASFMap";
import AddNotification from "./AddNotification";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, CheckCircle, XCircle, Eye, User, Mail, MapPin, Calendar, Phone, Home, Clipboard, X } from "lucide-react";
import { getAccounts, getDashboardData, getPendingAccounts, updateAccountStatus } from "../services/api";
import "../css/Navbar.css";
import "../css/EmployeeDashboard.css";

const EmployeeDashboard = ({ darkMode, setDarkMode }) => {
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [selectedStat, setSelectedStat] = useState(null);
    const [animationDirection, setAnimationDirection] = useState(null);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [asfOutbreakCount, setAsfOutbreakCount] = useState(0);

    const [notifications, setNotifications] = useState([]);
    const [notificationId, setNotificationId] = useState(0);

    // Fetch authenticated user profile from localStorage
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const profile = localStorage.getItem("profile");
            return profile ? JSON.parse(profile) : null;
        } catch {
            return null;
        }
    });

    const statTypes = [
        'Total No. of Registered Hog Raisers',
        'Pending Applications',
        'ASF Outbreak Reports'
    ];

    // Defensive: Only count registered hog raisers with role 'user' (case-insensitive) and status 'verified'
    useEffect(() => {
        async function fetchRegisteredUsers() {
            const updated = await getAccounts();
            setRegisteredUsers(updated.filter(acc => acc.role && acc.role.toLowerCase() === 'user' && acc.status && acc.status.toLowerCase() === 'verified'));
        }
        fetchRegisteredUsers();
    }, []);

    // Fetch real pending accounts and verified users from backend
    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            getPendingAccounts(),
            getDashboardData()
        ])
            .then(([pending, dashboard]) => {
                setPendingAccounts(pending);
                setFilteredAccounts(pending);
                setAsfOutbreakCount(dashboard.asfOutbreakCount || 0);
                setLoading(false);
            })
            .catch(err => {
                setError("Failed to fetch accounts or outbreak data: " + err.message);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showGraphModal) return;
            
            if (e.key === 'ArrowLeft') {
                navigateGraph('prev');
            } else if (e.key === 'ArrowRight') {
                navigateGraph('next');
            } else if (e.key === 'Escape') {
                closeGraphModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showGraphModal, selectedStat]);

    useEffect(() => {
        // Filter accounts by search term
        const q = searchTerm.toLowerCase();
        setFilteredAccounts(
            pendingAccounts.filter(acc =>
                acc.fullName.toLowerCase().includes(q) ||
                acc.emailAddress.toLowerCase().includes(q) ||
                (acc.contactNumber || "").toLowerCase().includes(q)
            )
        );
    }, [searchTerm, pendingAccounts]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showPendingModal) return;
            
            if (e.key === 'Escape') {
                closePendingModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPendingModal]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showDetailsModal) return;
            
            if (e.key === 'Escape') {
                closeDetailsModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showDetailsModal]);

    // Filter and sort accounts when search term or sort config changes
    useEffect(() => {
        let results = [...pendingAccounts];
        
        // Apply search filter
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(account => 
                account.fullName.toLowerCase().includes(lowercasedTerm) ||
                account.emailAddress.toLowerCase().includes(lowercasedTerm) ||
                account.location.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        // Apply sorting
        if (sortConfig.key) {
            results.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        setFilteredAccounts(results);
    }, [searchTerm, sortConfig, pendingAccounts]);

    const handleCardClick = (stat) => {
        setAnimationDirection('fade-in');
        setSelectedStat(stat);
        setShowGraphModal(true);
    };

    const closeGraphModal = () => {
        setAnimationDirection('fade-out');
        setTimeout(() => {
            setShowGraphModal(false);
            setSelectedStat(null);
            setAnimationDirection(null);
        }, 200);
    };

    const closePendingModal = () => {
        setShowPendingModal(false);
    };
    
    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedAccount(null);
    };

    const handleViewDetails = (account) => {
        setSelectedAccount(account);
        setShowDetailsModal(true);
    };

    const navigateGraph = (direction) => {
        const currentIndex = statTypes.indexOf(selectedStat);
        let newIndex;
        
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % statTypes.length;
            setAnimationDirection('slide-left');
        } else {
            newIndex = (currentIndex - 1 + statTypes.length) % statTypes.length;
            setAnimationDirection('slide-right');
        }
        
        setTimeout(() => {
            setSelectedStat(statTypes[newIndex]);
            setAnimationDirection(null);
        }, 200);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Accept or reject a pending account
    const handleAccountAction = async (uid, action) => {
        if (action !== 'approve' && action !== 'reject') return;
        const newStatus = action === 'approve' ? 'verified' : 'rejected';
        try {
            await updateAccountStatus(uid, newStatus);
            // Remove from pending list if approved, otherwise update status in place
            if (action === 'approve') {
                setPendingAccounts(prev => prev.filter(acc => acc.uid !== uid));
                setFilteredAccounts(prev => prev.filter(acc => acc.uid !== uid));
                const updated = await getAccounts();
                setRegisteredUsers(updated.filter(acc => acc.role && acc.role.toLowerCase() === 'user' && acc.status && acc.status.toLowerCase() === 'verified'));
            } else {
                setPendingAccounts(prev => prev.map(acc => acc.uid === uid ? { ...acc, status: 'rejected' } : acc));
                setFilteredAccounts(prev => prev.map(acc => acc.uid === uid ? { ...acc, status: 'rejected' } : acc));
            }
            // If viewing details of this account, close modal
            if (selectedAccount && selectedAccount.uid === uid) closeDetailsModal();
            if (action === 'approve') {
                showNotification("Account was approved", 'success');
            } else {
                showNotification("Account rejected.", 'error');
            }
        } catch (err) {
            showNotification("Failed to update account status: " + err.message, 'error');
        }
    };

    // Dynamic stat values based on backend data and logged-in employee
    // Registered users: only verified hog owners (role === 'user' && status === 'verified')
    // Pending applications: only pending
    // ASF Outbreak Reports: dynamic
    const statValues = {
        'Total No. of Registered Hog Raisers': registeredUsers.length,
        'Pending Applications': pendingAccounts.filter(acc => acc.role && acc.role.toLowerCase() === 'user' && acc.status && acc.status.toLowerCase() === 'pending').length,
        'ASF Outbreak Reports': asfOutbreakCount,
    };

    // Generate chart data based on real registration dates and ASF outbreaks
    const generateMonthlyData = () => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const last13Months = [];
        for (let i = 0; i < 13; i++) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const year = currentYear - Math.floor((12 - currentMonth + i) / 12);
            last13Months.unshift({
                label: `${months[monthIndex]} ${year}`,
                month: monthIndex,
                year
            });
        }
        // Aggregate registered users by registration month/year
        const userRegistrationsByMonth = last13Months.map(({label, month, year}) => {
            const count = registeredUsers.filter(user => {
                if (!user.userCreated) return false;
                const regDate = new Date(user.userCreated);
                return regDate.getMonth() === month && regDate.getFullYear() === year;
            }).length;
            return { name: label, value: count };
        });
        // Aggregate pending applications by registration month/year
        const pendingByMonth = last13Months.map(({label, month, year}) => {
            const count = pendingAccounts.filter(user => {
                if (!user.userCreated) return false;
                const regDate = new Date(user.userCreated);
                return regDate.getMonth() === month && regDate.getFullYear() === year;
            }).length;
            return { name: label, value: count };
        });
        // Outbreaks placeholder (for now, only total count, not by month)
        const outbreaksByMonth = last13Months.map(({label}, idx) => {
            // Optionally, if outbreak data includes dates, aggregate by month
            // For now, only total count for the last month
            if (idx === last13Months.length - 1) {
                return { name: label, value: asfOutbreakCount };
            }
            return { name: label, value: 0 };
        });
        return {
            'Total No. of Registered Hog Raisers': userRegistrationsByMonth,
            'Pending Applications': pendingByMonth,
            'ASF Outbreak Reports': outbreaksByMonth
        };
    };
    const chartData = generateMonthlyData();

    const generateChartAnalysis = (statType) => {
        const data = chartData[statType];
        if (!data || data.length < 2) return "Insufficient data for trend analysis.";
        
        // Get the most recent months for comparison (last 3 months)
        const recentMonths = data.slice(-3);
        
        // Calculate percentage change from previous to current month
        const currentValue = recentMonths[recentMonths.length - 1].value;
        const previousValue = recentMonths[recentMonths.length - 2].value;
        
        // Calculate trends
        const percentChange = previousValue === 0 
            ? (currentValue > 0 ? 100 : 0) 
            : ((currentValue - previousValue) / previousValue * 100).toFixed(1);
        
        // Trend direction
        const isIncreasing = currentValue > previousValue;
        const isSame = currentValue === previousValue;
        
        // Generate analysis text based on stat type
        switch (statType) {
            case 'Total No. of Registered Hog Raisers':
                if (isSame) return `Registration numbers have remained stable at ${currentValue} in the most recent month. No growth trend detected in the registration rate.`;
                return isIncreasing 
                    ? `User registrations increased by ${percentChange}% in the last month, showing positive adoption growth. Total registered users now at ${currentValue}.`
                    : `User registrations decreased by ${Math.abs(percentChange)}% compared to previous month. May require community outreach initiatives to boost adoption.`;
            
            case 'Pending Applications':
                if (isSame) return `The pending applications count remains steady at ${currentValue}. Current verification workflow is keeping pace with new applications.`;
                return isIncreasing 
                    ? `Pending applications increased by ${percentChange}% (${currentValue} total). Consider allocating additional resources for verification to prevent backlog.`
                    : `Pending applications decreased by ${Math.abs(percentChange)}%. Verification process is effectively managing the application queue.`;
            
            case 'ASF Outbreak Reports':
                if (currentValue === 0) return "No ASF outbreaks reported in the current period, indicating successful containment or prevention measures.";
                if (isSame) return `ASF outbreak reports remain consistent at ${currentValue}. Continue monitoring affected areas closely.`;
                return isIncreasing 
                    ? `ASF outbreak reports increased by ${percentChange}% to ${currentValue} total cases. Immediate attention required in affected locations.`
                    : `ASF outbreak reports decreased by ${Math.abs(percentChange)}%. Containment measures appear to be effective.`;
            
            default:
                return "Select a metric to view trend analysis.";
        }
    };

    // Custom tooltip component to prevent highlighting
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`custom-tooltip ${darkMode ? 'dark' : 'light'}`}>
                    <p className="tooltip-label">{label}</p>
                    <p className="tooltip-value">{`${selectedStat}: ${payload[0].value}`}</p>
                    {selectedStat === 'ASF Outbreak Reports' && payload[0].value > 0 && (
                        <p className="tooltip-alert">Requires attention</p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Get bar color based on stat type
    const getBarColor = (stat) => {
        const colors = {
            'Total No. of Registered Hog Raisers': '#4caf50',
            'Pending Applications': '#ff9800',
            'ASF Outbreak Reports': '#f44336'
        };
        return colors[stat] || '#ffcc00';
    };

    // Fix Date Applied formatting for pending accounts
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    return (
        <div className={`dashboard-wrapper ${darkMode ? 'dark-mode' : ''}`} style={{ marginTop: '50px' }}>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} currentUser={currentUser} />

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

            <div className="employee-dashboard-container">
                <div className="stats-section">
                    {statTypes.map((stat) => (
                        <div key={stat} className="stat-card" onClick={() => handleCardClick(stat)}>
                            <span>{statValues[stat]}</span>
                            <p>{stat}</p>
                        </div>
                    ))}
                </div>

                <div className="content-section">
                    <ASFMap />
                    <div className="quick-access">
                        <h3>Administrative Tools</h3>
                        <div className="admin-tools-container">
                            <button 
                                className="pending-accounts-btn"
                                onClick={() => setShowPendingModal(true)}
                            >
                                <div className="btn-content">
                                    <div className="btn-icon">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div className="btn-text">
                                        <span className="btn-title">Pending New Accounts</span>
                                        <span className="btn-count">{pendingAccounts.length} accounts waiting for verification</span>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <AddNotification />
                    </div>
                </div>
            </div>

            {showGraphModal && selectedStat && (
                <div className="graph-modal-overlay" onClick={closeGraphModal}>
                    <div className={`graph-modal-content ${animationDirection || ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="graph-modal-header">
                            <h2>{selectedStat}</h2>
                            <button className="em-close-btn" onClick={closeGraphModal}>×</button>
                        </div>
                        
                        {/* Desktop Chart - Only show on screens wider than 768px */}
                        <div className="graph-modal-body desktop-chart">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart 
                                    data={chartData[selectedStat]}
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 12}}
                                        interval={0}
                                        angle={0}
                                        textAnchor="middle"
                                        height={60}
                                        stroke={darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                                    />
                                    <YAxis stroke={darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"} />
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Legend wrapperStyle={{paddingTop: "10px"}} />
                                    <Bar 
                                        dataKey="value" 
                                        fill={getBarColor(selectedStat)} 
                                        animationDuration={750}
                                        animationEasing="ease-in-out"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Mobile Chart - Only show on screens 768px or smaller */}
                        <div className="graph-modal-body mobile-chart">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart 
                                    data={chartData[selectedStat]}
                                    margin={{ top: 5, right: 10, left: -10, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 9}}
                                        interval={1}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        stroke={darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                                    />
                                    <YAxis 
                                        stroke={darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                                        width={30}
                                        tickCount={5}
                                        tick={{fontSize: 10}}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Legend 
                                        wrapperStyle={{paddingTop: "5px", fontSize: "10px"}}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        fill={getBarColor(selectedStat)} 
                                        animationDuration={750}
                                        animationEasing="ease-in-out"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="graph-analysis">
                            <h3>Trend Analysis</h3>
                            <p>{generateChartAnalysis(selectedStat)}</p>
                        </div>
                        <div className="graph-navigation">
                            <button className="nav-btn prev-btn" onClick={() => navigateGraph('prev')}>
                                <ChevronLeft size={24} />
                            </button>
                            <div className="graph-indicators">
                                {statTypes.map((stat, index) => (
                                    <span 
                                        key={index} 
                                        className={`indicator ${selectedStat === stat ? 'active' : ''} ${darkMode ? 'dark' : 'light'}`}
                                        onClick={() => {
                                            setAnimationDirection('fade-in');
                                            setTimeout(() => {
                                                setSelectedStat(stat);
                                                setAnimationDirection(null);
                                            }, 200);
                                        }}
                                    />
                                ))}
                            </div>
                            <button className="nav-btn next-btn" onClick={() => navigateGraph('next')}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPendingModal && (
                <div className="modal-overlay" onClick={closePendingModal}>
                    <div className="pending-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="pending-modal-header">
                            <h2>Pending Account Verifications</h2>
                            <button className="em-close-btn" onClick={closePendingModal}>×</button>
                        </div>
                        <div className="pending-modal-search">
                            <div className="search-container">
                                <Search size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email, or location" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {loading ? (
                            <div className="loading">Loading accounts...</div>
                        ) : error ? (
                            <div className="error">{error}</div>
                        ) : (
                            <div className="pending-table-container">
                                <table className="pending-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('fullName')}>
                                                Name <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                            </th>
                                            <th onClick={() => handleSort('emailAddress')}>
                                                Email <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                            </th>
                                            <th onClick={() => handleSort('location')}>
                                                Location <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                            </th>
                                            <th onClick={() => handleSort('userCreated')}>
                                                Date Applied <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.length > 0 ? (
                                            filteredAccounts.map(account => (
                                                <tr key={account.uid}>
                                                    <td>{account.fullName}</td>
                                                    <td>{account.emailAddress}</td>
                                                    <td>{account.location}</td>
                                                    <td>{formatDate(account.userCreated)}</td>
                                                    <td className="action-buttons">
                                                        <button 
                                                            className="action-btn view-btn"
                                                            title="View Details"
                                                            onClick={() => handleViewDetails(account)}
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button 
                                                            className="action-btn approve-btn" 
                                                            onClick={() => handleAccountAction(account.uid, 'approve')}
                                                            title="Approve Account"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button 
                                                            className="action-btn reject-btn"
                                                            onClick={() => handleAccountAction(account.uid, 'reject')}
                                                            title="Reject Account"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="no-results">No pending accounts found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showDetailsModal && selectedAccount && (
                <div className="modal-overlay" onClick={closeDetailsModal}>
                    <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="details-modal-header">
                            <h2>Account Details</h2>
                            <button className="em-close-btn" onClick={closeDetailsModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="details-modal-body">
                            <div className="account-header">
                                <div className="account-avatar">
                                    <User size={40} />
                                </div>
                                <div className="account-title">
                                    <h3>{selectedAccount.fullName}</h3>
                                    <p className="account-subtitle">{selectedAccount.farmType} Hog Raiser • {selectedAccount.experience} Experience</p>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Contact Information</h4>
                                <div className="detail-item">
                                    <Mail size={16} />
                                    <span>{selectedAccount.emailAddress}</span>
                                </div>
                                <div className="detail-item">
                                    <Phone size={16} />
                                    <span>{selectedAccount.contactNumber}</span>
                                </div>
                                <div className="detail-item">
                                    <Home size={16} />
                                    <span>{selectedAccount.address}</span>
                                </div>
                                <div className="detail-item">
                                    <MapPin size={16} />
                                    <span>{selectedAccount.location}</span>
                                </div>
                                <div className="detail-item">
                                    <Calendar size={16} />
                                    <span>Applied on {formatDate(selectedAccount.userCreated)}</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Farm Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-grid-item">
                                        <span className="detail-label">Farm Size</span>
                                        <span className="detail-value">{selectedAccount.farmSize}</span>
                                    </div>
                                    <div className="detail-grid-item">
                                        <span className="detail-label">Hog Count</span>
                                        <span className="detail-value">{selectedAccount.hogCount} hogs</span>
                                    </div>
                                    <div className="detail-grid-item">
                                        <span className="detail-label">Farm Type</span>
                                        <span className="detail-value">{selectedAccount.farmType}</span>
                                    </div>
                                    <div className="detail-grid-item">
                                        <span className="detail-label">Experience</span>
                                        <span className="detail-value">{selectedAccount.experience}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Notes</h4>
                                <div className="detail-notes">
                                    <Clipboard size={16} />
                                    <p>{selectedAccount.notes}</p>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Documents Submitted</h4>
                                <div className="document-list">
                                    {selectedAccount.documents.map((doc, index) => (
                                        <div key={index} className="document-item">
                                            <div className="document-icon">📄</div>
                                            <span>{doc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="details-modal-footer">
                            <button className="btn secondary-btn" onClick={closeDetailsModal}>
                                Cancel
                            </button>
                            <div className="action-btns">
                                <button 
                                    className="btn reject-btn" 
                                    onClick={() => {
                                        handleAccountAction(selectedAccount.uid, 'reject');
                                    }}
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                                <button 
                                    className="btn approve-btn" 
                                    onClick={() => {
                                        handleAccountAction(selectedAccount.uid, 'approve');
                                    }}
                                >
                                    <CheckCircle size={16} />
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;