import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import '../../styles/UserLogin.css';

const UserLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); 
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                toast.success(`Welcome back, ${response.data.user.name}!`);
                localStorage.setItem('userToken', response.data.token);
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
                setTimeout(() => navigate('/user-dashboard'), 1500);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Invalid Credentials";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`user-login-wrapper ${isMounted ? 'animate-reveal' : ''}`}>
            <ToastContainer position="top-right" theme="colored" />

            <div className="user-login-image-panel">
                <div className="user-login-overlay">
                    <div className="user-login-brand">
                        <div className="brand-logo-icon">
                            <Sparkles size={32} color="white" fill="white" />
                        </div>
                        <h1>STP <span>AI</span></h1>
                        <p>Experience the nexus of AI and Global Exploration.</p>
                    </div>
                    <div className="user-login-quote">
                        "Artificial Intelligence is the new compass for the modern traveler."
                    </div>
                </div>
            </div>

            <div className="user-login-form-panel">
                <div className="user-login-card">
                    <div className="user-login-header">
                        <h2>Member Login</h2>
                        <p>Enter your credentials to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleLogin} className="user-login-form">
                        <div className="user-input-group">
                            <label>Email Address</label>
                            <div className="user-input-icon-wrapper">
                                <Mail size={18} className="user-field-icon" />
                                <input 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="user-input-group">
                            <label>Password</label>
                            <div className="user-input-icon-wrapper">
                                <Lock size={18} className="user-field-icon" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="user-forgot-row">
                                <Link to="/forgot-password">Forgot Password?</Link>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="user-login-btn" 
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-loading">Authenticating...</span>
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="user-login-footer">
                        <p>Don't have an account?</p>
                        <Link to="/register" className="user-register-link">
                            Join STP AI for free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;