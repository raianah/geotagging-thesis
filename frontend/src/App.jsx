import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegistrationForm from "./assets/Registration";
import LoginForm from "./assets/Login";
import ASFMap from "./assets/ASFMap";
import EmployeeDashboard from "./assets/EmployeeDashboard";
import UserDashboard from "./assets/UserDashboard";
import PrivacyPolicy from "./assets/PrivacyPolicy";
import HomePage from "./assets/HomePage";

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [position, setPosition] = useState([13.9374, 120.7335]);
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        try {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            
            if (token) {
                setIsAuthenticated(true);
                if (userData && userData !== "undefined") {
                    try {
                        const parsedUserData = JSON.parse(userData);
                        setCurrentUser(parsedUserData);
                    } catch (error) {
                        console.error("Error parsing user data:", error);
                        setCurrentUser(null);
                        localStorage.removeItem('userData'); // Remove invalid data
                    }
                } else {
                    // Handle case where userData is undefined or "undefined"
                    setCurrentUser(null);
                    localStorage.removeItem('userData'); // Clean up localStorage
                }
            } else {
                setIsAuthenticated(false);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Error in authentication check:", error);
            setIsAuthenticated(false);
            setCurrentUser(null);
        }
    }, []);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
    }, [darkMode]);

    // Login function to be passed to the LoginForm
    const handleLogin = (userData, token) => {
        console.log("Setting user data:", userData); // Debug log
        console.log("Setting token:", token); // Debug log
        
        // Store the token
        localStorage.setItem('authToken', token);
        
        // Store user data as a JSON string
        if (userData) {
            localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        // Update state
        setCurrentUser(userData);
        setIsAuthenticated(true);
    };

    // Protected route component with role-based access
    const ProtectedRoute = ({ children, requiredRole }) => {
        if (!isAuthenticated) {
            return <Navigate to="/login" />;
        }

        // If no specific role is required, allow access
        if (!requiredRole) {
            return children;
        }

        // Check if user has the required role
        if (currentUser && currentUser.role && currentUser.role.toLowerCase() === requiredRole.toLowerCase()) {
            return children;
        }

        // Redirect to appropriate dashboard based on role
        if (currentUser && currentUser.role && currentUser.role.toLowerCase() === 'employee') {
            return <Navigate to="/employee-dashboard" />;
        }
        return <Navigate to="/dashboard" />;
    };

    return (
        <Router>
            <div className={darkMode ? "dark-mode" : ""}>
                <Routes>
                    <Route path="/" element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/register" element={<RegistrationForm />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/login" element={
                        <LoginForm 
                            setIsAuthenticated={setIsAuthenticated} 
                            handleLogin={handleLogin} 
                        />
                    } />
                    
                    <Route path="/dashboard" element={
                        <ProtectedRoute requiredRole="user">
                            <UserDashboard darkMode={darkMode} setDarkMode={setDarkMode} currentUser={currentUser} />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/employee-dashboard" element={
                        <ProtectedRoute requiredRole="employee">
                            <EmployeeDashboard 
                                darkMode={darkMode} 
                                setDarkMode={setDarkMode} 
                                isOpen={isOpen} 
                                setIsOpen={setIsOpen}
                                currentUser={currentUser}
                            />
                        </ProtectedRoute>
                    } />
                    
                    {/* Add routes for other components, passing currentUser */}
                    <Route path="/asfmap" element={
                        <ProtectedRoute>
                            <ASFMap 
                                position={position} 
                                setPosition={setPosition}
                                isOpen={isOpen} 
                                setIsOpen={setIsOpen}
                                darkMode={darkMode}
                                currentUser={currentUser}
                            />
                        </ProtectedRoute>
                    } />
                    
                    {/* Add other protected routes here, passing currentUser prop */}
                </Routes>
            </div>
        </Router>
    );
};

export default App;