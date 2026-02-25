import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
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
  onContinue,
}: LessonCompletionScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const message =
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#001a10]/95"
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

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <div
          className={cn(
            "lesson-completion-check",
            showContent && "lesson-completion-check-visible"
          )}
        >
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>

        <div
          className={cn(
            "space-y-3 transition-all duration-700",
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <h1 className="font-['Afacad',sans-serif] font-semibold text-white text-3xl sm:text-4xl">
            Lesson Complete
          </h1>
          <p className="text-white/60 text-sm tracking-widest uppercase">
            Day {dayNumber}
          </p>
          <p className="text-white/80 text-base sm:text-lg max-w-sm font-light italic">
            {theme}
          </p>
          <p className="text-green-400/80 text-sm mt-2 font-medium">
            {message}
          </p>
        </div>

        <div
          className={cn(
            "mt-6 transition-all duration-500",
            showButton
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <Button
            onClick={onContinue}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-6 text-base rounded-xl shadow-lg shadow-green-600/20"
            data-testid="button-continue-after-completion"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
