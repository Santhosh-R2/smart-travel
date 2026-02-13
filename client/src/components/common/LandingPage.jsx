import React, { useEffect } from 'react';
import '../../styles/LandingPage.css';
import main from '../../assets/main.jpeg';
import budget from '../../assets/budget.jpeg';
import collaboration from '../../assets/team.jpeg';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    
    useEffect(() => {
        const observers = document.querySelectorAll('.landing-fade-in');
        const appearOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('landing-appear');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observers.forEach(obs => appearOnScroll.observe(obs));
    }, []);

    return (
        <div className="landing-page-container">
            
            <header className="landing-hero-section">
                <div className="landing-hero-overlay"></div>
                <div className="landing-hero-content landing-fade-in">
                    <h1 className="landing-hero-title">
                        Explore the World <br /> 
                        <span className="landing-text-animate">Smartly with AI</span>
                    </h1>
                    <p className="landing-hero-subtitle">
                        The ultimate intelligent planner that optimizes your routes, 
                        manages your budget, and personalizes your journey.
                    </p>
                <Link to="/user-login"><button className="landing-hero-btn">Start Your Journey</button></Link>
                </div>
            </header>

            <section className="landing-features-section">
                
                <div className="landing-zigzag-row landing-fade-in">
                    <div className="landing-zigzag-column">
                        <div className="landing-image-wrapper">
                            <img src={main} alt="AI Route" />
                        </div>
                    </div>
                    <div className="landing-zigzag-column">
                        <div className="landing-text-content">
                            <span className="landing-badge">AI Intelligence</span>
                            <h2 className="landing-feature-h2">Optimized Route Calculations</h2>
                            <p className="landing-feature-p">
                                Our AI engine goes beyond simple maps. It calculates travel density, opening hours, 
                                and your preferred pace to create a maximum utility itinerary.
                            </p>
                            <Link to="/user-login"><button className="landing-learn-more">Explore Technology</button></Link>
                        </div>
                    </div>
                </div>

                <div className="landing-zigzag-row landing-fade-in">
                    <div className="landing-zigzag-column">
                        <div className="landing-image-wrapper">
                            <img src={budget} alt="Budget" />
                        </div>
                    </div>
                    <div className="landing-zigzag-column">
                        <div className="landing-text-content">
                            <span className="landing-badge">Financial Control</span>
                            <h2 className="landing-feature-h2">Real-time Budget Tracking</h2>
                            <p className="landing-feature-p">
                                Manage your expenses across multiple currencies. Get instant insights into 
                                your spending patterns and stay within your financial limits.
                            </p>
                            <Link to="/user-login"><button className="landing-learn-more">View Budget Tools</button></Link>
                        </div>
                    </div>
                </div>

                <div className="landing-zigzag-row landing-fade-in">
                    <div className="landing-zigzag-column">
                        <div className="landing-image-wrapper">
                            <img src={collaboration} alt="Collaboration" />
                        </div>
                    </div>
                    <div className="landing-zigzag-column">
                        <div className="landing-text-content">
                            <span className="landing-badge">Social Grouping</span>
                            <h2 className="landing-feature-h2">Collaborative Trip Planning</h2>
                            <p className="landing-feature-p">
                                Planning with friends is now seamless. Share your itinerary, vote on 
                                destinations, and sync calendars in real-time.
                            </p>
                            <Link to="/user-login"><button className="landing-learn-more">Start Group Trip</button></Link>
                        </div>
                    </div>
                </div>

            </section>

           
        </div>
    );
};

export default LandingPage;