import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useJourney } from '../context/JourneyContext';
import { getJourneyGuidance } from '../services/gemini';

// Karachi center
const KARACHI = { lat: 24.8607, lng: 67.0105 };

// ── Inner component: needs to be inside <Map> to use useMap ──────────────────
function DirectionsLayer({ origin, destination, onResult }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    const service = new routesLib.DirectionsService();
    const renderer = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: '#005235', strokeWeight: 5, strokeOpacity: 0.9 },
    });

    // Try TRANSIT first, fall back to DRIVING
    const tryRoute = (travelMode) => {
      service.route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode,
        transitOptions: travelMode === routesLib.TravelMode.TRANSIT
          ? { departureTime: new Date(), routingPreference: 'FEWER_TRANSFERS' }
          : undefined,
      }, (result, status) => {
        if (status === 'OK') {
          renderer.setDirections(result);
          onResult(result, travelMode);
        } else if (travelMode === routesLib.TravelMode.TRANSIT) {
          tryRoute(routesLib.TravelMode.DRIVING);
        } else {
          onResult(null, null);
        }
      });
    };

    tryRoute(routesLib.TravelMode.TRANSIT);
    return () => renderer.setMap(null);
  }, [routesLib, map, origin, destination, onResult]);

  return null;
}

// ── Parse legs from Google Directions result ─────────────────────────────────
function parseLegs(result) {
  if (!result) return [];
  const steps = result.routes[0]?.legs[0]?.steps || [];
  return steps.map(s => ({
    mode: s.travel_mode,
    instructions: s.html_instructions?.replace(/<[^>]*>/g, '') || '',
    distance: s.distance?.text || '',
    duration: s.duration?.text || '',
    transitDetails: s.transit?.line?.short_name || s.transit?.line?.name || null,
    color: s.travel_mode === 'TRANSIT' ? '#005235' : '#6b7280',
  }));
}

function modeIcon(mode) {
  switch (mode) {
    case 'TRANSIT': return 'directions_bus';
    case 'WALKING': return 'directions_walk';
    default: return 'directions_car';
  }
}

export default function JourneyResults() {
  const navigate = useNavigate();
  const { origin, destination, directionsResult, setDirectionsResult, geminiSummary, setGeminiSummary } = useJourney();

  const [legs, setLegs] = useState([]);
  const [travelMode, setTravelMode] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [ragRoutes, setRagRoutes] = useState([]);

  // Redirect if no origin/destination set
  useEffect(() => {
    if (!origin && !destination) {
      navigate('/');
      return;
    }

    // Fetch local routes from Supabase RAG
    if (origin && destination) {
      fetch('http://localhost:8000/api/search-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `route from ${origin.name} to ${destination.name}`,
          origin: origin.name,
          destination: destination.name,
          limit: 1
        })
      })
      .then(r => r.json())
      .then(data => setRagRoutes(data.routes || []))
      .catch(err => console.error('RAG fetch failed:', err));
    }
  }, [origin, destination, navigate]);

  const handleDirectionsResult = useCallback((result, mode) => {
    if (!result) return;
    setDirectionsResult(result);
    setTravelMode(mode);

    const leg = result.routes[0]?.legs[0];
    setDuration(leg?.duration?.text || '');
    setDistance(leg?.distance?.text || '');
    const parsedLegs = parseLegs(result);
    setLegs(parsedLegs);
  }, []);

  // Separate effect for Gemini guidance to avoid re-render loops/flickering
  useEffect(() => {
    if (legs.length > 0 && !geminiSummary && !aiLoading) {
      const fetchGuidance = async () => {
        setAiLoading(true);
        try {
          const summary = await getJourneyGuidance(
            origin?.name || 'Origin',
            destination?.name || 'Destination',
            legs
          );
          setGeminiSummary(summary);
        } catch (err) {
          console.error('AI Guidance failed:', err);
          setGeminiSummary('Transit advice currently unavailable.');
        } finally {
          setAiLoading(false);
        }
      };
      fetchGuidance();
    }
  }, [legs, origin, destination, geminiSummary, aiLoading]);

  const modeIcon = (mode) => {
    if (mode === 'TRANSIT') return 'directions_bus';
    if (mode === 'WALKING') return 'directions_walk';
    return 'directions_car';
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface page-enter">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 h-14 bg-surface border-b border-outline-variant/40 shrink-0 z-50">
        <button onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-primary">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-primary tracking-tight">Journey Results</h1>
        {travelMode === 'DRIVING' && (
          <span className="ml-2 text-[10px] bg-secondary-fixed text-secondary px-2 py-0.5 rounded-full font-semibold">
            Transit data limited — showing drive route
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Results Panel ── */}
        <aside className="w-[300px] md:w-[340px] h-full flex flex-col bg-surface border-r border-outline-variant/30 shrink-0">
          {/* Sub-header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/30 shrink-0">
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {legs.length > 0 ? `${legs.length} steps found` : 'Calculating...'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {duration ? `~${duration} · ${distance}` : 'Fetching route...'}
              </p>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-on-surface">{origin?.name?.split(',')[0]}</span>
              <span className="text-[10px] text-on-surface-variant">→ {destination?.name?.split(',')[0]}</span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">

            {/* Local Bus Match (from Supabase) */}
            {ragRoutes.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[16px]">directions_bus</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Local Bus Found</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface mb-1">{ragRoutes[0].name}</h3>
                <p className="text-[11px] text-on-surface-variant leading-tight mb-3">
                  Route: {ragRoutes[0].origin} to {ragRoutes[0].destination}
                </p>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-primary">PKR {ragRoutes[0].base_fare || '25-50'}</span>
                  <span className="text-on-surface-variant">Semantic Match</span>
                </div>
              </div>
            )}

            {/* Best route card */}
            {duration && (
              <div className="bg-surface-container-lowest border border-primary/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary px-2.5 py-1 rounded-bl-xl">
                  <span className="text-white text-[9px] font-bold uppercase tracking-wider">Best Route</span>
                </div>
                <div className="flex justify-between items-start mb-3 pr-16">
                  <div>
                    <span className="text-3xl font-extrabold text-on-surface leading-none">{duration.split(' ')[0]}</span>
                    <span className="text-xs text-on-surface-variant ml-1">{duration.split(' ').slice(1).join(' ')}</span>
                    <p className="text-xs text-primary font-semibold mt-1">Departs now</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface">{distance}</p>
                    <p className="text-[10px] text-on-surface-variant">Total distance</p>
                  </div>
                </div>
                {/* Mode chips */}
                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                  {legs.slice(0, 4).map((leg, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${leg.mode === 'TRANSIT' ? 'bg-primary-container' : 'bg-surface-container-high'}`}>
                        <span className={`material-symbols-outlined text-[13px] ${leg.mode === 'TRANSIT' ? 'text-white' : 'text-on-surface-variant'}`}>
                          {modeIcon(leg.mode)}
                        </span>
                        <span className={`text-xs font-semibold ${leg.mode === 'TRANSIT' ? 'text-white' : 'text-on-surface'}`}>
                          {leg.transitDetails || leg.duration}
                        </span>
                      </div>
                      {i < Math.min(legs.length, 4) - 1 && (
                        <span className="material-symbols-outlined text-outline-variant text-[14px]">chevron_right</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/journey')}
                  className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-[0.98]">
                  Go Now <span className="material-symbols-outlined text-[17px]">near_me</span>
                </button>
              </div>
            )}

            {/* Gemini AI summary */}
            {(aiLoading || geminiSummary) && (
              <div className="bg-tertiary-fixed/50 border border-tertiary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-tertiary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="text-xs font-bold text-tertiary uppercase tracking-wider">AI Guide (Gemini Pro)</span>
                </div>
                {aiLoading
                  ? <p className="text-xs text-on-surface-variant animate-pulse">Generating local transit advice...</p>
                  : <p className="text-xs text-on-surface-variant leading-relaxed">{geminiSummary}</p>
                }
              </div>
            )}

            {/* Step-by-step */}
            {legs.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Step by Step</h3>
                <div className="space-y-3">
                  {legs.map((leg, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${leg.mode === 'TRANSIT' ? 'bg-primary-container' : 'bg-surface-container-high'}`}>
                        <span className={`material-symbols-outlined text-[14px] ${leg.mode === 'TRANSIT' ? 'text-white' : 'text-on-surface-variant'}`}>
                          {modeIcon(leg.mode)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-on-surface leading-snug">{leg.instructions}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{leg.duration} · {leg.distance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {!duration && !legs.length && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-on-surface-variant">Finding best route in Karachi...</p>
              </div>
            )}

            {/* Traffic alert */}
            <div className="border-l-4 border-secondary bg-surface-container-low rounded-r-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-secondary text-[18px]">warning</span>
              <div>
                <p className="text-xs font-bold text-secondary mb-1">Traffic Alert</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Heavy congestion near Numaish. Routes may take 10–15 mins longer.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right Map ── */}
        <section className="flex-1 relative overflow-hidden">
          <Map
            defaultCenter={KARACHI}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeId="roadmap"
            style={{ width: '100%', height: '100%' }}
          >
            {origin && destination && (
              <DirectionsLayer
                origin={origin}
                destination={destination}
                onResult={handleDirectionsResult}
              />
            )}
          </Map>

          {/* Floating origin/dest card */}
          {origin && destination && (
            <div className="absolute top-4 left-4 bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg p-4 flex items-center gap-4 border border-outline-variant/30 max-w-[280px]">
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[18px]">my_location</span>
                <div className="w-px h-3 border-l border-dotted border-outline" />
                <span className="material-symbols-outlined text-secondary text-[18px]">location_on</span>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="font-semibold text-sm text-on-surface truncate">{origin.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{destination.name}</p>
              </div>
              <button onClick={() => navigate('/')} className="text-on-surface-variant hover:bg-surface-container transition-colors p-1.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
