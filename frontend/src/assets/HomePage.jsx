import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import "../css/HomePage.css";
import "../css/Navbar.css"

const HomePage = ({ darkMode, setDarkMode }) => {
    // State for carousel images
    const [currentSlide, setCurrentSlide] = useState(0);
    
    // Placeholder images for carousel (would be replaced with real images)
    const carouselItems = [
        { id: 1, caption: "Register your hogs with Balayan's official system" },
        { id: 2, caption: "Protect your livestock with proper documentation" },
        { id: 3, caption: "Access government support during emergencies" },
        { id: 4, caption: "Join Balayan's growing agricultural community" },
    ];

    // Auto-advance carousel
    useEffect(() => {
        const interval = setInterval(() => {
        setCurrentSlide((prevSlide) => 
            prevSlide === carouselItems.length - 1 ? 0 : prevSlide + 1
        );
        }, 5000);
        
        return () => clearInterval(interval);
    }, [carouselItems.length]);

    return (
        <div className={`home-container ${darkMode ? "dark-mode" : ""}`}>
            {/* Hero Section with Carousel */}
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isHomePage={true} />
            <section className="hero-section">
                <div className="carousel-container">
                {carouselItems.map((item, index) => (
                    <div 
                    key={item.id} 
                    className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                    >
                    <div className="carousel-image-skeleton"></div>
                    <div className="carousel-caption">{item.caption}</div>
                    </div>
                ))}
                
                <div className="carousel-indicators">
                    {carouselItems.map((_, index) => (
                    <span 
                        key={index} 
                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                    ></span>
                    ))}
                </div>
                </div>

                <div className="hero-content">
                <h1>Balayan Hog Registration System</h1>
                <p>Simplifying livestock registration for Balayan's farmers and hog owners</p>
                <div className="hero-buttons">
                    <button className="btn-register">Register Now</button>
                    <button className="btn-learn-more">Learn More</button>
                </div>
                </div>
            </section>

            {/* Welcome/About Section */}
            <section className="welcome-section">
                <div className="container">
                <h2>Welcome to Balayan's Official Hog Registration Portal</h2>
                <p>
                    The Balayan Municipal Government is committed to supporting our local 
                    agriculture sector through efficient and accessible services. Our hog 
                    registration system simplifies compliance while ensuring the health, 
                    safety, and protection of your valuable livestock.
                </p>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="container">
                <h2>Benefits of Registration</h2>
                <div className="benefits-grid">
                    <div className="benefit-card">
                    <div className="benefit-icon">🛡️</div>
                    <h3>Protection During Outbreaks</h3>
                    <p>Registered hog owners receive priority compensation during ASF outbreaks or other livestock diseases.</p>
                    </div>
                    
                    <div className="benefit-card">
                    <div className="benefit-icon">💰</div>
                    <h3>Disaster Relief Access</h3>
                    <p>Qualify for government assistance programs during natural disasters affecting livestock.</p>
                    </div>
                    
                    <div className="benefit-card">
                    <div className="benefit-icon">📊</div>
                    <h3>Market Opportunities</h3>
                    <p>Connect with certified buyers and gain access to premium market rates for registered livestock.</p>
                    </div>
                    
                    <div className="benefit-card">
                    <div className="benefit-icon">🩺</div>
                    <h3>Veterinary Services</h3>
                    <p>Access subsidized veterinary care, vaccinations, and health monitoring for your hogs.</p>
                    </div>
                </div>
                </div>
            </section>

            {/* Registration Process Section */}
            <section className="process-section">
                <div className="container">
                <h2>Simple Registration Process</h2>
                <div className="process-steps">
                    <div className="step">
                    <div className="step-number">1</div>
                    <h3>Create an Account</h3>
                    <p>Sign up on our secure portal with your valid ID and contact information.</p>
                    </div>
                    
                    <div className="step">
                    <div className="step-number">2</div>
                    <h3>Submit Hog Details</h3>
                    <p>Provide information about your hogs including quantity, breed, and location.</p>
                    </div>
                    
                    <div className="step">
                    <div className="step-number">3</div>
                    <h3>Verification</h3>
                    <p>Our agricultural officers will verify the submitted information.</p>
                    </div>
                    
                    <div className="step">
                    <div className="step-number">4</div>
                    <h3>Receive Certificate</h3>
                    <p>Get your official digital registration certificate and physical tags for your hogs.</p>
                    </div>
                </div>
                <div className="register-cta">
                    <button className="btn-register-large">Register Your Hogs Today</button>
                </div>
                </div>
            </section>

            {/* News & Updates Section */}
            <section className="news-section">
                <div className="container">
                <h2>Latest Agricultural News</h2>
                <div className="news-grid">
                    <div className="news-card">
                    <div className="news-image-skeleton"></div>
                    <div className="news-content">
                        <h3>ASF Prevention Measures Strengthened</h3>
                        <p className="news-date">April 15, 2025</p>
                        <p>Balayan implements new biosecurity protocols to prevent African Swine Fever outbreaks.</p>
                        <a href="#" className="read-more">Read More</a>
                    </div>
                    </div>
                    
                    <div className="news-card">
                    <div className="news-image-skeleton"></div>
                    <div className="news-content">
                        <h3>Hog Farming Subsidy Program Launched</h3>
                        <p className="news-date">April 10, 2025</p>
                        <p>New government initiative provides financial support for registered small-scale hog farmers.</p>
                        <a href="#" className="read-more">Read More</a>
                    </div>
                    </div>
                    
                    <div className="news-card">
                    <div className="news-image-skeleton"></div>
                    <div className="news-content">
                        <h3>Training Workshop: Modern Hog Farming</h3>
                        <p className="news-date">April 5, 2025</p>
                        <p>Free workshop for registered farmers on sustainable and efficient hog raising techniques.</p>
                        <a href="#" className="read-more">Read More</a>
                    </div>
                    </div>
                </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="container">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-accordion">
                    <div className="faq-item">
                    <h3>Who needs to register their hogs?</h3>
                    <p>All hog owners in Balayan municipality with one or more pigs must register their livestock according to Municipal Ordinance No. 24-2023.</p>
                    </div>
                    
                    <div className="faq-item">
                    <h3>Is there a registration fee?</h3>
                    <p>Registration is free for the first year for small-scale farmers (1-10 hogs). Commercial farms have a minimal processing fee based on livestock quantity.</p>
                    </div>
                    
                    <div className="faq-item">
                    <h3>How often do I need to update my registration?</h3>
                    <p>Registration should be renewed annually, with updates required for significant changes in hog quantity, location, or ownership.</p>
                    </div>
                    
                    <div className="faq-item">
                    <h3>What documents do I need for registration?</h3>
                    <p>You'll need a valid government ID, proof of residence in Balayan, and basic information about your hog farming operation.</p>
                    </div>
                </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="cta-section">
                <div className="container">
                <h2>Join Balayan's Registered Hog Farmers Today</h2>
                <p>Protect your investment, access government support, and contribute to a healthier agricultural community.</p>
                <div className="cta-buttons">
                    <button className="btn-register">Register Now</button>
                    <button className="btn-contact">Contact Support</button>
                </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;