import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourney } from '../context/JourneyContext';
import { parseJourneyPrompt } from '../services/gemini';
import PlacesInput from '../components/PlacesInput';

const recentJourneys = [
  {
    time: '2h ago', from: 'Clifton Block 4', to: 'to Saddar Bazar',
    chip: 'BUS 7-K', chipBg: 'bg-primary-container', chipText: 'text-white',
    origin: { name: 'Clifton Block 4', lat: 24.8138, lng: 67.0325 },
    destination: { name: 'Saddar Bazar', lat: 24.8607, lng: 67.0105 },
  },
  {
    time: 'Yesterday', from: 'Gulshan-e-Iqbal', to: 'to North Nazimabad',
    chip: 'GREEN LINE', chipBg: 'bg-tertiary-fixed', chipText: 'text-tertiary',
    origin: { name: 'Gulshan-e-Iqbal', lat: 24.9281, lng: 67.0986 },
    destination: { name: 'North Nazimabad', lat: 24.9479, lng: 67.0598 },
  },
  {
    time: '3 days ago', from: 'Malir Cantt', to: 'to Airport',
    chip: 'RICKSHAW', chipBg: 'bg-secondary-fixed', chipText: 'text-secondary',
    origin: { name: 'Malir Cantonment', lat: 24.8982, lng: 67.2007 },
    destination: { name: 'Jinnah International Airport', lat: 24.9008, lng: 67.1681 },
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { setOrigin, setDestination, setDirectionsResult, setGeminiSummary } = useJourney();

  // Controlled values for voice fill
  const [fromDisplay, setFromDisplay] = useState('');
  const [toDisplay, setToDisplay] = useState('');
  const [originPlace, setOriginPlace] = useState(null);
  const [destPlace, setDestPlace] = useState(null);

  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  // Voice input using Web Speech API → Gemini Flash-Lite
  const handleVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceStatus('Voice not supported in this browser. Try Chrome.'); return; }

    const recognition = new SR();
    recognition.lang = 'ur-PK';
    recognition.interimResults = false;

    setVoiceActive(true);
    setVoiceStatus('Listening… speak your journey');
    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceStatus(`Heard: "${transcript}" — Parsing with AI…`);
      try {
        const parsed = await parseJourneyPrompt(transcript);
        if (parsed.origin)      setFromDisplay(parsed.origin);
        if (parsed.destination) setToDisplay(parsed.destination);
        setVoiceStatus(`✓ From: ${parsed.origin || '?'} → To: ${parsed.destination || '?'}  (confidence: ${Math.round((parsed.confidence || 0) * 100)}%)`);
      } catch {
        setVoiceStatus('Could not parse — please try again.');
      }
      setVoiceActive(false);
    };
    recognition.onerror = () => { setVoiceStatus('Microphone error. Please retry.'); setVoiceActive(false); };
  };

  // Navigate to results
  const handleSearch = () => {
    const o = originPlace  || (fromDisplay ? { name: fromDisplay, lat: 24.8607, lng: 67.0105 } : null);
    const d = destPlace    || (toDisplay   ? { name: toDisplay,   lat: 24.9281, lng: 67.0986 } : null);
    if (!o || !d) { setVoiceStatus('Please select both a From and To location.'); return; }
    setOrigin(o);
    setDestination(d);
    setDirectionsResult(null);
    setGeminiSummary('');
    navigate('/results');
  };

  const handleRecentJourney = (j) => {
    setOrigin(j.origin);
    setDestination(j.destination);
    setDirectionsResult(null);
    setGeminiSummary('');
    navigate('/results');
  };

  return (
    <div className="bg-warm min-h-screen flex flex-col page-enter">

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-14 bg-surface/90 backdrop-blur-sm border-b border-outline-variant/40">
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary tracking-tight">Musafir AI</span>
            <span className="text-base font-semibold text-primary/60" style={{ fontFamily: 'serif' }}>مسافر</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <button className="px-3 py-1 rounded-full text-[11px] font-semibold bg-primary text-white">EN</button>
          <button className="px-3 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">اردو</button>
          <button className="px-3 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">Roman</button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto px-5 md:px-8 pt-12 pb-16">

        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-[2.6rem] font-extrabold text-primary leading-tight mb-3 tracking-tight">
            Where are you headed?
          </h1>
          <p className="text-xl font-medium text-on-surface-variant" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            آپ کہاں جانا چاہتے ہیں؟
          </p>
        </div>

        {/* ── Search Card ── */}
        <div className="bg-surface-container-lowest rounded-2xl px-6 pt-5 pb-6 shadow-sm border border-surface-container-high mb-4 max-w-xl mx-auto relative">
          {/* Dotted connector line */}
          <div className="absolute left-[34px] top-14 h-[calc(100%-90px)] w-px border-l-2 border-dotted border-outline-variant pointer-events-none" />

          <div className="flex flex-col gap-0">
            {/* FROM */}
            <PlacesInput
              label="From"
              placeholder="Search origin…"
              dotColor="bg-primary"
              dotShape="circle"
              value={fromDisplay}
              onPlaceSelect={(p) => { setOriginPlace(p); setFromDisplay(p?.name || ''); }}
            />

            <hr className="border-surface-container-high ml-9 my-3" />

            {/* TO */}
            <PlacesInput
              label="To"
              placeholder="Search destination…"
              dotColor="bg-secondary"
              dotShape="square"
              value={toDisplay}
              onPlaceSelect={(p) => { setDestPlace(p); setToDisplay(p?.name || ''); }}
            />
          </div>
        </div>

        {/* Voice status */}
        {voiceStatus && (
          <p className={`text-center text-xs mb-3 max-w-xl mx-auto px-4 ${voiceStatus.startsWith('✓') ? 'text-primary' : 'text-on-surface-variant'}`}>
            {voiceStatus}
          </p>
        )}

        {/* ── Action Buttons ── */}
        <div className="grid grid-cols-2 gap-4 mb-10 max-w-xl mx-auto">
          <button
            onClick={handleSearch}
            disabled={!fromDisplay && !originPlace}
            className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary bg-white text-primary font-semibold text-sm hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Find Route
          </button>
          <button
            onClick={handleVoiceInput}
            disabled={voiceActive}
            className={`flex items-center justify-center gap-2 h-12 rounded-xl text-white font-semibold text-sm shadow-[0_4px_14px_rgba(0,82,53,0.25)] transition-colors
              ${voiceActive ? 'bg-secondary animate-pulse cursor-not-allowed' : 'bg-primary hover:bg-primary-container'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{voiceActive ? 'hearing' : 'mic'}</span>
            {voiceActive ? 'Listening…' : 'Voice Input'}
          </button>
        </div>

        {/* ── Recent Journeys ── */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-on-surface">Recent journeys</h2>
            <button className="text-xs font-bold text-primary hover:underline">Clear all</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentJourneys.map((j, i) => (
              <div
                key={i}
                onClick={() => handleRecentJourney(j)}
                className="bg-white rounded-xl p-4 shadow-sm border border-surface-container-high flex flex-col gap-2 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[16px]">schedule</span>
                  <span className="text-[11px] font-medium text-on-surface-variant">{j.time}</span>
                </div>
                <div>
                  <p className="text-sm font-bold truncate text-on-surface">{j.from}</p>
                  <p className="text-xs text-on-surface-variant">{j.to}</p>
                </div>
                <span className={`mt-1 self-start px-2 py-0.5 rounded-full text-[10px] font-bold ${j.chipBg} ${j.chipText}`}>
                  {j.chip}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Info Banner ── */}
        <div className="mt-6 p-4 bg-primary-fixed rounded-xl flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-[20px] mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            <p className="text-sm font-bold text-on-primary-fixed mb-0.5">Monsoon Update</p>
            <p className="text-xs text-on-primary-fixed-variant leading-relaxed">
              Heavy rains in Saddar area. Several bus routes diverted. Plan for +20 mins delay.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
