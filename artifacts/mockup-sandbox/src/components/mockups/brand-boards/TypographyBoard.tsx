import './_group.css';

const typeScale = [
  { name: 'Display', size: '64px', weight: '800', tracking: '-0.03em', lineHeight: '1.05', sample: 'Lumen Fidei', note: 'Hero headings, splash screens' },
  { name: 'H1', size: '48px', weight: '700', tracking: '-0.025em', lineHeight: '1.1', sample: 'A Guided Return to God', note: 'Page titles' },
  { name: 'H2', size: '36px', weight: '700', tracking: '-0.02em', lineHeight: '1.2', sample: 'Week 3 — The Holy Spirit', note: 'Section headings' },
  { name: 'H3', size: '24px', weight: '600', tracking: '-0.01em', lineHeight: '1.3', sample: 'Day 14: Gifts of the Spirit', note: 'Card headings, subheadings' },
  { name: 'Body', size: '16px', weight: '400', tracking: '0', lineHeight: '1.6', sample: 'The Holy Spirit gives each person unique gifts for building up the Body of Christ. Discovering yours is part of the journey toward wholeness.', note: 'Reading content, descriptions' },
  { name: 'Small', size: '14px', weight: '500', tracking: '0', lineHeight: '1.5', sample: 'Morning meditation · 8 min read · Day 14 of 30', note: 'UI labels, secondary text' },
  { name: 'Caption', size: '12px', weight: '600', tracking: '0.08em', lineHeight: '1.4', sample: 'WEEK 3 · ARCHDIOCESE OF CHICAGO', note: 'Labels, badges, meta (uppercase)', uppercase: true },
];

const usageRules = [
  { rule: 'Minimum body size', value: '16px', reason: 'Accessibility and reading comfort for all ages' },
  { rule: 'Minimum UI label', value: '12px', reason: 'Below this impacts legibility significantly' },
  { rule: 'Display weight', value: '700–800', reason: 'Creates clear hierarchy without extra elements' },
  { rule: 'Tracking (display)', value: '-0.03em', reason: 'Tight tracking for large weights — optical alignment' },
  { rule: 'Tracking (body)', value: '0 or default', reason: 'Never tighten body text — it impairs readability' },
  { rule: 'Line height (body)', value: '1.55–1.65', reason: 'Adequate breathing room for healing/reflective content' },
  { rule: 'No italic in UI', value: 'Prose only', reason: 'Italic reserved for scripture and quotations' },
];

export function TypographyBoard() {
  return (
    <div className="min-h-screen p-10" style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#111827' }}>
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Brand Board 2</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ letterSpacing: '-0.03em' }}>Typography</h1>
        <p style={{ color: '#6B7280' }} className="text-base">Plus Jakarta Sans · Clean, modern, no serifs</p>
      </div>

      <div className="mb-10 p-6 rounded-2xl" style={{ border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
        <div className="flex items-start gap-6 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Primary Font</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>Plus Jakarta Sans</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Variable · Google Fonts · Open Source</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Weights Used</p>
            <div className="flex gap-2 flex-wrap justify-end">
              {['400 Regular', '500 Medium', '600 SemiBold', '700 Bold', '800 ExtraBold'].map(w => (
                <span key={w} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#F3F4F6', color: '#4B5563' }}>{w}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400 }} className="text-base">Regular — The light of faith</p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }} className="text-base">Medium — The light of faith</p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }} className="text-base">SemiBold — The light of faith</p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }} className="text-base">Bold — The light of faith</p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }} className="text-base">ExtraBold — The light of faith</p>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#9CA3AF' }}>Type Scale</p>
        <div className="space-y-0">
          {typeScale.map((t, i) => (
            <div key={t.name} className="flex gap-5 py-5" style={{ borderBottom: i < typeScale.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div className="w-28 shrink-0 pt-1">
                <p className="text-sm font-semibold" style={{ color: '#374151' }}>{t.name}</p>
                <p className="text-xs font-mono" style={{ color: '#9CA3AF' }}>{t.size} / {t.weight}w</p>
                <p className="text-xs font-mono" style={{ color: '#D1D5DB' }}>{t.tracking !== '0' ? t.tracking : 'default'}</p>
              </div>
              <div className="flex-1">
                <p
                  style={{
                    fontSize: Math.min(parseInt(t.size), 48) + 'px',
                    fontWeight: parseInt(t.weight),
                    letterSpacing: t.tracking,
                    lineHeight: t.lineHeight,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    textTransform: t.uppercase ? 'uppercase' : 'none',
                    color: '#111827',
                  }}
                >
                  {t.sample}
                </p>
                <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>{t.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Usage Rules</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB', width: '200px' }}>Rule</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB', width: '120px' }}>Value</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }}>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {usageRules.map((r, i) => (
                <tr key={i} style={{ borderBottom: i < usageRules.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#374151' }}>{r.rule}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: '#F07830' }}>{r.value}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6B7280' }}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
