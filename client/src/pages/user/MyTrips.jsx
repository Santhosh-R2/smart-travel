import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify'; 
import { MapPin, Calendar, CheckCircle, XCircle, PenTool, Edit3 } from 'lucide-react';
import '../../styles/MyTrips.css';

const MyTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [blogModalOpen, setBlogModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [blogData, setBlogData] = useState({ title: '', content: '' });
    const [savingBlog, setSavingBlog] = useState(false);

    const fetchTrips = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/trips', config);
            if (res.data.success) {
                setTrips(res.data.data);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch trips");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(`Are you sure you want to mark this trip as ${status}?`)) return;

        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/trips/${id}/status`, { status }, config);
            toast.success(`Trip marked as ${status}`);
            fetchTrips();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const openBlogModal = (trip) => {
        setSelectedTrip(trip);
        
        if (trip.blog && trip.blog.title) {
            setBlogData({ 
                title: trip.blog.title, 
                content: trip.blog.content 
            });
        } else {
            setBlogData({ 
                title: `My Trip to ${trip.destination.city}`, 
                content: '' 
            });
        }
        setBlogModalOpen(true);
    };

    const handleBlogSubmit = async (e) => {
        e.preventDefault();
        setSavingBlog(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.put(`http://localhost:5000/api/trips/${selectedTrip._id}/blog`, blogData, config);
            
            toast.success("Blog published successfully!");
            setBlogModalOpen(false);
            fetchTrips(); 
        } catch (err) {
            toast.error("Failed to publish blog");
        } finally {
            setSavingBlog(false);
        }
    };

    if (loading) return <div className="trip-loading-state"><div className="trip-spinner"></div></div>;

    return (
        <div className="trip-container">
            <ToastContainer theme="colored" />
            <div className="trip-page-header">
                <h2>My Journeys</h2>
            </div>

            <div className="trip-grid">
                {trips.length === 0 ? (
                    <div className="trip-empty-state">
                        <p>No trips found. Start planning with the AI Engine!</p>
                    </div>
                ) : trips.map(trip => (
                    <div key={trip._id} className="trip-card">
                        <div className="trip-image-placeholder" style={{
                            backgroundImage: trip.destination.image ? `url(${trip.destination.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            {!trip.destination.image && <MapPin size={48} opacity={0.5} />}
                            <span className={`trip-status-badge trip-status-${trip.status}`}>
                                {trip.status}
                            </span>
                        </div>
                        <div className="trip-content">
                            <h3 className="trip-title">{trip.title}</h3>
                            <div className="trip-meta-row">
                                <div className="trip-meta-item">
                                    <Calendar size={14} />
                                    <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="trip-meta-item">
                                    <MapPin size={14} />
                                    <span>{trip.destination.city}</span>
                                </div>
                            </div>

                            <div className="trip-budget-row">
                                <span className="trip-budget-label">Est. Budget</span>
                                <span className="trip-budget-value">{trip.budget.currency} {trip.budget.totalCost.toLocaleString()}</span>
                            </div>
                            <div className="trip-budget-row">
                                <span className="trip-budget-label">Actual Spend</span>
                                <span className="trip-budget-value trip-text-green">
                                    {trip.budget.currency} {trip.budget.expenses ? trip.budget.expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString() : 0}
                                </span>
                            </div>
                        </div>

                        <div className="trip-actions-bar">
                            {(trip.status === 'planning' || trip.status === 'ongoing') && (
                                <>
                                    <button className="trip-btn trip-btn-complete" onClick={() => handleStatusUpdate(trip._id, 'completed')}>
                                        <CheckCircle size={16} /> Complete
                                    </button>
                                    <button className="trip-btn trip-btn-cancel" onClick={() => handleStatusUpdate(trip._id, 'cancelled')}>
                                        <XCircle size={16} /> Cancel
                                    </button>
                                </>
                            )}

                            {trip.status === 'completed' && (
                                <button className="trip-btn trip-btn-blog" onClick={() => openBlogModal(trip)}>
                                    {trip.blog?.title ? (
                                        <><Edit3 size={16} /> Edit Blog</>
                                    ) : (
                                        <><PenTool size={16} /> Write Blog</>
                                    )}
                                </button>
                            )}

                            {trip.status === 'cancelled' && (
                                <button className="trip-btn trip-btn-disabled" disabled>
                                    Trip Cancelled
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {blogModalOpen && (
                <div className="trip-modal-overlay">
                    <div className="trip-blog-modal">
                        <h3>{selectedTrip?.blog?.title ? 'Update Your Experience' : 'Share your Experience'}</h3>
                        <form onSubmit={handleBlogSubmit}>
                            <div className="trip-form-group">
                                <label>Blog Title</label>
                                <input
                                    className="trip-input"
                                    value={blogData.title}
                                    onChange={(e) => setBlogData({ ...blogData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="trip-form-group">
                                <label>Your Story</label>
                                <textarea
                                    className="trip-textarea"
                                    value={blogData.content}
                                    onChange={(e) => setBlogData({ ...blogData, content: e.target.value })}
                                    placeholder="Tell the world about your adventure..."
                                    required
                                />
                            </div>
                            <div className="trip-modal-actions">
                                <button type="button" className="trip-btn-cancel-modal" onClick={() => setBlogModalOpen(false)}>Close</button>
                                <button type="submit" className="trip-btn-primary" disabled={savingBlog}>
                                    {savingBlog ? 'Publishing...' : 'Publish Blog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTrips;