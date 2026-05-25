import { useState, useEffect, useRef } from "react";
import { Lock, Unlock, ArrowRight, RotateCcw } from "lucide-react";

import week1Img from "@assets/Week_1_1779734761983.webp";
import week2Img from "@assets/Week_2_1779734761983.webp";
import week3Img from "@assets/Week_3_1779734761982.webp";
import week4Img from "@assets/Week_4_1779734761982.webp";
import week5Img from "@assets/Week_5_1779734761982.webp";

const WEEK_DATA = [
  { number: 1, title: "Image of God", image: week1Img },
  { number: 2, title: "Sin: The Wound", image: week2Img },
  { number: 3, title: "Healing & Forgiveness", image: week3Img },
  { number: 4, title: "Deliverance & Renunciation", image: week4Img },
  { number: 5, title: "New Life", image: week5Img },
];

type LockPhase = "idle" | "shaking" | "opening" | "revealed" | "cta";

interface Props {
  fromWeek: number;
  toWeek: number;
  isPrivileged: boolean;
  onClose: () => void;
  onReplay: () => void;
}

export function WeekTransitionCinematic({ fromWeek, toWeek, isPrivileged, onClose, onReplay }: Props) {
  const [visible, setVisible] = useState(false);
  const [connectorFilled, setConnectorFilled] = useState(false);
  const [lockPhase, setLockPhase] = useState<LockPhase>("idle");
  const overlayRef = useRef<HTMLDivElement>(null);
  const fromCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

    // Overlay fades in
    t(60, () => setVisible(true));

    // Connector starts filling
    t(600, () => setConnectorFilled(true));

    // Pan: scroll the overlay so the toWeek card comes into view
    t(900, () => {
      const overlay = overlayRef.current;
      const fromCard = fromCardRef.current;
      if (overlay && fromCard) {
        const targetScrollTop = fromCard.offsetTop + fromCard.offsetHeight - overlay.clientHeight * 0.15;
        overlay.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
      }
    });

    // Lock shakes
    t(1800, () => setLockPhase("shaking"));
    // Lock → Unlock icon
    t(2250, () => setLockPhase("opening"));
    // Overlays dissolve, border brightens
    t(2600, () => setLockPhase("revealed"));
    // Sound
    t(2700, () => {
      try {
        new Audio("/week-unlock.mp3").play().catch(() => {});
      } catch {}
    });
    // CTA fades in + key written to localStorage
    t(2950, () => {
      setLockPhase("cta");
      localStorage.setItem(`lf_week_cinematic_seen_${toWeek}`, "1");
    });

    return () => timers.forEach(clearTimeout);
  }, [toWeek]);

  const from = WEEK_DATA[fromWeek - 1];
  const to = WEEK_DATA[toWeek - 1];
  const isRevealed = lockPhase === "revealed" || lockPhase === "cta";

  return (
    <div
      ref={overlayRef}
      data-testid="week-transition-cinematic"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Stop propagation so clicks inside the content panel don't dismiss */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 608, padding: "28px 16px 100px" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <p className="type-caption-md" style={{ color: "rgba(255,255,255,0.35)", margin: 0 }}>
            WEEK {toWeek} BEGINS
          </p>
          {isPrivileged && (
            <button
              onClick={onReplay}
              data-testid="button-replay-cinematic"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 100,
                border: "0.5px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.35)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <RotateCcw size={10} />
              <span className="type-caption-sm">Replay</span>
            </button>
          )}
        </div>

        {/* From week card — always shown as completed */}
        <div
          ref={fromCardRef}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.65)",
          }}
        >
          <CinematicWeekCard
            week={from}
            isCompleted
            lockPhase="idle"
            showCta={false}
            onCta={() => {}}
          />
        </div>

        {/* Connector line */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: 52,
          }}
        >
          <div
            style={{
              width: 1,
              height: "100%",
              background: "rgba(255,255,255,0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: connectorFilled ? "100%" : "0%",
                background: "rgba(255,255,255,0.7)",
                transition: connectorFilled ? "height 1.15s ease-in-out" : "none",
              }}
            />
          </div>
        </div>

        {/* To week card — locked → unlocks through animation */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${isRevealed ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.06)"}`,
            transition: "border-color 0.35s ease",
          }}
        >
          <CinematicWeekCard
            week={to}
            isCompleted={false}
            lockPhase={lockPhase}
            showCta={lockPhase === "cta"}
            onCta={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Individual card ───────────────────────────────────────────────────────────

interface CardProps {
  week: { number: number; title: string; image: string };
  isCompleted: boolean;
  lockPhase: LockPhase;
  showCta: boolean;
  onCta: () => void;
}

function CinematicWeekCard({ week, isCompleted, lockPhase, showCta, onCta }: CardProps) {
  const isRevealed = lockPhase === "revealed" || lockPhase === "cta";
  const isToCard = !isCompleted;

  const showDimOverlay = isToCard && !isRevealed;
  const overlaysHidden = isCompleted || isRevealed;
  const lockIconOpacity = isToCard ? (isRevealed ? 0 : 1) : 0;

  const captionText = isCompleted
    ? `WEEK ${week.number} COMPLETE`
    : isRevealed
    ? `WEEK ${week.number}`
    : `WEEK ${week.number} · LOCKED`;

  const captionColor = isCompleted
    ? "rgba(210,180,120,0.8)"
    : isRevealed
    ? "rgba(255,255,255,0.45)"
    : "rgba(255,255,255,0.3)";

  return (
    <div
      style={{
        position: "relative",
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Background image */}
      <img
        src={week.image}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          pointerEvents: "none",
        }}
      />

      {/* Dim overlay — locked state */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          opacity: showDimOverlay ? 1 : 0,
          transition: "opacity 0.35s ease",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Gradient overlays — present when inactive, hidden after unlock */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.15) 100%)",
          opacity: overlaysHidden || showDimOverlay ? 0 : 1,
          transition: "opacity 0.35s ease",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)",
          opacity: overlaysHidden || showDimOverlay ? 0 : 1,
          transition: "opacity 0.35s ease",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Lock / unlock icon — always rendered for smooth fade-out */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          zIndex: 10,
          opacity: lockIconOpacity,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      >
        <div
          className={lockPhase === "shaking" ? "lf-lock-shake" : ""}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {lockPhase === "opening" ? (
            <Unlock size={22} color="rgba(255,255,255,0.9)" />
          ) : (
            <Lock size={22} color="rgba(255,255,255,0.9)" />
          )}
        </div>
      </div>

      {/* Text content + CTA */}
      <div style={{ position: "relative", zIndex: 2, padding: "28px 28px" }}>
        <p
          className="type-caption-md"
          style={{ color: captionColor, margin: "0 0 8px" }}
        >
          {captionText}
        </p>

        <h2
          className="font-serif"
          style={{
            color: "white",
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 500,
            margin: "0 0 16px",
            lineHeight: 1.1,
            maxWidth: 240,
          }}
        >
          {week.title}
        </h2>

        {/* CTA — fades up into view */}
        <div
          style={{
            opacity: showCta ? 1 : 0,
            transform: showCta ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: showCta ? "auto" : "none",
          }}
        >
          <button
            data-testid={`button-begin-week-${week.number}`}
            onClick={onCta}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 8,
              border: "0.5px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "white",
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            <span className="type-caption-md">BEGIN WEEK {week.number}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
