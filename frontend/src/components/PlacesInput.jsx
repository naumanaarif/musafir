import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

/**
 * PlacesInput — real-time Places API suggestions as the user types.
 * Uses AutocompleteService (programmatic) + PlacesService for details.
 *
 * Props:
 *   label        — "FROM" / "TO" label text
 *   placeholder  — input placeholder
 *   dotColor     — Tailwind class for the dot (e.g. "bg-primary" / "bg-secondary")
 *   dotShape     — "circle" | "square"
 *   value        — controlled string value
 *   onPlaceSelect(place: {name, fullName, lat, lng}) — called when user picks a result
 */
export default function PlacesInput({
  label,
  placeholder,
  dotColor = 'bg-primary',
  dotShape = 'circle',
  value = '',
  onPlaceSelect,
}) {
  const placesLib = useMapsLibrary('places');

  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [apiError, setApiError] = useState(''); // surface Places API errors

  const acServiceRef = useRef(null);
  const plServiceRef = useRef(null);
  const dummyMapRef = useRef(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync if parent changes value (e.g. voice fill)
  useEffect(() => { setInputValue(value); }, [value]);

  // Init services once Places library loads
  useEffect(() => {
    if (!placesLib) return;
    try {
      acServiceRef.current = new placesLib.AutocompleteService();
      if (!dummyMapRef.current) dummyMapRef.current = document.createElement('div');
      plServiceRef.current = new placesLib.PlacesService(dummyMapRef.current);
      console.log('[PlacesInput] AutocompleteService initialized OK');
    } catch (err) {
      console.error('[PlacesInput] Failed to init Places services:', err);
      setApiError('Maps API failed to initialize');
    }
  }, [placesLib]);

  // Fetch predictions from Google Places + Local Backend
  const fetchPredictions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setApiError('');

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      // 1. Local search (Bus Stops) with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const localPromise = fetch(`${baseUrl}/api/stop-search?q=${encodeURIComponent(query)}&limit=4`, { signal: controller.signal })
        .then(r => r.json())
        .then(d => {
          clearTimeout(timeoutId);
          return (d.stops || []).map(s => ({
            place_id: `local-${s.stop_id}`,
            description: s.name_en,
            structured_formatting: { 
              main_text: s.name_en, 
              secondary_text: `Transit Stop • ${s.stop_id}` 
            },
            types: ['transit_station'],
            isLocal: true,
            lat: s.latitude,
            lng: s.longitude,
            fullName: `${s.name_en}, Karachi`
          }));
        })
        .catch(() => {
          clearTimeout(timeoutId);
          return [];
        });

      // 2. Google Places search
      const googlePromise = new Promise((resolve) => {
        if (!acServiceRef.current) return resolve([]);
        
        const biasLocation = (window.google && window.google.maps && window.google.maps.LatLng) 
          ? new window.google.maps.LatLng(24.8607, 67.0105) 
          : null;

        acServiceRef.current.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'pk' },
            location: biasLocation,
            radius: 50000,
            types: ['geocode', 'establishment'],
          },
          (results, status) => {
            const S = window.google?.maps?.places?.PlacesServiceStatus;
            if (status === S?.OK && results) {
              resolve(results);
            } else {
              if (status === S?.REQUEST_DENIED) setApiError('Google Maps API denied');
              resolve([]);
            }
          }
        );
      });

      // Use Promise.allSettled so one failure doesn't block the other
      const [localRes, googleRes] = await Promise.allSettled([localPromise, googlePromise]);
      
      const localResults = localRes.status === 'fulfilled' ? localRes.value : [];
      const googleResults = googleRes.status === 'fulfilled' ? googleRes.value : [];
      
      const combined = [...localResults, ...googleResults];
      setPredictions(combined);
      setOpen(true); 
    } catch (err) {
      console.error('[PlacesInput] Fetch error:', err);
      setApiError('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle typing — debounce 300ms
  const handleChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(v), 300);
  };

  // User picks a suggestion
  const handleSelect = async (prediction) => {
    const displayName = prediction.structured_formatting?.main_text || prediction.description;
    setInputValue(displayName);
    setOpen(false);
    setPredictions([]);
    setApiError('');

    // Case A: Local Stop result (already has coords)
    if (prediction.isLocal) {
      onPlaceSelect?.({
        name: displayName,
        fullName: prediction.fullName,
        lat: prediction.lat,
        lng: prediction.lng,
      });
      return;
    }

    // Case B: Google result (needs details fetch)
    setLoading(true);
    try {
      const { Place } = await window.google.maps.importLibrary('places');
      const place = new Place({ id: prediction.place_id });
      await place.fetchFields({ fields: ['displayName', 'location', 'formattedAddress'] });
      onPlaceSelect?.({
        name: displayName,
        fullName: place.formattedAddress || prediction.description,
        lat: place.location.lat(),
        lng: place.location.lng(),
      });
    } catch {
      // Fallback: legacy PlacesService
      if (!plServiceRef.current) { setLoading(false); return; }
      plServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ['name', 'geometry', 'formatted_address'] },
        (place, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry) {
            onPlaceSelect?.({
              name: displayName,
              fullName: place.formatted_address || prediction.description,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
      return;
    }
    setLoading(false);
  };

  // If API fails, allow typing a location name and pressing Enter to use it with fallback coords
  const handleManualSubmit = () => {
    if (!inputValue.trim()) return;
    // Use Karachi center as fallback — user can still search by name
    onPlaceSelect?.({
      name: inputValue.trim(),
      fullName: inputValue.trim() + ', Karachi, Pakistan',
      lat: 24.8607,
      lng: 67.0105,
    });
    setApiError('');
  };

  // Close on outside click
  useEffect(() => {
    const onOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Keyboard navigation
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !open) { handleManualSubmit(); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, predictions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); handleSelect(predictions[highlightIdx]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={containerRef} className={`relative flex items-start gap-4 ${open || focused ? 'z-50' : 'z-0'}`}>
      {/* Coloured dot / square */}
      <div className={`w-5 h-5 ${dotShape === 'square' ? 'rounded' : 'rounded-full'} ${dotColor} flex items-center justify-center shrink-0 mt-5`}>
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>

      {/* Input + dropdown */}
      <div className="flex-grow relative">
        <label className="block text-[10px] font-semibold text-on-surface-variant mb-0.5 uppercase tracking-widest">
          {label}
        </label>
        <div className={`flex items-center gap-2 border-b transition-colors ${focused ? 'border-primary' : 'border-transparent'}`}>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleChange}
            onFocus={() => { setFocused(true); if (inputValue.length >= 2) fetchPredictions(inputValue); }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-base font-medium placeholder:text-outline py-1"
            placeholder={placeholder}
            autoComplete="off"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {inputValue && !loading && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setInputValue(''); setPredictions([]); setOpen(false); setApiError(''); onPlaceSelect?.(null); }}
              className="text-outline hover:text-on-surface transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* API error hint */}
        {apiError && (
          <p className="text-[10px] text-red-500 mt-1 leading-snug">
            {apiError} —{' '}
            <button
              onMouseDown={(e) => { e.preventDefault(); handleManualSubmit(); }}
              className="underline font-semibold"
            >
              use typed name anyway
            </button>
          </p>
        )}

        {/* Suggestions Dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-outline-variant/20 overflow-hidden">
            {predictions.length > 0 ? (
              <>
                {predictions.map((p, idx) => {
                  const main = p.structured_formatting?.main_text || p.description;
                  const secondary = p.structured_formatting?.secondary_text || '';
                  const isHighlighted = idx === highlightIdx;
                  return (
                    <button
                      key={p.place_id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-outline-variant/10 last:border-none ${
                        isHighlighted ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="material-symbols-outlined text-outline text-[18px] shrink-0">
                        {p.isLocal ? 'directions_bus' : (p.types?.includes('establishment') ? 'storefront' : 'location_on')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface truncate">{main}</p>
                        {secondary && (
                          <p className="text-[11px] text-on-surface-variant truncate">{secondary}</p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-outline-variant text-[16px] shrink-0">north_west</span>
                    </button>
                  );
                })}
                <div className="px-4 py-1.5 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-end">
                  <img src="https://developers.google.com/static/maps/documentation/images/google_on_white.png" alt="Google" className="h-3 opacity-60" />
                </div>
              </>
            ) : (
              <div className="px-4 py-8 text-center bg-white">
                <span className="material-symbols-outlined text-outline-variant text-[32px] mb-2 block">search_off</span>
                <p className="text-sm font-semibold text-on-surface">No results found</p>
                <p className="text-[11px] text-on-surface-variant mt-1 px-6">
                  We couldn't find "{inputValue}" in our database or via Google Maps.
                </p>
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleManualSubmit(); }}
                  className="mt-4 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Use "{inputValue}" anyway
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
