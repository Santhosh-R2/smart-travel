import React, { useEffect, useState } from 'react';
import '../../styles/ContactPage.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const observers = document.querySelectorAll('.contact-fade-in');
        const appearOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('contact-appear');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observers.forEach(obs => appearOnScroll.observe(obs));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Submitted:", formData);
        alert("Thank you! Our travel experts will contact you soon.");
    };

    return (
        <div className="contact-main-wrapper">
            
            <header className="contact-hero-section">
                <div className="contact-hero-content contact-fade-in">
                    <h1 className="contact-hero-title">Get In <span>Touch</span></h1>
                    <p className="contact-hero-subtitle">
                        Have questions about our AI Route Engine or need help with your itinerary? 
                        We are here to help you travel better.
                    </p>
                </div>
            </header>

            <section className="contact-grid-section">
                <div className="contact-container">
                    <div className="contact-flex-box contact-fade-in">
                        
                        <div className="contact-info-panel">
                            <h2 className="contact-panel-h2">Contact Information</h2>
                            <p className="contact-panel-p">Fill out the form and our team will get back to you within 24 hours.</p>
                            
                            <div className="contact-details">
                                <div className="contact-detail-item">
                                    <div className="contact-icon">📍</div>
                                    <div>
                                        <h4>Our Headquarters</h4>
                                        <p>123 AI Plaza, Innovation Way, Tech City</p>
                                    </div>
                                </div>
                                <div className="contact-detail-item">
                                    <div className="contact-icon">📧</div>
                                    <div>
                                        <h4>Email Support</h4>
                                        <p>support@stpai.travel</p>
                                    </div>
                                </div>
                                <div className="contact-detail-item">
                                    <div className="contact-icon">📞</div>
                                    <div>
                                        <h4>Phone</h4>
                                        <p>+1 (555) 000-PLAN</p>
                                    </div>
                                </div>
                            </div>

                            <div className="contact-social-strip">
                                <span>Follow Us:</span>
                                <div className="contact-social-icons">
                                    <div className="cs-icon">Fb</div>
                                    <div className="cs-icon">Tw</div>
                                    <div className="cs-icon">Li</div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-form-panel">
                            <form onSubmit={handleSubmit} className="contact-actual-form">
                                <div className="contact-form-row">
                                    <div className="contact-form-group">
                                        <label>Full Name</label>
                                        <input type="text" name="name" placeholder="John Doe" onChange={handleChange} required />
                                    </div>
                                    <div className="contact-form-group">
                                        <label>Email Address</label>
                                        <input type="email" name="email" placeholder="john@example.com" onChange={handleChange} required />
                                    </div>
                                </div>

                                <div className="contact-form-group">
                                    <label>Subject</label>
                                    <input type="text" name="subject" placeholder="Plan Query" onChange={handleChange} required />
                                </div>

                                <div className="contact-form-group">
                                    <label>Your Message</label>
                                    <textarea name="message" rows="5" placeholder="Tell us how we can help..." onChange={handleChange} required></textarea>
                                </div>

                                <button type="submit" className="contact-submit-btn">Send Message</button>
                            </form>
                        </div>

                    </div>
                </div>
            </section>

            <section className="contact-help-strip contact-fade-in">
                <div className="contact-help-card">
                    <h3>Technical Support</h3>
                    <p>Issues with your AI route? Our devs are ready.</p>
                    <button className="contact-btn-text">Visit Docs →</button>
                </div>
                <div className="contact-help-card">
                    <h3>Partnerships</h3>
                    <p>Are you a travel agency? Let's collaborate.</p>
                    <button className="contact-btn-text">Let's Talk →</button>
                </div>
                <div className="contact-help-card">
                    <h3>Media & Press</h3>
                    <p>Get our official brand kit and latest news.</p>
                    <button className="contact-btn-text">Media Kit →</button>
                </div>
            </section>

        </div>
    );
};

export default ContactPage;