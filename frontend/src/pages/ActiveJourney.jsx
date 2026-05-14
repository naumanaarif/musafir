import { useNavigate } from 'react-router-dom';

const MAP_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDXuYr1LfZr9h5dRl7FFqJrKHoYIZp91QHfmsLQ-frfbtjBx7PjX_8rjsCSeX-FU3h_1rOC8RJqDbV0ur-IXVTPUSKq8E4ZLYmpm7c0euXtcqTBu_8sLo3pa8ahfvfZ0muc0EVL7nqbOFMFdsv3kTmyHaeTIHzjKbFN3HaYYXYVOWCmOq0phSKW1b0-XjH3I44tj3bq_21C4McGV3ILJzzpzO7iN4v71cqXdivnSzZVzvrJWixl-ZVjyww12jPDk46TwnvC7sax0A';

const steps = [
  {
    label: 'Walk to Station',
    sub: 'Completed',
    status: 'done',
    icon: 'check',
    iconBg: 'bg-primary',
    iconColor: 'text-white',
  },
  {
    label: 'BRT Red Line',
    sub: 'Active • 8 min remaining',
    status: 'active',
    icon: 'directions_bus',
    iconBg: 'bg-secondary-container',
    iconColor: 'text-on-secondary-container',
    pulse: true,
  },
  {
    label: 'Local Bus to Destination',
    sub: 'Upcoming',
    status: 'upcoming',
    icon: 'directions_bus',
    iconBg: 'bg-surface-container',
    iconColor: 'text-on-surface-variant',
  },
];

export default function ActiveJourney() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden page-enter">

      {/* Dark title bar */}
      <div className="h-8 bg-inverse-surface flex items-center px-4 gap-2 shrink-0">
        <span className="material-symbols-outlined text-inverse-on-surface text-[14px]">web</span>
        <span className="text-inverse-on-surface text-[11px] font-medium">Active Journey (Minimalist Web) - Musafir AI</span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="w-[200px] md:w-[220px] h-full bg-surface border-r border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto no-scrollbar">

          {/* Header section */}
          <div className="px-4 pt-5 pb-4 border-b border-outline-variant/30">
            <h2 className="text-base font-bold text-primary text-center mb-4">Musafir AI</h2>

            {/* Next station */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest text-center mb-1">Next Station</p>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-extrabold text-primary leading-none">min 8</span>
                <span className="text-sm font-semibold text-on-surface leading-tight text-right">Ride to Nipa Chowrangi</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary-container rounded-full" style={{ width: '55%' }} />
            </div>

            {/* End Journey */}
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-error rounded-xl text-white text-sm font-bold shadow-md hover:bg-error/90 transition-colors active:scale-95"
            >
              End Journey
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Journey Steps */}
          <div className="px-4 pt-5 pb-6">
            <h3 className="text-xs font-semibold text-on-surface-variant text-center mb-5 uppercase tracking-widest">
              Journey Steps
            </h3>

            <div className="relative flex flex-col gap-0">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 relative pb-6 last:pb-0">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className={`absolute left-[17px] top-9 w-px h-[calc(100%-24px)] ${
                        step.status === 'done' ? 'bg-primary' : 'border-l border-dashed border-outline-variant'
                      }`}
                    />
                  )}

                  {/* Step content: label on left, icon on right */}
                  <div className="flex-1 flex flex-col pt-1 min-w-0">
                    <span
                      className={`text-sm font-semibold leading-tight truncate ${
                        step.status === 'upcoming' ? 'text-on-surface-variant' : 'text-on-surface'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        step.status === 'active' ? 'text-secondary' : 'text-on-surface-variant'
                      }`}
                    >
                      {step.sub}
                    </span>
                  </div>

                  {/* Icon on right */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${step.iconBg} ${
                        step.status === 'active' ? 'border-2 border-white shadow-md' : ''
                      }`}
                    >
                      <span className={`material-symbols-outlined ${step.status === 'done' ? 'filled' : ''} text-[18px] ${step.iconColor}`}>
                        {step.icon}
                      </span>
                    </div>
                    {/* Red pulse dot for active */}
                    {step.pulse && (
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-error rounded-full border border-white pulse-red" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right Map ── */}
        <section className="flex-1 relative overflow-hidden">
          <img
            src={MAP_URL}
            alt="Active journey map showing Karachi route"
            className="w-full h-full object-cover"
          />

          {/* Route SVG overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 600 500"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M 300 380 L 320 300 L 290 220 L 310 150 L 280 80"
              fill="none"
              stroke="#005235"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </svg>

          {/* User blue dot */}
          <div className="absolute bottom-[38%] left-[49%] -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white pulse-blue shadow-md" />
          </div>

          {/* Recenter FAB */}
          <button className="absolute bottom-6 right-6 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center text-primary border border-outline-variant hover:bg-surface-container transition-all active:scale-90">
            <span className="material-symbols-outlined text-[20px]">my_location</span>
          </button>
        </section>

      </div>
    </div>
  );
}
