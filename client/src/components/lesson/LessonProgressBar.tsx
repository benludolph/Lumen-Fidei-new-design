import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onExit: () => void;
}

export function LessonProgressBar({
  currentStep,
  totalSteps,
  onExit,
}: LessonProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="flex items-center gap-3 px-4 py-3" data-testid="lesson-progress-bar">
      <button
        onClick={onExit}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        data-testid="button-exit-lesson"
        aria-label="Exit lesson"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            "bg-gradient-to-r from-[#003725] to-[#005a3a]"
          )}
          style={{ width: `${progress}%` }}
          data-testid="progress-fill"
        />
      </div>

      <span className="shrink-0 text-xs text-muted-foreground font-medium min-w-[3rem] text-right">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  );
}
