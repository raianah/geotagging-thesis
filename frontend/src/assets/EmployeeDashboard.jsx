import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import ASFMap from "./ASFMap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, CheckCircle, XCircle, Eye, User, Mail, MapPin, Calendar, Phone, Home, Clipboard, X } from "lucide-react";
import "../css/Navbar.css";
import "../css/EmployeeDashboard.css";

const EmployeeDashboard = ({ darkMode, setDarkMode }) => {
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [selectedStat, setSelectedStat] = useState(null);
    const [animationDirection, setAnimationDirection] = useState(null);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
    const [filteredAccounts, setFilteredAccounts] = useState([]);

    const statTypes = [
        'Total No. of Registered Hog Raisers',
        'Pending Applications',
        'ASF Outbreak Reports'
    ];

    // Generate some mock data for pending accounts
    useEffect(() => {
        const mockAccounts = [
            { 
                id: 1, 
                name: "Juan Dela Cruz", 
                email: "juan@example.com", 
                location: "Bulacan", 
                date: "2025-04-18", 
                status: "pending",
                phone: "+63 912 345 6789",
                address: "123 Main St, San Miguel, Bulacan",
                farmSize: "2.5 hectares",
                hogCount: 25,
                farmType: "Backyard",
                experience: "5 years",
                notes: "Previously registered with the local agricultural office. Has completed training on biosecurity measures.",
                documents: ["Valid ID", "Land Title", "Business Permit"]
            },
            { 
                id: 2, 
                name: "Maria Santos", 
                email: "maria@example.com", 
                location: "Batangas", 
                date: "2025-04-17", 
                status: "pending",
                phone: "+63 917 876 5432",
                address: "456 Rizal Ave, Lipa City, Batangas",
                farmSize: "1.8 hectares",
                hogCount: 18,
                farmType: "Backyard",
                experience: "3 years",
                notes: "New to commercial hog raising. Seeking guidance on proper practices.",
                documents: ["Valid ID", "Barangay Certificate", "Tax Declaration"]
            },
            { 
                id: 3, 
                name: "Pedro Reyes", 
                email: "pedro@example.com", 
                location: "Laguna", 
                date: "2025-04-15", 
                status: "pending",
                phone: "+63 918 765 4321",
                address: "789 National Hwy, Calamba, Laguna",
                farmSize: "4.2 hectares",
                hogCount: 45,
                farmType: "Commercial",
                experience: "10 years",
                notes: "Expanding existing operation. Has implemented biosecurity protocols.",
                documents: ["Valid ID", "Business Registration", "Environmental Compliance Certificate"]
            },
            { 
                id: 4, 
                name: "Ana Gonzales", 
                email: "ana@example.com", 
                location: "Cavite", 
                date: "2025-04-14", 
                status: "pending",
                phone: "+63 919 234 5678",
                address: "321 Aguinaldo Hwy, Dasmariñas, Cavite",
                farmSize: "1.5 hectares",
                hogCount: 15,
                farmType: "Backyard",
                experience: "2 years",
                notes: "First-time registrant. Attended training sessions on hog raising.",
                documents: ["Valid ID", "Land Certificate"]
            },
            { 
                id: 5, 
                name: "Carlos Tan", 
                email: "carlos@example.com", 
                location: "Rizal", 
                date: "2025-04-12", 
                status: "pending",
                phone: "+63 920 345 6789",
                address: "654 Marcos Hwy, Antipolo, Rizal",
                farmSize: "3.7 hectares",
                hogCount: 40,
                farmType: "Commercial",
                experience: "7 years",
                notes: "Recently relocated from Bulacan. Previously registered under a different municipality.",
                documents: ["Valid ID", "Business Permit", "Sanitary Permit"]
            },
            { 
                id: 6, 
                name: "Elena Magtanggol", 
                email: "elena@example.com", 
                location: "Pampanga", 
                date: "2025-04-10", 
                status: "pending",
                phone: "+63 921 567 8901",
                address: "987 MacArthur Hwy, San Fernando, Pampanga",
                farmSize: "2.3 hectares",
                hogCount: 22,
                farmType: "Backyard",
                experience: "4 years",
                notes: "Expanding operation. Has completed certification on disease prevention.",
                documents: ["Valid ID", "Land Title", "Tax Clearance"]
            },
            { 
                id: 7, 
                name: "Roberto Lim", 
                email: "roberto@example.com", 
                location: "Nueva Ecija", 
                date: "2025-04-08", 
                status: "pending",
                phone: "+63 922 678 9012",
                address: "456 Maharlika Hwy, Cabanatuan, Nueva Ecija",
                farmSize: "5.1 hectares",
                hogCount: 60,
                farmType: "Commercial",
                experience: "12 years",
                notes: "Long-time hog raiser. Recently adopted modern farming techniques.",
                documents: ["Valid ID", "Business Registration", "Environmental Compliance Certificate"]
            },
            { 
                id: 8, 
                name: "Sofia Cruz", 
                email: "sofia@example.com", 
                location: "Tarlac", 
                date: "2025-04-05", 
                status: "pending",
                phone: "+63 923 789 0123",
                address: "234 Provincial Rd, Tarlac City, Tarlac",
                farmSize: "1.9 hectares",
                hogCount: 20,
                farmType: "Backyard",
                experience: "3 years",
                notes: "Seeking assistance with biosecurity implementation.",
                documents: ["Valid ID", "Property Document"]
            },
            { 
                id: 9, 
                name: "Miguel Bautista", 
                email: "miguel@example.com", 
                location: "Zambales", 
                date: "2025-04-02", 
                status: "pending",
                phone: "+63 924 890 1234",
                address: "567 National Rd, Olongapo, Zambales",
                farmSize: "3.2 hectares",
                hogCount: 35,
                farmType: "Commercial",
                experience: "6 years",
                notes: "Transitioning from poultry to hog raising. Has relevant agricultural experience.",
                documents: ["Valid ID", "Business Permit", "Sanitary Permit"]
            },
            { 
                id: 10, 
                name: "Olivia Reyes", 
                email: "olivia@example.com", 
                location: "Pangasinan", 
                date: "2025-04-01", 
                status: "pending",
                phone: "+63 925 901 2345",
                address: "890 Lingayen Hwy, Dagupan, Pangasinan",
                farmSize: "2.8 hectares",
                hogCount: 30,
                farmType: "Commercial",
                experience: "5 years",
                notes: "Family-run operation. Looking to modernize farming practices.",
                documents: ["Valid ID", "Land Title", "Business Permit"]
            },
        ];
        setPendingAccounts(mockAccounts);
        setFilteredAccounts(mockAccounts);
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

    // Filter and sort accounts when search term or sort config changes
    useEffect(() => {
        let results = [...pendingAccounts];
        
        // Apply search filter
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(account => 
                account.name.toLowerCase().includes(lowercasedTerm) ||
                account.email.toLowerCase().includes(lowercasedTerm) ||
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

    const handleAccountAction = (id, action) => {
        // In a real app, this would send an API request
        if (action === 'approve' || action === 'reject') {
            const updatedAccounts = pendingAccounts.filter(account => account.id !== id);
            setPendingAccounts(updatedAccounts);
            
            // If we're viewing details of an account that's being removed, close the details modal
            if (selectedAccount && selectedAccount.id === id) {
                closeDetailsModal();
            }
            
            // Show a temporary notification (would be better with a toast system)
            alert(`Account ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        }
    };

    // Generate data for the last 13 months
    const generateMonthlyData = () => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11
        
        const last13Months = [];
        
        // Loop backwards from current month to get the last 13 months
        for (let i = 0; i < 13; i++) {
            // Calculate the month index (handling wrap-around to previous year)
            const monthIndex = (currentMonth - i + 12) % 12;
            last13Months.unshift(months[monthIndex]);
        }
        
        // Create the chart data with realistic patterns
        return {
            'Total No. of Registered Hog Raisers': last13Months.map((month, index) => {
                // Generate semi-realistic data with an upward trend
                const baseValue = 7;
                const randomFactor = Math.floor(Math.random() * 5);
                const trendFactor = Math.floor(index * 0.7); // Slight upward trend
                return {
                    name: month,
                    value: baseValue + randomFactor + trendFactor
                };
            }),
            
            'Pending Applications': last13Months.map((month) => {
                // Random number between 1 and 5
                return {
                    name: month,
                    value: Math.floor(Math.random() * 5) + 1
                };
            }),
            
            'ASF Outbreak Reports': last13Months.map((month) => {
                // Mostly zeros with occasional outbreaks (1 or 2)
                const randomValue = Math.random();
                let value = 0;
                if (randomValue > 0.7) {
                    value = 1;
                } else if (randomValue > 0.95) {
                    value = 2;
                }
                return {
                    name: month,
                    value: value
                };
            })
        };
    };

    // Generate the chart data
    const chartData = generateMonthlyData();

    // Fixed stat values from the updated version
    const statValues = {
        'Total No. of Registered Hog Raisers': 38,
        'Pending Applications': 10,
        'ASF Outbreak Reports': 2,
        'Hogs Ready for Market': 10
    };

    // Custom tooltip component to prevent highlighting
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`${label} : ${payload[0].value}`}</p>
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

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className='dashboard-wrapper'>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="dashboard-container">
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
                    </div>
                </div>
            </div>

            {showGraphModal && selectedStat && (
                <div className="graph-modal-overlay" onClick={closeGraphModal}>
                    <div className={`graph-modal-content ${animationDirection || ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="graph-modal-header">
                            <h2>{selectedStat}</h2>
                            <button className="close-btn" onClick={closeGraphModal}>×</button>
                        </div>
                        <div className="graph-modal-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData[selectedStat]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Legend />
                                    <Bar dataKey="value" fill={getBarColor(selectedStat)} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="graph-navigation">
                            <button className="nav-btn prev-btn" onClick={() => navigateGraph('prev')}>
                                <ChevronLeft size={24} />
                            </button>
                            <div className="graph-indicators">
                                {statTypes.map((stat, index) => (
                                    <span 
                                        key={index} 
                                        className={`indicator ${selectedStat === stat ? 'active' : ''}`}
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
                            <button className="close-btn" onClick={closePendingModal}>×</button>
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
                        <div className="pending-table-container">
                            <table className="pending-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')}>
                                            Name <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                        </th>
                                        <th onClick={() => handleSort('email')}>
                                            Email <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                        </th>
                                        <th onClick={() => handleSort('location')}>
                                            Location <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                        </th>
                                        <th onClick={() => handleSort('date')}>
                                            Date Applied <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.length > 0 ? (
                                        filteredAccounts.map(account => (
                                            <tr key={account.id}>
                                                <td>{account.name}</td>
                                                <td>{account.email}</td>
                                                <td>{account.location}</td>
                                                <td>{formatDate(account.date)}</td>
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
                                                        onClick={() => handleAccountAction(account.id, 'approve')}
                                                        title="Approve Account"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        className="action-btn reject-btn"
                                                        onClick={() => handleAccountAction(account.id, 'reject')}
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
                    </div>
                </div>
            )}

            {showDetailsModal && selectedAccount && (
                <div className="modal-overlay" onClick={closeDetailsModal}>
                    <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="details-modal-header">
                            <h2>Account Details</h2>
                            <button className="close-btn" onClick={closeDetailsModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="details-modal-body">
                            <div className="account-header">
                                <div className="account-avatar">
                                    <User size={40} />
                                </div>
                                <div className="account-title">
                                    <h3>{selectedAccount.name}</h3>
                                    <p className="account-subtitle">{selectedAccount.farmType} Hog Raiser • {selectedAccount.experience} Experience</p>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Contact Information</h4>
                                <div className="detail-item">
                                    <Mail size={16} />
                                    <span>{selectedAccount.email}</span>
                                </div>
                                <div className="detail-item">
                                    <Phone size={16} />
                                    <span>{selectedAccount.phone}</span>
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
                                    <span>Applied on {formatDate(selectedAccount.date)}</span>
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
                                        handleAccountAction(selectedAccount.id, 'reject');
                                    }}
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                                <button 
                                    className="btn approve-btn" 
                                    onClick={() => {
                                        handleAccountAction(selectedAccount.id, 'approve');
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