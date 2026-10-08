import { cn } from "@/lib/utils";
import { Lock, Loader, CircleCheck, BookOpen } from "lucide-react";

export type DayCardVariant = "full" | "half";

interface DayCardProps {
  variant?: DayCardVariant;
  dayNumber: number;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isCompletedOutOfOrder?: boolean;
  isToday: boolean;
  isLocked: boolean;
  isWorkbookGate?: boolean;
  backgroundImage?: string;
  cohortStartDate?: string | null;
  onClick: () => void;
}

function getUnlockDateLabel(cohortStartDate: string, dayNumber: number): string {
  const start = new Date(cohortStartDate + "T00:00:00");
  const programDayIndex = dayNumber - 1;
  const fullWeeks = Math.floor(programDayIndex / 6);
  const remainder = programDayIndex % 6;
  const unlock = new Date(start);
  unlock.setDate(start.getDate() + fullWeeks * 7 + remainder);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `Unlocks ${months[unlock.getMonth()]} ${unlock.getDate()}`;
}

export function DayCard({
  variant = "half",
  dayNumber,
  title,
  subtitle,
  isCompleted,
  isCompletedOutOfOrder,
  isToday,
  isLocked,
  isWorkbookGate,
  backgroundImage,
  cohortStartDate,
  onClick,
}: DayCardProps) {
  const tooltipTitle = isWorkbookGate
    ? "Complete all Workbook categories to unlock Week 4"
    : isLocked && cohortStartDate
    ? getUnlockDateLabel(cohortStartDate, dayNumber)
    : undefined;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={tooltipTitle}
      data-testid={`card-day-${dayNumber}`}
      className={cn(
        "day-card-hover relative text-left overflow-hidden w-full flex flex-col justify-between",
        "pt-3 px-3 pb-[14px] min-h-[126px]",
        isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      )}
      style={{
        background: "var(--surface-base)",
        border: "0.5px solid var(--white-5)",
        borderRadius: "6px",
      }}
    >
      {/* Full-span background image */}
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className={cn(isLocked && "grayscale")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* State icon — top-left, Figma spec: square box with 5% fill */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "24px",
          height: "24px",
          borderRadius: "4px",
          background: isLocked ? "transparent" : isCompleted ? "rgba(0,255,0,0.05)" : "var(--white-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isWorkbookGate ? (
          <BookOpen style={{ width: "10px", height: "10px", color: "var(--white-30)" }} />
        ) : isLocked ? (
          <Lock style={{ width: "10px", height: "10px", color: "var(--white-30)" }} />
        ) : isCompleted ? (
          <CircleCheck style={{ width: "13px", height: "13px", color: "#00ff00", strokeWidth: 1.8 }} />
        ) : (
          <Loader style={{ width: "13px", height: "13px", color: "#ffffff", strokeWidth: 1.8 }} />
        )}
      </div>

      {/* Text block — bottom of card, hugs title + subtitle with 8px gap */}
      <div className="relative z-[1] flex flex-col gap-2">
        <p
          className="type-display-sm"
          style={{
            letterSpacing: "-0.14px",
            color: "white",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="type-body-xs"
            style={{
              color: "var(--white-45)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
