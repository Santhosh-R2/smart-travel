import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { ShieldCheck, Eye, EyeOff, Lock, Hash } from 'lucide-react';
import '../../styles/ResetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const emailFromState = location.state?.email || "your email";

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
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
                toast.success("Security Updated! Redirecting to login...");
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
                <div className="reset-pw-icon-box">
                    <ShieldCheck size={40} color="#4A90E2" strokeWidth={1.5} />
                </div>

                <div className="reset-pw-header">
                    <h2>Secure Reset</h2>
                    <p>We sent a 6-digit verification code to <br /><strong>{emailFromState}</strong></p>
                </div>

                <form onSubmit={handleReset} className="reset-pw-form">
                    
                    <div className="reset-pw-input-group">
                        <label>Verification Code</label>
                        <div className="input-with-icon">
                            <Hash size={18} className="input-left-icon" />
                            <input 
                                type="text" 
                                maxLength="6"
                                placeholder="000000"
                                className="otp-input-field"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div className="reset-pw-input-group">
                        <label>New Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-left-icon" />
                            <input 
                                type={showNewPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required 
                            />
                            <button 
                                type="button" 
                                className="eye-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="reset-pw-input-group">
                        <label>Confirm Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-left-icon" />
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                            />
                            <button 
                                type="button" 
                                className="eye-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="reset-pw-btn" 
                        disabled={loading}
                    >
                        {loading ? "Verifying Credentials..." : "Update Password"}
                    </button>
                </form>

                <div className="reset-pw-footer">
                    <p>Didn't receive a code? <Link to="/forgot-password">Request New Code</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;