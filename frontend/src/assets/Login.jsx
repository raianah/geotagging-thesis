import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginCSS.css";
import logo from '../img/logo.png';

export default function LoginForm() {
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch("http://localhost:3000/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			const data = await response.json();
			if (response.ok) {
				alert("Login successful!");
				navigate("/asfmap");
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
					<form className="login-form" onSubmit={handleLogin}>
						<input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
						<div className="password-container">
							<input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
						</div>
						<button type="submit">Login</button>
					</form>
				</div>
			</div>
		</div>
	);
}
