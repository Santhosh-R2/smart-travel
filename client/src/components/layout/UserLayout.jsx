import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard, Map, Compass, PieChart,
    Settings, LogOut, UserCircle, ShieldCheck,
    ChevronLeft, Menu, ChevronRight, MessageSquare
} from 'lucide-react';
import './UserLayout.css';

const UserLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Get User Data from LocalStorage
    const user = JSON.parse(localStorage.getItem('userInfo')) || {
        name: "Alex Johnson",
        profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100"
    };

    const navItems = [
        { name: 'Dashboard', path: '/user-dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'AI Planner', path: '/ai-planner', icon: <Compass size={20} /> },
        { name: 'AI Chat', path: '/ai-chat', icon: <MessageSquare size={20} /> },
        { name: 'My Trips', path: '/my-trips', icon: <Map size={20} /> },
        { name: 'Budgeting', path: '/budget', icon: <PieChart size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
        { name: 'Security', path: '/settings', icon: <ShieldCheck size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/user-login');
    };

    return (
        <div className="stp-wrapper">
            {/* --- SIDEBAR --- */}
            <aside className={`stp-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon">S</div>
                        {!isCollapsed && <span className="brand-name">STP <span>AI</span></span>}
                    </div>
                    {/* TOGGLE ICON INSIDE SIDEBAR */}
                    <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            {!isCollapsed && <span className="text">{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={() => setIsLogoutModalOpen(true)}>
                        <LogOut size={20} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* --- MAIN SECTION --- */}
            <div className="stp-main">
                {/* --- FIXED NAVBAR --- */}
                <header className="stp-navbar">
                    <div className="nav-breadcrumb">
                        <span>Explorer</span> <ChevronRight size={14} />
                        <span className="active-page">{navItems.find(n => n.path === location.pathname)?.name || 'Dashboard'}</span>
                    </div>

                    {/* USER PROFILE */}
                    <div className="nav-user-profile" onClick={() => navigate('/profile')}>
                        <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-status">Pro Traveler</span>
                        </div>
                        <div className="avatar-wrapper">
                            <img src={user.profileImage} alt="Profile" />
                            <div className="status-dot"></div>
                        </div>
                    </div>
                </header>

                {/* --- SCROLLABLE CONTENT AREA --- */}
                <main className="stp-content">
                    {children}
                </main>
            </div>

            {/* --- LOGOUT MODAL --- */}
            {isLogoutModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header-icon"><LogOut size={28} /></div>
                        <h3>Sign Out?</h3>
                        <p>We'll save your latest AI itineraries for your next visit.</p>
                        <div className="modal-buttons">
                            <button className="m-cancel" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
                            <button className="m-logout" onClick={handleLogout}>Log Out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserLayout;