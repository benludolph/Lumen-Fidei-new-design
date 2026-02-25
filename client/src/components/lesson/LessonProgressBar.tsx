import { X } from "lucide-react";

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
    <div
      className="flex items-center gap-3 px-3 h-[76px] w-full bg-white shadow-[0px_0px_15px_0px_rgba(0,0,0,0.1)] sticky top-0 z-50"
      data-testid="lesson-progress-bar"
    >
      <button
        onClick={onExit}
        className="shrink-0 w-12 h-12 min-w-[48px] flex items-center justify-center rounded-md border-2 border-transparent text-foreground hover:bg-muted/50 transition-colors"
        data-testid="button-exit-lesson"
        aria-label="Exit lesson"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[592px] h-3 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out bg-[#00b57a]"
            style={{ width: `${progress}%` }}
            data-testid="progress-fill"
          />
        </div>
      </div>
    </div>
  );
}
