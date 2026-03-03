import { cn } from "@/lib/utils";
import { Lock, Check, ArrowRight, Sun, Moon, Church } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayCardProps {
  dayNumber: number;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isCompletedOutOfOrder?: boolean;
  isToday: boolean;
  isLocked: boolean;
  isSunday?: boolean;
  morningCompleted?: boolean;
  eveningCompleted?: boolean;
  isTrackB?: boolean;
  backgroundImage?: string;
  cohortStartDate?: string | null;
  onClick: () => void;
}

function getUnlockDateLabel(cohortStartDate: string, dayNumber: number): string {
  const start = new Date(cohortStartDate + "T00:00:00");
  const unlock = new Date(start);
  unlock.setDate(start.getDate() + (dayNumber - 1));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `This lesson unlocks on ${months[unlock.getMonth()]} ${unlock.getDate()}`;
}

export function DayCard({
  dayNumber,
  title,
  subtitle,
  isCompleted,
  isCompletedOutOfOrder,
  isToday,
  isLocked,
  isSunday,
  morningCompleted,
  eveningCompleted,
  isTrackB,
  backgroundImage,
  cohortStartDate,
  onClick,
}: DayCardProps) {
  if (isSunday) {
    return (
      <div
        data-testid={`card-day-${dayNumber}`}
        className={cn(
          "relative flex items-center gap-3 p-5 rounded-lg shadow-sm text-left w-full min-h-[120px] sm:col-span-2 overflow-hidden",
          !backgroundImage && "bg-gradient-to-r from-[#2d4a22]/90 to-[#5c6b32]/70 dark:from-[#2d4a22]/80 dark:to-[#5c6b32]/60",
          "border border-[#8b7d3c]/30"
        )}
      >
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
          />
        )}
        {backgroundImage && (
          <div className="absolute inset-0 rounded-lg bg-black/50" />
        )}
        <div className="relative z-10 flex items-center gap-4 w-full justify-center">
          <Church className="w-7 h-7 text-[#d4c876]/80" />
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-serif text-[#d4c876] text-lg font-semibold tracking-wide">
              Sunday — Go to Mass
            </p>
            <p className="font-['Afacad',sans-serif] text-white/50 text-xs">
              Day {dayNumber}
            </p>
          </div>
          <Church className="w-7 h-7 text-[#d4c876]/80" />
        </div>
      </div>
    );
  }

  const isPast = !isToday && !isLocked;
  const showGrayscale = !isToday && !isCompleted;

  const tooltipTitle = isLocked && cohortStartDate
    ? getUnlockDateLabel(cohortStartDate, dayNumber)
    : undefined;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={tooltipTitle}
      data-testid={`card-day-${dayNumber}`}
      className={cn(
        "relative flex items-center gap-3 p-5 rounded-lg shadow-sm text-left transition-all duration-200 overflow-hidden group w-full min-h-[120px]",
        dayNumber === 1 && "sm:col-span-2",
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
          "absolute inset-0 rounded-lg transition-colors duration-300",
          backgroundImage && "bg-black/40",
          backgroundImage && isCompleted && !isLocked && "group-hover:bg-black/0",
          !backgroundImage && isToday && "bg-[#003725]",
          !backgroundImage && isCompleted && !isToday && "bg-[#003725]/90",
          !backgroundImage && isPast && !isCompleted && "bg-zinc-800",
          !backgroundImage && isLocked && "bg-zinc-900",
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
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-md shadow-sm",
            isCompletedOutOfOrder ? "bg-yellow-500" : "bg-green-500"
          )}>
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
