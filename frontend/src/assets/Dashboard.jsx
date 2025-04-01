import React from "react";
import Navbar from "./Navbar";
import ASFMap from "./ASFMap";
import "../css/Navbar.css";
import "../css/Dashboard.css";

const Dashboard = ({ darkMode, setDarkMode, isOpen, setIsOpen }) => {
    return (
        <div className={`dashboard-wrapper ${isOpen ? "expanded" : ""}`}>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isOpen={isOpen} setIsOpen={setIsOpen} />
            
            <div className="dashboard-container">
                <div className="stats-section">
                    <div className="stat-card">
                        <span>38</span>
                        <p>Total No. of Registered Hog Raisers</p>
                    </div>
                    <div className="stat-card">
                        <span>10</span>
                        <p>Pending Applications</p>
                    </div>
                    <div className="stat-card">
                        <span>2</span>
                        <p>ASF Outbreak Reports</p>
                    </div>
                    <div className="stat-card">
                        <span>10</span>
                        <p>Hogs Ready for Market</p>
                    </div>
                </div>
                <div className="content-section">
                    {/* Replace the old map-container with the new ASFMap component */}
                    <ASFMap />
                    
                    <div className="quick-access">
                        <h3>Quick Access Tools:</h3>
                        <button>Register New Hog Raiser</button>
                        <button>View ASF Statistics</button>
                        <button>Report ASF Case</button>
                        <button>Assign Quarantine Zone</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;