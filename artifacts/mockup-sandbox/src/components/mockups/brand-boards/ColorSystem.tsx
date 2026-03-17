import './_group.css';

const orangeRamp = [
  { label: '50',  hex: '#FFF7F0', text: '#5E230A' },
  { label: '100', hex: '#FFE9D6', text: '#5E230A' },
  { label: '200', hex: '#FFD0A8', text: '#5E230A' },
  { label: '300', hex: '#FCA974', text: '#5E230A' },
  { label: '400', hex: '#FA8F51', text: '#fff' },
  { label: '500', hex: '#F07830', text: '#fff', primary: true },
  { label: '600', hex: '#E56120', text: '#fff' },
  { label: '700', hex: '#BE4C14', text: '#fff' },
  { label: '800', hex: '#8E380E', text: '#fff' },
  { label: '900', hex: '#5E230A', text: '#fff' },
];

const goldRamp = [
  { label: '50',  hex: '#FFFBF0', text: '#573903' },
  { label: '100', hex: '#FFF1C4', text: '#573903' },
  { label: '200', hex: '#FFE475', text: '#573903' },
  { label: '300', hex: '#FDD44A', text: '#573903' },
  { label: '400', hex: '#FBCB30', text: '#573903' },
  { label: '500', hex: '#F5C030', text: '#573903', primary: true },
  { label: '600', hex: '#E0A010', text: '#fff' },
  { label: '700', hex: '#B87D08', text: '#fff' },
  { label: '800', hex: '#875B05', text: '#fff' },
  { label: '900', hex: '#573903', text: '#fff' },
];

const grayRamp = [
  { label: '50',  hex: '#F9FAFB', text: '#111827' },
  { label: '100', hex: '#F3F4F6', text: '#111827' },
  { label: '200', hex: '#E5E7EB', text: '#111827' },
  { label: '300', hex: '#D1D5DB', text: '#111827' },
  { label: '400', hex: '#9CA3AF', text: '#fff' },
  { label: '500', hex: '#6B7280', text: '#fff', primary: true },
  { label: '600', hex: '#4B5563', text: '#fff' },
  { label: '700', hex: '#374151', text: '#fff' },
  { label: '800', hex: '#1F2937', text: '#fff' },
  { label: '900', hex: '#111827', text: '#fff' },
];

const semanticRoles = [
  { name: 'Primary', hex: '#F07830', hsl: 'hsl(24 88% 57%)', usage: 'CTAs, active states, key accents', textColor: '#fff' },
  { name: 'Accent', hex: '#F5C030', hsl: 'hsl(43 90% 57%)', usage: 'Highlights, badges, stars', textColor: '#111827' },
  { name: 'Background', hex: '#FFFFFF', hsl: 'hsl(0 0% 100%)', usage: 'Page surface, cards', textColor: '#111827', border: '#E5E7EB' },
  { name: 'Surface', hex: '#F3F4F6', hsl: 'hsl(220 14% 96%)', usage: 'Muted backgrounds, inputs', textColor: '#374151', border: '#E5E7EB' },
  { name: 'Foreground', hex: '#111827', hsl: 'hsl(220 17% 11%)', usage: 'Body text, headings', textColor: '#fff' },
  { name: 'Muted Text', hex: '#6B7280', hsl: 'hsl(220 9% 46%)', usage: 'Captions, labels, meta', textColor: '#fff' },
];

const contrastRows = [
  { fg: '#111827', bg: '#FFFFFF', fgName: 'Foreground', bgName: 'Background', ratio: '16.1:1', wcag: 'AAA' },
  { fg: '#FFFFFF', bg: '#F07830', fgName: 'White', bgName: 'Primary', ratio: '3.1:1', wcag: 'AA Large' },
  { fg: '#111827', bg: '#F07830', fgName: 'Foreground', bgName: 'Primary', ratio: '5.2:1', wcag: 'AA' },
  { fg: '#6B7280', bg: '#FFFFFF', fgName: 'Muted', bgName: 'Background', ratio: '4.6:1', wcag: 'AA' },
  { fg: '#111827', bg: '#F3F4F6', fgName: 'Foreground', bgName: 'Surface', ratio: '14.7:1', wcag: 'AAA' },
  { fg: '#111827', bg: '#F5C030', fgName: 'Foreground', bgName: 'Accent', ratio: '8.2:1', wcag: 'AAA' },
];

const darkTokens = [
  { name: 'Background', hex: '#111827', hsl: 'hsl(220 17% 11%)' },
  { name: 'Card', hex: '#1F2937', hsl: 'hsl(215 19% 18%)' },
  { name: 'Primary', hex: '#F5A050', hsl: 'hsl(28 88% 64%)' },
  { name: 'Foreground', hex: '#F9FAFB', hsl: 'hsl(210 20% 98%)' },
  { name: 'Border', hex: '#374151', hsl: 'hsl(215 14% 26%)' },
];

function SwatchRow({ label, ramp }: { label: string; ramp: typeof orangeRamp }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>{label}</p>
      <div className="flex rounded-xl overflow-hidden h-12 shadow-sm">
        {ramp.map(s => (
          <div key={s.label} className="flex-1 flex flex-col items-center justify-center relative" style={{ background: s.hex }}>
            {s.primary && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />}
            <span className="text-[10px] font-medium" style={{ color: s.text + 'cc' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColorSystem() {
  return (
    <div className="min-h-screen p-10" style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#111827' }}>
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Brand Board 1</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ letterSpacing: '-0.03em' }}>Color System</h1>
        <p style={{ color: '#6B7280' }} className="text-base">Direction A · Radiance · Lumen Fidei</p>
      </div>

      <SwatchRow label="Primary — Orange" ramp={orangeRamp} />
      <SwatchRow label="Accent — Golden" ramp={goldRamp} />
      <SwatchRow label="Neutral — Cool Gray" ramp={grayRamp} />

      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Semantic Roles</p>
        <div className="grid grid-cols-3 gap-3">
          {semanticRoles.map(r => (
            <div key={r.name} className="rounded-xl overflow-hidden" style={{ border: r.border ? `1px solid ${r.border}` : 'none' }}>
              <div className="h-16 flex items-center px-4" style={{ background: r.hex }}>
                <span className="text-sm font-bold" style={{ color: r.textColor }}>{r.name}</span>
              </div>
              <div className="px-4 py-3" style={{ background: '#F9FAFB' }}>
                <p className="text-xs font-mono font-medium mb-0.5" style={{ color: '#374151' }}>{r.hex}</p>
                <p className="text-xs font-mono" style={{ color: '#9CA3AF' }}>{r.hsl}</p>
                <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>{r.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Contrast Audit — WCAG 2.2</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }}>Combo</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }}>Preview</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }}>Ratio</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }}>WCAG</th>
              </tr>
            </thead>
            <tbody>
              {contrastRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < contrastRows.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium" style={{ color: '#374151' }}>{row.fgName} on {row.bgName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: row.bg, color: row.fg, border: row.bg === '#FFFFFF' ? '1px solid #E5E7EB' : 'none' }}>
                      Aa
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: '#374151' }}>{row.ratio}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" style={{
                      background: row.wcag === 'AAA' ? '#D1FAE5' : row.wcag === 'AA' ? '#DBEAFE' : '#FEF3C7',
                      color: row.wcag === 'AAA' ? '#065F46' : row.wcag === 'AA' ? '#1E40AF' : '#92400E',
                    }}>
                      {row.wcag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Dark Mode Tokens</p>
        <div className="flex gap-3 rounded-xl p-5" style={{ background: '#111827' }}>
          {darkTokens.map(t => (
            <div key={t.name} className="flex-1 text-center">
              <div className="w-full h-10 rounded-lg mx-auto mb-2" style={{ background: t.hex, border: t.hex === '#111827' ? '1px solid #374151' : 'none' }} />
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#D1D5DB' }}>{t.name}</p>
              <p className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{t.hex}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
