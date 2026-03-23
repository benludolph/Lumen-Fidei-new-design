import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { playLessonComplete } from "@/lib/sounds";
import slideBg from "@assets/SlideBG_1774302310257.webp";
import crossDividerImg from "@assets/Cross_Divider_1774243395976.webp";

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

  useEffect(() => {
    playLessonComplete();
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
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
          background: "rgba(0,0,0,0.6)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "24px",
          paddingBottom: "24px",
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
              background: "#18181b",
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
            background: "#18181b",
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
              background: "#18181b",
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
        className="relative flex-1 flex flex-col items-center overflow-hidden"
        style={{ paddingTop: "32px", paddingLeft: "20px", paddingRight: "20px" }}
      >
        {/* Dark card — identical structure to slide screens */}
        <div
          className="relative flex-1 flex flex-col overflow-hidden w-full max-w-[640px]"
          style={{
            background: "rgb(15,17,22)",
            border: "0.5px solid rgba(255,255,255,0.05)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            padding: "48px",
          }}
        >
          {/* Subtle radial highlight at top-left corner */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              background: "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 60%)",
            }}
          />

          {/* Completion content — vertically and horizontally centered */}
          <div
            className="relative flex-1 flex flex-col items-center justify-center"
            style={{
              gap: "24px",
              transition: "opacity 700ms ease, transform 700ms ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            {/* Headline */}
            <p
              className="font-serif text-white text-center"
              style={{ fontSize: "32px", lineHeight: "36px", letterSpacing: "-0.64px", fontWeight: 500 }}
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
            <p
              className="type-body-sm text-white/40 text-center"
            >
              {dayNumber > 0 ? `Day ${dayNumber} · ` : ""}{theme || ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer: black bar with right-aligned CONTINUE button ── */}
      <div
        className="relative shrink-0 flex flex-col items-center justify-center"
        style={{
          background: "black",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "32px",
        }}
      >
        <div className="max-w-[640px] w-full flex items-center justify-end">
          <button
            onClick={onContinue}
            className="flex items-center gap-2 justify-center font-sans font-medium text-[#fafafa] transition-opacity hover:opacity-80"
            style={{
              background: "#18181b",
              borderRadius: "6px",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "12px",
              paddingBottom: "12px",
              fontSize: "14px",
              letterSpacing: "2.8px",
              lineHeight: "20px",
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
