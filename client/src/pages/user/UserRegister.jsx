import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { 
    User, Mail, Lock, Eye, EyeOff, Image as ImageIcon, 
    CheckCircle2, Sparkles, ArrowRight 
} from 'lucide-react';
import '../../styles/UserRegister.css';

const UserRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        profileImage: '',
        interests: []
    });

    // Validations
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);

    // Filter Name Input (Only Alphabets)
    const handleNameChange = (e) => {
        const val = e.target.value;
        if (val === "" || /^[A-Za-z\s]+$/.test(val)) {
            setFormData({ ...formData, name: val });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                return toast.error("Image must be less than 2MB");
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData({ ...formData, profileImage: reader.result });
            };
        }
    };

    const handleInterestChange = (interest) => {
        const updated = formData.interests.includes(interest)
            ? formData.interests.filter(i => i !== interest)
            : [...formData.interests, interest];
        setFormData({ ...formData, interests: updated });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // 1. Image Validation
        if (!formData.profileImage) return toast.warn("Please upload a profile image");
        
        // 2. Name Validation
        if (formData.name.trim().length < 3) return toast.warn("Please enter a valid full name");

        // 3. Email Validation
        if (!validateEmail(formData.email)) return toast.warn("Please enter a valid email address");

        // 4. Password Strength Validation
        if (!validatePassword(formData.password)) {
            return toast.error("Password must be 8+ chars, include Uppercase, Lowercase, Number and Special Character");
        }

        // 5. Password Match
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
                preferences: { interests: formData.interests }
            });

            if (response.data.success) {
                toast.success("Welcome Aboard! Redirecting to login...");
                setTimeout(() => navigate('/user-login'), 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-main-wrapper">
            <ToastContainer theme="colored" position="top-right" />
            
            <div className="register-container">
                <div className="register-info-panel">
                    <div className="register-branding">
                        <div className="brand-badge"><Sparkles size={16} /> AI Travel</div>
                        <h1 className="register-logo">STP <span>AI</span></h1>
                        <h2>Your global journey starts here.</h2>
                    </div>
                    <div className="register-features">
                        <div className="r-feat"><CheckCircle2 size={18} /> Intelligent Route Mapping</div>
                        <div className="r-feat"><CheckCircle2 size={18} /> Personalized Local Gems</div>
                        <div className="r-feat"><CheckCircle2 size={18} /> Collaborative Itineraries</div>
                    </div>
                </div>

                <div className="register-form-panel">
                    <form onSubmit={handleRegister} className="register-form">
                        <div className="register-header">
                            <h3>Create Account</h3>
                            <p>Join our community of global explorers</p>
                        </div>

                        {/* Avatar Upload */}
                        <div className="register-avatar-section">
                            <div className={`avatar-preview ${!formData.profileImage ? 'empty' : ''}`}>
                                {imagePreview ? <img src={imagePreview} alt="Preview" /> : <ImageIcon size={30} color="#94a3b8" />}
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <label>Upload Profile Photo *</label>
                        </div>

                        <div className="register-grid">
                            {/* Name */}
                            <div className="register-group">
                                <label>Full Name</label>
                                <div className="input-icon-box">
                                    <User size={18} className="i-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Letters only" 
                                        value={formData.name} 
                                        onChange={handleNameChange} 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="register-group">
                                <label>Email Address</label>
                                <div className="input-icon-box">
                                    <Mail size={18} className="i-icon" />
                                    <input 
                                        type="email" 
                                        placeholder="you@example.com" 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="register-group">
                                <label>Password</label>
                                <div className="input-icon-box">
                                    <Lock size={18} className="i-icon" />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Strong Password" 
                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                        required 
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="register-group">
                                <label>Confirm Password</label>
                                <div className="input-icon-box">
                                    <Lock size={18} className="i-icon" />
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="Repeat Password" 
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                                        required 
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="register-interests">
                            <label>Travel Preferences</label>
                            <div className="interests-flex">
                                {['Nature', 'Culture', 'Food', 'Adventure', 'Relax'].map(item => (
                                    <div 
                                        key={item} 
                                        className={`chip ${formData.interests.includes(item) ? 'active' : ''}`}
                                        onClick={() => handleInterestChange(item)}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="register-btn" disabled={loading}>
                            {loading ? "Creating Account..." : "Sign Up Now"} <ArrowRight size={18} />
                        </button>

                        <p className="register-link">
                            Already a member? <Link to="/user-login">Log In</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserRegister;