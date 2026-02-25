import { cn } from "@/lib/utils";
import { Lock, Check, ArrowRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayCardProps {
  dayNumber: number;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isToday: boolean;
  isLocked: boolean;
  isSunday?: boolean;
  morningCompleted?: boolean;
  eveningCompleted?: boolean;
  isTrackB?: boolean;
  backgroundImage?: string;
  onClick: () => void;
}

export function DayCard({
  dayNumber,
  title,
  subtitle,
  isCompleted,
  isToday,
  isLocked,
  isSunday,
  morningCompleted,
  eveningCompleted,
  isTrackB,
  backgroundImage,
  onClick,
}: DayCardProps) {
  const isPast = !isToday && !isLocked;
  const showGrayscale = !isToday && !isCompleted;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      data-testid={`card-day-${dayNumber}`}
      className={cn(
        "relative flex items-center gap-3 p-5 rounded-lg shadow-sm text-left transition-all duration-200 overflow-hidden group w-full min-h-[120px]",
        isSunday && "col-span-2",
        isLocked && "opacity-40 cursor-not-allowed",
        !isLocked && !isCompleted && "hover:shadow-md hover:scale-[1.01] cursor-pointer",
        isCompleted && "cursor-pointer hover:shadow-md",
      )}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover rounded-lg transition-all duration-300",
            showGrayscale && "grayscale",
          )}
        />
      )}

      <div
        className={cn(
          "absolute inset-0 rounded-lg",
          backgroundImage && isToday && "bg-gradient-to-r from-[#003725]/80 to-[#003725]/30",
          backgroundImage && isCompleted && !isToday && "bg-gradient-to-r from-[#003725]/85 to-[#003725]/40",
          backgroundImage && isPast && !isCompleted && "bg-gradient-to-r from-zinc-800/90 to-zinc-800/50",
          backgroundImage && isLocked && "bg-gradient-to-r from-zinc-900/90 to-zinc-900/50",
          !backgroundImage && isToday && "bg-gradient-to-r from-[#003725] to-[#003725]/60",
          !backgroundImage && isCompleted && !isToday && "bg-gradient-to-r from-[#003725]/90 to-[#003725]/40",
          !backgroundImage && isPast && !isCompleted && "bg-gradient-to-r from-zinc-800 to-zinc-800/60",
          !backgroundImage && isLocked && "bg-gradient-to-r from-zinc-900 to-zinc-900/60",
        )}
      />

      <div className="relative z-10 flex flex-col gap-1 flex-1 min-w-0">
        <p className="font-['Afacad',sans-serif] font-semibold text-white text-[16px] leading-7 line-clamp-2 drop-shadow-sm">
          Day {dayNumber}. {title}
        </p>
        {subtitle && (
          <p className="font-['Afacad',sans-serif] text-white/70 text-[13px] leading-5 truncate drop-shadow-sm">
            {subtitle}
          </p>
        )}
        {isTrackB && !isLocked && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Sun className={cn("w-3 h-3", morningCompleted ? "text-green-400" : "text-white/40")} />
              <span className={cn("text-[11px]", morningCompleted ? "text-green-400" : "text-white/40")}>AM</span>
            </div>
            <div className="flex items-center gap-1">
              <Moon className={cn("w-3 h-3", eveningCompleted ? "text-green-400" : "text-white/40")} />
              <span className={cn("text-[11px]", eveningCompleted ? "text-green-400" : "text-white/40")}>PM</span>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 shrink-0">
        {isLocked ? (
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white/10">
            <Lock className="w-4 h-4 text-white/50" />
          </div>
        ) : isCompleted ? (
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-green-500 shadow-sm">
            <Check className="w-5 h-5 text-white" />
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 h-9 text-sm font-medium pointer-events-none"
            tabIndex={-1}
            data-testid={`button-start-day-${dayNumber}`}
          >
            Start
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </button>
  );
}
