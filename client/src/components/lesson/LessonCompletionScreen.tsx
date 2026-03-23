import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, X, Trophy } from "lucide-react";
import { playLessonComplete } from "@/lib/sounds";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";
import crossDividerImg from "@assets/Cross_Divider_1774243395976.webp";

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

  return (
    <div
      className="fixed inset-0 z-[220] flex flex-col bg-[#111]"
      data-testid="lesson-completion-screen"
    >
      {/* ── Header — identical to LessonFlow ── */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{ paddingLeft: "16px", paddingRight: "16px", paddingTop: "24px", paddingBottom: "24px" }}
      >
        {/* Left: Back button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center justify-center rounded-full transition-colors hover:bg-[rgba(52,52,52,0.7)] disabled:opacity-0 disabled:pointer-events-none"
            style={{
              width: "40px",
              height: "40px",
              background: "rgba(30,30,30,0.72)",
              backdropFilter: "blur(11px)",
            }}
            data-testid="button-completion-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Center: COMPLETE pill */}
        <div
          className="flex items-center justify-center"
          style={{
            background: "#202020",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "10px",
            paddingBottom: "10px",
            maxHeight: "42px",
          }}
        >
          <span
            className="font-['Afacad'] font-medium whitespace-nowrap uppercase"
            style={{ fontSize: "14px", letterSpacing: "2.8px", color: "#efefef", lineHeight: "18px" }}
          >
            COMPLETE
          </span>
        </div>

        {/* Right: Exit button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onContinue}
            className="flex items-center justify-center rounded-full transition-colors hover:bg-[rgba(62,62,62,0.7)]"
            style={{
              width: "40px",
              height: "40px",
              background: "rgba(42,42,42,0.5)",
              backdropFilter: "blur(18px)",
            }}
            data-testid="button-completion-exit"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content area — identical structure to LessonFlow ── */}
      <div className="flex-1 relative flex flex-col items-center overflow-hidden pt-8">
        {/* Oil painting background + gradient overlay */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img
            src={candleBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(89.99deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
            }}
          />
        </div>

        {/* Dark card — fills remaining height, top corners rounded, same as LessonFlow */}
        <div
          className="relative flex-1 flex flex-col overflow-hidden w-full max-w-[640px]"
          style={{
            background: "#0f1116",
            border: "0.5px solid rgba(255,255,255,0.05)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            padding: "24px",
          }}
        >
          {/* Completion content — centered in the card */}
          <div
            className="flex-1 flex flex-col items-center justify-center"
            style={{
              gap: "32px",
              transition: "opacity 700ms ease, transform 700ms ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            {/* Trophy icon in frosted glass box */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: "35px",
                height: "35px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "6px",
                boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1)",
              }}
            >
              <Trophy className="text-white/60" style={{ width: "19px", height: "19px" }} />
            </div>

            {/* Text group */}
            <div className="flex flex-col items-center" style={{ gap: "24px" }}>
              <p
                className="font-['IvyOra_Display'] text-[#f7f8f8] text-center"
                style={{ fontSize: "24px", lineHeight: 1 }}
              >
                Lesson Complete
              </p>

              {/* Ornamental divider */}
              <div className="shrink-0 flex items-center justify-center" style={{ height: "14px", width: "152px" }}>
                <img
                  src={crossDividerImg}
                  alt=""
                  style={{ width: "100%", height: "auto", opacity: 0.4, display: "block" }}
                />
              </div>

              <p
                className="font-['Afacad'] font-normal text-[#8a8f98] text-center"
                style={{ fontSize: "10px", lineHeight: "10px" }}
              >
                {dayNumber > 0 ? `Day ${dayNumber} · ` : ""}
                {theme || "Lorem ipsum"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer — identical to LessonFlow ── */}
      <div
        className="shrink-0 flex flex-col items-center justify-center"
        style={{
          background: "#0f1116",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "32px",
          paddingBottom: "32px",
        }}
      >
        <div className="max-w-[640px] w-full mx-auto flex items-center justify-end px-4">
          <button
            onClick={onContinue}
            className="flex items-center gap-2 justify-center font-['Afacad'] font-medium text-[#fafafa] transition-opacity hover:opacity-80 text-[14px] leading-[20px]"
            style={{
              background: "#18181b",
              borderRadius: "6px",
              height: "36px",
              paddingLeft: "16px",
              paddingRight: "16px",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)",
            }}
            data-testid="button-completion-continue"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
