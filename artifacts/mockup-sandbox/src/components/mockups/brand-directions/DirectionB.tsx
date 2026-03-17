import './_group.css';

const ORANGE = '#E85C1A';
const ORANGE_LIGHT = '#FFF0E6';
const AMBER = '#F0A510';
const AMBER_LIGHT = '#FFF8E0';
const WHITE = '#FAFAF8';
const STONE_50 = '#FAFAF9';
const STONE_100 = '#F5F5F4';
const STONE_200 = '#E7E5E4';
const STONE_400 = '#A8A29E';
const STONE_600 = '#57534E';
const STONE_900 = '#1C1917';

const shades = [
  { label: '50',  hex: '#FFF5EE' },
  { label: '100', hex: '#FFE2C8' },
  { label: '200', hex: '#FFC598' },
  { label: '300', hex: '#F9A06A' },
  { label: '400', hex: '#F27840' },
  { label: '500', hex: '#E85C1A', primary: true },
  { label: '600', hex: '#C84410' },
  { label: '700', hex: '#A0320A' },
  { label: '800', hex: '#782206' },
  { label: '900', hex: '#4E1403' },
];

export function DirectionB() {
  return (
    <div className="min-h-screen p-10" style={{ background: WHITE, fontFamily: "'Geist', 'Inter', sans-serif", color: STONE_900 }}>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ background: ORANGE }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: STONE_400 }}>Direction B</span>
        </div>
        <h1 className="text-5xl font-bold leading-none mb-3" style={{ letterSpacing: '-0.025em' }}>
          Ember
        </h1>
        <p className="text-lg leading-relaxed max-w-lg" style={{ color: STONE_600 }}>
          Warmth without sentimentality. A deeper, richer fire — for people who have been through something real and need something grounded.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl p-5" style={{ background: ORANGE }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Primary</p>
          <p className="text-xl font-bold text-white leading-none mb-1">Ember</p>
          <p className="text-sm text-white/80">#E85C1A</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>hsl(20 82% 51%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: AMBER }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(15,17,23,0.6)' }}>Accent</p>
          <p className="text-xl font-bold leading-none mb-1" style={{ color: STONE_900 }}>Amber</p>
          <p className="text-sm" style={{ color: STONE_600 }}>#F0A510</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(28,25,23,0.5)' }}>hsl(38 87% 50%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: STONE_100, border: `1px solid ${STONE_200}` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: STONE_400 }}>Background</p>
          <p className="text-xl font-bold leading-none mb-1" style={{ color: STONE_900 }}>Stone White</p>
          <p className="text-sm" style={{ color: STONE_600 }}>#FAFAF8</p>
          <p className="text-xs mt-1" style={{ color: STONE_400 }}>hsl(60 9% 98%)</p>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: STONE_400 }}>Primary Scale</p>
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
              <span className="text-[9px]" style={{ color: STONE_400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 p-6 rounded-2xl" style={{ background: STONE_100, border: `1px solid ${STONE_200}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: STONE_400 }}>Typography · Geist</p>
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: STONE_400 }}>Display</span>
            <p className="text-5xl font-bold leading-none" style={{ letterSpacing: '-0.025em' }}>Lumen Fidei</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: STONE_400 }}>Heading</span>
            <p className="text-2xl font-semibold" style={{ letterSpacing: '-0.01em' }}>Day 14 — Gifts of the Spirit</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: STONE_400 }}>Body</span>
            <p className="text-base leading-relaxed" style={{ color: STONE_600 }}>
              The Holy Spirit gives each person unique gifts for building up the Body of Christ. Discovering yours is part of the journey.
            </p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs w-16 shrink-0" style={{ color: STONE_400 }}>Caption</span>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: STONE_400 }}>Week 3 · Archdiocese of Chicago</p>
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
        <button className="px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: STONE_200, color: STONE_600 }}>
          Settings
        </button>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: STONE_100, border: `1px solid ${STONE_200}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: STONE_400 }}>CSS Tokens (light)</p>
        <pre className="text-xs leading-relaxed" style={{ color: STONE_600, fontFamily: 'monospace' }}>
{`--primary:          20 82% 51%;   /* #E85C1A */
--primary-foreground: 0 0% 100%;
--accent:           38 87% 50%;   /* #F0A510 */
--background:       60 9% 98%;    /* #FAFAF8 */
--foreground:       20 11% 11%;   /* #1C1917 */
--muted:            60 5% 96%;    /* #F5F5F4 */
--muted-foreground: 25 5% 45%;    /* #57534E */
--border:           30 6% 89%;    /* #E7E5E4 */`}
        </pre>
      </div>
    </div>
  );
}
