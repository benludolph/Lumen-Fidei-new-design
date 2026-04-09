import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";

interface PotBandageSceneProps {
  onComplete?: () => void;
}

// ─── Crack definitions ───────────────────────────────────────────────────────
// cx/cy = center of the crack hotspot, relative to the 500×540 SVG pot viewport.
// ASSET: swap crackPath with actual image crack overlays if desired.
const CRACKS = [
  {
    id: 0,
    label: "Quick Fix",
    // Upper-left face crack
    crackPath: "M148,118 l4,10 l-3,8 l5,12 l-2,7",
    waterX: 150, waterY: 153,
    hotX: 132, hotY: 112, hotW: 40, hotH: 60,
    bandageX: 85,  bandageY: 100,
  },
  {
    id: 1,
    label: "Quick Prayer",
    // Mid-right belly crack
    crackPath: "M218,200 l-5,9 l4,7 l-6,11 l3,6",
    waterX: 215, waterY: 233,
    hotX: 203, hotY: 194, hotW: 40, hotH: 60,
    bandageX: 158, bandageY: 185,
  },
  {
    id: 2,
    label: "Quick Deliverance",
    // Lower-left side crack
    crackPath: "M130,278 l5,8 l-4,9 l6,10 l-3,8",
    waterX: 133, waterY: 313,
    hotX: 115, hotY: 272, hotW: 42, hotH: 62,
    bandageX: 60,  bandageY: 264,
  },
] as const;

// ─── Shard geometry ──────────────────────────────────────────────────────────
// 10 shards radiating outward from the pot centre.
const SHARDS = Array.from({ length: 10 }, (_, i) => {
  const angleDeg = i * 36;
  const angleRad = (angleDeg * Math.PI) / 180;
  const dist = 180 + Math.random() * 60; // pixels to travel
  return {
    id: i,
    dx: Math.cos(angleRad) * dist,
    dy: Math.sin(angleRad) * dist,
    rotate: angleDeg + (Math.random() - 0.5) * 60,
    size: 14 + Math.random() * 18,
    color: i % 2 === 0 ? "#7a4e2a" : "#5c3618",
  };
});

// ─── CSS keyframe injection ───────────────────────────────────────────────────
// Injected once into <head>; gives us water-flow and drip animations.
const KEYFRAMES = `
@keyframes waterFlow {
  0%   { transform: translateY(0px) scaleX(1);   opacity: 0.7; }
  50%  { transform: translateY(18px) scaleX(0.8); opacity: 0.9; }
  100% { transform: translateY(36px) scaleX(1);   opacity: 0; }
}
@keyframes drip {
  0%   { transform: translateY(0px);  opacity: 0.8; }
  80%  { transform: translateY(28px); opacity: 0.6; }
  100% { transform: translateY(34px); opacity: 0; }
}
`;

function injectKeyframes() {
  if (document.getElementById("pot-scene-kf")) return;
  const style = document.createElement("style");
  style.id = "pot-scene-kf";
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

// ─── Water stream sub-component ───────────────────────────────────────────────
function WaterStream({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Main flowing strip — always running from crack start */}
      <rect
        x={x - 3} y={y}
        width={6} height={28}
        rx={3}
        fill="rgba(100,180,255,0.55)"
        style={{
          animation: active ? "waterFlow 0.9s linear infinite" : "waterFlow 0.9s linear infinite",
          transformOrigin: `${x}px ${y}px`,
        }}
      />
      {/* Drip */}
      <circle
        cx={x} cy={y + 28}
        r={3.5}
        fill="rgba(130,200,255,0.45)"
        style={{
          animation: active ? "drip 1.2s ease-in infinite 0.4s" : "drip 1.2s ease-in infinite 0.4s",
        }}
      />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PotBandageScene({ onComplete }: PotBandageSceneProps) {
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"idle" | "shaking" | "exploded">("idle");
  const [potRef, animatePot] = useAnimate();
  const completeCalledRef = useRef(false);

  useEffect(() => {
    injectKeyframes();
  }, []);

  const handleCrackClick = async (id: number) => {
    if (applied.has(id) || phase !== "idle") return;
    const next = new Set(applied);
    next.add(id);
    setApplied(next);

    if (next.size === 3) {
      // All bandages applied — wait, shake, then explode
      await new Promise(r => setTimeout(r, 700));
      setPhase("shaking");
      await animatePot(potRef.current, {
        x: [-8, 8, -7, 7, -5, 5, -3, 3, 0],
        y: [0, -2, 2, -2, 1, -1, 0],
      }, { duration: 0.55, ease: "easeInOut" });
      await animatePot(potRef.current, { opacity: 0, scale: 1.1 }, { duration: 0.22 });
      setPhase("exploded");
      // Unlock CONTINUE after shards have flown
      setTimeout(() => {
        if (!completeCalledRef.current) {
          completeCalledRef.current = true;
          onComplete?.();
        }
      }, 1100);
    }
  };

  const allApplied = applied.size === 3;

  return (
    <div
      className="flex items-center justify-center w-full"
      data-testid="slide-scene-pot"
      style={{ padding: "12px 0" }}
    >
      {/* ── Outer scene frame ────────────────────────────────────────────── */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "min(700px, 100%)",
          aspectRatio: "1 / 1",
          borderRadius: 16,
          // Painterly dark background
          background:
            "radial-gradient(ellipse 75% 65% at 50% 55%, #1c110a 0%, #0d0806 70%, #060404 100%)",
          boxShadow: "0 0 60px rgba(0,0,0,0.7) inset",
          overflow: "hidden",
        }}
      >
        {/* Subtle vignette ring */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)",
            pointerEvents: "none", zIndex: 10,
          }}
        />

        {/* ── Pot container — animated for shake + fade-out ────────────── */}
        {/* ASSET: If you have /public/assets/pot-base.png, swap the SVG below
            with <img src="/public/assets/pot-base.png" style={{ width: "100%", height: "100%" }} /> */}
        <motion.div
          ref={potRef}
          style={{ position: "relative", width: "76%", maxWidth: 380, zIndex: 5 }}
        >
          <svg
            viewBox="0 0 320 380"
            width="100%"
            style={{ overflow: "visible", filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.7))" }}
          >
            <defs>
              <radialGradient id="potGrad" cx="38%" cy="32%" r="65%">
                <stop offset="0%"  stopColor="#a0682c" />
                <stop offset="55%" stopColor="#7a4e1e" />
                <stop offset="100%" stopColor="#3a2008" />
              </radialGradient>
              <radialGradient id="potShine" cx="32%" cy="25%" r="45%">
                <stop offset="0%"  stopColor="rgba(255,220,160,0.18)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <filter id="potShadow">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.55" />
              </filter>
            </defs>

            {/* ── Pot body ──────────────────────────────────────────────── */}
            {/* ASSET: replace this group with an <image> tag if you have pot-base.png */}
            <g filter="url(#potShadow)">
              {/* Foot / base */}
              <ellipse cx="160" cy="356" rx="72" ry="16" fill="#3a2008" />
              {/* Body */}
              <path
                d="M100,170 Q68,240 72,300 Q80,350 160,358 Q240,350 248,300 Q252,240 220,170 Z"
                fill="url(#potGrad)"
              />
              {/* Shoulder / widest belly highlight */}
              <path
                d="M100,170 Q90,200 88,230 Q160,250 232,230 Q230,200 220,170 Z"
                fill="rgba(255,220,160,0.08)"
              />
              {/* Neck */}
              <path
                d="M130,100 Q118,130 108,160 L212,160 Q202,130 190,100 Z"
                fill="#7a4e1e"
              />
              {/* Rim */}
              <ellipse cx="160" cy="100" rx="52" ry="14" fill="#8c5a22" />
              <ellipse cx="160" cy="96" rx="46" ry="10" fill="#6b3d10" />
              {/* Opening inside */}
              <ellipse cx="160" cy="94" rx="40" ry="8" fill="#2a1505" />
              {/* Shine overlay */}
              <path
                d="M100,170 Q68,240 72,300 Q80,350 160,358 Q240,350 248,300 Q252,240 220,170 Z"
                fill="url(#potShine)"
              />
              {/* Handles */}
              <path d="M72,210 Q48,210 50,235 Q52,260 74,258" fill="none" stroke="#6b3d10" strokeWidth="12" strokeLinecap="round" />
              <path d="M248,210 Q272,210 270,235 Q268,260 246,258" fill="none" stroke="#6b3d10" strokeWidth="12" strokeLinecap="round" />
            </g>

            {/* ── Cracks ──────────────────────────────────────────────────── */}
            {/* ASSET: replace each path with a crack overlay image if desired */}
            {CRACKS.map(c => (
              <g key={c.id}>
                <path
                  d={c.crackPath}
                  fill="none"
                  stroke="#1a0d04"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={c.crackPath}
                  fill="none"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity={0.4}
                />
              </g>
            ))}

            {/* ── Water streams — always flowing ──────────────────────────── */}
            {CRACKS.map(c => (
              <WaterStream key={c.id} x={c.waterX} y={c.waterY} active />
            ))}

            {/* ── Bandage hotspot buttons ─────────────────────────────────── */}
            {phase === "idle" && CRACKS.map(c => (
              !applied.has(c.id) && (
                <foreignObject
                  key={c.id}
                  x={c.hotX} y={c.hotY}
                  width={c.hotW} height={c.hotH}
                  style={{ cursor: "pointer", overflow: "visible" }}
                >
                  <button
                    onClick={() => handleCrackClick(c.id)}
                    data-testid={`button-pot-crack-${c.id}`}
                    style={{
                      width: "100%", height: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px dashed rgba(255,200,100,0.35)",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                    title={`Apply ${c.label}`}
                  />
                </foreignObject>
              )
            ))}
          </svg>

          {/* ── Bandages — mounted via AnimatePresence ───────────────────── */}
          {/* ASSET: replace each bandage div with:
              <img src={`/public/assets/bandage-${c.label.toLowerCase().replace(/ /g,"-")}.png`} /> */}
          <AnimatePresence>
            {CRACKS.map(c => applied.has(c.id) && (
              <motion.div
                key={c.id}
                data-testid={`bandage-${c.id}`}
                initial={{ opacity: 0, scale: 0.75, rotate: -6 }}
                animate={{ opacity: 1, scale: 1,   rotate: c.id === 0 ? -8 : c.id === 1 ? 5 : -12 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                style={{
                  position: "absolute",
                  left: `${(c.bandageX / 320) * 100}%`,
                  top:  `${(c.bandageY / 380) * 100}%`,
                  width: "38%",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #e8d5a0 0%, #d4b87a 100%)",
                    borderRadius: 6,
                    padding: "5px 10px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
                    textAlign: "center",
                    border: "1px solid rgba(180,140,60,0.6)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Bandage texture strips */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: "rgba(200,160,60,0.35)" }} />
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 10, background: "rgba(200,160,60,0.35)" }} />
                  <span
                    style={{
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "clamp(0.55rem, 1.8vw, 0.72rem)",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: "#3a2008",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      position: "relative",
                    }}
                  >
                    {c.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── Explosion shards ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {phase === "exploded" && SHARDS.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: s.dx,
                y: s.dy,
                rotate: s.rotate,
                scale: 0.4,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.2, 0, 0.8, 1], delay: s.id * 0.03 }}
              style={{
                position: "absolute",
                left: "50%",
                top: "52%",
                width: s.size,
                height: s.size * 0.6,
                background: s.color,
                borderRadius: 2,
                transformOrigin: "center center",
                zIndex: 30,
                pointerEvents: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            />
          ))}
        </AnimatePresence>

        {/* ── Water surge on explosion ─────────────────────────────────────── */}
        <AnimatePresence>
          {phase === "exploded" && (
            <motion.div
              initial={{ opacity: 0.9, scale: 0.3 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: "50%", top: "52%",
                width: 80, height: 80,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(130,200,255,0.55) 0%, rgba(100,180,255,0.1) 60%, transparent 100%)",
                pointerEvents: "none",
                zIndex: 28,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Instructional hint (before any click) ───────────────────────── */}
        <AnimatePresence>
          {applied.size === 0 && phase === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              style={{
                position: "absolute",
                bottom: "7%",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 15,
                pointerEvents: "none",
              }}
            >
              <p style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "clamp(0.72rem, 2.5vw, 0.875rem)",
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                Tap each crack to apply a fix
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Post-explosion message ───────────────────────────────────────── */}
        <AnimatePresence>
          {phase === "exploded" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              style={{
                position: "absolute",
                bottom: "6%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80%",
                textAlign: "center",
                zIndex: 35,
                pointerEvents: "none",
              }}
            >
              <p style={{
                fontFamily: "'IvyOra Display', serif",
                fontSize: "clamp(0.9rem, 3.5vw, 1.2rem)",
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.4,
                letterSpacing: "0.01em",
              }}>
                Surface fixes don't hold.<br />
                <span style={{ color: "rgba(255,215,120,0.85)", fontStyle: "italic" }}>Real healing goes deeper.</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
