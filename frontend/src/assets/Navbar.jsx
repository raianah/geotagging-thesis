import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { BiNotification } from "react-icons/bi";
import { FaRegClipboard } from "react-icons/fa";
import { FiMoon, FiSun, FiLogOut } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";

import "../css/Navbar.css";
import AccountSettingsModal from "./AccountSettings";
import HogOwnersModal from "./HogOwners";
import NotificationDetail from "./Notifications";

import Logo from "../img/logo.png";

const Navbar = ({ darkMode, setDarkMode, currentUser }) => {
    const [currentDate, setCurrentDate] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [hogOwnersModalOpen, setHogOwnersModalOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);

    // Using a state to manage user data that might be modified
    const [userData, setUserData] = useState({
        firstName: currentUser?.firstName || 'Virgilio Jr',
        lastName: currentUser?.lastName || 'Diaz',
        email: currentUser?.email || 'john.doe@example.com',
        phone: currentUser?.phone || '(555) 123-4567',
        profilePicture: currentUser?.profilePicture || null,
        emailVerified: true,
        phoneVerified: true
    });

    // Dummy notifications data
    const [notifications, setNotifications] = useState([
        { id: 1, title: "New Hog Owner", message: "John Smith has registered as a new hog owner.", date: "2025-04-12", read: false },
        { id: 2, title: "Payment Received", message: "Payment of $250.00 received from Emma Johnson for hog care services.", date: "2025-04-11", read: true },
        { id: 3, title: "System Update", message: "The dashboard will be under maintenance on April 15th from 2:00 AM to 4:00 AM.", date: "2025-04-10", read: false },
        { id: 4, title: "New Message", message: "You have a new message from Dr. Martinez regarding vaccination schedules.", date: "2025-04-09", read: true },
        { id: 5, title: "Appointment Request", message: "Lisa Wilson has requested an appointment for hog health check on April 18th.", date: "2025-04-08", read: false }
    ]);

    const handleAccountSettings = () => {
        setAccountModalOpen(true);
        setDropdownOpen(false);
    };

    const handleViewOwners = () => {
        setHogOwnersModalOpen(true);
        setDropdownOpen(false);
    };

    const handleLogout = () => {
        console.log("User logged out");
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
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

    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        // Mark notification as read
        setNotifications(notifications.map(n => 
            n.id === notification.id ? {...n, read: true} : n
        ));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
        setSelectedNotification(null);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

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

    // Full name based on userData which might be updated
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const userRole = 'Employee Dashboard';

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <nav className="navbar unified-navbar">
                {/* Left section with brand */}
                <Link to="/dashboard" className="brand-section">
                    <img src={Logo} alt="Logo" className="navbar-logo" />
                    <span className="brand-text">EMPLOYEE<br />DASHBOARD</span>
                </Link>
                
                {/* Center section with date */}
                <div className="date-section">
                    <span className="date-display">{currentDate}</span>
                </div>

                {/* Right section with controls */}
                <div className="user-controls">
                    <div className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        {darkMode ? <FiSun /> : <FiMoon />}
                    </div>
                    
                    <div className="profile-container" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
                        {userData.profilePicture ? (
                            <img src={userData.profilePicture} alt="Profile" className="profile-pic-small" />
                        ) : (
                            <div className="profile-initials">
                                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                            </div>
                        )}
                        
                        {dropdownOpen && (
                            <div className="profile-dropdown">
                                <div className="profile-header">
                                    <span className="dropdown-user-name">{fullName}</span>
                                    <span className="dropdown-user-role">{userRole}</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleAccountSettings}><IoSettingsOutline className="dropdown-icon" /> Account Settings</button>
                                <button onClick={handleViewOwners}><FaRegClipboard className="dropdown-icon" />View Hog Owners</button>
                                <button onClick={handleLogout}><FiLogOut className="dropdown-icon" /> Logout</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="notification-container" ref={notificationRef}>
                        <div className="notification-wrapper" onClick={toggleNotifications} title="Notifications">
                            <BiNotification className="notification-icon" />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </div>
                        
                        {notificationsOpen && (
                            <div className="notifications-dropdown">
                                <div className="notifications-header">
                                    <h3>Notifications</h3>
                                    {unreadCount > 0 && <span className="unread-count">{unreadCount} unread</span>}
                                </div>
                                <div className="dropdown-divider"></div>
                                {notifications.length > 0 ? (
                                    <div className="notifications-list">
                                        {notifications.map(notification => (
                                            <div 
                                                key={notification.id} 
                                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="notification-title">{notification.title}</div>
                                                <div className="notification-preview">{notification.message.substring(0, 50)}...</div>
                                                <div className="notification-date">{notification.date}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-notifications">No notifications</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Account Settings Modal */}
            <AccountSettingsModal 
                isOpen={accountModalOpen}
                onClose={() => setAccountModalOpen(false)} 
                currentUser={userData}
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
        </div>
    );
};

export default Navbar;