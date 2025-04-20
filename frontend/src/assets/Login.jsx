import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/LoginCSS.css";
import logo from '../img/logo.png';

export default function LoginForm({ handleLogin }) {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({...errors, [name]: ""});
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = "Email is required";
        }
        
        if (!formData.password) {
            newErrors.password = "Password is required";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            
            const data = await response.json();
            console.log("Login response:", data);
            
            if (response.ok) {
                // TEMPORARY WORKAROUND: Create dummy user data if missing from response
                const userData = data.user || {
                    uid: "temp-" + Date.now(),
                    fullName: formData.email.split('@')[0], // Use part of email as name
                    emailAddress: formData.email
                };
                
                // TEMPORARY WORKAROUND: Create dummy token if missing
                const token = data.token || "temp-token-" + Date.now();
                
                // Call handleLogin with the user data and token
                handleLogin(userData, token);
                alert("Login successful!");
                navigate("/");
            } else {
                setErrors({...errors, form: data.error || "Invalid credentials."});
            }
        } catch (error) {
            console.error("Error:", error);
            setErrors({...errors, form: "Something went wrong. Please try again."});
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-container">
                    <img src={logo} alt="Balayan Hog Registration" className="logo" />
                </div>
                
                <div className="login-content">
                    <h1 className="login-title">Login to Your Account</h1>
                    <p className="login-subtitle">Access your Balayan Hog Registration profile</p>
                    
                    {errors.form && (
                        <div className="error-banner">
                            <p>{errors.form}</p>
                        </div>
                    )}
                    
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address<span className="required">*</span></label>
                            <div className="input-wrapper">
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Enter your email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                />
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>
                        </div>
                        
                        <div className="input-group">
                            <label>Password<span className="required">*</span></label>
                            <div className="password-container">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="Enter your password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                />
                                <button 
                                    type="button"
                                    className="toggle-password"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>
                        </div>
                        
                        <button type="submit" className="login-btn">Login</button>
                    </form>
                    
                    <div className="register-link">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}