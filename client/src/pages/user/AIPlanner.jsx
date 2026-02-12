import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Search, MapPin, Camera, X, Compass, Navigation, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; // Routing CSS
import '../../styles/AIPlanner.css';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet-routing-machine'; // Import Routing Machine

// Fix for Leaflet Default Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Icon for Tourist Places
const PlaceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom User Location Icon
const UserIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


// Component to handle Routing
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
                setDistanceKm(km > 0 ? km : 0.1); // Ensure it's not 0 for display
            }
        }).on('routingerror', function (e) {
            console.error('Routing error:', e.error);
            // Fallback for distance if routing fails
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

// Component to recenter map
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
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India Center
    const [activePlace, setActivePlace] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const searchBoxRef = useRef(null);

    // Fetch location suggestions from Nominatim
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

    // Debounced input handler
    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    // Select suggestion
    const handleSelectSuggestion = (suggestion) => {
        const cityName = suggestion.name.split(',')[0].trim();
        setQuery(cityName);
        setSuggestions([]);
        setShowSuggestions(false);
        // Auto-trigger search
        handleSearchWithCity(cityName);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Trip Details State
    const [tripDetails, setTripDetails] = useState({
        mode: 'Car',
        passengers: 1,
        date: new Date().toISOString().split('T')[0]
    });

    const [distanceKm, setDistanceKm] = useState(null);
    const [estimatedTime, setEstimatedTime] = useState(null);

    // Preferences State
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

    // Dynamic ETA Calculation (Local)
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
                distance: distanceKm || 50 // Fallback if still null
            };

            const res = await axios.post('http://localhost:5000/api/ai/estimate-cost', payload, config);
            if (res.data.success) {
                setCostEstimate(res.data.data);
                // Backend returns accurate ETA
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

            // Construct Trip Object matching the Model
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
            toast.success("Trip saved to your dashboard!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save trip.");
        }
    };

    // Search with a specific city name (used by autocomplete)
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
        setCostEstimate(null); // Reset estimate
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

    const handlePlaceClick = async (place) => {
        setActivePlace(place);
        setCostEstimate(null); // Reset previous estimate

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
            {/* Sidebar */}
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

                        {/* Autocomplete Suggestions Dropdown */}
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

            {/* Map Area */}
            <div className="map-view">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap center={mapCenter} />

                    {/* Routing Control */}
                    {userLocation && activePlace && (
                        <RoutingControl
                            userLocation={userLocation}
                            destination={activePlace}
                            setDistanceKm={setDistanceKm}
                            setEstimatedTime={setEstimatedTime}
                        />
                    )}

                    {/* User Location Marker */}
                    {userLocation && (
                        <Marker position={userLocation} icon={UserIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}

                    {/* All Place Markers */}
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

                {/* Floating Detail Panel */}
                {activePlace && (
                    <div className="place-detail-modal">
                        {/* Image Header */}
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

                            {/* Plan Trip Section - Visible after location found */}
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
                                                value={tripDetails.passengers}
                                                onChange={(e) => setTripDetails({ ...tripDetails, passengers: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input
                                                type="date"
                                                value={tripDetails.date}
                                                onChange={(e) => setTripDetails({ ...tripDetails, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Preferences: Relocated here */}
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

                                    {/* Distance & ETA Info */}
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
                                        disabled={calculatingCost}
                                    >
                                        {calculatingCost ? 'Calculating...' : 'Estimate Cost & Plan'}
                                    </button>

                                    {/* Cost Estimate Result */}
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPlanner;
