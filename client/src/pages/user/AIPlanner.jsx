import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Search, MapPin, Camera, X, Compass, Navigation, Locate, Star, MessageSquare, Send, BookOpen } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; 
import '../../styles/AIPlanner.css';
import '../../styles/PostSection.css';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet-routing-machine'; 

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const PlaceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const UserIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


const RoutingControl = ({ userLocation, destination, setDistanceKm, setEstimatedTime }) => {
    const map = useMap();

    useEffect(() => {
        if (!userLocation || !destination) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation[0], userLocation[1]),
                L.latLng(destination.lat, destination.lng)
            ],
            routeWhileDragging: false,
            lineOptions: {
                styles: [{ color: '#6366f1', weight: 4 }]
            },
            createMarker: () => null,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
        }).on('routesfound', function (e) {
            const routes = e.routes;
            if (routes && routes[0] && routes[0].summary) {
                const summary = routes[0].summary;
                const km = (summary.totalDistance || 0) / 1000;
                setDistanceKm(km > 0 ? km : 0.1); 
            }
        }).on('routingerror', function (e) {
            console.error('Routing error:', e.error);
            setDistanceKm(50);
        }).addTo(map);

        return () => {
            try {
                map.removeControl(routingControl);
            } catch (err) {
                console.error("Leaflet cleanup error:", err);
            }
        };
    }, [map, userLocation, destination, setDistanceKm, setEstimatedTime]);

    return null;
};

const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13, { duration: 2 });
        }
    }, [center, map]);
    return null;
};

const AIPlanner = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); 
    const [activePlace, setActivePlace] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const searchBoxRef = useRef(null);

    const fetchSuggestions = useCallback(async (text) => {
        if (text.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=6&addressdetails=1&accept-language=en&countrycodes=in`
            );
            const data = await res.json();
            const mapped = data.map(item => ({
                name: item.display_name.split(',').slice(0, 3).join(','),
                fullName: item.display_name,
                type: item.type,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            }));
            setSuggestions(mapped);
            setShowSuggestions(true);
        } catch (err) {
            console.error('Autocomplete error:', err);
        }
    }, []);

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const handleSelectSuggestion = (suggestion) => {
        const cityName = suggestion.name.split(',')[0].trim();
        setQuery(cityName);
        setSuggestions([]);
        setShowSuggestions(false);
        handleSearchWithCity(cityName);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [tripDetails, setTripDetails] = useState({
        mode: 'Car',
        passengers: 1,
        date: new Date().toISOString().split('T')[0]
    });

    const [distanceKm, setDistanceKm] = useState(null);
    const [estimatedTime, setEstimatedTime] = useState(null);

    const [preferences, setPreferences] = useState({
        accommodation: true,
        meals: {
            breakfast: true,
            lunch: true,
            dinner: true
        }
    });

    const [costEstimate, setCostEstimate] = useState(null);
    const [calculatingCost, setCalculatingCost] = useState(false);

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postRating, setPostRating] = useState(5);
    const [submittingPost, setSubmittingPost] = useState(false);

    const [blogs, setBlogs] = useState([]);
    const [loadingBlogs, setLoadingBlogs] = useState(false);

    useEffect(() => {
        if (!distanceKm) return;

        const avgSpeeds = {
            'Car': 40,
            'Bike': 45,
            'Train': 60,
            'Bus': 42,
            'Public Transport': 25
        };

        const speed = avgSpeeds[tripDetails.mode] || 40;
        const timeHours = distanceKm / speed;
        const timeSeconds = Math.round(timeHours * 3600);
        setEstimatedTime(timeSeconds);
    }, [distanceKm, tripDetails.mode]);




    const handleEstimateCost = async () => {
        if (!userLocation) {
            toast.error("Please get directions first to determine start location.");
            return;
        }

        setCalculatingCost(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                startLocation: `${userLocation[0]},${userLocation[1]}`,
                destination: activePlace.name,
                mode: tripDetails.mode,
                passengers: tripDetails.passengers,
                date: tripDetails.date,
                preferences: preferences,
                distance: distanceKm || 50 
            };

            const res = await axios.post('http://localhost:5000/api/ai/estimate-cost', payload, config);
            if (res.data.success) {
                setCostEstimate(res.data.data);
                if (res.data.data.estimatedTimeSeconds) {
                    setEstimatedTime(res.data.data.estimatedTimeSeconds);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to calculate estimate.");
        } finally {
            setCalculatingCost(false);
        }
    };

    const handleSaveTrip = async () => {
        if (!costEstimate || !activePlace) return;

        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const tripData = {
                title: `Trip to ${activePlace.name}`,
                destination: {
                    city: activePlace.name,
                    country: 'India',
                    image: activePlace.image
                },
                startDate: tripDetails.date,
                endDate: tripDetails.date,
                transportMode: tripDetails.mode,
                passengerCount: tripDetails.passengers,
                isHoliday: costEstimate.isHoliday,
                distance: distanceKm,
                preferences: preferences,
                budget: {
                    totalCost: costEstimate.totalCost,
                    currency: costEstimate.currency,
                    breakdown: costEstimate.breakdown,
                    tips: costEstimate.tips
                },
                itinerary: []
            };

            await axios.post('http://localhost:5000/api/trips', tripData, config);
            toast.success("✨ Trip Confirmed! Experience Saved to Dashboard.");

            setActivePlace(null);
            setCostEstimate(null);
            setDistanceKm(null);
            setEstimatedTime(null);
            setUserLocation(null);
            setTripDetails({
                mode: 'Car',
                passengers: 1,
                date: new Date().toISOString().split('T')[0]
            });
            setPreferences({
                accommodation: true,
                meals: { breakfast: true, lunch: true, dinner: true }
            });
            setPosts([]);
            setBlogs([]);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save trip.");
        }
    };

    const handleSearchWithCity = async (cityName) => {
        if (!cityName.trim()) return;

        setLoading(true);
        setActivePlace(null);
        setUserLocation(null);
        setCostEstimate(null);
        setDistanceKm(null);
        setEstimatedTime(null);
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const res = await axios.post('http://localhost:5000/api/ai/generate', { city: cityName }, config);

            if (res.data.success) {
                setResults(res.data.data.places);
                setMapCenter([res.data.data.center.lat, res.data.data.center.lng]);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to fetch places.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setActivePlace(null);
        setUserLocation(null);
        setCostEstimate(null); 
        try {
            const token = localStorage.getItem('userToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const res = await axios.post('http://localhost:5000/api/ai/generate', { city: query }, config);

            if (res.data.success) {
                setResults(res.data.data.places);
                setMapCenter([res.data.data.center.lat, res.data.data.center.lng]);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to fetch places.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async (placeId) => {
        setLoadingPosts(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/posts/place/${placeId}`);
            if (res.data.success) {
                setPosts(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchBlogs = async (cityName) => {
        setLoadingBlogs(true);
        try {
            const city = cityName.split(',')[0].trim();
            const res = await axios.get(`http://localhost:5000/api/trips/city/${city}`);
            if (res.data.success) {
                setBlogs(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching blogs:", err);
        } finally {
            setLoadingBlogs(false);
        }
    };

    const handlePlaceClick = async (place) => {
        setActivePlace(place);
        setCostEstimate(null); 
        setPosts([]); 
        setBlogs([]);
        fetchPosts(place.id); 
        fetchBlogs(place.name); 

        if (!place.image) {
            try {
                const res = await axios.get(`http://localhost:5000/api/ai/photos/${place.id}`);
                if (res.data.data) {
                    setActivePlace(prev => ({ ...prev, image: res.data.data }));
                }
            } catch (err) {
                console.log("No extra photo found");
            }
        }
        setMapCenter([place.lat, place.lng]);
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!postContent.trim()) return;

        setSubmittingPost(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                placeId: activePlace.id,
                placeName: activePlace.name,
                content: postContent,
                rating: postRating
            };

            const res = await axios.post('http://localhost:5000/api/posts', payload, config);
            if (res.data.success) {
                toast.success("Experience shared!");
                setPostContent('');
                setPostRating(5);
                fetchPosts(activePlace.id); 
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to share experience.");
        } finally {
            setSubmittingPost(false);
        }
    };

    const handleGetDirections = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
                setGettingLocation(false);
                toast.success("Location found! Calculating route...");
            },
            (error) => {
                console.error(error);
                toast.error("Unable to retrieve your location");
                setGettingLocation(false);
            }
        );
    };


    return (
        <div className="planner-container">
            <aside className="planner-sidebar">
                <div className="planner-header">
                    <div className="brand-badge"><Compass size={14} /> AI Travel Engine</div>
                    <h2>Explore the World</h2>
                    <form className="search-box" onSubmit={handleSearch} ref={searchBoxRef} style={{ position: 'relative' }}>
                        <Search className="search-icon" size={20} />
                        <input
                            className="search-input"
                            placeholder="Where do you want to go?"
                            value={query}
                            onChange={handleQueryChange}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        />

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="autocomplete-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                borderRadius: '0 0 12px 12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                zIndex: 100,
                                maxHeight: '250px',
                                overflowY: 'auto',
                                border: '1px solid #e2e8f0',
                                borderTop: 'none'
                            }}>
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectSuggestion(s)}
                                        style={{
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <MapPin size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.name.split(',')[0]}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
                </div>

                <div className="results-container">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Finding best places...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="empty-state">
                            <MapPin size={48} opacity={0.3} />
                            <p>Enter a city to discover amazing places.</p>
                        </div>
                    ) : (
                        results.map(place => (
                            <div
                                key={place.id}
                                className={`place-card ${activePlace?.id === place.id ? 'active' : ''}`}
                                onClick={() => handlePlaceClick(place)}
                            >
                                {place.image ? (
                                    <img src={place.image} alt={place.name} className="place-thumbnail" />
                                ) : (
                                    <div className="place-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={24} color="#ccc" />
                                    </div>
                                )}
                                <div className="place-info">
                                    <span className="place-category">{place.category}</span>
                                    <h4 className="place-name">{place.name}</h4>
                                    <p className="place-desc-short">{place.description}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            <div className="map-view">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap center={mapCenter} />

                    {userLocation && activePlace && (
                        <RoutingControl
                            userLocation={userLocation}
                            destination={activePlace}
                            setDistanceKm={setDistanceKm}
                            setEstimatedTime={setEstimatedTime}
                        />
                    )}

                    {userLocation && (
                        <Marker position={userLocation} icon={UserIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}

                    {results.map(place => (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lng]}
                            icon={PlaceIcon}
                            eventHandlers={{
                                click: () => handlePlaceClick(place),
                            }}
                        >
                            <Popup>{place.name}</Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {activePlace && (
                    <div className="place-detail-modal">
                        <div className="detail-image-container">
                            {activePlace.image ? (
                                <img src={activePlace.image} alt={activePlace.name} className="detail-image" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Camera size={48} color="#cbd5e1" />
                                </div>
                            )}
                            <button className="close-btn" onClick={() => setActivePlace(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="detail-content">
                            <h3 className="detail-title">{activePlace.name}</h3>
                            <p className="detail-desc">{activePlace.description}</p>

                            <div className="action-row">
                                <button
                                    className="action-btn"
                                    onClick={handleGetDirections}
                                    disabled={gettingLocation}
                                    style={{ flex: 1 }}
                                >
                                    {gettingLocation ? 'Locating...' : <><Locate size={16} /> Get Directions</>}
                                </button>
                            </div>

                            {userLocation && (
                                <div className="trip-planner-section">
                                    <h4>Plan Your Journey</h4>
                                    <div className="form-group">
                                        <label>Transport Mode</label>
                                        <select
                                            value={tripDetails.mode}
                                            onChange={(e) => setTripDetails({ ...tripDetails, mode: e.target.value })}
                                        >
                                            <option value="Car">Car</option>
                                            <option value="Bike">Bike</option>
                                            <option value="Train">Train</option>
                                            <option value="Bus">Tourist Bus</option>
                                            <option value="Public Transport">Public Transport</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Passengers</label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Count"
                                                value={tripDetails.passengers || ''}
                                                onChange={(e) => setTripDetails({ ...tripDetails, passengers: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={tripDetails.date}
                                                onChange={(e) => setTripDetails({ ...tripDetails, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Preferences</label>
                                        <div className="pref-checkbox-group">
                                            <div className="pref-item">
                                                <input
                                                    type="checkbox"
                                                    id="pref-acc"
                                                    checked={preferences.accommodation}
                                                    onChange={(e) => setPreferences({ ...preferences, accommodation: e.target.checked })}
                                                />
                                                <label htmlFor="pref-acc">Include Accommodation</label>
                                            </div>

                                            <label className="sub-label">Meals</label>
                                            <div className="meals-options">
                                                <div className="pref-item">
                                                    <input
                                                        type="checkbox" id="meal-bf"
                                                        checked={preferences.meals.breakfast}
                                                        onChange={(e) => setPreferences({
                                                            ...preferences,
                                                            meals: { ...preferences.meals, breakfast: e.target.checked }
                                                        })}
                                                    />
                                                    <label htmlFor="meal-bf">Breakfast</label>
                                                </div>
                                                <div className="pref-item">
                                                    <input
                                                        type="checkbox" id="meal-ln"
                                                        checked={preferences.meals.lunch}
                                                        onChange={(e) => setPreferences({
                                                            ...preferences,
                                                            meals: { ...preferences.meals, lunch: e.target.checked }
                                                        })}
                                                    />
                                                    <label htmlFor="meal-ln">Lunch</label>
                                                </div>
                                                <div className="pref-item">
                                                    <input
                                                        type="checkbox" id="meal-dn"
                                                        checked={preferences.meals.dinner}
                                                        onChange={(e) => setPreferences({
                                                            ...preferences,
                                                            meals: { ...preferences.meals, dinner: e.target.checked }
                                                        })}
                                                    />
                                                    <label htmlFor="meal-dn">Dinner</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="distance-info-box" style={{
                                        background: 'linear-gradient(135deg, #e0e7ff, #f0f4ff)',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid #c7d2fe'
                                    }}>
                                        <div>
                                            <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>📍 Distance</span>
                                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>
                                                {distanceKm ? `${distanceKm.toFixed(1)} km` : 'Calculating...'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>⏱️ Est. Time</span>
                                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>
                                                {estimatedTime ? (
                                                    <>
                                                        {Math.floor(estimatedTime / 3600) > 0 && `${Math.floor(estimatedTime / 3600)}h `}
                                                        {Math.floor((estimatedTime % 3600) / 60)}m
                                                    </>
                                                ) : '...'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        className="estimate-btn"
                                        onClick={handleEstimateCost}
                                        disabled={calculatingCost || !tripDetails.passengers}
                                    >
                                        {calculatingCost ? 'Calculating...' : 'Estimate Cost & Plan'}
                                    </button>

                                    {costEstimate && (
                                        <div className="cost-result">
                                            <div className="total-cost">
                                                <span>Total Estimated Budget</span>
                                                <strong>{costEstimate.currency} {costEstimate.totalCost.toLocaleString('en-IN')}</strong>
                                            </div>

                                            {costEstimate.isHoliday && (
                                                <div className="holiday-badge">
                                                    📅 Holiday/Peak: {costEstimate.holidayName || 'Weekend Surcharge'}
                                                </div>
                                            )}

                                            <div className="breakdown">
                                                <h4>Cost Breakdown</h4>
                                                <div className="breakdown-item">
                                                    <span>🚗 Transport <small>({tripDetails.mode === 'Car' || tripDetails.mode === 'Bike' ? `Fuel for ${distanceKm ? distanceKm.toFixed(0) : '—'} km` : `Tickets for ${distanceKm ? distanceKm.toFixed(0) : '—'} km`})</small></span>
                                                    <span>{costEstimate.currency} {costEstimate.breakdown.transport.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="breakdown-item">
                                                    <span>🍔 Food <small>({[preferences.meals.breakfast, preferences.meals.lunch, preferences.meals.dinner].filter(Boolean).length} meals × {tripDetails.passengers} pax)</small></span>
                                                    <span>{costEstimate.currency} {costEstimate.breakdown.food.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="breakdown-item">
                                                    <span>🏨 Accommodation</span>
                                                    <span>{costEstimate.currency} {costEstimate.breakdown.accommodation.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="breakdown-item">
                                                    <span>🅿️ Miscellaneous <small>(Tolls/Entry)</small></span>
                                                    <span>{costEstimate.currency} {costEstimate.breakdown.miscellaneous.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            {costEstimate.tips && (
                                                <div className="travel-tips">
                                                    <h4>💡 AI Travel Tips</h4>
                                                    <p>{costEstimate.tips}</p>
                                                </div>
                                            )}


                                            <button className="save-trip-btn" onClick={handleSaveTrip}>
                                                Save to Dashboard
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="posts-section">
                                <h4><MessageSquare size={18} color="#6366f1" /> Community Experiences</h4>

                                <form className="post-form" onSubmit={handlePostSubmit}>
                                    <textarea
                                        placeholder="Share your experience at this place..."
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        rows="3"
                                        required
                                    />
                                    <div className="post-form-footer">
                                        <div className="rating-input">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={`star-btn ${postRating >= star ? 'active' : ''}`}
                                                    onClick={() => setPostRating(star)}
                                                >
                                                    <Star size={16} fill={postRating >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="submit"
                                            className="submit-post-btn"
                                            disabled={submittingPost || !postContent.trim()}
                                        >
                                            {submittingPost ? 'Posting...' : <><Send size={14} /> Post</>}
                                        </button>
                                    </div>
                                </form>

                                {loadingPosts ? (
                                    <p className="no-posts">Loading experiences...</p>
                                ) : (
                                    <>
                                        {posts.length > 0 && (
                                            <div className="posts-list">
                                                {posts.map((post) => (
                                                    <div key={post._id} className="post-card">
                                                        <div className="post-header">
                                                            <img
                                                                src={post.user?.profileImage || 'https://via.placeholder.com/40'}
                                                                alt={post.user?.name}
                                                                className="user-avatar"
                                                            />
                                                            <div className="user-info-post">
                                                                <h5>{post.user?.name || 'Anonymous'}</h5>
                                                                <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="post-rating">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={12}
                                                                    color={i < post.rating ? "#f59e0b" : "#cbd5e1"}
                                                                    fill={i < post.rating ? "#f59e0b" : "none"}
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="post-content">{post.content}</p>
                                                        {post.image && <img src={post.image} alt="Experience" className="post-image" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!loadingPosts && posts.length === 0 && (
                                            <div className="no-posts">
                                                <p>No experiences shared yet. Be the first!</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="blogs-section">
                                <h4><BookOpen size={18} color="#6366f1" /> Travel Stories & Blogs</h4>
                                <div className="blogs-list">
                                    {loadingBlogs ? (
                                        <p className="no-posts">Loading stories...</p>
                                    ) : blogs.length === 0 ? (
                                        <div className="no-posts">
                                            <p>No blog stories found for this city yet.</p>
                                        </div>
                                    ) : (
                                        blogs.map((blog) => (
                                            <div key={blog._id} className="blog-card">
                                                {blog.blog.photos?.[0] && (
                                                    <img src={blog.blog.photos[0]} alt={blog.blog.title} className="blog-thumbnail" />
                                                )}
                                                <div className="blog-card-content">
                                                    <h5 className="blog-card-title">{blog.blog.title}</h5>
                                                    <div className="blog-meta">
                                                        <img
                                                            src={blog.owner?.profileImage || 'https://via.placeholder.com/40'}
                                                            alt={blog.owner?.name}
                                                            className="user-avatar-small"
                                                        />
                                                        <span>By {blog.owner?.name}</span>
                                                        <span className="dot">•</span>
                                                        <span>{new Date(blog.blog.publishedDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="blog-snippet">
                                                        {blog.blog.content.substring(0, 100)}...
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPlanner;
