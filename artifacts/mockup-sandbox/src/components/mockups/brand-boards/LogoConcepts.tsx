import './_group.css';

function MonstranceSVG({ size = 48, dark = false }: { size?: number; dark?: boolean }) {
  const cx = size / 2;
  const cy = size / 2;
  const hostR = size * 0.175;
  const ringR = size * 0.24;
  const rayInner = size * 0.27;
  const rayOuter = size * 0.46;
  const numRays = 16;
  const orange = dark ? '#F5A050' : '#F07830';
  const gold = dark ? '#FFD44A' : '#F5C030';
  const dark1 = dark ? '#FFF7F0' : '#8E380E';

  const rays = Array.from({ length: numRays }, (_, i) => {
    const angle = (i / numRays) * 2 * Math.PI - Math.PI / 2;
    const isLong = i % 2 === 0;
    const outerR = isLong ? rayOuter : (rayOuter * 0.78);
    const innerR = rayInner;
    const halfWidth = Math.PI / numRays * 0.4;
    const x1 = cx + innerR * Math.cos(angle - halfWidth);
    const y1 = cy + innerR * Math.sin(angle - halfWidth);
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy + outerR * Math.sin(angle);
    const x3 = cx + innerR * Math.cos(angle + halfWidth);
    const y3 = cy + innerR * Math.sin(angle + halfWidth);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)}Z`;
  });

  const stemH = size * 0.12;
  const stemY = cy + ringR;
  const baseW = size * 0.22;
  const baseY = stemY + stemH;
  const stemX = cx - size * 0.025;
  const stemW = size * 0.05;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`ray-grad-${size}-${dark ? 'd' : 'l'}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} />
          <stop offset="100%" stopColor={orange} />
        </radialGradient>
        <radialGradient id={`ring-grad-${size}-${dark ? 'd' : 'l'}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={orange} />
          <stop offset="100%" stopColor={dark1} />
        </radialGradient>
      </defs>
      {rays.map((d, i) => (
        <path key={i} d={d} fill={`url(#ray-grad-${size}-${dark ? 'd' : 'l'})`} />
      ))}
      <circle cx={cx} cy={cy} r={ringR} fill={`url(#ring-grad-${size}-${dark ? 'd' : 'l'})`} />
      <circle cx={cx} cy={cy} r={hostR} fill={dark ? '#1F2937' : '#fff'} />
      <circle cx={cx} cy={cy} r={hostR * 0.55} fill={orange} opacity={0.3} />
      <rect x={stemX} y={stemY} width={stemW} height={stemH} fill={orange} rx={stemW * 0.3} />
      <rect x={cx - baseW / 2} y={baseY} width={baseW} height={stemH * 0.4} fill={orange} rx={2} />
    </svg>
  );
}

function LogoWordmark({ dark = false }: { dark?: boolean }) {
  const text = dark ? '#F9FAFB' : '#111827';
  const sub = dark ? '#9CA3AF' : '#6B7280';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <MonstranceSVG size={44} dark={dark} />
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: text, letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
          Lumen Fidei
        </p>
        <p style={{ fontSize: 10, fontWeight: 600, color: sub, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          A 30-Day Formation Program
        </p>
      </div>
    </div>
  );
}

function LogoStacked({ dark = false }: { dark?: boolean }) {
  const text = dark ? '#F9FAFB' : '#111827';
  const sub = dark ? '#9CA3AF' : '#6B7280';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <MonstranceSVG size={64} dark={dark} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: text, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1, fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
          Lumen Fidei
        </p>
        <p style={{ fontSize: 9, fontWeight: 600, color: sub, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Archdiocese of Chicago
        </p>
      </div>
    </div>
  );
}

function LogoIcon({ dark = false, size = 80 }: { dark?: boolean; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: dark ? '#1F2937' : '#FFF7F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: dark ? 'none' : '0 2px 8px rgba(240,120,48,0.15)',
    }}>
      <MonstranceSVG size={size * 0.72} dark={dark} />
    </div>
  );
}

function VariantRow({ label, node, bg }: { label: string; node: React.ReactNode; bg: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      <div style={{ background: bg, padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
        {node}
      </div>
      <div style={{ background: '#F9FAFB', padding: '10px 16px', borderTop: '1px solid #E5E7EB' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
      </div>
    </div>
  );
}

export function LogoConcepts() {
  return (
    <div className="min-h-screen p-10" style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#111827' }}>
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Brand Board 4</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ letterSpacing: '-0.03em' }}>Logo Concepts</h1>
        <p style={{ color: '#6B7280' }} className="text-base">Monstrance mark · 3 variations · Light & dark</p>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Variation 1 — Wordmark</p>
        <div className="grid grid-cols-2 gap-4">
          <VariantRow label="On light" node={<LogoWordmark dark={false} />} bg="#FFFFFF" />
          <VariantRow label="On dark" node={<LogoWordmark dark={true} />} bg="#111827" />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Variation 2 — Stacked</p>
        <div className="grid grid-cols-2 gap-4">
          <VariantRow label="On light" node={<LogoStacked dark={false} />} bg="#FFFFFF" />
          <VariantRow label="On dark" node={<LogoStacked dark={true} />} bg="#111827" />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Variation 3 — Icon Only (App Icon)</p>
        <div className="grid grid-cols-4 gap-4">
          <VariantRow label="80px light" node={<LogoIcon size={80} dark={false} />} bg="#FFFFFF" />
          <VariantRow label="80px dark" node={<LogoIcon size={80} dark={true} />} bg="#111827" />
          <VariantRow label="48px light" node={<LogoIcon size={48} dark={false} />} bg="#FFFFFF" />
          <VariantRow label="32px light" node={<LogoIcon size={32} dark={false} />} bg="#FFFFFF" />
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#FFF7F0', border: '1px solid #FFD0A8' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>Logo Usage Rules</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {[
            ['Minimum size (icon only)', '24px'],
            ['Minimum size (wordmark)', '120px wide'],
            ['Clear space', '0.5× icon height on all sides'],
            ['Don\'t use on low-contrast backgrounds', 'Always ensure 3:1+ contrast'],
            ['Don\'t stretch or distort', 'Scale proportionally only'],
            ['Don\'t change colors independently', 'Use approved color combos'],
          ].map(([rule, val], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{rule}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#E56120', shrink: 0 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
