import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/react-toastify.css';
import '../../styles/ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });

            if (response.data.success) {
                toast.success("OTP sent to your email!");
                setTimeout(() => {
                    navigate('/reset-password', { state: { email } });
                }, 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "User not found with this email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-pw-wrapper">
            <ToastContainer theme="colored" position="top-center" />
            
            <div className="forgot-pw-card">
                <div className="forgot-pw-icon-area">
                    <div className="forgot-pw-pulse"></div>
                    <div className="forgot-pw-icon">✉</div>
                </div>

                <div className="forgot-pw-header">
                    <h2>Recover Password</h2>
                    <p>Enter your registered email to receive a 6-digit security OTP.</p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-pw-form">
                    <div className="forgot-pw-input-group">
                        <label>Registered Email</label>
                        <input 
                            type="email" 
                            placeholder="e.g. traveler@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="forgot-pw-btn" 
                        disabled={loading}
                    >
                        {loading ? "Sending OTP..." : "Request Security Code"}
                    </button>
                </form>

                <div className="forgot-pw-footer">
                    <Link to="/user-login">← Back to Login</Link>
                </div>
            </div>

            <div className="forgot-bg-circle c-top"></div>
            <div className="forgot-bg-circle c-bottom"></div>
        </div>
    );
};

export default ForgotPassword;