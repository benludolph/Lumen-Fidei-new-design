import { useState, useEffect } from "react";
import { ArrowLeft, X, CheckCircle2 } from "lucide-react";
import { playLessonComplete } from "@/lib/sounds";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  onContinue: () => void;
  onBack?: () => void;
}

export function LessonCompletionScreen({
  dayNumber,
  theme,
  onContinue,
  onBack,
}: LessonCompletionScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    playLessonComplete();
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const FrostedButton = ({
    onClick,
    disabled,
    children,
    testId,
  }: {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    testId: string;
  }) => (
    <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center rounded-[20px] transition-colors hover:bg-[rgba(52,52,52,0.6)] disabled:opacity-0 disabled:pointer-events-none"
        style={{
          width: "40px",
          height: "40px",
          background: disabled ? "transparent" : "rgba(42,42,42,0.5)",
          backdropFilter: "blur(18px)",
        }}
        data-testid={testId}
      >
        {children}
      </button>
    </div>
  );

  const pillLabel = dayNumber > 0 ? `DAY ${dayNumber}` : "LESSON";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#111]"
      data-testid="lesson-completion-screen"
      style={{ paddingTop: "24px" }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{ paddingLeft: "24px", paddingRight: "24px", paddingBottom: "24px" }}
      >
        {/* Left: Back button */}
        <FrostedButton onClick={onBack} disabled={!onBack} testId="button-completion-back">
          <ArrowLeft className="w-4 h-4 text-white" />
        </FrostedButton>

        {/* Center: pill */}
        <div
          className="flex items-center justify-center"
          style={{
            background: "#202020",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            maxHeight: "42px",
          }}
        >
          <span
            className="font-['Afacad'] font-medium whitespace-nowrap uppercase"
            style={{ fontSize: "14px", letterSpacing: "2.8px", color: "#efefef", lineHeight: "18px" }}
          >
            {pillLabel}
          </span>
          <span
            className="font-['Afacad'] font-normal whitespace-nowrap"
            style={{ fontSize: "13.9px", color: "#8b8b8b", lineHeight: "18px", paddingLeft: "8px" }}
          >
            Complete
          </span>
        </div>

        {/* Right: Exit / Continue */}
        <FrostedButton onClick={onContinue} testId="button-completion-continue">
          <X className="w-4 h-4 text-white" />
        </FrostedButton>
      </div>

      {/* ── Content area (bg image + card) ── */}
      <div
        className="flex-1 relative flex flex-col overflow-hidden"
        style={{ background: "#010101", borderRadius: "24px 24px 0 0" }}
      >
        {/* Background image + gradient overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ borderRadius: "24px 24px 0 0" }}
        >
          <img
            src={candleBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
            }}
          />
        </div>

        {/* Centered completion card */}
        <div className="flex-1 flex items-center justify-center relative" style={{ padding: "24px" }}>
          <div
            className="relative overflow-hidden flex flex-col items-center gap-8 w-full"
            style={{
              maxWidth: "528px",
              background: "#0f1116",
              border: "0.5px solid rgba(255,255,255,0.05)",
              borderRadius: "8px",
              paddingTop: "64px",
              paddingBottom: "64px",
              paddingLeft: "12px",
              paddingRight: "12px",
              transition: "opacity 700ms ease, transform 700ms ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            {/* Radial glow — top-left */}
            <div
              className="absolute pointer-events-none mix-blend-lighten"
              style={{
                top: "-160px",
                left: "-133px",
                width: "310px",
                height: "310px",
                opacity: 0.04,
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 90%)",
              }}
            />

            {/* Icon */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: "35px",
                height: "35px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "5.835px",
                boxShadow: "0px 1.459px 2.917px 0px rgba(0,0,0,0.1)",
              }}
            >
              <CheckCircle2
                className="text-white/60"
                style={{ width: "18px", height: "18px" }}
              />
            </div>

            {/* Text group */}
            <div className="flex flex-col items-center gap-6">
              {/* Heading */}
              <p
                className="font-['IvyOra_Display'] text-[#f7f8f8] text-center"
                style={{ fontSize: "24px", lineHeight: 1, fontStyle: "italic" }}
              >
                Lesson Complete
              </p>

              {/* Stars decoration */}
              <div className="flex items-center" style={{ gap: "20px", height: "14px" }}>
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    style={{ color: "#F07830", fontSize: "9px", lineHeight: 1 }}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Subtitle */}
              {theme && (
                <p
                  className="font-['Afacad'] text-[#8a8f98] text-center"
                  style={{ fontSize: "13px", lineHeight: "16px" }}
                >
                  {dayNumber > 0 ? `Day ${dayNumber} · ` : ""}
                  {theme}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
