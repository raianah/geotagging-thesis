import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getProfile } from "../services/api";
import "../css/LoginCSS.css";
import logo from '../img/logo.png';

export default function LoginForm() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
        
        setLoading(true);
        setErrors({});
        
        try {
            const { token } = await login(formData.email, formData.password);
            localStorage.setItem("authToken", token);
            const profile = await getProfile();
            localStorage.setItem("profile", JSON.stringify(profile));
            setLoading(false);
            alert("Login successful!");
            // Robust, case-insensitive redirect based on user role
            if (profile.role && profile.role.toLowerCase() === 'employee') {
                navigate("/employee-dashboard");
            } else if (profile.role && profile.role.toLowerCase() === 'user') {
                navigate("/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (error) {
            setLoading(false);
            setErrors({ form: error.message || "Invalid credentials." });
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                                <button 
                                    type="button"
                                    className="toggle-password"
                                    onClick={togglePasswordVisibility}
                                    disabled={loading}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>
                        </div>
                        
                        <button type="submit" className="login-btn" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                    </form>
                    
                    <div className="register-link">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}