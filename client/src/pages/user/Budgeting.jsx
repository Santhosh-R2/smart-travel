import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { PieChart, TrendingUp, DollarSign, Plus, Lock, AlertCircle, Calendar } from 'lucide-react';
import '../../styles/Budgeting.css';

const Budgeting = () => {
    const [trips, setTrips] = useState([]);
    const [selectedTripId, setSelectedTripId] = useState('');
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Food'
    });

    const categories = ['Food', 'Transport', 'Accommodation', 'Fuel', 'Tickets', 'Miscellaneous'];

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/trips', config);
                
                if (res.data.success) {
                    setTrips(res.data.data);
                    if (res.data.data.length > 0) {
                        setSelectedTripId(res.data.data[0]._id);
                    } else {
                        setLoading(false);
                    }
                }
            } catch (err) {
                toast.error("Failed to load your trips.");
                setLoading(false);
            }
        };
        fetchTrips();
    }, []);

    useEffect(() => {
        if (!selectedTripId) return;
        
        const fetchTripDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('userToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`http://localhost:5000/api/trips/${selectedTripId}`, config);
                setTrip(res.data.data);
            } catch (err) {
                console.error(err);
                toast.error("Could not load trip details.");
            } finally {
                setLoading(false);
            }
        };
        fetchTripDetails();
    }, [selectedTripId]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        
        if (trip.status !== 'planning') {
            toast.error("Expenses cannot be added to completed or cancelled trips.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.post(`http://localhost:5000/api/trips/${selectedTripId}/expenses`, newExpense, config);
            
            toast.success("Expense recorded successfully!");
            
            const res = await axios.get(`http://localhost:5000/api/trips/${selectedTripId}`, config);
            setTrip(res.data.data);
            
            setNewExpense({ description: '', amount: '', category: 'Food' });
        } catch (err) {
            toast.error("Failed to add expense.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !trip) return <div className="budget-loading">Loading Financial Data...</div>;

    const totalEstimated = trip ? trip.budget.totalCost : 0;
    const totalActual = trip ? trip.budget.expenses.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    const difference = totalEstimated - totalActual;
    const isUnderBudget = difference >= 0;
    
    const isEditable = trip && trip.status === 'planning';

    return (
        <div className="budget-wrapper">
            <ToastContainer position="top-right" theme="colored" />
            
            <div className="budget-header-section">
                <div className="budget-title-block">
                    <h2><DollarSign className="budget-icon-title" /> Budget Manager</h2>
                    <p>Track expenses and compare against AI estimates.</p>
                </div>
                
                <div className="budget-controls">
                    <select
                        className="budget-dropdown"
                        value={selectedTripId}
                        onChange={(e) => setSelectedTripId(e.target.value)}
                    >
                        {trips.map(t => (
                            <option key={t._id} value={t._id}>{t.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {trip ? (
                <>
                    <div className={`budget-status-banner ${trip.status}`}>
                        <div className="budget-status-content">
                            {trip.status === 'planning' ? (
                                <><Calendar size={18} /> Status: <strong>Active Planning</strong></>
                            ) : (
                                <><Lock size={18} /> Status: <strong>{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</strong> (Read Only)</>
                            )}
                        </div>
                        <span className="budget-date-badge">
                            {new Date(trip.startDate).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="budget-metrics-grid">
                        <div className="budget-metric-card">
                            <span className="budget-metric-label">AI Estimated Budget</span>
                            <div className="budget-metric-value text-blue">
                                {trip.budget.currency} {totalEstimated.toLocaleString()}
                            </div>
                        </div>
                        <div className="budget-metric-card">
                            <span className="budget-metric-label">Actual Spend</span>
                            <div className="budget-metric-value text-dark">
                                {trip.budget.currency} {totalActual.toLocaleString()}
                            </div>
                        </div>
                        <div className="budget-metric-card">
                            <span className="budget-metric-label">Remaining Balance</span>
                            <div className={`budget-metric-value ${isUnderBudget ? 'text-green' : 'text-red'}`}>
                                {isUnderBudget ? '+' : ''}{difference.toLocaleString()}
                            </div>
                            <div className={`budget-badge ${isUnderBudget ? 'bg-green' : 'bg-red'}`}>
                                {isUnderBudget ? 'Under Budget' : 'Overrun Warning'}
                            </div>
                        </div>
                    </div>

                    <div className="budget-dashboard-layout">
                        
                        <div className="budget-history-panel">
                            <div className="budget-panel-header">
                                <h3>Expense History</h3>
                                <span className="budget-count">{trip.budget.expenses.length} Records</span>
                            </div>
                            
                            <div className="budget-scroll-area">
                                {trip.budget.expenses.length === 0 ? (
                                    <div className="budget-empty-state">
                                        <TrendingUp size={40} />
                                        <p>No expenses recorded yet.</p>
                                    </div>
                                ) : (
                                    trip.budget.expenses.map((exp, i) => (
                                        <div key={i} className="budget-expense-row">
                                            <div className="budget-row-icon">
                                                {exp.category.charAt(0)}
                                            </div>
                                            <div className="budget-row-info">
                                                <h4>{exp.description || exp.category}</h4>
                                                <span>{new Date(exp.date).toLocaleDateString()} • {exp.category}</span>
                                            </div>
                                            <div className="budget-row-amount">
                                                {trip.budget.currency} {exp.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="budget-form-panel">
                            <div className="budget-panel-header">
                                <h3>{isEditable ? 'Add New Expense' : 'Budget Locked'}</h3>
                            </div>

                            {isEditable ? (
                                <form className="budget-add-form" onSubmit={handleAddExpense}>
                                    <div className="budget-form-group">
                                        <label>Category</label>
                                        <div className="budget-category-grid">
                                            {categories.map(cat => (
                                                <button
                                                    type="button"
                                                    key={cat}
                                                    className={`budget-cat-btn ${newExpense.category === cat ? 'active' : ''}`}
                                                    onClick={() => setNewExpense({ ...newExpense, category: cat })}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="budget-form-group">
                                        <label>Amount ({trip.budget.currency})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0.00"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                            required
                                        />
                                    </div>

                                    <div className="budget-form-group">
                                        <label>Description (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Lunch at Cafe"
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="budget-submit-btn" disabled={submitting}>
                                        {submitting ? 'Adding...' : <><Plus size={18} /> Record Expense</>}
                                    </button>
                                </form>
                            ) : (
                                <div className="budget-locked-state">
                                    <AlertCircle size={48} className="budget-lock-icon" />
                                    <h4>Trip {trip.status === 'completed' ? 'Completed' : 'Cancelled'}</h4>
                                    <p>This budget has been finalized. You cannot add new expenses to closed trips.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="budget-loading">No trips found. Start planning!</div>
            )}
        </div>
    );
};

export default Budgeting;