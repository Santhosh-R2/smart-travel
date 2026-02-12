import { createContext, useState } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
    const [trips, setTrips] = useState([]);
    const [currentTrip, setCurrentTrip] = useState(null);

    return (
        <TripContext.Provider value={{ trips, setTrips, currentTrip, setCurrentTrip }}>
            {children}
        </TripContext.Provider>
    );
};

export default TripContext;
