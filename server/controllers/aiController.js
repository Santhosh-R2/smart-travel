const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');
const aiService = require('../services/aiService');

exports.getTouristPlaces = async (req, res, next) => {
    try {
        const { city } = req.body;

        if (!city) {
            return next(new ErrorResponse('Please provide a city name', 400));
        }

        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
        const geoRes = await axios.get(geoUrl, {
            headers: { 'User-Agent': 'SmartTravelApp/1.0' } 
        });

        if (!geoRes.data || geoRes.data.length === 0) {
            return next(new ErrorResponse('City not found', 404));
        }

        const { lat, lon } = geoRes.data[0];
        const wikiUrl = 'https://en.wikipedia.org/w/api.php';
        const wikiParams = {
            action: 'query',
            generator: 'geosearch',
            ggscoord: `${lat}|${lon}`,
            ggsradius: '10000', 
            ggslimit: '20',
            prop: 'pageimages|coordinates|extracts',
            piprop: 'thumbnail',
            pithumbsize: '600',
            exintro: 1,
            explaintext: 1,
            exsentences: 3,
            format: 'json',
            origin: '*'
        };

        const wikiRes = await axios.get(wikiUrl, {
            params: wikiParams,
            headers: { 'User-Agent': 'SmartTravelApp/1.0 (contact@example.com)' }
        });
        const pages = wikiRes.data?.query?.pages || {};
        const places = Object.values(pages).map(place => ({
            id: place.pageid,
            name: place.title,
            lat: place.coordinates ? place.coordinates[0].lat : null,
            lng: place.coordinates ? place.coordinates[0].lon : null,
            category: 'Tourist Attraction',
            description: place.extract || 'No description available.',
            image: place.thumbnail ? place.thumbnail.source : null,
            address: 'Location details available on map' 
        })).filter(p => p.lat && p.lng);

        res.status(200).json({
            success: true,
            data: {
                center: { lat: parseFloat(lat), lng: parseFloat(lon) },
                places
            }
        });

    } catch (error) {
        console.error("AI Planner Error:", error.message);
        next(new ErrorResponse('Failed to fetch travel data', 500));
    }
};

exports.fetchDetails = async (req, res, next) => {
    try {
        const { xid } = req.params; 

        const wikiUrl = 'https://en.wikipedia.org/w/api.php';
        const params = {
            action: 'query',
            prop: 'pageimages',
            pageids: xid,
            pithumbsize: '1000',
            format: 'json',
            origin: '*'
        };

        const response = await axios.get(wikiUrl, {
            params,
            headers: { 'User-Agent': 'SmartTravelApp/1.0 (contact@example.com)' }
        });
        const pages = response.data?.query?.pages || {};
        const page = pages[xid];

        const photoUrl = page?.thumbnail?.source || null;

        res.status(200).json({
            success: true,
            data: photoUrl
        });
    } catch (error) {
        next(error);
    }
};

exports.estimateTripCost = async (req, res, next) => {
    try {
        const { startLocation, destination, mode, passengers, date, distance } = req.body;

        if (!startLocation || !destination || !mode) {
            return next(new ErrorResponse('Please provide all trip details', 400));
        }

        const estimate = await aiService.calculateTravelBudget({
            startLocation,
            destination,
            mode,
            passengers,
            date,
            distance,
            preferences: req.body.preferences 
        });

        res.status(200).json({
            success: true,
            data: estimate
        });

    } catch (error) {
        console.error("Controller Error:", error.message);
        next(new ErrorResponse('AI Budget calculation failed', 500));
    }
};
