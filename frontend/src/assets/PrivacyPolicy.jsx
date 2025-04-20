import React from "react";
import { Link } from "react-router-dom";
import "../css/PrivacyPolicy.css";
import logo from '../img/logo.png';

export default function PrivacyPolicy() {
    return (
        <div className="privacy-container">
            <div className="privacy-header">
                <img src={logo} alt="Balayan Hog Registration" className="privacy-logo" />
                <h1>Privacy Policy</h1>
            </div>
            
            <div className="privacy-content">
                <div className="privacy-section">
                    <h2>Information We Collect</h2>
                    <p>
                        Balayan Hog Registration collects the following information during registration:
                    </p>
                    <ul>
                        <li>Full Name (First and Last Name)</li>
                        <li>Contact Information (Phone Number and Email Address)</li>
                        <li>Location Data (GPS coordinates and/or address)</li>
                        <li>Photos (Valid ID and Hog Photos)</li>
                        <li>Number of Hogs Owned</li>
                    </ul>
                </div>
                
                <div className="privacy-section">
                    <h2>How We Use Your Information</h2>
                    <p>
                        The information you provide is used for:
                    </p>
                    <ul>
                        <li>Registration and identification of hog raisers in Balayan, Batangas</li>
                        <li>Communication regarding hog-related programs and initiatives</li>
                        <li>Statistical analysis for agricultural planning</li>
                        <li>Disease prevention and control measures</li>
                        <li>Verification of identity and ownership</li>
                    </ul>
                </div>
                
                <div className="privacy-section">
                    <h2>Data Storage and Security</h2>
                    <p>
                        All data collected is stored securely in our database with appropriate security measures in place. 
                        We implement reasonable technical and organizational measures to protect your personal information.
                    </p>
                    <p>
                        Your location data and photos are used solely for verification purposes and will not be shared with 
                        third parties without your explicit consent, except when required by law.
                    </p>
                </div>
                
                <div className="privacy-section">
                    <h2>Your Rights</h2>
                    <p>
                        You have the right to:
                    </p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Request correction of inaccurate information</li>
                        <li>Request deletion of your data (subject to legal requirements)</li>
                        <li>Withdraw consent at any time</li>
                    </ul>
                    <p>
                        To exercise these rights, please contact our data protection officer at <a href="mailto:privacy@balayanhog.gov.ph">privacy@balayanhog.gov.ph</a>.
                    </p>
                </div>
                
                <div className="privacy-section">
                    <h2>Third-Party Access</h2>
                    <p>
                        Your information may be shared with:
                    </p>
                    <ul>
                        <li>Local government agencies for agricultural and livestock management</li>
                        <li>Health and veterinary services for disease control</li>
                        <li>Law enforcement agencies when required by law</li>
                    </ul>
                </div>
                
                <div className="privacy-section">
                    <h2>Data Retention</h2>
                    <p>
                        We will retain your personal information for as long as necessary to fulfill the purposes outlined 
                        in this privacy policy unless a longer retention period is required by law.
                    </p>
                </div>
                
                <div className="privacy-section">
                    <h2>Changes to This Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
                        the new Privacy Policy on this page and updating the "Last Updated" date.
                    </p>
                    <p>
                        <strong>Last Updated:</strong> April 20, 2025
                    </p>
                </div>
            </div>
            
            <div className="privacy-footer">
                <Link to="/register" className="back-button">Back to Registration</Link>
                <p>© 2025 Balayan Hog Registration Program. All rights reserved.</p>
            </div>
        </div>
    );
}