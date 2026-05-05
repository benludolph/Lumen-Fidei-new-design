import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";
import crossDividerImg from "@assets/Cross_Divider_1774243395976.webp";
import reflectionUnlockSound from "@assets/Cyberwave_Orchestra_-_Logos_from_Asia_-_Chinese_Dizi_Logo_1777998276547.wav";

export interface OverlayConfig {
  enabled: boolean;
  imageUrl: string;
  text: string;
  subtext: string;
  label: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface CompletionOverlayProps {
  overlayConfig: OverlayConfig;
  onDismiss: () => void;
}

function spawnParticle(cx: number, cy: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.9 + 0.2;
  return {
    x: cx + (Math.random() - 0.5) * 20,
    y: cy + (Math.random() - 0.5) * 20,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: Math.random() * 3.5 + 1.5,
    alpha: Math.random() * 0.6 + 0.4,
  };
}

export function CompletionOverlay({ overlayConfig, onDismiss }: CompletionOverlayProps) {
  const [unlockPhase, setUnlockPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const audio = new Audio(reflectionUnlockSound);
    audio.volume = 0.8;
    audio.play().catch(() => {});

    const timers = [
      setTimeout(() => setUnlockPhase(1), 400),
      setTimeout(() => setUnlockPhase(2), 2000),
      setTimeout(() => setUnlockPhase(3), 2320),
      setTimeout(() => setUnlockPhase(4), 2640),
      setTimeout(() => setUnlockPhase(5), 3000),
      setTimeout(() => setUnlockPhase(6), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (unlockPhase < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    particlesRef.current = Array.from({ length: 35 }, () => spawnParticle(cx, cy));
    frameCountRef.current = 0;

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      if (frameCountRef.current % 3 === 0) {
        particlesRef.current.push(spawnParticle(cx, cy));
        if (particlesRef.current.length > 90) particlesRef.current.shift();
      }

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.003;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(255,255,255,${p.alpha.toFixed(3)})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      frameCountRef.current++;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [unlockPhase]);

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 450,
        background: "var(--black-70)",
        transition: "opacity 500ms ease-out",
        opacity: unlockPhase >= 1 ? 1 : 0,
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: 48, width: "100%", maxWidth: 480, padding: "0 32px" }}
      >
        {overlayConfig.imageUrl && (
          <div
            style={{
              position: "relative",
              width: 160,
              height: 160,
              flexShrink: 0,
              transition: "opacity 700ms ease-out, transform 700ms ease-out",
              opacity: unlockPhase >= 2 ? 1 : 0,
              transform: unlockPhase >= 2 ? "scale(1)" : "scale(0.85)",
            }}
          >
            {/* Particle canvas — behind the circle */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 320,
                height: 320,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />
            {/* Outer decorative ring */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid var(--white-15)",
                background: "var(--white-4)",
                zIndex: 1,
              }}
            />
            {/* Inner image */}
            <img
              src={overlayConfig.imageUrl}
              alt=""
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                width: 150,
                height: 150,
                borderRadius: "50%",
                objectFit: "cover",
                zIndex: 2,
              }}
            />
          </div>
        )}

        <div className="flex flex-col items-center w-full" style={{ gap: 20 }}>
          <p
            className="type-caption-lg text-white text-center whitespace-nowrap"
            style={{
              lineHeight: "20px",
              transition: "opacity 600ms ease-out",
              opacity: unlockPhase >= 3 ? 1 : 0,
            }}
          >
            {overlayConfig.label ? overlayConfig.label.toUpperCase() : "REFLECTION UNLOCKED"}
          </p>

          <p
            className="type-display-xl text-white text-center"
            style={{
              letterSpacing: "-0.96px",
              transition: "opacity 600ms ease-out",
              opacity: unlockPhase >= 3 ? 1 : 0,
            }}
          >
            {overlayConfig.text || "Reflection Unlocked"}
          </p>

          <div
            style={{
              transition: "opacity 600ms ease-out",
              opacity: unlockPhase >= 4 ? 1 : 0,
            }}
          >
            <img
              src={crossDividerImg}
              alt=""
              style={{ width: 264.5, height: 25, objectFit: "contain" }}
            />
          </div>

          <p
            className="type-body-lg text-white text-center"
            style={{
              lineHeight: "20px",
              transition: "opacity 600ms ease-out",
              opacity: unlockPhase >= 5 ? 1 : 0,
            }}
          >
            {overlayConfig.subtext || ""}
          </p>

          <button
            onClick={onDismiss}
            style={{
              background: "var(--surface-float)",
              border: "1px solid var(--white-8)",
              borderRadius: 6,
              height: 42,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "0 1px",
              cursor: "pointer",
              boxShadow:
                "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.06)",
              transition: "opacity 600ms ease-out",
              opacity: unlockPhase >= 6 ? 1 : 0,
              pointerEvents: unlockPhase >= 6 ? "auto" : "none",
            }}
            data-testid="button-reflection-overlay-continue"
          >
            <span className="type-body-lg font-medium text-center text-white">
              Continue
            </span>
            <ArrowRight style={{ width: 16, height: 16, color: "white" }} />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
