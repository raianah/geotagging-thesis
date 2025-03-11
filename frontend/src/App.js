import React, { useState } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegistrationForm from "./assets/Registration";
import LoginForm from "./assets/Login";
import ASFMap from "./assets/ASFMap";

import Sidebar from "./assets/Sidebar";
import SPM from "./assets/SPM";
import MapFixer from "./assets/MapFixer";

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [position, setPosition] = useState([13.9374, 120.7335]);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<RegistrationForm />} />
                <Route path="/login" element={<LoginForm setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/asfmap" element={<ASFMap isAuthenticated={isAuthenticated} position={position} setPosition={setPosition} />} />
            </Routes>
        </Router>


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
