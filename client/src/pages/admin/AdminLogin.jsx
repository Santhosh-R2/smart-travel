import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/react-toastify.css';
import '../../styles/AdminLogin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
                email,
                password
            });

            if (response.data.success) {
                toast.success('System Access Granted. Welcome, Admin.');
                localStorage.setItem('adminToken', response.data.token);
                
                setTimeout(() => {
                    navigate('/admin/dashboard');
                }, 1500);
            }
        } catch (error) {
            const message = error.response?.data?.error || "Unauthorized Access. Credentials Invalid.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-wrapper">
            <ToastContainer theme="dark" position="top-center" autoClose={3000} />
            
            {/* LEFT SIDE: Brand & Secure Animation */}
            <div className="admin-visual-panel">
                <div className="admin-radar-container">
                    <div className="admin-radar-circle"></div>
                    <div className="admin-radar-scanner"></div>
                </div>
                <div className="admin-panel-content">
                    <h1 className="admin-brand-logo">STP <span>AI</span></h1>
                    <div className="admin-status-badge">
                        <span className="admin-pulse"></span> SYSTEM SECURE
                    </div>
                    <p className="admin-panel-tagline">Central Intelligence & Operations</p>
                </div>
            </div>

            {/* RIGHT SIDE: Secure Login Form */}
            <div className="admin-form-panel">
                <div className="admin-login-card">
                    <div className="admin-header-box">
                        <h2>Admin Authentication</h2>
                        <div className="admin-underline"></div>
                    </div>
                    
                    <form onSubmit={handleLogin} className="admin-form">
                        <div className="admin-field">
                            <label>Master Email</label>
                            <input 
                                type="email" 
                                placeholder="root@stpai.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="admin-field">
                            <label>Security Key</label>
                            <input 
                                type="password" 
                                placeholder="••••••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="admin-access-btn" 
                            disabled={loading}
                        >
                            {loading ? "VERIFYING..." : "GRANT ACCESS"}
                        </button>
                    </form>

                    <div className="admin-security-note">
                        <p>Unauthorized access attempts are logged and reported.</p>
                        <span onClick={() => navigate('/')}>Return to Terminal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;