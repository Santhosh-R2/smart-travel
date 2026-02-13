import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Camera, User, Mail, Heart, Save, X, Globe, Loader, Edit3 } from 'lucide-react';
import '../../styles/ProfilePage.css';

const ProfilePage = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isEditing, setIsEditing] = useState(false); 
    const [imagePreview, setImagePreview] = useState(null);
    
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        profileImage: '',
        interests: []
    });

    const loadUserData = () => {
        try {
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setProfile({
                    name: userData.name || '',
                    email: userData.email || '',
                    profileImage: userData.profileImage || '',
                    interests: userData.preferences?.interests || []
                });
                setImagePreview(userData.profileImage || null);
            }
        } catch (err) {
            console.error("Error parsing user data", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleImageChange = (e) => {
        if (!isEditing) return; 
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setProfile(prev => ({ ...prev, profileImage: reader.result }));
            };
        }
    };

    const toggleInterest = (interest) => {
        if (!isEditing) return; 
        setProfile(prev => {
            const updated = prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest];
            return { ...prev, interests: updated };
        });
    };

    const handleCancel = () => {
        loadUserData(); 
        setIsEditing(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const response = await axios.put('http://localhost:5000/api/auth/updateprofile', {
                name: profile.name,
                profileImage: profile.profileImage,
                preferences: { interests: profile.interests }
            }, config);

            if (response.data.success) {
                toast.success("Profile Synchronized!");
                localStorage.setItem('userInfo', JSON.stringify(response.data.data));
                setIsEditing(false); 
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Update Failed");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="profile-loader-container">
                <Loader className="animate-spin" size={40} color="#3b82f6" />
                <p>Loading Secure Environment...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <ToastContainer theme="colored" />
            
            <div className={`profile-card ${isEditing ? 'is-editing-mode' : ''}`}>
                <div className="profile-header">
                    <div className="profile-cover"></div>
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-inner">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile" />
                            ) : (
                                <div className="avatar-placeholder"><User size={50} color="#cbd5e1" /></div>
                            )}
                            {isEditing && (
                                <label className="avatar-edit-badge">
                                    <Camera size={18} />
                                    <input type="file" onChange={handleImageChange} accept="image/*" />
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="profile-intro">
                        <h2>{profile.name || 'User'}</h2>
                        <span className="profile-status-badge">Account Active</span>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="profile-form">
                    <div className="form-grid">
                        <div className={`form-group ${!isEditing ? 'readonly-group' : ''}`}>
                            <label><User size={16} /> Full Name</label>
                            <input 
                                type="text" 
                                value={profile.name} 
                                onChange={(e) => setProfile({...profile, name: e.target.value})}
                                readOnly={!isEditing}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <div className="form-group readonly-group">
                            <label><Mail size={16} /> Email Address</label>
                            <input 
                                type="email" 
                                value={profile.email} 
                                readOnly
                                className="disabled-input"
                            />
                        </div>
                    </div>

                    <div className="interests-section">
                        <label className="section-label"><Heart size={16} /> Travel Preferences</label>
                        <p className="section-desc">Interests are currently {isEditing ? 'editable' : 'locked'}.</p>
                        <div className="interests-grid">
                            {['nature', 'culture', 'food', 'adventure', 'nightlife', 'shopping', 'history'].map(item => (
                                <div 
                                    key={item} 
                                    className={`interest-pill ${profile.interests.includes(item) ? 'active' : ''} ${!isEditing ? 'locked-pill' : ''}`}
                                    onClick={() => toggleInterest(item)}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="profile-actions">
                        {!isEditing ? (
                            <button 
                                type="button" 
                                className="btn-edit-mode" 
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit3 size={18} /> Edit Profile
                            </button>
                        ) : (
                            <>
                                <button type="button" className="btn-secondary" onClick={handleCancel}>
                                    <X size={18} /> Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;