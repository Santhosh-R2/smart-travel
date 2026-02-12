import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import '../../styles/UserLogin.css';

const UserLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const navigate = useNavigate();

    // Trigger the "Curtain Reveal" animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Use your actual backend URL
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                toast.success(`Welcome back, ${response.data.user.name}!`);
                
                // Store Token & User Data
                localStorage.setItem('userToken', response.data.token);
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
                
                // Redirect with a slight delay for UX
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

            {/* LEFT PANEL: Hero Image (Starts Full Width, Shrinks to Left) */}
            <div className="user-login-image-panel">
                <div className="user-login-overlay">
                    <div className="user-login-brand">
                        <h1>STP <span>AI</span></h1>
                        <p>The Future of Intelligent Travel Planning.</p>
                    </div>
                    <div className="user-login-quote">
                        "The world is a book and those who do not travel read only one page."
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Login Form (Revealed) */}
            <div className="user-login-form-panel">
                <div className="user-login-card">
                    <div className="user-login-header">
                        <h2>Welcome Back</h2>
                        <p>Please enter your details to sign in.</p>
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
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
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
                                <span className="btn-loading">Verifying...</span>
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="user-login-footer">
                        <p>Don't have an account?</p>
                        <Link to="/register" className="user-register-link">
                            Create free account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;