import { useNavigate } from 'react-router-dom';

const MAP_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBFjGUVhtMMh_7B7xVHtGaXeB6jG3LnFmvD7gcC95mEsWxIgEiWZHXUpsYeIrbrz8wkhCef_w03PPVx5TOHm0YFbOaLe5a17f9GoC9kNCAabTr8qBP-sCNPOLmvj71rCVcm1pxuF37JoOvbTQVJkDyAjwwuwkZweTFsM1UJ7p3KP0BRQjZzcdG8ohQJhy1Deq6S6sFokMm9Zomo2fMgf1DakKHzZ0DIqR39Rq76YU87RFHiUenAtmdT2NE8bFVKYt8t_rA2ZfPubA';

export default function JourneyResults() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface page-enter">

      {/* Header */}
      <header className="flex items-center gap-2 px-5 h-14 bg-surface border-b border-outline-variant/40 shrink-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-primary"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-primary tracking-tight">Journey Results</h1>
      </header>

      {/* Body: Left panel + Right map */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Results Panel ── */}
        <aside className="w-[280px] md:w-[320px] h-full flex flex-col bg-surface border-r border-outline-variant/30 shrink-0">

          {/* Sub-header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/30 shrink-0">
            <div>
              <h2 className="text-base font-bold text-on-surface">3 routes found</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Arriving by 09:15 AM</p>
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[15px]">sort</span>
              Sort
            </button>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">

            {/* Card 1 — Recommended */}
            <div className="bg-surface-container-lowest border border-primary/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
              {/* Recommended badge */}
              <div className="absolute top-0 right-0 bg-primary px-2.5 py-1 rounded-bl-xl">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider">Recommended</span>
              </div>

              <div className="flex justify-between items-start mb-3 pr-16">
                <div>
                  <span className="text-3xl font-extrabold text-on-surface leading-none">42</span>
                  <span className="text-xs text-on-surface-variant ml-1">min</span>
                  <p className="text-xs text-primary font-semibold mt-1">Leaves in 4 mins</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-on-surface">PKR 60</p>
                  <p className="text-[10px] text-on-surface-variant">Total fare</p>
                </div>
              </div>

              {/* Mode chips */}
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant">directions_walk</span>
                  <span className="text-xs font-medium text-on-surface">8m</span>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>
                <div className="flex items-center gap-1 bg-primary-container px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[13px] text-white">directions_bus</span>
                  <span className="text-xs font-semibold text-white">Red Line</span>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>
                <div className="flex items-center gap-1 bg-tertiary-fixed px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[13px] text-tertiary">directions_bus</span>
                  <span className="text-xs font-semibold text-tertiary">7-K</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/journey')}
                className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-[0.98]"
              >
                Go Now
                <span className="material-symbols-outlined text-[17px]">near_me</span>
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-3xl font-extrabold text-on-surface leading-none">51</span>
                  <span className="text-xs text-on-surface-variant ml-1">min</span>
                  <p className="text-xs text-on-surface-variant mt-1">Direct route</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-on-surface">PKR 45</p>
                  <p className="text-[10px] text-on-surface-variant">Total fare</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant">directions_walk</span>
                  <span className="text-xs font-medium text-on-surface">12m</span>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>
                <div className="flex items-center gap-1 bg-secondary-fixed px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[13px] text-secondary">directions_bus</span>
                  <span className="text-xs font-semibold text-secondary">W-11 Bus</span>
                </div>
              </div>
            </div>

            {/* Traffic Alert */}
            <div className="border-l-4 border-secondary bg-surface-container-low rounded-r-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">warning</span>
              <div>
                <p className="text-xs font-bold text-secondary mb-1">Traffic Delay</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Heavy congestion near Numaish. Routes may take 10–15 mins longer.
                </p>
              </div>
            </div>

          </div>
        </aside>

        {/* ── Right Map Area ── */}
        <section className="flex-1 relative overflow-hidden">
          <img
            src={MAP_URL}
            alt="Karachi transit map"
            className="w-full h-full object-cover"
          />
          {/* Gradient fade toward left panel */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface/60 via-transparent to-transparent pointer-events-none" />

          {/* Floating origin-destination card */}
          <div className="absolute top-5 left-5 bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg p-4 flex items-center gap-4 border border-outline-variant/30 min-w-[260px]">
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[20px]">my_location</span>
              <div className="w-px h-3 border-l border-dotted border-outline" />
              <span className="material-symbols-outlined text-secondary text-[20px]">location_on</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-sm text-on-surface leading-none">Saddar, Empress Market</p>
              <p className="text-xs text-on-surface-variant leading-none">Gulshan-e-Iqbal, Block 13</p>
            </div>
            <button className="ml-auto text-on-surface-variant hover:bg-surface-container transition-colors p-1.5 rounded-full">
              <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
