import api from './api';

const generateItinerary = (preferences) => {
    return api.post('/ai/generate', preferences);
};

const aiService = {
    generateItinerary,
};

export default aiService;
