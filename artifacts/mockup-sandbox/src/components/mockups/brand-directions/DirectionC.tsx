import './_group.css';

const ORANGE = '#F07830';
const GOLDEN = '#F5C030';
const WHITE = '#FFFFFF';
const SLATE_50 = '#F8FAFC';
const SLATE_100 = '#F1F5F9';
const SLATE_200 = '#E2E8F0';
const SLATE_400 = '#94A3B8';
const SLATE_600 = '#475569';
const SLATE_900 = '#0F172A';

const shades = [
  { label: '50',  hex: '#FFF7F0' },
  { label: '100', hex: '#FFE9D6' },
  { label: '200', hex: '#FFD0A8' },
  { label: '300', hex: '#FCA974' },
  { label: '400', hex: '#FA8F51' },
  { label: '500', hex: '#F07830', primary: true },
  { label: '600', hex: '#E56120' },
  { label: '700', hex: '#BE4C14' },
  { label: '800', hex: '#8E380E' },
  { label: '900', hex: '#5E230A' },
];

export function DirectionC() {
  return (
    <div className="min-h-screen p-10" style={{ background: WHITE, fontFamily: "'Space Grotesk', 'Inter', sans-serif", color: SLATE_900 }}>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ background: ORANGE }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: SLATE_400 }}>Direction C</span>
        </div>
        <h1 className="text-5xl font-bold leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>
          Sol
        </h1>
        <p className="text-lg leading-relaxed max-w-lg" style={{ color: SLATE_600 }}>
          The most restrained. Color is a precision tool — orange marks only what matters. The rest is light, space, and geometric clarity.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl p-5" style={{ background: ORANGE }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Primary</p>
          <p className="text-xl font-bold text-white leading-none mb-1">Orange</p>
          <p className="text-sm text-white/80">#F07830</p>
          <p className="text-xs mt-1 text-white/60">hsl(24 88% 57%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: SLATE_900 }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Neutral</p>
          <p className="text-xl font-bold text-white leading-none mb-1">Slate 900</p>
          <p className="text-sm text-white/70">#0F172A</p>
          <p className="text-xs mt-1 text-white/40">hsl(222 47% 11%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: SLATE_100, border: `1px solid ${SLATE_200}` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: SLATE_400 }}>Surface</p>
          <p className="text-xl font-bold leading-none mb-1" style={{ color: SLATE_900 }}>Slate 100</p>
          <p className="text-sm" style={{ color: SLATE_600 }}>#F1F5F9</p>
          <p className="text-xs mt-1" style={{ color: SLATE_400 }}>hsl(210 40% 96%)</p>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: SLATE_400 }}>Primary Scale</p>
        <div className="flex h-10 rounded-xl overflow-hidden">
          {shades.map(s => (
            <div key={s.label} className="flex-1 relative" style={{ background: s.hex }}>
              {s.primary && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/80" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex mt-1">
          {shades.map(s => (
            <div key={s.label} className="flex-1 text-center">
              <span className="text-[9px]" style={{ color: SLATE_400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 p-6 rounded-2xl" style={{ background: SLATE_50, border: `1px solid ${SLATE_200}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: SLATE_400 }}>Typography · Space Grotesk</p>
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: SLATE_400 }}>Display</span>
            <p className="text-5xl font-bold leading-none" style={{ letterSpacing: '-0.03em' }}>Lumen Fidei</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: SLATE_400 }}>Heading</span>
            <p className="text-2xl font-semibold" style={{ letterSpacing: '-0.015em' }}>Day 14 — Gifts of the Spirit</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: SLATE_400 }}>Body</span>
            <p className="text-base leading-relaxed" style={{ color: SLATE_600 }}>
              The Holy Spirit gives each person unique gifts for building up the Body of Christ. Discovering yours is part of the journey.
            </p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: SLATE_400 }}>Caption</span>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: SLATE_400 }}>Week 3 · Archdiocese of Chicago</p>
          </div>
        </div>
      </div>

      <div className="mb-10 flex items-center gap-4">
        <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: ORANGE }}>
          Begin Today's Lesson
        </button>
        <button className="px-6 py-3 rounded-xl font-semibold text-sm border" style={{ color: ORANGE, borderColor: SLATE_200, background: SLATE_50 }}>
          View Progress
        </button>
        <button className="px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: SLATE_100, color: SLATE_600 }}>
          Settings
        </button>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: SLATE_50, border: `1px solid ${SLATE_200}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: SLATE_400 }}>CSS Tokens (light)</p>
        <pre className="text-xs leading-relaxed" style={{ color: SLATE_600, fontFamily: 'monospace' }}>
{`--primary:          24 88% 57%;   /* #F07830 */
--primary-foreground: 0 0% 100%;
--accent:           43 90% 57%;   /* #F5C030 */
--background:        0 0% 100%;   /* #FFFFFF */
--foreground:       222 47% 11%;  /* #0F172A */
--muted:            210 40% 96%;  /* #F1F5F9 */
--muted-foreground: 215 16% 47%;  /* #64748B */
--border:           214 32% 91%;  /* #E2E8F0 */`}
        </pre>
      </div>
    </div>
  );
}
