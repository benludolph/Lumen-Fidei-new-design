import { useState, useEffect, useRef } from "react";
import { Lock, Unlock, ArrowRight, RotateCcw, BookOpen } from "lucide-react";

import week1Img from "@assets/Week_1_1779734761983.webp";
import week2Img from "@assets/Week_2_1779734761983.webp";
import week3Img from "@assets/Week_3_1779734761982.webp";
import week4Img from "@assets/Week_4_1779734761982.webp";
import week5Img from "@assets/Week_5_1779734761982.webp";
import unlockSound from "@assets/Ni_Sound_-_Timeless_Logos_-_Ascending_Piano_Arpeggio_Chord_Tra_1779742551453.wav";

const WEEK_DATA = [
  {
    number: 1,
    title: "Image of God",
    image: week1Img,
    purpose:
      "Week 1 covers who God is and who you are. Most people come in with a distorted picture of God, and you can't trust or follow someone you've misread. Before the course asks you to look at sin and the enemy, it settles this foundation first.",
    agenda:
      "You'll cover prayer and worry, whether God is really there, the image of God you're carrying and where it came from, that you were made for a personal relationship with Him, and how His love doesn't change. The week ends by introducing the enemy and how he builds a foothold.",
  },
  {
    number: 2,
    title: "Sin: The Wound",
    image: week2Img,
    purpose:
      "Week 2 is where you look honestly at sin. Sin is real, it shapes your life, and the enemy uses it, especially occult involvement and other doorways, to gain power over you. This week names what's actually wrong so you can begin to deal with it.",
    agenda:
      "You'll cover the reality of sin and how it shapes your life, the enemy's power and the specific doorways that give him access (occult sins and others), what conversion and repentance actually mean, the wounds sin leaves, and how inner healing begins.",
  },
  {
    number: 3,
    title: "Healing & Forgiveness",
    image: week3Img,
    purpose:
      "Week 3 is about healing the wounds underneath the sin. Jesus has authority over what oppresses you, and a lot of what keeps people stuck is unforgiveness, toward themselves and others, and old agreements that were never closed. This week works through those.",
    agenda:
      "You'll cover Jesus as your healer, forgiving yourself, closing open doors like soul ties, vows, and word curses, taking your thoughts captive, forgiving others, and dealing with generational and family-line sin.",
  },
  {
    number: 4,
    title: "Deliverance & Renunciation",
    image: week4Img,
    purpose:
      "Week 4 is the deliverance work. You've identified the sin, the wounds, and the open doors. Now you renounce them out loud and claim the authority you have through Jesus. This is the part the whole workbook has been building toward.",
    agenda:
      "You'll cover Jesus as deliverer and king, the power of renunciation, the spiritual weapons available to you, praying a personal renunciation, praying a generational renunciation, and receiving salvation through Jesus Christ.",
  },
  {
    number: 5,
    title: "New Life",
    image: week5Img,
    purpose:
      "Week 5 is about living free after the deliverance work is done. The hard part is behind you, but old patterns return if nothing replaces them. This week sets up the Catholic life that keeps you close to God.",
    agenda:
      "You'll cover conversion as a daily turning back to God, life in the Holy Spirit, what grace is and why effort alone won't change you, the Eucharist and the Mass, saying your own yes to God, and a closing reflection on the thirty days.",
  },
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
  const [step, setStep] = useState(1);
  const step1Ref = useRef<HTMLDivElement>(null);
  const fromCardRef = useRef<HTMLDivElement>(null);

  const hasStep2 = toWeek === 2;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

    t(60, () => setVisible(true));
    t(600, () => setConnectorFilled(true));

    t(900, () => {
      const container = step1Ref.current;
      const fromCard = fromCardRef.current;
      if (container && fromCard) {
        const targetScrollTop = fromCard.offsetTop + fromCard.offsetHeight - container.clientHeight * 0.15;
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
      }
    });

    t(1800, () => setLockPhase("shaking"));
    t(2250, () => setLockPhase("opening"));
    t(2600, () => setLockPhase("revealed"));

    t(2700, () => {
      try {
        const audio = new Audio(unlockSound);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
    });

    t(2950, () => {
      setLockPhase("cta");
      localStorage.setItem(`lf_week_cinematic_seen_${toWeek}`, "1");
    });

    return () => timers.forEach(clearTimeout);
  }, [toWeek]);

  const from = WEEK_DATA[fromWeek - 1];
  const to = WEEK_DATA[toWeek - 1];
  const isRevealed = lockPhase === "revealed" || lockPhase === "cta";

  function handleContinue() {
    if (hasStep2) {
      setStep(2);
    } else {
      onClose();
    }
  }

  return (
    <div
      data-testid="week-transition-cinematic"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        overflow: "hidden",
      }}
    >
      {/* Sliding track — each step is 100vw wide */}
      <div
        style={{
          display: "flex",
          width: hasStep2 ? "200%" : "100%",
          height: "100%",
          transform: `translateX(-${(step - 1) * (hasStep2 ? 50 : 0)}%)`,
          transition: "transform 0.52s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ── Step 1: Week cards ─────────────────────────────────── */}
        <div
          ref={step1Ref}
          onClick={onClose}
          style={{
            width: hasStep2 ? "50%" : "100%",
            height: "100%",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 608, margin: "0 auto", padding: "28px 16px 100px" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
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

            {/* From week card */}
            <div
              ref={fromCardRef}
              style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.65)" }}
            >
              <CinematicWeekCard
                week={from}
                isCompleted
                lockPhase="idle"
                showCta={false}
                onCta={() => {}}
              />
            </div>

            {/* Connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: 52 }}>
              <div style={{ width: 1, height: "100%", background: "rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
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

            {/* To week card */}
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
                ctaLabel={hasStep2 ? "Continue" : `Begin Week ${toWeek}`}
                onCta={handleContinue}
              />
            </div>
          </div>
        </div>

        {/* ── Step 2: Deliverance Notebook intro (week 2 only) ───── */}
        {hasStep2 && (
          <div
            style={{
              width: "50%",
              height: "100%",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <div style={{ width: "100%", maxWidth: 608, margin: "0 auto", padding: "28px 16px 100px" }}>
              {/* Step 2 header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <p className="type-caption-md" style={{ color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  WEEK 2 · WHAT'S NEW
                </p>
                {isPrivileged && (
                  <button
                    onClick={onReplay}
                    data-testid="button-replay-cinematic-step2"
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

              <DeliveranceNotebookCard onBegin={onClose} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week card ────────────────────────────────────────────────────────────────

interface CardProps {
  week: (typeof WEEK_DATA)[number];
  isCompleted: boolean;
  lockPhase: LockPhase;
  showCta: boolean;
  ctaLabel?: string;
  onCta: () => void;
}

function CinematicWeekCard({ week, isCompleted, lockPhase, showCta, ctaLabel, onCta }: CardProps) {
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

  const label = ctaLabel ?? `Begin Week ${week.number}`;

  return (
    <div style={{ position: "relative", minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <img
        src={week.image}
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", pointerEvents: "none" }}
      />

      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", opacity: showDimOverlay ? 1 : 0, transition: "opacity 0.35s ease", zIndex: 1, pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.25) 100%)", opacity: overlaysHidden || showDimOverlay ? 0 : 1, transition: "opacity 0.35s ease", zIndex: 1, pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)", opacity: overlaysHidden || showDimOverlay ? 0 : 1, transition: "opacity 0.35s ease", zIndex: 1, pointerEvents: "none" }} />

      {/* Lock icon */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", zIndex: 10, opacity: lockIconOpacity, transition: "opacity 0.3s ease", pointerEvents: "none" }}>
        <div
          className={lockPhase === "shaking" ? "lf-lock-shake" : ""}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "0.5px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {lockPhase === "opening" ? <Unlock size={22} color="rgba(255,255,255,0.9)" /> : <Lock size={22} color="rgba(255,255,255,0.9)" />}
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, padding: "40px 36px" }}>
        <p className="type-caption-md" style={{ color: captionColor, margin: "0 0 10px" }}>
          {captionText}
        </p>

        <h2 className="font-serif" style={{ color: "white", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 500, margin: "0 0 20px", lineHeight: 1.1, maxWidth: 280 }}>
          {week.title}
        </h2>

        <div style={{ width: "100%", maxWidth: 329, height: "0.5px", background: "rgba(255,255,255,0.12)", marginBottom: 20 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <div>
            <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>PURPOSE</p>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>{week.purpose}</p>
          </div>
          <div>
            <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>AGENDA</p>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>{week.agenda}</p>
          </div>
        </div>

        {/* Right-aligned CTA */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "flex-end",
            opacity: showCta ? 1 : 0,
            transform: showCta ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: showCta ? "auto" : "none",
          }}
        >
          <button
            data-testid={`button-cta-week-${week.number}`}
            onClick={onCta}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 8,
              border: "0.5px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span className="type-caption-md">{label.toUpperCase()}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deliverance Notebook intro card ─────────────────────────────────────────

function DeliveranceNotebookCard({ onBegin }: { onBegin: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(157.67deg, rgb(25,26,27) 8.978%, rgb(19,19,20) 91.022%)",
        boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.6)",
        padding: "48px 32px 48px 32px",
        minHeight: 420,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      {/* Radial glow top-left */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -62,
          left: -38,
          width: 467,
          height: 172,
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 70%)",
          mixBlendMode: "lighten",
          pointerEvents: "none",
        }}
      />

      {/* Decorative notebook — right side */}
      <NotebookDecoration />

      {/* Text content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 275 }}>
        {/* Label */}
        <p
          className="type-caption-md"
          style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "3.2px", margin: "0 0 8px" }}
        >
          NEW
        </p>

        {/* Title */}
        <h2
          className="font-serif"
          style={{ color: "white", fontSize: 32, fontWeight: 500, letterSpacing: "-0.64px", margin: "0 0 20px", lineHeight: 1.1 }}
        >
          Deliverance Notebook
        </h2>

        {/* Divider */}
        <div style={{ width: "100%", maxWidth: 329, height: "0.5px", background: "rgba(255,255,255,0.12)", marginBottom: 20 }} />

        {/* Purpose */}
        <div style={{ marginBottom: 32 }}>
          <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px", letterSpacing: "1.8px" }}>
            PURPOSE
          </p>
          <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0 }}>
            Over the program you'll fill it in by category: unrepented sins, occult involvement and other doorways, people you need to forgive, soul ties, vows, word curses, and generational patterns. By the end you'll use what you've written to pray through your renunciations and to make your confession. Add to it anytime — it's yours to keep working through.
          </p>
        </div>

        {/* Begin Week 2 CTA */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            data-testid="button-begin-week-2"
            onClick={onBegin}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 8,
              border: "0.5px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span className="type-caption-md">BEGIN WEEK 2</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CSS notebook decoration ──────────────────────────────────────────────────

function NotebookDecoration() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        right: -16,
        top: 100,
        width: 200,
        height: 290,
        zIndex: 1,
      }}
    >
      {/* Back page — darkest */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 14,
        width: 172,
        height: 256,
        borderRadius: 6,
        background: "#302929",
        border: "0.5px solid rgba(255,255,255,0.18)",
        boxShadow: "10px -1px 4px 0px rgba(0,0,0,0.25)",
        transform: "rotate(1.8deg)",
      }} />

      {/* Middle page */}
      <div style={{
        position: "absolute",
        top: 8,
        left: 6,
        width: 174,
        height: 254,
        borderRadius: 6,
        background: "white",
        border: "0.5px solid rgba(255,255,255,0.18)",
        boxShadow: "10px -1px 4px 0px rgba(0,0,0,0.25)",
        transform: "rotate(0.8deg)",
      }} />

      {/* Front cover */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 176,
        height: 260,
        borderRadius: 6,
        background: "linear-gradient(211.78deg, rgba(0,0,0,0) 21.77%, rgb(0,0,0) 85.02%)",
        backgroundColor: "#1a1612",
        border: "0.5px solid rgba(255,255,255,0.06)",
        boxShadow: "10px -1px 4px 0px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}>
        {/* Cover texture lines */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.8) 18px, rgba(255,255,255,0.8) 19px)", pointerEvents: "none" }} />
        {/* Cover title */}
        <div style={{ position: "absolute", bottom: 24, left: 20, right: 12 }}>
          <p className="font-serif" style={{ color: "white", fontSize: 20, fontWeight: 500, lineHeight: 1.25, margin: 0, letterSpacing: "-0.4px" }}>
            The<br />Deliverance<br />Workbook
          </p>
        </div>
        {/* Top gold line accent */}
        <div style={{ position: "absolute", top: 20, left: 20, right: 20, height: "0.5px", background: "rgba(210,180,120,0.4)" }} />
      </div>

      {/* Bookmark ribbon */}
      <div style={{
        position: "absolute",
        top: -8,
        left: 120,
        width: 12,
        height: 52,
        background: "rgba(210,180,120,0.7)",
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}
