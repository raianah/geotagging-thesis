import React from "react";
import Navbar from "./Navbar";
import "../css/Navbar.css"

const Dashboard = ({ darkMode, setDarkMode, isOpen, setIsOpen }) => {
    return (
        <>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isOpen={isOpen} setIsOpen={setIsOpen} />
            {/* <div className={`dashboard-container ${darkMode ? "dark-mode" : ""} ${isOpen ? "expanded" : ""}`}>
                <h1>Welcome to the Dashboard</h1>
                <p>This is your main content area.</p>
            </div> */}
        </>
    );
};

export default Dashboard;