import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  completionMessage?: string | null;
  onContinue: () => void;
}

const ENCOURAGING_MESSAGES = [
  "Well done, faithful servant.",
  "You have persevered in faith today.",
  "The Lord delights in your devotion.",
  "Your commitment to growth is beautiful.",
  "Grace upon grace, day by day.",
  "You are growing in wisdom and love.",
];

export function LessonCompletionScreen({
  dayNumber,
  theme,
  completionMessage,
  onContinue,
}: LessonCompletionScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const message = completionMessage ||
    ENCOURAGING_MESSAGES[(dayNumber - 1) % ENCOURAGING_MESSAGES.length];

  const sparkles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: `${15 + ((i * 37 + 13) % 70)}%`,
        top: `${15 + ((i * 53 + 7) % 70)}%`,
        delay: `${0.3 + (i * 0.18)}s`,
        duration: `${2 + (i % 3)}s`,
      })),
    []
  );

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 400);
    const buttonTimer = setTimeout(() => setShowButton(true), 1200);
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      data-testid="lesson-completion-screen"
    >
      <div className="lesson-completion-glow" />

      {sparkles.map((s, i) => (
        <div
          key={i}
          className="lesson-sparkle"
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-4 sm:px-6 text-center max-w-[90vw]">
        <div
          className={cn(
            "lesson-completion-check",
            showContent && "lesson-completion-check-visible"
          )}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={3} />
          </div>
        </div>

        <div
          className={cn(
            "space-y-2 sm:space-y-3 transition-all duration-700",
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <h1 className="font-['Afacad',sans-serif] font-semibold text-white text-2xl sm:text-3xl md:text-4xl">
            Lesson Complete
          </h1>
          <p className="text-white/60 text-xs sm:text-sm tracking-widest uppercase">
            Day {dayNumber}
          </p>
          <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-[260px] sm:max-w-sm font-light italic">
            {theme}
          </p>
          <p className="text-green-400/80 text-xs sm:text-sm mt-2 font-medium">
            {message}
          </p>
        </div>

        <div
          className={cn(
            "mt-4 sm:mt-6 w-full sm:w-auto transition-all duration-500",
            showButton
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <Button
            onClick={onContinue}
            size="lg"
            className="bg-green-600 text-white gap-2 w-full sm:w-auto sm:px-8 text-base rounded-xl shadow-lg shadow-green-600/20"
            data-testid="button-continue-after-completion"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
