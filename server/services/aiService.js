// AI Service (Python Integration)
const axios = require('axios');
require('dotenv').config();

const FSQ_API_KEY = process.env.FOURSQUARE_API_KEY;
const BASE_URL = 'https://api.foursquare.com/v3/places';

/**
 * Find tourist attractions near a specific city
 */
exports.getTouristPlaces = async (city) => {
    const options = {
        method: 'GET',
        url: `${BASE_URL}/search`,
        params: {
            near: city,
            categories: '16000', 
            limit: '15',
            fields: 'fsq_id,name,geocodes,location,categories'
        },
        headers: {
            accept: 'application/json',
            Authorization: FSQ_API_KEY
        }
    };

    const response = await axios.request(options);

    return {
        center: {
            lat: response.data.results[0]?.geocodes.main.latitude || 0,
            lng: response.data.results[0]?.geocodes.main.longitude || 0
        },
        places: response.data.results.map(place => ({
            id: place.fsq_id,
            name: place.name,
            lat: place.geocodes.main.latitude,
            lng: place.geocodes.main.longitude,
            category: place.categories[0]?.name || 'Attraction',
            address: place.location.formatted_address
        }))
    };
};


exports.getPlacePhotos = async (fsq_id) => {
    const options = {
        method: 'GET',
        url: `${BASE_URL}/${fsq_id}/photos`,
        params: { limit: '1', sort: 'POPULAR' },
        headers: { Authorization: FSQ_API_KEY }
    };

    const response = await axios.request(options);

    const photo = response.data[0];
    return photo ? `${photo.prefix}original${photo.suffix}` : null;
};


const { spawn } = require('child_process');
const path = require('path');

exports.calculateTravelBudget = (details) => {
    return new Promise((resolve, reject) => {
        const { startLocation, destination, mode, passengers, date, preferences, distance } = details;

        const includeAcc = preferences?.accommodation ? 'true' : 'false';
        const meals = preferences?.meals || { breakfast: true, lunch: true, dinner: true };
        const mealsMask = `${meals.breakfast ? 1 : 0},${meals.lunch ? 1 : 0},${meals.dinner ? 1 : 0}`;
        const actualDistance = distance ? distance.toString() : '0';

        const scriptPath = path.join(__dirname, '../python/travel_bias.py');
        const pythonProcess = spawn('python', [
            scriptPath,
            startLocation,
            destination,
            mode,
            passengers.toString(),
            date,
            includeAcc,
            mealsMask,
            actualDistance
        ]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script error: ${errorString}`);
                reject(new Error('Failed to calculate budget via AI Engine'));
                return;
            }

            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (err) {
                console.error("Failed to parse Python output", err);
                reject(new Error('Invalid response from AI Engine'));
            }
        });
    });
};