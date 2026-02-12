import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { Shield, Key, AlertTriangle, Phone, HeartPulse, Truck, Lock } from 'lucide-react';
import '../../styles/Security.css';

const Security = () => {
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("New passwords do not match.");
        }

        if (passwords.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters.");
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Correct endpoint for password change
            await axios.put('http://localhost:5000/api/auth/changepassword', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            }, config);

            toast.success("Password updated successfully!");
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleSOS = () => {
        // In a real app, this would trigger an SMS API or native share
        toast.error("SOS Signal Simulated: Location sent to emergency contacts.");
    };

    return (
        <div className="security-container">
            <ToastContainer theme="colored" position="top-right" />

            <div className="security-header">
                <h2 className="security-title">Security & Safety Center</h2>
                <p className="security-subtitle">Manage your account access and access emergency travel tools.</p>
            </div>

            <div className="security-grid">

                {/* LEFT: CHANGE PASSWORD */}
                <div className="security-card">
                    <div className="security-card-header">
                        <div className="security-icon-box blue">
                            <Key size={24} />
                        </div>
                        <h3>Change Password</h3>
                    </div>

                    <form className="security-form" onSubmit={handlePasswordUpdate}>
                        <div className="security-input-group">
                            <label>Current Password</label>
                            <div className="security-input-wrapper">
                                <Lock size={16} className="security-field-icon" />
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="••••••••"
                                    value={passwords.currentPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="security-input-group">
                            <label>New Password</label>
                            <div className="security-input-wrapper">
                                <Lock size={16} className="security-field-icon" />
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="••••••••"
                                    value={passwords.newPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="security-input-group">
                            <label>Confirm New Password</label>
                            <div className="security-input-wrapper">
                                <Lock size={16} className="security-field-icon" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={passwords.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="security-form-actions">
                            <button type="submit" className="security-btn-primary" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: TRAVEL SAFETY & HELPLINES */}
                <div className="security-card">
                    <div className="security-card-header">
                        <div className="security-icon-box red">
                            <Shield size={24} />
                        </div>
                        <h3>Travel Safety & SOS</h3>
                    </div>

                    <div className="security-sos-box">
                        <div className="security-sos-content">
                            <h4><AlertTriangle size={20} /> Emergency SOS</h4>
                            <p>Instantly alert local authorities and your trusted contacts with your GPS location.</p>
                        </div>
                        <button className="security-btn-sos" onClick={handleSOS}>
                            ACTIVATE SOS
                        </button>
                    </div>

                    <div className="security-helplines">
                        <h4 className="security-section-title">Emergency Helplines (India)</h4>

                        <div className="security-helpline-grid">
                            <div className="security-helpline-item">
                                <div className="security-hl-icon"><Phone size={18} /></div>
                                <div className="security-hl-info">
                                    <span>Police</span>
                                    <strong>100 / 112</strong>
                                </div>
                            </div>

                            <div className="security-helpline-item">
                                <div className="security-hl-icon"><HeartPulse size={18} /></div>
                                <div className="security-hl-info">
                                    <span>Ambulance</span>
                                    <strong>108</strong>
                                </div>
                            </div>

                            <div className="security-helpline-item">
                                <div className="security-hl-icon"><Shield size={18} /></div>
                                <div className="security-hl-info">
                                    <span>Women's Safety</span>
                                    <strong>1091</strong>
                                </div>
                            </div>

                            <div className="security-helpline-item">
                                <div className="security-hl-icon"><Truck size={18} /></div>
                                <div className="security-hl-info">
                                    <span>Highway Patrol</span>
                                    <strong>1033</strong>
                                </div>
                            </div>

                            <div className="security-helpline-item">
                                <div className="security-hl-icon"><Phone size={18} /></div>
                                <div className="security-hl-info">
                                    <span>Tourist Info</span>
                                    <strong>1363</strong>
                                </div>
                            </div>

                            <div className="security-helpline-item">
                                <div className="security-hl-icon"><Phone size={18} /></div>
                                <div className="security-hl-info">
                                    <span>Fire</span>
                                    <strong>101</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Security;