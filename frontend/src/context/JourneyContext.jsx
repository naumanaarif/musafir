import { createContext, useContext, useState } from 'react';

const JourneyContext = createContext(null);

export function JourneyProvider({ children }) {
  const [origin, setOrigin] = useState(null);       // { name, lat, lng }
  const [destination, setDestination] = useState(null); // { name, lat, lng }
  const [directionsResult, setDirectionsResult] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  return (
    <JourneyContext.Provider value={{
      origin, setOrigin,
      destination, setDestination,
      directionsResult, setDirectionsResult,
      geminiSummary, setGeminiSummary,
      activeStep, setActiveStep,
    }}>
      {children}
    </JourneyContext.Provider>
  );
}

export const useJourney = () => useContext(JourneyContext);
