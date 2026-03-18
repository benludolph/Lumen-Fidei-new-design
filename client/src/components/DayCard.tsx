import { cn } from "@/lib/utils";
import { Lock, Check, Clock } from "lucide-react";

interface DayCardProps {
  dayNumber: number;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isCompletedOutOfOrder?: boolean;
  isToday: boolean;
  isLocked: boolean;
  morningCompleted?: boolean;
  eveningCompleted?: boolean;
  isTrackB?: boolean;
  backgroundImage?: string;
  cohortStartDate?: string | null;
  onClick: () => void;
}

function getUnlockDateLabel(cohortStartDate: string, dayNumber: number): string {
  const start = new Date(cohortStartDate + "T00:00:00");
  const programDayIndex = dayNumber - 1;
  const fullWeeks = Math.floor(programDayIndex / 6);
  const remainder = programDayIndex % 6;
  const calendarDaysOffset = fullWeeks * 7 + remainder;
  const unlock = new Date(start);
  unlock.setDate(start.getDate() + calendarDaysOffset);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `This lesson unlocks on ${months[unlock.getMonth()]} ${unlock.getDate()}`;
}

function StatusBadge({
  isLocked,
  isCompleted,
  isCompletedOutOfOrder,
}: {
  isLocked: boolean;
  isCompleted: boolean;
  isCompletedOutOfOrder?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "5px",
        background: "rgba(0,0,0,0.72)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {isLocked ? (
        <Lock className="w-3.5 h-3.5 text-white/35" />
      ) : isCompleted ? (
        isCompletedOutOfOrder ? (
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        )
      ) : (
        <div
          className="rounded-full border border-white/30"
          style={{ width: "8px", height: "8px" }}
        />
      )}
    </div>
  );
}

export function DayCard({
  dayNumber,
  title,
  subtitle,
  isCompleted,
  isCompletedOutOfOrder,
  isToday,
  isLocked,
  morningCompleted,
  eveningCompleted,
  isTrackB,
  backgroundImage,
  cohortStartDate,
  onClick,
}: DayCardProps) {
  const tooltipTitle =
    isLocked && cohortStartDate
      ? getUnlockDateLabel(cohortStartDate, dayNumber)
      : undefined;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={tooltipTitle}
      data-testid={`card-day-${dayNumber}`}
      className={cn(
        "relative flex flex-col justify-between text-left w-full transition-opacity duration-200",
        isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
      )}
      style={{
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
        padding: "12.17px 12.17px 14.118px 12.17px",
        minHeight: "126px",
        overflow: "clip",
      }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-79.49px",
            top: "-58.49px",
            width: "463px",
            height: "209px",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      )}

      {backgroundImage && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, #0f1011 35%, rgba(15,16,17,0.65) 60%, rgba(15,16,17,0) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-10">
        <StatusBadge
          isLocked={isLocked}
          isCompleted={isCompleted}
          isCompletedOutOfOrder={isCompletedOutOfOrder}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-0 min-w-0" style={{ maxWidth: "55%" }}>
        <p
          className="text-white line-clamp-2"
          style={{
            fontFamily: "'IT Cathdra Demo', sans-serif",
            fontSize: "18px",
            lineHeight: "28px",
          }}
        >
          {title}
        </p>
        <p
          className="text-[#d0d6e0] truncate"
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            letterSpacing: "2.4px",
            lineHeight: "24px",
          }}
        >
          DAY {dayNumber}
        </p>
      </div>
    </button>
  );
}
