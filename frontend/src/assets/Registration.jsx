import { useState } from "react";
import Input from "react-phone-number-input/input";
import { useNavigate } from "react-router-dom";
import "react-phone-number-input/style.css";
import "../css/RegistrationCSS.css";
import logo from '../img/logo.png';

export default function RegistrationForm() {
	const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
	const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
	const [passwordSuggestions, setPasswordSuggestions] = useState([]);

    const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		if (name === "password") checkPasswordStrength(value);
	};

	const handlePhoneChange = (value) => {
		setFormData({ ...formData, phone: value });
	};

	const checkPasswordStrength = (password) => {
		let score = 0;
		let suggestions = [];

		if (password.length >= 8) score++; else suggestions.push("Use at least 8 characters");
		if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++; else suggestions.push("Mix uppercase & lowercase letters");
		if (/\d/.test(password)) score++; else suggestions.push("Add at least one number");
		if (/[\W_]/.test(password)) score++; else suggestions.push("Include special characters (!@#$%)");

		const strengthLevels = [
			{ label: "Weak", color: "#e74c3c" },
			{ label: "Fair", color: "#f39c12" },
			{ label: "Good", color: "#3498db" },
			{ label: "Strong", color: "#2ecc71" },
            { label: "Very Strong", color: "#3be08e" }
		];

		setPasswordStrength(strengthLevels[score] || { label: "Very Weak", color: "#e74c3c" });
		setPasswordSuggestions(suggestions);
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		if (!formData.phone || formData.phone.length !== 13) return alert("Phone number must be exactly 13 characters including +63.");
		if (passwordStrength.score < 2) return alert("Password must be at least 'Good' strength.");
		try {
			const response = await fetch("http://localhost:3000/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			const data = await response.json();
			if (response.ok) {
                alert("Registration successful!");
                navigate("/login");
            } else {
                alert(data.error || "Registration failed.");
            }
		} catch (error) {
			console.error("Error:", error);
			alert("Something went wrong.");
		}
	};

	return (
		<div className="registration-container">
			<div className="registration-card">
				<div className="registration-image"><img src={logo} alt="ASF Detection" /></div>
				<div className="registration-content">
					<h1 className="registration-title">Balayan Hog Registration Form</h1>
					<p className="registration-subtitle">For hog raisers of Balayan, Batangas.</p>
					<form className="registration-form" onSubmit={handleRegister}>
						<div className="name-container">
							<input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
							<input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
						</div>

						<Input country="PH" international withCountryCallingCode value={formData.phone} onChange={handlePhoneChange} />

						<input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />

						<div className="password-container">
							<input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
							<div className="password-strength">
								<div className="strength-bar" style={{ background: passwordStrength.color, width: `${(passwordStrength.score + 1) * 25}%` }}></div>
								<span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
							</div>
							{passwordSuggestions.length > 0 && (
								<ul className="password-suggestions">
									{passwordSuggestions.map((suggestion, index) => (
										<li key={index}>{suggestion}</li>
									))}
								</ul>
							)}
						</div>

						<button type="submit">Register</button>
					</form>
				</div>
			</div>
		</div>
	);
}
