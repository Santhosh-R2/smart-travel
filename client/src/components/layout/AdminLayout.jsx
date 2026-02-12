import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    ShieldCheck, Users, MapPin, BarChart3, 
    Settings, LogOut, Bell, ShieldAlert, 
    Database, Activity, Search, Menu, ChevronLeft
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Sidebar navigation specifically for Admin roles
    const adminNavItems = [
        { name: 'Admin Console', path: '/admin/dashboard', icon: <BarChart3 size={20} /> },
        { name: 'User Records', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'POI Database', path: '/admin/poi', icon: <MapPin size={20} /> },
        { name: 'AI Performance', path: '/admin/ai-monitor', icon: <Activity size={20} /> },
        { name: 'System Logs', path: '/admin/logs', icon: <Database size={20} /> },
        { name: 'Global Settings', path: '/admin/settings', icon: <Settings size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin-login');
    };

    return (
        <div className="admin-layout">
            {/* --- ADMIN SIDEBAR --- */}
            <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-logo">
                        <ShieldCheck className="logo-icon" />
                        <span>STP <span>PRO</span></span>
                    </div>
                    <button className="collapse-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                        <ChevronLeft size={18} />
                    </button>
                </div>

                <div className="admin-status-indicator">
                    <div className="pulse-dot"></div>
                    <span>System Live</span>
                </div>

                <nav className="admin-nav">
                    {adminNavItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-text">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout-trigger" onClick={() => setIsLogoutModalOpen(true)}>
                        <LogOut size={20} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* --- ADMIN MAIN SECTION --- */}
            <div className="admin-main-wrapper">
                <header className="admin-top-bar">
                    <div className="admin-breadcrumb">
                        <h2>{adminNavItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}</h2>
                    </div>

                    <div className="admin-top-actions">
                        <div className="admin-search">
                            <Search size={16} />
                            <input type="text" placeholder="Search system records..." />
                        </div>
                        <button className="admin-action-btn"><Bell size={20} /></button>
                        <button className="admin-action-btn alert"><ShieldAlert size={20} /></button>
                        <div className="admin-profile-pill">
                            <div className="admin-avatar">AD</div>
                            <span>Super Admin</span>
                        </div>
                    </div>
                </header>

                <main className="admin-page-content">
                    {children}
                </main>
            </div>

            {/* --- SECURE LOGOUT MODAL --- */}
            {isLogoutModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card">
                        <div className="admin-modal-warning">
                            <LogOut size={40} />
                        </div>
                        <h3>Security Confirmation</h3>
                        <p>You are about to terminate the administrative session. Do you wish to proceed?</p>
                        <div className="admin-modal-actions">
                            <button className="admin-btn-stay" onClick={() => setIsLogoutModalOpen(false)}>Stay Connected</button>
                            <button className="admin-btn-logout" onClick={handleLogout}>Confirm Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;