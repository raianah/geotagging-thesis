import React, { useState, useEffect } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegistrationForm from "./assets/Registration";
import LoginForm from "./assets/Login";
import ASFMap from "./assets/ASFMap";

import SPM from "./assets/SPM";
import MapFixer from "./assets/MapFixer";

import Dashboard from "./assets/Dashboard";

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [position, setPosition] = useState([13.9374, 120.7335]);
    const [isOpen, setIsOpen] = useState(false); // Manage sidebar state here
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
    }, [darkMode]);

    return (
        <Router>
            <div className={darkMode ? "dark-mode" : ""}>
                <Routes>
                    <Route path="/" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} isOpen={isOpen} setIsOpen={setIsOpen} />} />
                    {/* <Route path="/account-settings" element={<AccountSettings darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/view-hog-owners" element={<ViewHogOwners darkMode={darkMode} setDarkMode={setDarkMode} />} /> */}
                </Routes>
            </div>
        </Router>

        // <Router>
        //     <div className={darkMode ? "dark-mode" : ""}>
        //         <Routes>
        //             <Route path="/" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
        //             {/* <Route path="/" element={<RegistrationForm />} />
        //             <Route path="/login" element={<LoginForm setIsAuthenticated={setIsAuthenticated} />} />
        //             <Route path="/asfmap" element={<ASFMap isAuthenticated={isAuthenticated} position={position} setPosition={setPosition} />} /> */}
        //         </Routes>
        //     </div>
        // </Router>


        // <div style={{ margin: 0, padding: 0 }}>
        //     <SPM />
        //     {/* <RegistrationForm /> */}
        //     {/* <LoginForm /> */}
        //     {/* <div style={{ flex: 1 }}> */}
        //     {/* <ASFMap position={position} setPosition={setPosition} /> */}
        //     {/* </div> */}
        // </div>
    );
};

export default App;
