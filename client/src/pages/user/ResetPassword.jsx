import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/ResetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get email from the navigation state (passed from ForgotPassword.jsx)
    const emailFromState = location.state?.email || "";

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        if (otp.length !== 6) {
            return toast.error("Please enter a valid 6-digit OTP");
        }

        setLoading(true);

        try {
            const response = await axios.put('http://localhost:5000/api/auth/resetpassword', {
                email: emailFromState,
                otp,
                newPassword
            });

            if (response.data.success) {
                toast.success("Password Reset Successful! Redirecting to login...");
                setTimeout(() => navigate('/user-login'), 2500);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Invalid OTP or Session Expired");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-pw-wrapper">
            <ToastContainer theme="colored" position="top-center" />
            
            <div className="reset-pw-card">
                {/* Security Shield Icon */}
                <div className="reset-pw-icon-box">
                    <div className="reset-pw-shield">🛡️</div>
                </div>

                <div className="reset-pw-header">
                    <h2>Secure Reset</h2>
                    <p>Enter the 6-digit code sent to <br /><strong>{emailFromState}</strong></p>
                </div>

                <form onSubmit={handleReset} className="reset-pw-form">
                    {/* OTP Input */}
                    <div className="reset-pw-input-group">
                        <label>6-Digit OTP</label>
                        <input 
                            type="text" 
                            maxLength="6"
                            placeholder="0 0 0 0 0 0"
                            className="otp-input-field"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required 
                        />
                    </div>

                    {/* New Password Input */}
                    <div className="reset-pw-input-group">
                        <label>New Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required 
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="reset-pw-input-group">
                        <label>Confirm New Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="reset-pw-btn" 
                        disabled={loading}
                    >
                        {loading ? "Updating Security..." : "Reset Password"}
                    </button>
                </form>

                <div className="reset-pw-footer">
                    <p>Didn't receive a code? <Link to="/forgot-password">Resend</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;