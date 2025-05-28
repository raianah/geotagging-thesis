import React, { useState, useEffect } from "react";
import { FaShieldVirus } from "react-icons/fa6";
import { TbMoneybag } from "react-icons/tb";
import { MdVaccines } from "react-icons/md";
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
                <p>Official registry for hog raisers in Balayan, Batangas.</p>
                <div className="hero-buttons">
                    <button onClick={() => window.location.href = "/register"} className="btn-register">Register Now</button>
                    <button className="btn-learn-more">Learn More</button>
                </div>
                </div>
            </section>

            {/* Welcome/About Section */}
            <section className="welcome-section">
                <div className="container">
                <h2>Welcome to Balayan's Official Hog Registration Portal</h2>
                <p>
                    The Balayan Local Government is committed to supporting our local 
                    hog sector through efficient, accessible, and centralized services. Our hog 
                    registration system simplifies compliance while ensuring the health, 
                    safety, and protection of your valuable livestock in cases of an outbreak.
                </p>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="container">
                <h2>Benefits of Registration</h2>
                <div className="benefits-grid">
                    <div className="benefit-card">
                    <div className="benefit-icon"><FaShieldVirus /></div>
                    <h3>Protection During Outbreaks</h3>
                    <p>Registered hog owners receive priority compensation during ASF outbreaks or other livestock diseases.</p>
                    </div>
                    
                    <div className="benefit-card">
                    <div className="benefit-icon"><TbMoneybag /></div>
                    <h3>Disaster Relief Access</h3>
                    <p>Qualify for government assistance programs during natural disasters affecting livestock.</p>
                    </div>
                    
                    <div className="benefit-card">
                    <div className="benefit-icon"><MdVaccines /></div>
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
                    <p>Sign up on the registration portal, providing your personal and farm information. Only hog raisers located in Balayan, Batangas are eligible to register.</p>
                    </div>
                    
                    <div className="step">
                    <div className="step-number">2</div>
                    <h3>Wait for Approval</h3>
                    <p>While you can use the rest of the website, your account still needs approval for beneficiaries related to ASF outbreaks.</p>
                    </div>
                    
                    <div className="step">
                    <div className="step-number">3</div>
                    <h3>You are now verified!</h3>
                    <p>Once your account is verified, you will receive beneficiaries and compensation programs related to ASF outbreaks. You will be prioritized for assistance. You must update and re-verify your account once in a year.</p>
                    </div>
                </div>
                <div className="register-cta">
                    <button onClick={() => window.location.href = "/register"} className="btn-register-large">Register Your Hogs Today</button>
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
                        <h3>DA to distribute P1-B worth of swine to boost hog inventory</h3>
                        <p className="news-date">April 20, 2025</p>
                        <p>The Department of Agriculture is set to distribute P1 billion worth of swine to large farms nationwide, aiming to restore the country’s hog population to its pre-African Swine Fever level of 14 million heads within three years.</p>
                        <a href="https://www.gmanetwork.com/news/money/economy/943290/da-to-distribute-p1-b-worth-of-swine-to-boost-hog-inventory/story/" target="_blank" className="read-more">Read More</a>
                    </div>
                    </div>
                    
                    <div className="news-card">
                    <div className="news-image-skeleton"></div>
                    <div className="news-content">
                        <h3>Agri dept to pilot test 'tracing system' for hogs from farmers to retailers</h3>
                        <p className="news-date">April 2, 2025</p>
                        <p>The Department of Agriculture will pilot test a 'tracing system' which will give retailers a 'card' containing information about the hogs they are selling.</p>
                        <a href="https://www.abs-cbn.com/news/business/2025/4/2/agri-dept-to-pilot-test-tracing-system-for-hogs-from-farmers-to-retailers-1637" target="_blank" className="read-more">Read More</a>
                    </div>
                    </div>

                    <div className="news-card">
                    <div className="news-image-skeleton"></div>
                    <div className="news-content">
                        <h3>Swine industry urged to produce 2M more pigs yearly to recover from swine fever</h3>
                        <p className="news-date">March 27, 2025</p>
                        <p>The Department of Agriculture (DA) urged the swine industry to raise an additional two million hogs annually to restore the pig population, which was decimated by the African Swine Fever (ASF) outbreak in 2019.</p>
                        <a href="https://www.philstar.com/business/2025/03/27/2431538/swine-industry-urged-produce-2m-more-pigs-yearly-recover-swine-fever" target="_blank" className="read-more">Read More</a>
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
                    <p>All hog raisers in Balayan, Batangas with one or more farms with one or more pigs must register their livestock.</p>
                    </div>
                    
                    <div className="faq-item">
                    <h3>Is there a registration fee?</h3>
                    <p>There is no registration fee for hog farmers in Balayan, Batangas.</p>
                    </div>
                    
                    <div className="faq-item">
                    <h3>How often do I need to update my account?</h3>
                    <p>Account verification should be updated annually, with updates required for significant changes in hog quantity, location, or ownership.</p>
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
                    <button onClick={() => window.location.href = "/register"} className="btn-register">Register Now</button>
                    <button onClick={() => window.location.href = "mailto:support@balayanhog2025.thetwlight.xyz"} className="btn-contact">Contact Support</button>
                </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;