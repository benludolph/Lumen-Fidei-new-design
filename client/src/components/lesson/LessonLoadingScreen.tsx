import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LessonLoadingScreenProps {
  dayNumber: number;
  theme: string;
  backgroundImage?: string;
  onComplete: () => void;
}

export function LessonLoadingScreen({
  dayNumber,
  theme,
  backgroundImage,
  onComplete,
}: LessonLoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const completeTimer = setTimeout(() => onComplete(), 2300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500",
        fadeOut ? "opacity-0" : "opacity-100"
      )}
      data-testid="lesson-loading-screen"
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}
      <div className="absolute inset-0 bg-black/90" />

      <div className="lesson-loading-glow" />

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-4 sm:px-6 text-center lesson-loading-content max-w-[90vw]">
        <div className="lesson-loading-cross">
          <svg
            width="40"
            height="40"
            viewBox="0 0 48 48"
            fill="none"
            className="text-white/80 sm:w-12 sm:h-12"
          >
            <rect x="21" y="4" width="6" height="40" rx="3" fill="currentColor" />
            <rect x="8" y="17" width="32" height="6" rx="3" fill="currentColor" />
          </svg>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <p className="text-white/60 text-xs sm:text-sm font-medium tracking-widest uppercase">
            {dayNumber < 0 ? `Module ${Math.abs(dayNumber)}` : dayNumber === 0 ? "Introduction" : `Day ${dayNumber}`}
          </p>
          <h1 className="font-['Afacad',sans-serif] font-semibold text-white text-xl sm:text-2xl md:text-3xl max-w-[280px] sm:max-w-md leading-tight">
            {theme}
          </h1>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 lesson-loading-dot" style={{ animationDelay: "0s" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 lesson-loading-dot" style={{ animationDelay: "0.2s" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 lesson-loading-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
