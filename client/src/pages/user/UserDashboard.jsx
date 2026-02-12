import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Calendar, MapPin, Trash2, Plus, CheckCircle, Car, Train, Bus, Bike
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../styles/UserDashboard.css';

// --- CHART.JS IMPORTS ---
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart Components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const UserDashboard = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0, completed: 0, cancelled: 0, planned: 0
    });

    const user = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/trips', config);
            if (res.data.success) {
                const data = res.data.data;
                setTrips(data);
                setStats({
                    total: data.length,
                    completed: data.filter(t => t.status === 'completed').length,
                    cancelled: data.filter(t => t.status === 'cancelled').length,
                    planned: data.filter(t => t.status === 'planning' || t.status === 'ongoing').length
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (id) => {
        if (!window.confirm("Are you sure you want to delete this trip record?")) return;
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:5000/api/trips/${id}`, config);
            fetchTrips();
            toast.success("Trip record deleted.");
        } catch (err) {
            toast.error("Deletion failed.");
        }
    };

    const getTransportIcon = (mode) => {
        switch (mode?.toLowerCase()) {
            case 'car': return <Car size={16} />;
            case 'train': return <Train size={16} />;
            case 'bus': return <Bus size={16} />;
            case 'bike': return <Bike size={16} />;
            default: return <Car size={16} />;
        }
    };

    // --- CHART DATA PREPARATION ---

    // 1. Doughnut Chart Data (Trip Status)
    const statusData = {
        labels: ['Completed', 'Planned', 'Cancelled'],
        datasets: [
            {
                data: [stats.completed, stats.planned, stats.cancelled],
                backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
                hoverOffset: 4,
                borderWidth: 0,
            },
        ],
    };

    const statusOptions = {
        cutout: '70%', // Makes it a thin doughnut
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 12 } } }
        }
    };

    // 2. Bar Chart Data (Budget vs Actual)
    const recentTrips = trips.slice(0, 5);
    const budgetData = {
        labels: recentTrips.map(t => t.destination.city),
        datasets: [
            {
                label: 'Estimated',
                data: recentTrips.map(t => t.budget.totalCost),
                backgroundColor: '#e2e8f0',
                borderRadius: 4,
                barPercentage: 0.6,
            },
            {
                label: 'Actual Spend',
                data: recentTrips.map(t => t.budget.expenses ? t.budget.expenses.reduce((a, b) => a + b.amount, 0) : 0),
                backgroundColor: '#6366f1',
                borderRadius: 4,
                barPercentage: 0.6,
            },
        ],
    };

    const budgetOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
        }
    };

    const upcomingTrips = trips
        .filter(t => t.status === 'planning' || t.status === 'ongoing')
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 3);

    return (
        <div className="user-dash-container">
            
            {/* Header */}
            <div className="user-dash-header">
                <div className="user-dash-welcome">
                    <h1>Hello, {user?.name?.split(' ')[0] || 'Traveler'} 👋</h1>
                    <p>Here is what’s happening with your travel plans.</p>
                </div>
                <Link to="/ai-planner" className="user-dash-create-btn">
                    <Plus size={18} /> New Trip
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="user-dash-stats-grid">
                <div className="user-dash-stat-card">
                    <div className="user-dash-icon-box purple"><MapPin size={24} /></div>
                    <div className="user-dash-stat-info">
                        <h3>{stats.total}</h3>
                        <span>Total Trips</span>
                    </div>
                </div>
                <div className="user-dash-stat-card">
                    <div className="user-dash-icon-box green"><CheckCircle size={24} /></div>
                    <div className="user-dash-stat-info">
                        <h3>{stats.completed}</h3>
                        <span>Completed</span>
                    </div>
                </div>
                <div className="user-dash-stat-card">
                    <div className="user-dash-icon-box blue"><Calendar size={24} /></div>
                    <div className="user-dash-stat-info">
                        <h3>{stats.planned}</h3>
                        <span>Upcoming</span>
                    </div>
                </div>
                <div className="user-dash-stat-card">
                    <div className="user-dash-icon-box red"><Trash2 size={24} /></div>
                    <div className="user-dash-stat-info">
                        <h3>{stats.cancelled}</h3>
                        <span>Cancelled</span>
                    </div>
                </div>
            </div>

            {/* Analytics Row (CHARTS) */}
            <div className="user-dash-analytics-row">
                
                {/* Doughnut Chart */}
                <div className="user-dash-chart-card">
                    <h3>Trip Status</h3>
                    <div className="user-dash-chart-wrapper doughnut-wrap">
                        {stats.total === 0 ? (
                            <p className="user-dash-no-data">No data available</p>
                        ) : (
                            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                                <Doughnut data={statusData} options={statusOptions} />
                                <div className="doughnut-center-text">
                                    <strong>{stats.total}</strong>
                                    <span>Trips</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="user-dash-chart-card">
                    <h3>Budget vs Actual</h3>
                    <div className="user-dash-chart-wrapper">
                        {trips.length === 0 ? (
                            <p className="user-dash-no-data">Start planning to see analytics</p>
                        ) : (
                            <Bar data={budgetData} options={budgetOptions} />
                        )}
                    </div>
                </div>
            </div>

            {/* Upcoming Trips */}
            <h2 className="user-dash-section-title">Next Adventures</h2>
            {upcomingTrips.length === 0 ? (
                <div className="user-dash-empty-state">
                    <MapPin size={40} />
                    <p>No upcoming trips planned. Start exploring now!</p>
                </div>
            ) : (
                <div className="user-dash-upcoming-list">
                    {upcomingTrips.map(trip => (
                        <div key={trip._id} className="user-dash-upcoming-card">
                            <div className="user-dash-date-box">
                                <span className="dd">{new Date(trip.startDate).getDate()}</span>
                                <span className="mm">{new Date(trip.startDate).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div className="user-dash-trip-info">
                                <h4>{trip.title}</h4>
                                <div className="user-dash-meta">
                                    <span><MapPin size={14} /> {trip.destination.city}</span>
                                    <span className="user-dash-transport">{getTransportIcon(trip.transportMode)} {trip.transportMode}</span>
                                </div>
                            </div>
                            <Link to={`/my-trips`} className="user-dash-view-btn">View</Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Trips List */}
            <h2 className="user-dash-section-title">Recent Itineraries</h2>
            <div className="user-dash-grid">
                {trips.map(trip => (
                    <div key={trip._id} className="user-dash-card">
                        <div className="user-dash-card-header">
                            <div className={`user-dash-status-pill ${trip.status}`}>{trip.status}</div>
                            <button className="user-dash-del-btn" onClick={() => handleDeleteTrip(trip._id)}><Trash2 size={16} /></button>
                        </div>
                        <div className="user-dash-card-body">
                            <h3>{trip.title}</h3>
                            <p><Calendar size={14} /> {new Date(trip.startDate).toLocaleDateString()}</p>
                            <div className="user-dash-mini-budget">
                                <span>Est: {trip.budget.currency} {trip.budget.totalCost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserDashboard;