import './_group.css';

const ORANGE = '#F07830';
const ORANGE_LIGHT = '#FFF0E6';
const GOLDEN = '#F5C030';
const GOLDEN_LIGHT = '#FFF8E0';
const WHITE = '#FFFFFF';
const GRAY_50 = '#F9FAFB';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_400 = '#9CA3AF';
const GRAY_600 = '#4B5563';
const GRAY_900 = '#111827';

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

const goldenShades = [
  { label: '50',  hex: '#FFFBF0' },
  { label: '100', hex: '#FFF1C4' },
  { label: '200', hex: '#FFE475' },
  { label: '300', hex: '#FDD44A' },
  { label: '400', hex: '#FBCB30' },
  { label: '500', hex: '#F5C030', primary: true },
  { label: '600', hex: '#E0A010' },
  { label: '700', hex: '#B87D08' },
  { label: '800', hex: '#875B05' },
  { label: '900', hex: '#573903' },
];

export function DirectionA() {
  return (
    <div className="min-h-screen p-10" style={{ background: WHITE, fontFamily: "'Plus Jakarta Sans', sans-serif", color: GRAY_900 }}>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ background: ORANGE }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GRAY_400 }}>Direction A</span>
        </div>
        <h1 className="text-5xl font-extrabold leading-none tracking-tight mb-3" style={{ letterSpacing: '-0.03em' }}>
          Radiance
        </h1>
        <p className="text-lg leading-relaxed max-w-lg" style={{ color: GRAY_600 }}>
          Pure white space interrupted only by the warmth of flame — orange and gold signal clarity, forward motion, and life.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl p-5" style={{ background: ORANGE }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Primary</p>
          <p className="text-xl font-bold text-white leading-none mb-1">Orange</p>
          <p className="text-sm text-white/80">#F07830</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>hsl(24 88% 57%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: GOLDEN }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(15,17,23,0.6)' }}>Accent</p>
          <p className="text-xl font-bold leading-none mb-1" style={{ color: GRAY_900 }}>Golden</p>
          <p className="text-sm" style={{ color: GRAY_600 }}>#F5C030</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(15,17,23,0.5)' }}>hsl(43 90% 57%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: GRAY_900 }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Surface</p>
          <p className="text-xl font-bold text-white leading-none mb-1">Near Black</p>
          <p className="text-sm text-white/70">#111827</p>
          <p className="text-xs mt-1 text-white/40">hsl(220 17% 11%)</p>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GRAY_400 }}>Primary Scale</p>
        <div className="flex h-10 rounded-xl overflow-hidden">
          {shades.map(s => (
            <div
              key={s.label}
              className="flex-1 relative group"
              style={{ background: s.hex }}
            >
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
              <span className="text-[9px]" style={{ color: GRAY_400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 p-6 rounded-2xl" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: GRAY_400 }}>Typography · Plus Jakarta Sans</p>
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: GRAY_400 }}>Display</span>
            <p className="text-5xl font-extrabold leading-none tracking-tight" style={{ letterSpacing: '-0.03em' }}>Lumen Fidei</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: GRAY_400 }}>Heading</span>
            <p className="text-2xl font-bold tracking-tight">Day 14 — Gifts of the Spirit</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: GRAY_400 }}>Body</span>
            <p className="text-base leading-relaxed" style={{ color: GRAY_600 }}>
              The Holy Spirit gives each person unique gifts for building up the Body of Christ. Discovering yours is part of the journey.
            </p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: GRAY_400 }}>Caption</span>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: GRAY_400 }}>Week 3 · Archdiocese of Chicago</p>
          </div>
        </div>
      </div>

      <div className="mb-10 flex items-center gap-4">
        <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: ORANGE }}>
          Begin Today's Lesson
        </button>
        <button className="px-6 py-3 rounded-xl font-semibold text-sm border" style={{ color: ORANGE, borderColor: ORANGE, background: ORANGE_LIGHT }}>
          View Progress
        </button>
        <button className="px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: GRAY_100, color: GRAY_600 }}>
          Settings
        </button>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GRAY_400 }}>CSS Tokens (light)</p>
        <pre className="text-xs leading-relaxed" style={{ color: GRAY_600, fontFamily: 'monospace' }}>
{`--primary:          24 88% 57%;   /* #F07830 */
--primary-foreground: 0 0% 100%;
--accent:           43 90% 57%;   /* #F5C030 */
--background:        0 0% 100%;   /* #FFFFFF */
--foreground:       220 17% 11%;  /* #111827 */
--muted:            210 16% 95%;  /* #F3F4F6 */
--muted-foreground: 220 9% 46%;   /* #6B7280 */
--border:           220 13% 91%;  /* #E5E7EB */`}
        </pre>
      </div>
    </div>
  );
}
