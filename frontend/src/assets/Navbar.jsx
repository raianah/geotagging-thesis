import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { notificationService } from '../services/notificationService';

import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import { BiNotification } from "react-icons/bi";
import { FaRegClipboard } from "react-icons/fa";
import { FiMoon, FiSun, FiLogOut } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";

import "../css/Navbar.css";
import AccountSettingsModal from "./AccountSettings";
import HogOwnersModal from "./HogOwners";
import NotificationDetail from "./Notifications";

import Logo from "../img/logo.png";

const Navbar = ({ darkMode, setDarkMode, currentUser, isHomePage = false }) => {
    const [currentDate, setCurrentDate] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [hogOwnersModalOpen, setHogOwnersModalOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [menuAnimation, setMenuAnimation] = useState(false);
    const [darkModeToggleActive, setDarkModeToggleActive] = useState(false);

    // Using a state to manage user data that might be modified
    const [userData, setUserData] = useState({
        firstName: currentUser?.firstName || 'Virgilio Jr',
        lastName: currentUser?.lastName || 'Diaz',
        email: currentUser?.email || 'john.doe@example.com',
        phone: currentUser?.phone || '(555) 123-4567',
        profilePicture: currentUser?.profilePicture || null,
        accountType: currentUser?.accountType || 'Hog Owner', // Use accountType for role
        emailVerified: true,
        phoneVerified: true
    });

    // Replace hard-coded notifications with empty array and loading state
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notificationsError, setNotificationsError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Polling interval for notifications (30 seconds)
    const POLLING_INTERVAL = 30000;

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);
            setNotificationsError(null);
            const data = await notificationService.getNotifications();
            setNotifications(data);
            
            // Update unread count
            const unread = data.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotificationsError('Failed to load notifications');
        } finally {
            setNotificationsLoading(false);
        }
    };

    // Initial fetch and setup polling
    useEffect(() => {
        fetchNotifications();

        // Set up polling interval
        const intervalId = setInterval(fetchNotifications, POLLING_INTERVAL);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    // Fetch notifications when notificationsOpen changes
    useEffect(() => {
        if (notificationsOpen) {
            fetchNotifications();
        }
    }, [notificationsOpen]);

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.read) {
                await notificationService.markAsRead(notification.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            
            const updatedNotification = {
                ...notification,
                read: true,
                lastRead: new Date().toISOString()
            };
            
            setNotifications(notifications.map(n => 
                n.id === notification.id ? updatedNotification : n
            ));
            
            setSelectedNotification(updatedNotification);
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
            if (selectedNotification?.id === id) {
                setSelectedNotification(null);
            }
            // Update unread count if the deleted notification was unread
            const deletedNotification = notifications.find(n => n.id === id);
            if (deletedNotification && !deletedNotification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Function to add a new notification (for system events)
    const addNotification = async (notificationData) => {
        try {
            const newNotification = await notificationService.createNotification(notificationData);
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.read) {
                setUnreadCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    };

    // DEBUG: Log userData to verify what is being used for initials
    useEffect(() => {
        console.log('Navbar userData:', userData);
    }, [userData]);

    useEffect(() => {
        const handleResize = () => {
          const width = window.innerWidth;
          setWindowWidth(width);
          
          // Auto-close mobile menu when resizing to desktop
          if (width > 768 && mobileMenuOpen) {
            setMobileMenuOpen(false);
          }
        };
      
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    // Modified handleClickOutside function to fix the error
    useEffect(() => {
        const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setNotificationsOpen(false);
        }
        // Fixed check for mobile menu - className can be a string or object depending on the element
        if (mobileMenuOpen) {
            const target = event.target;
            const isMenuOrHamburger = 
            target.closest('.mobile-menu') || 
            target.closest('.hamburger-menu');
            
            if (!isMenuOrHamburger) {
            setMobileMenuOpen(false);
            }
        }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [mobileMenuOpen]);

    // Helper to get user initials (works for all roles)
    const getUserInitials = (user) => {
        if (!user) return '';
        const first = (user.firstName && user.firstName.trim().length > 0) ? user.firstName.trim().charAt(0).toUpperCase() : '';
        const last = (user.lastName && user.lastName.trim().length > 0) ? user.lastName.trim().charAt(0).toUpperCase() : '';
        if (first || last) return first + last;
        // Fallback: try email or username
        if (user.email && user.email.length > 0) return user.email.charAt(0).toUpperCase();
        if (user.username && user.username.length > 0) return user.username.charAt(0).toUpperCase();
        return '?'; // Show '?' if truly no info
    };

    const showMobileNotifications = () => {
        // Make sure unreadCount is accessible in this scope
        const mobileUnreadCount = notifications.filter(n => !n.read).length;
        
        if (windowWidth <= 768) {
            return (
                <div className="navbar-notifications-detail-modal" onClick={() => setNotificationsOpen(false)}>
                <div className="navbar-notifications-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="navbar-notifications-header">
                    <h3>Notifications</h3>
                    {mobileUnreadCount > 0 && <span className="unread-count">{mobileUnreadCount} unread</span>}
                    <button 
                        className="close-notifications-btn"
                        onClick={() => setNotificationsOpen(false)}
                    >
                        &times;
                    </button>
                    </div>
                    <div className="dropdown-divider"></div>
                    {notifications.length > 0 ? (
                    <div className="navbar-notifications-list">
                        {notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            className={`navbar-notifications-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="navbar-notifications-title">{notification.title}</div>
                            <div className="navbar-notifications-preview">{notification.message}</div>
                            <div className="navbar-notifications-date">{notification.date}</div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="no-notifications">No notifications</div>
                    )}
                </div>
                </div>
            );
        }
        return null;
    };

    // Helper to get full name (works for all roles)
    const getFullName = (user) => {
        if (!user) return '';
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        if (user.firstName) return user.firstName;
        if (user.lastName) return user.lastName;
        if (user.email) return user.email;
        if (user.username) return user.username;
        return '';
    };

    const handleDarkModeToggle = () => {
        setDarkModeToggleActive(true);
        setDarkMode(!darkMode);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            setDarkModeToggleActive(false);
        }, 300);
    };

    const toggleMobileMenu = () => {
        if (mobileMenuOpen) {
            // Start closing animation
            setMenuAnimation(false);
            // Delay actual closing to allow animation to complete
            setTimeout(() => {
                setMobileMenuOpen(false);
            }, 300);
        } else {
            setMobileMenuOpen(true);
            // Slight delay to ensure DOM is updated before animation
            setTimeout(() => {
                setMenuAnimation(true);
            }, 10);
        }
    };

    const handleAccountSettings = () => {
        setAccountModalOpen(true);
        setDropdownOpen(false);
    };

    const handleViewOwners = () => {
        setHogOwnersModalOpen(true);
        setDropdownOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        navigate('/login');
    };

    const updateUserData = (newData) => {
        setUserData(newData);
        // Here you would typically send this data to your backend
        console.log("User data updated:", newData);
        
        // In a real application, you would save this to local storage or state management
        // localStorage.setItem('userData', JSON.stringify(newData));
    };

    const toggleNotifications = () => {
        setNotificationsOpen(!notificationsOpen);
    };

    useEffect(() => {
        const updateDate = () => {
            const date = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setCurrentDate(date.toLocaleDateString("en-US", options));
        };
        updateDate();
        const interval = setInterval(updateDate, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (currentUser) {
            // Normalize role for compatibility
            let normalizedAccountType = currentUser.accountType;
            if (!normalizedAccountType && currentUser.role) {
                if (currentUser.role.toLowerCase() === 'employee') {
                    normalizedAccountType = 'Employee';
                } else if (currentUser.role.toLowerCase() === 'hog owner' || currentUser.role.toLowerCase() === 'user') {
                    normalizedAccountType = 'Hog Owner';
                } else {
                    normalizedAccountType = currentUser.role;
                }
            }
            setUserData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                profilePicture: currentUser.profilePicture || null,
                accountType: normalizedAccountType || 'Hog Owner',
                emailVerified: currentUser.emailVerified ?? true,
                phoneVerified: currentUser.phoneVerified ?? true
            });
        }
    }, [currentUser]);

    // Full name based on userData which might be updated
    const fullName = getFullName(userData);
    const userRole = userData.accountType === 'Employee' ? 'Employee Dashboard' : 'Hog Owner Dashboard';

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <nav className="navbar unified-navbar">
                {/* Left section with brand */}
                <Link to={isHomePage ? "/" : "/dashboard"} className="brand-section">
                    <img src={Logo} alt="Logo" className="navbar-logo" />
                    <div className="brand-text">
                        {isHomePage ? (
                            <>
                            <span className="govt-text-small text-center">Republic of the Philippines</span>
                            <hr className="govt-text-divider" />
                            <span className="govt-text-normal text-center">Municipality of Balayan</span>
                            <span className="govt-text-normal text-center">Online Hog Registry</span>
                            </>
                        ) : (
                            <>
                            {userData.accountType === 'Employee' ? (
                                <>EMPLOYEE<br />DASHBOARD</>
                            ) : (
                                <>HOG OWNER<br />DASHBOARD</>
                            )}
                            </>
                        )}
                    </div>
                </Link>
                
                {/* Center section with date */}
                <div className="date-section">
                    <span className="date-display">{currentDate}</span>
                </div>

                {/* Right section with controls */}
                <div className="user-controls">
                    <div className={`dark-mode-toggle ${darkModeToggleActive ? 'toggle-active' : ''}`} onClick={handleDarkModeToggle} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        {darkMode ? <FiSun /> : <FiMoon />}
                    </div>

                    {isHomePage ? (
                        <div className="home-auth-buttons">
                        <Link to="/login" className="btn-login">Login</Link>
                        <Link to="/register" className="btn-register-nav">Register</Link>
                        </div>
                    ) : (
                        <>
                        <div className="desktop-menu">
                            <div className="navbar-notifications-container" ref={notificationRef} onClick={toggleNotifications} title="Notifications">
                                <div className="navbar-notifications-wrapper">
                                    <BiNotification className="navbar-notifications-icon" />
                                    {unreadCount > 0 && <span className="navbar-notifications-badge">{unreadCount}</span>}
                                </div>
                                {notificationsOpen && windowWidth > 768 && (
                                    <div className="navbar-notifications-dropdown">
                                    <div className="navbar-notifications-header">
                                        <h3>Notifications</h3>
                                        {unreadCount > 0 && <span className="unread-count">{unreadCount} unread</span>}
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    {notificationsLoading ? (
                                        <div className="notifications-loading">Loading notifications...</div>
                                    ) : notificationsError ? (
                                        <div className="notifications-error">{notificationsError}</div>
                                    ) : notifications.length > 0 ? (
                                        <div className="navbar-notifications-list">
                                        {notifications.map(notification => (
                                            <div 
                                                key={notification.id} 
                                                className={`navbar-notifications-item ${!notification.read ? 'unread' : ''}`} 
                                                onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                                            >
                                                <div className="navbar-notifications-title">{notification.title}</div>
                                                <div className="navbar-notifications-preview">{notification.message}</div>
                                                <div className="navbar-notifications-date">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    ) : (
                                        <div className="no-notifications">No notifications</div>
                                    )}
                                    </div>
                                )}
                            </div>

                            <div className="profile-container" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
                            {userData.profilePicture ? (
                                <img src={userData.profilePicture} alt="Profile" className="profile-pic-small" />
                            ) : (
                                <div className="profile-initials">
                                {getUserInitials(userData)}
                                </div>
                            )}
                            
                            {dropdownOpen && (
                                <div className="profile-dropdown">
                                <div className="profile-header">
                                    <div className="dropdown-user-name">{fullName}</div>
                                    <div className="dropdown-user-role">{userRole}</div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleAccountSettings}><IoSettingsOutline className="dropdown-icon" /> Account Settings</button>
                                {userData.accountType === 'Employee' && (
                                    <button onClick={handleViewOwners}><FaRegClipboard className="dropdown-icon" />View Hog Owners</button>
                                )}
                                <button onClick={handleLogout}><FiLogOut className="dropdown-icon" /> Logout</button>
                                </div>
                            )}
                            </div>
                        </div>

                        <div className="hamburger-menu" onClick={toggleMobileMenu}>
                            {mobileMenuOpen ? 
                                <RiCloseLine className={`hamburger-icon ${menuAnimation ? 'active' : ''}`} /> : 
                                <RiMenu3Line className="hamburger-icon" />
                            }
                        </div>

                        {mobileMenuOpen && (
                            <div className={`mobile-menu ${menuAnimation ? 'active' : ''}`}>
                                <div className="mobile-menu-header">
                                    <div className="mobile-profile">
                                    {userData.profilePicture ? (
                                        <img src={userData.profilePicture} alt="Profile" className="mobile-profile-pic" />
                                    ) : (
                                        <div className="mobile-profile-initials">
                                        {getUserInitials(userData)}
                                        </div>
                                    )}
                                    <div className="mobile-user-info">
                                        <div className="mobile-user-name">{fullName}</div>
                                        <div className="mobile-user-role">{userRole}</div>
                                    </div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="mobile-menu-items">
                                    <button onClick={() => { handleAccountSettings(); setMobileMenuOpen(false); }}>
                                    <IoSettingsOutline className="mobile-menu-icon" /> Account Settings
                                    </button>
                                    
                                    {userData.accountType === 'Employee' && (
                                    <button onClick={() => { handleViewOwners(); setMobileMenuOpen(false); }}>
                                        <FaRegClipboard className="mobile-menu-icon" /> View Hog Owners
                                    </button>
                                    )}
                                    
                                    <button onClick={() => { toggleNotifications(); setMobileMenuOpen(false); }}>
                                    <BiNotification className="mobile-menu-icon" /> 
                                    Notifications
                                    {unreadCount > 0 && <span className="mobile-notification-badge">{unreadCount}</span>}
                                    </button>
                                    
                                    <button onClick={handleLogout}>
                                    <FiLogOut className="mobile-menu-icon" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </nav>

            {/* Account Settings Modal */}
            <AccountSettingsModal 
                isOpen={accountModalOpen}
                onClose={() => setAccountModalOpen(false)} 
                user={userData}
                updateUserData={updateUserData}
            />

            {/* Hog Owners Modal */}
            <HogOwnersModal
                isOpen={hogOwnersModalOpen}
                onClose={() => setHogOwnersModalOpen(false)}
            />

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <NotificationDetail 
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    onDelete={deleteNotification}
                />
            )}

            {notificationsOpen && windowWidth <= 768 && showMobileNotifications()}
        </div>
    );
};

export default Navbar;