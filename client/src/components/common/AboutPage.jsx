import React, { useEffect } from 'react';
import '../../styles/AboutPage.css';
import team from '../../assets/team.jpeg';
import travel from '../../assets/travel.jpeg';
const AboutPage = () => {
    
    useEffect(() => {
        const observers = document.querySelectorAll('.about-fade-in');
        const appearOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('about-appear');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observers.forEach(obs => appearOnScroll.observe(obs));
    }, []);

    return (
        <div className="about-main-container">
            
            {/* HERO SECTION */}
            <header className="about-hero-section">
                <div className="about-hero-content about-fade-in">
                    <h1 className="about-hero-title">We are Redefining <br /> <span>The Modern Journey.</span></h1>
                    <p className="about-hero-subtitle">Combining cutting-edge AI with human curiosity to make world exploration seamless and accessible.</p>
                </div>
            </header>

            {/* OUR MISSION: IMAGE & TEXT */}
            <section className="about-mission-section">
                <div className="about-mission-row about-fade-in">
                    <div className="about-mission-image">
                        <img src={team} alt="Our Team" />
                    </div>
                    <div className="about-mission-text">
                        <span className="about-badge">The Vision</span>
                        <h2 className="about-section-h2">The Problem We Solve</h2>
                        <p className="about-section-p">
                            Traditional travel planning is broken. It’s a stressful mess of browser tabs, sub-optimal routes, and missed opportunities. 
                            <strong> Smart Travel Planner (STP)</strong> was born from a simple question: 
                            <em>"Can we use Artificial Intelligence to give travelers their time back?"</em>
                        </p>
                        <p className="about-section-p">
                            We built a platform that handles the heavy lifting of logistics, so you can focus on the experience.
                        </p>
                    </div>
                </div>
            </section>

            {/* TECHNOLOGY PILLARS: 3 GRID STYLE */}
            <section className="about-pillars-section">
                <div className="about-pillars-header about-fade-in">
                    <h2 className="about-section-h2">Our Three Pillars</h2>
                </div>
                <div className="about-pillars-grid">
                    <div className="about-pillar-card about-fade-in">
                        <div className="about-pillar-icon">01</div>
                        <h3>Efficiency</h3>
                        <p>Our MERN-stack architecture ensures lightning-fast responses and real-time data sync across all your devices.</p>
                    </div>
                    <div className="about-pillar-card about-fade-in">
                        <div className="about-pillar-icon">02</div>
                        <h3>Personalization</h3>
                        <p>Our AI analyzes your unique preferences to recommend destinations that actually match your personality.</p>
                    </div>
                    <div className="about-pillar-card about-fade-in">
                        <div className="about-pillar-icon">03</div>
                        <h3>Global Scale</h3>
                        <p>With data coverage across 150+ countries, we ensure your trip is optimized whether you are in Tokyo or Paris.</p>
                    </div>
                </div>
            </section>

            {/* IMPACT SECTION: TEXT & IMAGE REVERSED */}
            <section className="about-impact-section">
                <div className="about-mission-row about-reverse about-fade-in">
                    <div className="about-mission-image">
                        <img src={travel} alt="Travel Impact" />
                    </div>
                    <div className="about-mission-text">
                        <span className="about-badge">The Future</span>
                        <h2 className="about-section-h2">Building a Sustainable Future</h2>
                        <p className="about-section-p">
                            We are committed to more than just planning. We help travelers discover hidden gems, 
                            reducing over-tourism in crowded areas while supporting local economies. 
                        </p>
                        <div className="about-stats-box">
                            <div className="about-stat-item">
                                <h4>50k+</h4>
                                <span>Users</span>
                            </div>
                            <div className="about-stat-item">
                                <h4>1.2M</h4>
                                <span>Routes Optimized</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AboutPage;