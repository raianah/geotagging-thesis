import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { BiStore, BiNotification } from "react-icons/bi"
import { FaRegClipboard } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6"
import { FiMenu, FiX, FiMoon, FiSun, FiLogOut } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineCalendarToday } from "react-icons/md";
import { HiOutlineMap } from "react-icons/hi"
import { LuHouse } from "react-icons/lu"

import "../css/Navbar.css";

import Logo from "../img/logo.png";

// Add currentUser as a prop
const Navbar = ({ darkMode, setDarkMode, isOpen, setIsOpen, currentUser }) => {
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
    const fullName = currentUser  ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest User';
    const userRole = 'Employee Dashboard';

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <div className={`nav-sidebar ${isOpen ? "open" : ""}`}>
                <div className="logo">
                    <img src={Logo} alt="" />
                    <span>EMPLOYEE <br /> DASHBOARD</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/dashboard"><LuHouse className="icon" /><span>Home</span></Link></li>
                    <li><Link to="/market"><BiStore className="icon" /><span>Market</span></Link></li>
                    <li><Link to="/asf-map"><HiOutlineMap className="icon" /><span>Map</span></Link></li>
                    <li><Link to="/notifications"><BiNotification className="icon" /><span>Notifications</span></Link></li>
                </ul>
            </div>

            <nav className="navbar">
                <div className="nav-left">
                    <div className={`menu-toggle ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <FiX /> : <FiMenu />}
                    </div>
                    <div className="date-container">
                        <MdOutlineCalendarToday className="calendar-icon" />
                        <span>{currentDate}</span>
                    </div>
                </div>

                <div className="nav-right">
                    <div className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <FiSun /> : <FiMoon />}
                    </div>

                    <div className="profile-container" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <FaCircleUser  className="icon user" />
                        <div className="profile-info">
                            <span className="user-name">{fullName}</span>
                            <span className="user-role">{userRole}</span>
                        </div>

                        {dropdownOpen && (
                            <div className="profile-dropdown">
                                <button onClick={handleAccountSettings}><IoSettingsOutline className="dropdown-icon" /> Account Settings</button>
                                <button onClick={handleViewOwners}><FaRegClipboard className="dropdown-icon" />View Hog Owners</button>
                                <button onClick={handleLogout}><FiLogOut className="dropdown-icon" /> Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;