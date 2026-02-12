import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/UserRegister.css';

const UserRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        profileImage: '',
        interests: []
    });

    // Convert Image to Base64
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                return toast.error("File too large. Max 2MB.");
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData({ ...formData, profileImage: reader.result });
            };
        }
    };

    // Handle Checkbox Interests
    const handleInterestChange = (interest) => {
        const updatedInterests = [...formData.interests];
        if (updatedInterests.includes(interest)) {
            const index = updatedInterests.indexOf(interest);
            updatedInterests.splice(index, 1);
        } else {
            updatedInterests.push(interest);
        }
        setFormData({ ...formData, interests: updatedInterests });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match!");
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                profileImage: formData.profileImage,
                preferences: {
                    interests: formData.interests
                }
            });

            if (response.data.success) {
                toast.success("Account Created Successfully! Redirecting...");
                setTimeout(() => navigate('/user-login'), 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Registration Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-main-wrapper">
            <ToastContainer theme="colored" />
            
            <div className="register-container">
                {/* LEFT SIDE: Info & Branding */}
                <div className="register-info-panel">
                    <div className="register-branding">
                        <h1 className="register-logo">STP <span>AI</span></h1>
                        <h2>Start Your Smart Journey.</h2>
                        <p>Join 50,000+ travelers using AI to plan their perfect trips.</p>
                    </div>
                    <div className="register-features-list">
                        <div className="r-feature"><span>✔</span> AI Route Optimization</div>
                        <div className="r-feature"><span>✔</span> Real-time Budget Tracking</div>
                        <div className="r-feature"><span>✔</span> Global POI Discovery</div>
                    </div>
                </div>

                {/* RIGHT SIDE: Register Form */}
                <div className="register-form-panel">
                    <form onSubmit={handleRegister} className="register-form">
                        <div className="register-header">
                            <h3>Create Account</h3>
                            <p>Enter your details to get started</p>
                        </div>

                        {/* Profile Image Upload (Base64) */}
                        <div className="register-avatar-section">
                            <div className="avatar-preview">
                                {imagePreview ? <img src={imagePreview} alt="Preview" /> : <span>+</span>}
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <label>Upload Profile Picture</label>
                        </div>

                        <div className="register-row">
                            <div className="register-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="John Doe" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="register-group">
                                <label>Email Address</label>
                                <input type="email" placeholder="john@example.com" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        <div className="register-row">
                            <div className="register-group">
                                <label>Password</label>
                                <input type="password" placeholder="••••••••" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="register-group">
                                <label>Confirm Password</label>
                                <input type="password" placeholder="••••••••" required onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                            </div>
                        </div>

                        {/* Interests Select */}
                        <div className="register-interests">
                            <label>Travel Interests</label>
                            <div className="interests-grid">
                                {['nature', 'culture', 'food', 'adventure', 'nightlife'].map(item => (
                                    <div 
                                        key={item} 
                                        className={`interest-chip ${formData.interests.includes(item) ? 'active' : ''}`}
                                        onClick={() => handleInterestChange(item)}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="register-submit-btn" disabled={loading}>
                            {loading ? "Processing..." : "Create Account"}
                        </button>

                        <p className="register-footer-text">
                            Already have an account? <Link to="/user-login">Sign In</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserRegister;