import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { playLessonComplete } from "@/lib/sounds";
import slideBg from "@assets/SlideBG_1774302310257.webp";
import crossDividerImg from "@assets/Cross_Divider_1774243395976.webp";
import monstranceImg from "@assets/Logo_LumenFidei_1775672709011.webp";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  completionMessage?: string | null;
  onContinue: () => void;
  onBack?: () => void;
}

export function LessonCompletionScreen({
  dayNumber,
  theme,
  completionMessage,
  onContinue,
  onBack,
}: LessonCompletionScreenProps) {
  const [visible, setVisible] = useState(false);
  const [monstranceVisible, setMonstranceVisible] = useState(false);

  useEffect(() => {
    playLessonComplete();
    const t1 = setTimeout(() => setMonstranceVisible(true), 80);
    const t2 = setTimeout(() => setVisible(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[220] flex flex-col"
      data-testid="lesson-completion-screen"
    >
      {/* ── Full-screen background: painting + radial vignette ── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          src={slideBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 140% 80% at 50% 120%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.05) 100%)",
          }}
        />
      </div>

      {/* ── Header: blurred top nav bar ── */}
      <div
        className="relative shrink-0 flex items-center justify-between"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "var(--black-60)",
          borderBottom: "1px solid var(--white-5)",
          boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "16px",
          paddingBottom: "16px",
        }}
      >
        {/* Left: Back button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-0 disabled:pointer-events-none"
            style={{
              width: "40px",
              height: "40px",
              background: "var(--surface-float)",
              backdropFilter: "blur(11px)",
              WebkitBackdropFilter: "blur(11px)",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid="button-completion-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Center: COMPLETE pill */}
        <div
          className="flex items-center"
          style={{
            background: "var(--surface-float)",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            maxHeight: "42px",
          }}
        >
          <span
            className="type-caption-md whitespace-nowrap"
            style={{ color: "#efefef", lineHeight: "18px" }}
          >
            COMPLETE
          </span>
        </div>

        {/* Right: Exit button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onContinue}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: "40px",
              height: "40px",
              background: "var(--surface-float)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid="button-completion-exit"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div
        className="relative flex-1 min-h-0 flex flex-col items-center"
        style={{ paddingTop: "16px", paddingLeft: "16px", paddingRight: "16px" }}
      >
        {/* Dark card — identical structure to slide screens */}
        <div
          className="relative flex-1 min-h-0 flex flex-col w-full max-w-[780px] p-7 sm:p-12"
          style={{
            background: "var(--surface-base)",
            border: "0.5px solid var(--white-5)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          {/* Subtle radial highlight at top-left corner */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              background: "radial-gradient(ellipse at 0% 0%, var(--white-4) 0%, transparent 60%)",
            }}
          />

          {/* Completion content — stacked column, monstrance first then text */}
          <div
            className="relative flex-1 flex flex-col items-center justify-center"
            style={{ gap: "28px" }}
          >
            {/* Monstrance — fades in first, slowly from below */}
            <img
              src={monstranceImg}
              aria-hidden="true"
              alt=""
              style={{
                width: "clamp(90px, 22vw, 130px)",
                height: "auto",
                mixBlendMode: "screen",
                opacity: monstranceVisible ? 0.78 : 0,
                transform: monstranceVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 2000ms cubic-bezier(0.4, 0, 0.2, 1), transform 2000ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            {/* Text block — fades in after monstrance settles */}
            <div
              className="flex flex-col items-center"
              style={{
                gap: "20px",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 900ms ease, transform 900ms ease",
              }}
            >
              {/* Headline */}
              <p
                className="type-display-lg text-white text-center"
                style={{ letterSpacing: "-0.64px" }}
              >
                Lesson Complete
              </p>

              {/* Cross divider */}
              <img
                src={crossDividerImg}
                alt=""
                style={{ width: "152px", height: "auto", opacity: 0.4 }}
              />

              {/* Day · Theme tag */}
              <p className="type-body-sm text-[var(--white-40)] text-center">
                {dayNumber > 0 ? `Day ${dayNumber} · ` : ""}{theme || ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: black bar with right-aligned CONTINUE button ── */}
      <div
        className="relative shrink-0 flex flex-col items-center justify-center px-4 py-4 sm:px-8"
        style={{
          background: "var(--surface-ground)",
          borderTop: "1px solid var(--white-5)",
        }}
      >
        <div className="max-w-[780px] w-full flex items-center justify-end">
          <button
            onClick={onContinue}
            className="flex items-center gap-2 justify-center type-caption-lg text-[#fafafa] transition-opacity hover:opacity-80"
            style={{
              background: "var(--surface-float)",
              borderRadius: "6px",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "12px",
              paddingBottom: "12px",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)",
            }}
            data-testid="button-completion-continue"
          >
            CONTINUE
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
