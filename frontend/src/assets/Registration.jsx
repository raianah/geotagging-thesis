import React, { useState } from "react";
import "../css/RegistrationCSS.css";
import sampleImg from "../img/sample.jpg"; // Adjust the path as necessary

export default function RegistrationForm() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [barangay, setBarangay] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showRoleSelection, setShowRoleSelection] = useState(false);

    const barangays = [
        "Baclaran",
        "Barangay 1 (Poblacion)",
        "Barangay 2 (Poblacion)",
        "Barangay 3 (Poblacion)",
        "Barangay 4 (Poblacion)",
        "Barangay 5 (Poblacion)",
        "Barangay 6 (Poblacion)",
        "Barangay 7 (Poblacion)",
        "Barangay 8 (Poblacion)",
        "Barangay 9 (Poblacion)",
        "Barangay 10 (Poblacion)",
        "Barangay 11 (Poblacion)",
        "Barangay 12 (Poblacion)",
        "Calan",
        "Caloocan",
        "Calzada",
        "Canda",
        "Carenahan",
        "Caybunga",
        "Cayponce",
        "Dalig",
        "Dao",
        "Dilao",
        "Duhatan",
        "Durungao",
        "Gimalas",
        "Gumamela",
        "Lagnas",
        "Lanatan",
        "Langgangan",
        "Lucban Pook",
        "Lucban Putol",
        "Magabe",
        "Malalay",
        "Munting Tubig",
        "Navotas",
        "Palikpikan",
        "Patugo",
        "Pooc",
        "Sambat",
        "Sampaga",
        "San Juan",
        "San Piro",
        "Santol",
        "Sukol",
        "Tactac",
        "Taludtud",
        "Tanggoy"
    ];    

    const handleRegister = (e) => {
        e.preventDefault();
        if (termsAccepted) {
            setShowRoleSelection(true);
        } else {
            alert("You must accept the terms and conditions.");
        }
    };

    const handleRoleSelect = (role) => {
        if (role === "business") {
            window.location.href = "/business-dashboard";
        } else if (role === "customer") {
            window.location.href = "/customer-dashboard";
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-card">
                <div className="registration-image">
                    <img src={sampleImg} alt="ASF Detection" />
                </div>

                <div className="registration-content">
                    <h1 className="registration-title">Create Your Account</h1>
                    <p className="registration-subtitle">
                        Enter your details to get started!
                    </p>

                    <form className="registration-form" onSubmit={handleRegister}>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                        
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                        
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                        
                        <select
                            value={barangay}
                            onChange={(e) => setBarangay(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select Barangay</option>
                            {barangays.map((barangay, index) => (
                                <option key={index} value={barangay}>
                                    {barangay}
                                </option>
                            ))}
                        </select>
                        
                        <div className="terms-container">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={() => setTermsAccepted(!termsAccepted)}
                                required
                            />
                            <label>
                                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
                            </label>
                        </div>
                        
                        <button type="submit">Create Your Account</button>
                    </form>
                </div>
            </div>

            {showRoleSelection && (
                <div className="role-modal">
                    <div className="role-modal-content">
                        <h2>Choose Your Role</h2>
                        <button
                            className="role-business"
                            onClick={() => handleRoleSelect("business")}
                        >
                            Business Hog Owner
                        </button>
                        <button
                            className="role-customer"
                            onClick={() => handleRoleSelect("customer")}
                        >
                            Customer
                        </button>
                        <button
                            style={{
                                marginTop: "16px",
                                background: "none",
                                color: "#9e9e9e",
                                border: "none",
                                fontSize: "14px",
                                cursor: "pointer",
                            }}
                            onClick={() => setShowRoleSelection(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}