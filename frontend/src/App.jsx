import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { JourneyProvider } from './context/JourneyContext';
import Home from './pages/Home';
import JourneyResults from './pages/JourneyResults';
import ActiveJourney from './pages/ActiveJourney';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function App() {
  return (
    <APIProvider apiKey={MAPS_KEY} libraries={['places', 'routes', 'geometry']}>
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<JourneyResults />} />
            <Route path="/journey" element={<ActiveJourney />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </JourneyProvider>
    </APIProvider>
  );
}
