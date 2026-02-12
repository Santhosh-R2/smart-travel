import api from './api';

const getTrips = () => {
    return api.get('/trips');
};

const createTrip = (tripData) => {
    return api.post('/trips', tripData);
};

const tripService = {
    getTrips,
    createTrip,
};

export default tripService;
