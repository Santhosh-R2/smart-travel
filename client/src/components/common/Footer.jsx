import React from 'react';
import '../../styles/Footer.css';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="footer-main-wrapper">
            <div className="footer-top-section">
                <div className="footer-container">
                    <div className="footer-grid">
                        
                        {/* Column 1: Brand Info */}
                        <div className="footer-column">
                            <div className="footer-logo">
                                STP <span>AI</span>
                            </div>
                            <p className="footer-brand-desc">
                                Redefining the future of travel through AI-powered optimization. 
                                Plan your dream journey in seconds, not hours.
                            </p>
                            <div className="footer-social-links">
                                <a href="#" className="footer-social-icon">Fb</a>
                                <a href="#" className="footer-social-icon">Tw</a>
                                <a href="#" className="footer-social-icon">Li</a>
                                <a href="#" className="footer-social-icon">Ig</a>
                            </div>
                        </div>

                        {/* Column 2: Quick Navigation */}
                        <div className="footer-column">
                            <h4 className="footer-heading">Platform</h4>
                            <ul className="footer-links">
                                <li onClick={() => navigate('/')}>Home</li>
                                <li onClick={() => navigate('/about')}>About Us</li>
                                <li>Itinerary Builder</li>
                                <li>AI Route Finder</li>
                                <li>Budget Planner</li>
                            </ul>
                        </div>

                        {/* Column 3: Support & Legal */}
                        <div className="footer-column">
                            <h4 className="footer-heading">Support</h4>
                            <ul className="footer-links">
                                <li>Help Center</li>
                                <li>Contact Us</li>
                                <li>Privacy Policy</li>
                                <li>Terms of Service</li>
                                <li>Cookie Policy</li>
                            </ul>
                        </div>

                        {/* Column 4: Newsletter */}
                        <div className="footer-column">
                            <h4 className="footer-heading">Stay Updated</h4>
                            <p className="footer-newsletter-text">
                                Subscribe to get travel insights and AI feature updates.
                            </p>
                            <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="footer-input"
                                />
                                <button className="footer-btn-subscribe">Subscribe</button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Copyright Section */}
            <div className="footer-bottom-bar">
                <div className="footer-container footer-flex-bottom">
                    <p className="footer-copyright">
                        © {new Date().getFullYear()} Smart Travel Planner (STP AI). All rights reserved.
                    </p>
                    <div className="footer-trust-badges">
                        <span>Secured by SSL</span>
                        <span>MERN Stack Project</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;