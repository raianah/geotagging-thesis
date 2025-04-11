import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { BiNotification } from "react-icons/bi";
import { FaRegClipboard } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { FiMoon, FiSun, FiLogOut } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";

import "../css/Navbar.css";

import Logo from "../img/logo.png";

const Navbar = ({ darkMode, setDarkMode, currentUser }) => {
    const [currentDate, setCurrentDate] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleAccountSettings = () => {
        console.log("Navigate to account settings");
        // Implement navigation logic
    };

    const handleViewOwners = () => {
        console.log("Navigate to hog shop ecommerce page");
        // Implement ecommerce logic
    };

    const handleLogout = () => {
        console.log("User logged out");
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
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
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // dummy data for currentUser
    const fullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest User';
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
                        <FaCircleUser className="profile-icon" />
                        
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
                    
                    <Link to="/notifications" className="notification-link" title="Notifications">
                        <BiNotification className="notification-icon" />
                    </Link>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;