import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useJourney } from '../context/JourneyContext';

const KARACHI = { lat: 24.8607, lng: 67.0105 };

// ── Live route renderer inside map ──────────────────────────────────────────
function ActiveRouteLayer({ directionsResult, userLocation }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  useEffect(() => {
    if (!routesLib || !map || !directionsResult) return;
    const renderer = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#005235', strokeWeight: 6, strokeOpacity: 0.85 },
    });
    renderer.setDirections(directionsResult);
    return () => renderer.setMap(null);
  }, [routesLib, map, directionsResult]);

  // Pan map to user location when it updates
  useEffect(() => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
  }, [map, userLocation]);

  return null;
}

// ── Journey steps parsed from DirectionsResult ──────────────────────────────
function buildSteps(directionsResult) {
  if (!directionsResult) return [];
  const rawSteps = directionsResult.routes[0]?.legs[0]?.steps || [];
  return rawSteps.map(s => ({
    label: s.transit?.line?.short_name
      ? `${s.transit.line.short_name} — ${s.transit.departure_stop?.name || ''}`
      : s.html_instructions?.replace(/<[^>]*>/g, '') || '',
    duration: s.duration?.text || '',
    mode: s.travel_mode,
    done: false,
  }));
}

export default function ActiveJourney() {
  const navigate = useNavigate();
  const { origin, destination, directionsResult, activeStep, setActiveStep } = useJourney();

  const [userLocation, setUserLocation] = useState(null);
  const [steps, setSteps] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const watchRef = useRef(null);
  const timerRef = useRef(null);

  // Redirect if no journey
  useEffect(() => {
    if (!origin && !destination) navigate('/');
  }, []);

  // Parse steps from directions
  useEffect(() => {
    if (directionsResult) {
      setSteps(buildSteps(directionsResult));
    } else {
      // Fallback steps when no directions
      setSteps([
        { label: 'Walk to nearest stop', duration: '~5 min', mode: 'WALKING', done: true },
        { label: `BRT / Bus toward ${destination?.name?.split(',')[0] || 'Destination'}`, duration: '~25 min', mode: 'TRANSIT', done: false },
        { label: 'Alight at destination', duration: '', mode: 'WALKING', done: false },
      ]);
    }
  }, [directionsResult, destination]);

  // Geolocation watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // Elapsed time counter
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const totalDuration = directionsResult?.routes[0]?.legs[0]?.duration?.text || '';
  const activeStepData = steps[activeStep] || steps[0];
  const progress = steps.length > 0 ? Math.round(((activeStep) / steps.length) * 100) : 55;

  const modeIcon = (mode) => {
    if (mode === 'TRANSIT') return 'directions_bus';
    if (mode === 'WALKING') return 'directions_walk';
    return 'directions_car';
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden page-enter">
      {/* Dark title bar */}
      <div className="h-8 bg-inverse-surface flex items-center px-4 gap-2 shrink-0">
        <span className="material-symbols-outlined text-inverse-on-surface text-[14px]">directions_transit</span>
        <span className="text-inverse-on-surface text-[11px] font-medium">
          Active Journey — Musafir AI
        </span>
        {userLocation && (
          <span className="ml-auto text-[10px] text-primary-fixed-dim">📍 Live location active</span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-[210px] md:w-[230px] h-full bg-surface border-r border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto no-scrollbar">

          <div className="px-4 pt-5 pb-4 border-b border-outline-variant/30">
            <h2 className="text-base font-bold text-primary text-center mb-4">Musafir AI</h2>

            {/* Next station */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest text-center mb-1">Next Station</p>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-extrabold text-primary leading-none">
                  {activeStepData?.duration || '—'}
                </span>
                <span className="text-xs font-semibold text-on-surface leading-tight text-right line-clamp-2 max-w-[120px]">
                  {activeStepData?.label || destination?.name?.split(',')[0] || 'Destination'}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant mb-4">
              <span>{origin?.name?.split(',')[0]}</span>
              <span>{destination?.name?.split(',')[0]}</span>
            </div>

            {/* End Journey */}
            <button onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-error rounded-xl text-white text-sm font-bold shadow-md hover:bg-error/90 transition-colors active:scale-95">
              End Journey
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Steps */}
          <div className="px-4 pt-5 pb-6">
            <h3 className="text-[10px] font-semibold text-on-surface-variant text-center mb-4 uppercase tracking-widest">
              Journey Steps
            </h3>
            <div className="relative flex flex-col gap-0">
              {steps.map((step, i) => {
                const isDone = i < activeStep;
                const isActive = i === activeStep;
                const isUpcoming = i > activeStep;
                return (
                  <div key={i} className="flex items-start gap-3 relative pb-5 last:pb-0">
                    {i < steps.length - 1 && (
                      <div className={`absolute left-[17px] top-9 w-px h-[calc(100%-24px)] ${isDone ? 'bg-primary' : 'border-l border-dashed border-outline-variant'}`} />
                    )}
                    {/* Content */}
                    <div className="flex-1 flex flex-col pt-1 min-w-0 order-1">
                      <span className={`text-xs font-semibold leading-tight ${isUpcoming ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                        {step.label}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {isDone ? 'Completed' : isActive ? `Active${step.duration ? ` · ${step.duration}` : ''}` : 'Upcoming'}
                      </span>
                    </div>
                    {/* Icon on right */}
                    <div className="relative shrink-0 order-2">
                      <div onClick={() => !isDone && setActiveStep(i)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                          isDone ? 'bg-primary' : isActive ? 'bg-secondary-container border-2 border-white shadow-md' : 'bg-surface-container'
                        }`}>
                        <span className={`material-symbols-outlined text-[17px] ${
                          isDone ? 'text-white' : isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'
                        }`} style={isDone ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          {isDone ? 'check' : modeIcon(step.mode)}
                        </span>
                      </div>
                      {isActive && <div className="absolute -top-1 -left-1 w-3 h-3 bg-error rounded-full border border-white pulse-red" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advance step button */}
            {activeStep < steps.length - 1 && (
              <button onClick={() => setActiveStep(s => Math.min(s + 1, steps.length - 1))}
                className="w-full mt-4 py-2 border border-primary rounded-lg text-xs text-primary font-semibold hover:bg-primary/5 transition-colors">
                Mark Step Done →
              </button>
            )}
          </div>
        </aside>

        {/* ── Right Map ── */}
        <section className="flex-1 relative overflow-hidden">
          <Map
            defaultCenter={userLocation || (origin ? { lat: origin.lat, lng: origin.lng } : KARACHI)}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            <ActiveRouteLayer directionsResult={directionsResult} userLocation={userLocation} />

            {/* Live user location marker */}
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white pulse-blue shadow-lg" />
              </AdvancedMarker>
            )}
          </Map>

          {/* Recenter FAB */}
          <button
            onClick={() => { /* map.panTo handled by ActiveRouteLayer */ }}
            className="absolute bottom-6 right-6 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center text-primary border border-outline-variant hover:bg-surface-container transition-all active:scale-90">
            <span className="material-symbols-outlined text-[20px]">my_location</span>
          </button>

          {/* Bottom instruction card */}
          {activeStepData && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-sm rounded-2xl shadow-xl border border-outline-variant/30 px-5 py-3 flex items-center gap-3 max-w-sm w-[90%]">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${activeStepData.mode === 'TRANSIT' ? 'bg-primary-container' : 'bg-surface-container-high'}`}>
                <span className={`material-symbols-outlined text-[18px] ${activeStepData.mode === 'TRANSIT' ? 'text-white' : 'text-on-surface-variant'}`}>
                  {modeIcon(activeStepData.mode)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{activeStepData.label}</p>
                <p className="text-xs text-on-surface-variant">{activeStepData.duration}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
