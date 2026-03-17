import './_group.css';

/* ─── OKLCH Shade Ramps ─────────────────────────────────── */
const oklchOrange = [
  { step: '50',  hex: '#FFF7F0', oklch: '0.98 0.015 51',  text: '#5E230A' },
  { step: '100', hex: '#FFE9D6', oklch: '0.95 0.038 51',  text: '#5E230A' },
  { step: '200', hex: '#FFD0A8', oklch: '0.89 0.075 51',  text: '#5E230A' },
  { step: '300', hex: '#FCA974', oklch: '0.80 0.125 50',  text: '#5E230A' },
  { step: '400', hex: '#FA8F51', oklch: '0.73 0.160 50',  text: '#fff' },
  { step: '500', hex: '#F07830', oklch: '0.67 0.185 50',  text: '#fff', primary: true },
  { step: '600', hex: '#E56120', oklch: '0.60 0.180 48',  text: '#fff' },
  { step: '700', hex: '#BE4C14', oklch: '0.50 0.160 46',  text: '#fff' },
  { step: '800', hex: '#8E380E', oklch: '0.38 0.130 44',  text: '#fff' },
  { step: '900', hex: '#5E230A', oklch: '0.25 0.100 42',  text: '#fff' },
];

const oklchGold = [
  { step: '50',  hex: '#FFFBF0', oklch: '0.98 0.015 85',  text: '#573903' },
  { step: '100', hex: '#FFF1C4', oklch: '0.96 0.045 85',  text: '#573903' },
  { step: '200', hex: '#FFE475', oklch: '0.92 0.100 85',  text: '#573903' },
  { step: '300', hex: '#FDD44A', oklch: '0.88 0.140 85',  text: '#573903' },
  { step: '400', hex: '#FBCB30', oklch: '0.85 0.158 85',  text: '#573903' },
  { step: '500', hex: '#F5C030', oklch: '0.82 0.168 85',  text: '#573903', primary: true },
  { step: '600', hex: '#E0A010', oklch: '0.74 0.165 78',  text: '#fff' },
  { step: '700', hex: '#B87D08', oklch: '0.62 0.145 75',  text: '#fff' },
  { step: '800', hex: '#875B05', oklch: '0.48 0.120 70',  text: '#fff' },
  { step: '900', hex: '#573903', oklch: '0.34 0.095 65',  text: '#fff' },
];

const oklchGray = [
  { step: '50',  hex: '#F9FAFB', oklch: '0.98 0.006 250', text: '#111827' },
  { step: '100', hex: '#F3F4F6', oklch: '0.96 0.010 250', text: '#111827' },
  { step: '200', hex: '#E5E7EB', oklch: '0.92 0.013 250', text: '#111827' },
  { step: '300', hex: '#D1D5DB', oklch: '0.86 0.015 250', text: '#111827' },
  { step: '400', hex: '#9CA3AF', oklch: '0.70 0.018 250', text: '#fff' },
  { step: '500', hex: '#6B7280', oklch: '0.56 0.018 250', text: '#fff', primary: true },
  { step: '600', hex: '#4B5563', oklch: '0.44 0.017 250', text: '#fff' },
  { step: '700', hex: '#374151', oklch: '0.34 0.016 250', text: '#fff' },
  { step: '800', hex: '#1F2937', oklch: '0.24 0.014 250', text: '#fff' },
  { step: '900', hex: '#111827', oklch: '0.16 0.012 250', text: '#fff' },
];

/* ─── WCAG Contrast Audit ────────────────────────────────── */
const wcagPairs = [
  { fg: '#111827', bg: '#FFFFFF', fgName: 'Foreground', bgName: 'Background', ratio: '18.3:1', wcag: 'AAA', note: 'Body text — primary reading pair' },
  { fg: '#FFFFFF', bg: '#F07830', fgName: 'White', bgName: 'Primary orange', ratio: '2.8:1', wcag: 'FAIL', note: 'Below 3:1 — avoid white body text on primary' },
  { fg: '#111827', bg: '#F07830', fgName: 'Foreground', bgName: 'Primary orange', ratio: '6.6:1', wcag: 'AA', note: 'Dark text on orange button — preferred' },
  { fg: '#6B7280', bg: '#FFFFFF', fgName: 'Muted (Gray-500)', bgName: 'Background', ratio: '4.9:1', wcag: 'AA', note: 'Captions / meta on white' },
  { fg: '#4B5563', bg: '#FFFFFF', fgName: 'Gray-600', bgName: 'Background', ratio: '7.4:1', wcag: 'AAA', note: 'Secondary text — preferred for labels' },
  { fg: '#111827', bg: '#F3F4F6', fgName: 'Foreground', bgName: 'Surface (Gray-100)', ratio: '16.7:1', wcag: 'AAA', note: 'Text on card/muted background' },
  { fg: '#111827', bg: '#F5C030', fgName: 'Foreground', bgName: 'Accent gold', ratio: '10.9:1', wcag: 'AAA', note: 'Text on gold badges — excellent' },
  { fg: '#FFFFFF', bg: '#E56120', fgName: 'White', bgName: 'Orange-600', ratio: '3.4:1', wcag: 'AA Lg', note: 'Large text / icons only on Orange-600' },
  { fg: '#9CA3AF', bg: '#FFFFFF', fgName: 'Gray-400', bgName: 'Background', ratio: '2.5:1', wcag: 'FAIL', note: 'Placeholder / decorative only — never text' },
  { fg: '#F9FAFB', bg: '#111827', fgName: 'Gray-50', bgName: 'Dark bg', ratio: '18.3:1', wcag: 'AAA', note: 'Dark mode body text' },
  { fg: '#F5A050', bg: '#111827', fgName: 'Primary dark (#F5A050)', bgName: 'Dark bg', ratio: '6.2:1', wcag: 'AA', note: 'Dark mode primary — shifted +7° lighter' },
  { fg: '#9CA3AF', bg: '#111827', fgName: 'Muted dark', bgName: 'Dark bg', ratio: '5.4:1', wcag: 'AA', note: 'Dark mode muted text' },
];

/* ─── Font Evaluation ────────────────────────────────────── */
const fonts = [
  {
    name: 'Plus Jakarta Sans',
    type: 'Variable (200–800)',
    source: 'Google Fonts',
    use: 'Recommended — all UI',
    verdict: 'CHOSEN',
    notes: 'Geometric-humanist sans. Excellent variable support. Optimal at display (700–800) and body (400–500). Highest typographic flexibility.',
  },
  {
    name: 'Afacad',
    type: 'Variable (400–700)',
    source: 'Self-hosted (client/src/assets/fonts)',
    use: 'Body text (16px+)',
    verdict: 'SECONDARY',
    notes: 'Same geometric-humanist DNA. Slightly softer stroke contrast — warmer at reading sizes. Could pair: Afacad body + Plus Jakarta Sans headings. Adds a local font load instead of Google CDN.',
  },
];

/* ─── Components ─────────────────────────────────────────── */
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>
      {children}
    </p>
  );
}

function OklchRamp({ label, ramp }: { label: string; ramp: typeof oklchOrange }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>{label}</p>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex h-10">
          {ramp.map(s => (
            <div key={s.step} className="flex-1 relative" style={{ background: s.hex }}>
              {s.primary && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white/80" /></div>}
            </div>
          ))}
        </div>
        <div style={{ background: '#F9FAFB' }}>
          {ramp.map(s => (
            <div
              key={s.step}
              className="inline-block"
              style={{ width: `${100 / ramp.length}%`, verticalAlign: 'top', padding: '4px 4px 4px 6px', borderRight: '1px solid #F3F4F6' }}
            >
              <p className="text-[9px] font-bold" style={{ color: '#374151' }}>{s.step}</p>
              <p className="text-[8px] font-mono" style={{ color: '#6B7280' }}>{s.hex}</p>
              <p className="text-[8px] font-mono leading-tight" style={{ color: '#9CA3AF' }}>oklch({s.oklch})</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandHandoff() {
  return (
    <div className="min-h-screen p-10" style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#111827' }}>
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Brand Board 5 · Implementation Handoff</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ letterSpacing: '-0.03em' }}>Design Tokens & Audit</h1>
        <p style={{ color: '#6B7280' }} className="text-base">OKLCH ramps · WCAG verification · Font evaluation · Copy-paste tokens</p>
      </div>

      {/* OKLCH Ramps */}
      <div className="mb-10">
        <SectionLabel>OKLCH Shade Ramps (perceptual lightness)</SectionLabel>
        <p className="text-xs mb-4 -mt-2" style={{ color: '#9CA3AF' }}>
          Values use oklch(L C H) — L is perceptual lightness (0–1), C is chroma (0–0.4), H is hue angle (0–360°). Steps are perceptually uniform.
        </p>
        <OklchRamp label="Primary — Orange" ramp={oklchOrange} />
        <OklchRamp label="Accent — Golden" ramp={oklchGold} />
        <OklchRamp label="Neutral — Cool Gray" ramp={oklchGray} />
      </div>

      {/* WCAG Contrast Audit */}
      <div className="mb-10">
        <SectionLabel>WCAG 2.2 Contrast Audit — All semantic pairs</SectionLabel>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Foreground', 'Background', 'Preview', 'Ratio', 'WCAG', 'Usage note'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wcagPairs.map((row, i) => {
                const isPass = row.wcag !== 'FAIL';
                const isAAA = row.wcag === 'AAA';
                const isAA = row.wcag === 'AA';
                const isAALg = row.wcag === 'AA Lg';
                return (
                  <tr key={i} style={{ borderBottom: i < wcagPairs.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: row.fg, border: '1px solid #E5E7EB' }} />
                        <span className="text-xs" style={{ color: '#374151' }}>{row.fgName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: row.bg, border: '1px solid #E5E7EB' }} />
                        <span className="text-xs" style={{ color: '#374151' }}>{row.bgName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold"
                        style={{ background: row.bg, color: row.fg, border: row.bg === '#FFFFFF' ? '1px solid #E5E7EB' : 'none' }}>
                        Aa
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-mono font-semibold" style={{ color: '#374151' }}>{row.ratio}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                        background: isAAA ? '#D1FAE5' : isAA ? '#DBEAFE' : isAALg ? '#FEF3C7' : '#FEE2E2',
                        color: isAAA ? '#065F46' : isAA ? '#1E40AF' : isAALg ? '#92400E' : '#991B1B',
                      }}>
                        {row.wcag}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: '#9CA3AF' }}>{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
          AA = 4.5:1+ normal text · AA Large = 3:1+ large text ≥18pt or ≥14pt bold · AAA = 7:1+
        </p>
      </div>

      {/* Font Evaluation */}
      <div className="mb-10">
        <SectionLabel>Font Evaluation — Plus Jakarta Sans vs. Afacad</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          {fonts.map(f => (
            <div key={f.name} className="rounded-xl p-5" style={{
              background: f.verdict === 'CHOSEN' ? '#FFF7F0' : '#F9FAFB',
              border: `1px solid ${f.verdict === 'CHOSEN' ? '#FFD0A8' : '#E5E7EB'}`,
            }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-lg font-extrabold" style={{ fontFamily: f.name + ', sans-serif', letterSpacing: '-0.02em', color: '#111827' }}>
                  {f.name}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                  background: f.verdict === 'CHOSEN' ? '#F07830' : '#E5E7EB',
                  color: f.verdict === 'CHOSEN' ? '#fff' : '#6B7280',
                }}>
                  {f.verdict}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs" style={{ color: '#6B7280' }}><strong>Type:</strong> {f.type}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}><strong>Source:</strong> {f.source}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}><strong>Use:</strong> {f.use}</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ fontFamily: f.name + ', sans-serif', color: '#374151' }}>
                {f.notes}
              </p>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p className="text-2xl font-bold leading-tight" style={{ fontFamily: f.name + ', sans-serif', letterSpacing: '-0.02em' }}>Lumen Fidei</p>
                <p className="text-sm leading-relaxed mt-1" style={{ fontFamily: f.name + ', sans-serif', color: '#6B7280' }}>
                  The light shines in the darkness, and the darkness has not overcome it.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Copy-paste tokens */}
      <div className="mb-10">
        <SectionLabel>Copy-paste tokens (client/src/index.css)</SectionLabel>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: '#1F2937', borderBottom: '1px solid #374151' }}>
            <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>tokens.css → :root</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#374151', color: '#D1D5DB' }}>artifacts/brand-guidelines/tokens.css</span>
          </div>
          <pre className="p-4 text-xs leading-relaxed overflow-x-auto" style={{ background: '#111827', color: '#D1D5DB', fontFamily: 'monospace', margin: 0, maxHeight: 280 }}>
{`--primary:           24 88% 57%;   /* #F07830 — logo orange  */
--primary-foreground: 0 0% 100%;
--accent:            43 90% 57%;   /* #F5C030 — logo golden  */
--accent-foreground: 220 17% 11%;
--background:         0 0% 100%;   /* #FFFFFF                 */
--foreground:        220 17% 11%;  /* #111827                 */
--card:               0 0% 100%;
--card-foreground:   220 17% 11%;
--muted:             220 14% 96%;  /* #F3F4F6                 */
--muted-foreground:  220  9% 46%;  /* #6B7280                 */
--border:            220 13% 91%;  /* #E5E7EB                 */
--input:             220 13% 91%;
--ring:               24 88% 57%;
--radius:            0.625rem;     /* 10px                    */

/* .dark { */
/*   --primary:         28 88% 64%;  /* #F5A050 lighter orange  */
/*   --background:     220 17% 11%;  /* #111827                 */
/*   --foreground:     210 20% 98%;  /* #F9FAFB                 */
/*   --card:           215 25% 17%;  /* #1F2937                 */
/*   --border:         217 19% 27%;  /* #374151                 */
/* }`}
          </pre>
        </div>
      </div>

      {/* Tailwind config */}
      <div>
        <SectionLabel>Copy-paste Tailwind config (tailwind.config.ts)</SectionLabel>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: '#1F2937', borderBottom: '1px solid #374151' }}>
            <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>tailwind-colors.ts</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#374151', color: '#D1D5DB' }}>artifacts/brand-guidelines/tailwind-colors.ts</span>
          </div>
          <pre className="p-4 text-xs leading-relaxed overflow-x-auto" style={{ background: '#111827', color: '#D1D5DB', fontFamily: 'monospace', margin: 0 }}>
{`// tailwind.config.ts → theme.extend
colors: {
  primary:  { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
  accent:   { DEFAULT: "hsl(var(--accent))",  foreground: "hsl(var(--accent-foreground))" },
  orange: {
    "50": "hsl(var(--orange-50))",  "100": "hsl(var(--orange-100))",
    "500": "hsl(var(--orange-500))", "600": "hsl(var(--orange-600))",
    "900": "hsl(var(--orange-900))",
  },
  gold: {
    "50": "hsl(var(--gold-50))",  "500": "hsl(var(--gold-500))",
    "600": "hsl(var(--gold-600))", "900": "hsl(var(--gold-900))",
  },
},
fontFamily: {
  sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
  mono: ["Geist Mono", "ui-monospace", "monospace"],
},`}
          </pre>
        </div>
      </div>
    </div>
  );
}
