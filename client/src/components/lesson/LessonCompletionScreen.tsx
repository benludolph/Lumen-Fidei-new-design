import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { playLessonComplete } from "@/lib/sounds";
import successVideo from "@assets/Untitled_design_1772578374170.mp4";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  onContinue: () => void;
}

export function LessonCompletionScreen({
  dayNumber,
  theme,
  onContinue,
}: LessonCompletionScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    playLessonComplete();
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    const buttonTimer = setTimeout(() => setShowButton(true), 900);
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      data-testid="lesson-completion-screen"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center max-w-[393px] w-full">
          <div
            className={cn(
              "mb-4 transition-all duration-500",
              showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            <div className="w-[160px] h-[160px] rounded-xl overflow-hidden">
              <video
                src={successVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                data-testid="success-video"
              />
            </div>
          </div>

          <div
            className={cn(
              "text-center space-y-1 transition-all duration-700",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h1 className="font-['Afacad',sans-serif] font-bold text-black text-[30px] leading-[37.5px]">
              Lesson Complete
            </h1>
            <div className="space-y-0">
              {dayNumber > 0 && (
                <p className="font-['Afacad',sans-serif] font-semibold text-black text-[16px] tracking-[1.6px] uppercase leading-none pt-3">
                  DAY {dayNumber}
                </p>
              )}
              <p className="font-['Afacad',sans-serif] font-semibold text-black text-[18px] leading-[37.5px]">
                {theme}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-zinc-200 bg-white py-6 sm:py-8 flex justify-center transition-all duration-500",
          showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <Button
          onClick={onContinue}
          className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 h-9 px-4 text-sm font-medium rounded-md shadow-md font-['Afacad',sans-serif]"
          data-testid="button-continue-after-completion"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
