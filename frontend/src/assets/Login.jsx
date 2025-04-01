import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/LoginCSS.css";
import logo from '../img/logo.png';

export default function LoginForm({ handleLogin }) {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
		e.preventDefault();
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
				alert(data.error || "Invalid credentials.");
			}
		} catch (error) {
			console.error("Error:", error);
			alert("Something went wrong.");
		}
	};

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-image"><img src={logo} alt="ASF Detection" /></div>
                <div className="login-content">
                    <h1 className="login-title">Login to Your Account</h1>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        <div className="password-container">
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <button type="submit">Login</button>
                    </form>
                    <div className="register-link">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}