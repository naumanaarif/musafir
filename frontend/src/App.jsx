import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import JourneyResults from './pages/JourneyResults';
import ActiveJourney from './pages/ActiveJourney';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<JourneyResults />} />
        <Route path="/journey" element={<ActiveJourney />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
