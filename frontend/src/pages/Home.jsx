import { useNavigate } from 'react-router-dom';

const recentJourneys = [
  {
    time: '2h ago',
    from: 'Clifton Block 4',
    to: 'to Saddar Bazar',
    chip: 'BUS 7-K',
    chipBg: 'bg-primary-container',
    chipText: 'text-white',
  },
  {
    time: 'Yesterday',
    from: 'Gulshan-e-Iqbal',
    to: 'to North Nazimabad',
    chip: 'GREEN LINE',
    chipBg: 'bg-tertiary-fixed',
    chipText: 'text-tertiary',
  },
  {
    time: '3 days ago',
    from: 'Malir Cantt',
    to: 'to Airport',
    chip: 'RICKSHAW',
    chipBg: 'bg-secondary-fixed',
    chipText: 'text-secondary',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-warm min-h-screen flex flex-col page-enter">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-14 bg-surface/90 backdrop-blur-sm border-b border-outline-variant/40">
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary tracking-tight">Musafir AI</span>
            <span className="text-base font-semibold text-primary/60" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>مسافر</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <button className="px-3 py-1 rounded-full text-[11px] font-semibold bg-primary text-white">EN</button>
          <button className="px-3 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">اردو</button>
          <button className="px-3 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">Roman</button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-5 md:px-8 pt-12 pb-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-[2.6rem] font-extrabold text-primary leading-tight mb-3 tracking-tight">
            Where are you headed?
          </h1>
          <p className="text-xl font-medium text-on-surface-variant" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl' }}>
            آپ کہاں جانا چاہتے ہیں؟
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high mb-6 max-w-xl mx-auto">
          <div className="relative flex flex-col gap-7">
            {/* Dotted connector line */}
            <div className="absolute left-[10px] top-5 h-[calc(100%-28px)] w-px border-l-2 border-dotted border-outline-variant" />

            {/* FROM */}
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="flex-grow">
                <label className="block text-[10px] font-semibold text-on-surface-variant mb-0.5 uppercase tracking-widest">From</label>
                <input
                  className="w-full bg-transparent border-none outline-none text-base font-medium placeholder:text-outline"
                  placeholder="Current Location"
                  defaultValue="Current Location"
                />
              </div>
            </div>

            <hr className="border-surface-container-high ml-9" />

            {/* TO */}
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center shrink-0">
                <div className="w-2 h-2 bg-white" />
              </div>
              <div className="flex-grow">
                <label className="block text-[10px] font-semibold text-on-surface-variant mb-0.5 uppercase tracking-widest">To</label>
                <input
                  className="w-full bg-transparent border-none outline-none text-base font-medium placeholder:text-outline"
                  placeholder="Enter destination..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-12 max-w-xl mx-auto">
          <button className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary bg-white text-primary font-semibold text-sm hover:bg-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">keyboard</span>
            Type Route
          </button>
          <button
            onClick={() => navigate('/results')}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-white font-semibold text-sm shadow-[0_4px_14px_rgba(0,82,53,0.25)] hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
            Voice Input
          </button>
        </div>

        {/* Recent Journeys */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-on-surface">Recent journeys</h2>
            <button className="text-xs font-bold text-primary hover:underline">Clear all</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentJourneys.map((j, i) => (
              <div
                key={i}
                onClick={() => navigate('/results')}
                className="bg-white rounded-xl p-4 shadow-sm border border-surface-container-high flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[16px]">schedule</span>
                  <span className="text-[11px] font-medium text-on-surface-variant">{j.time}</span>
                </div>
                <div>
                  <p className="text-sm font-bold truncate text-on-surface">{j.from}</p>
                  <p className="text-xs text-on-surface-variant">{j.to}</p>
                </div>
                <div className="flex gap-1 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${j.chipBg} ${j.chipText}`}>
                    {j.chip}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alert Banner */}
        <div className="mt-6 p-4 bg-primary-fixed rounded-xl flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined filled text-on-primary-fixed-variant text-[20px] mt-0.5">info</span>
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
