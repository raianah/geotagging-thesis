import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getProfile } from "../services/api";
import "../css/LoginCSS.css";
import logo from '../img/logo.png';

export default function LoginForm({ handleLogin }) {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [notificationId, setNotificationId] = useState(0);

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
            const response = await login(formData.email, formData.password);
            const profile = await getProfile();
            localStorage.setItem("profile", JSON.stringify(profile));
            setLoading(false);
            showNotification("Login successful!", "success");
            
            // Call the parent's handleLogin function with both tokens
            handleLogin(profile, response.accessToken);
            
            // Navigate based on user role
            if (profile.role && profile.role.toLowerCase() === 'employee') {
                navigate("/employee-dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (error) {
            setLoading(false);
            setErrors({ form: error.message || "Invalid credentials." });
        }
    };

    const showNotification = (message, type = 'info') => {
        const id = notificationId + 1;
        setNotificationId(id);
        
        const newNotification = {
            id,
            message,
            type,
            timestamp: new Date()
        };
        
        setNotifications([...notifications, newNotification]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(notifications => 
                notifications.filter(notification => notification.id !== id)
            );
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(notifications => 
            notifications.filter(notification => notification.id !== id)
        );
    };

    return (
        <div className="login-container">
            <div className="slide-notification-container">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`slide-notification notification-${notification.type}`}
                    >
                        <div className="slide-notification-content">
                            {notification.message}
                        </div>
                        <button 
                            className="slide-notification-close"
                            onClick={() => removeNotification(notification.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
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