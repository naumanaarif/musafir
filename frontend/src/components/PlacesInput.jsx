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
    acServiceRef.current = new placesLib.AutocompleteService();
    // Keep PlacesService as legacy fallback (still works)
    if (!dummyMapRef.current) dummyMapRef.current = document.createElement('div');
    plServiceRef.current = new placesLib.PlacesService(dummyMapRef.current);
  }, [placesLib]);

  // Fetch predictions from Google Places
  const fetchPredictions = useCallback((query) => {
    if (!acServiceRef.current || !query || query.trim().length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    acServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'pk' },
        location: new window.google.maps.LatLng(24.8607, 67.0105),
        radius: 35000, // 35 km around Karachi centre
        types: ['geocode', 'establishment'],
      },
      (results, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length) {
          setPredictions(results);
          setOpen(true);
        } else {
          setPredictions([]);
          setOpen(false);
        }
      }
    );
  }, []);

  // Handle typing — debounce 280 ms
  const handleChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(v), 280);
  };

  // User picks a suggestion
  const handleSelect = async (prediction) => {
    const displayName =
      prediction.structured_formatting?.main_text || prediction.description;
    setInputValue(displayName);
    setOpen(false);
    setPredictions([]);

    // Use new Place API (fetchFields) — no deprecation warning
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
      if (!plServiceRef.current) return;
      plServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ['name', 'geometry', 'formatted_address'] },
        (place, status) => {
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
    }
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
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, predictions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); handleSelect(predictions[highlightIdx]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={containerRef} className="relative flex items-start gap-4">
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
              onMouseDown={(e) => { e.preventDefault(); setInputValue(''); setPredictions([]); setOpen(false); onPlaceSelect?.(null); }}
              className="text-outline hover:text-on-surface transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* ── Suggestions Dropdown ── */}
        {open && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-outline-variant/20 overflow-hidden">
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
                    {p.types?.includes('establishment') ? 'storefront' : 'location_on'}
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Highlight matching text */}
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
          </div>
        )}
      </div>
    </div>
  );
}
