import { cn } from "@/lib/utils";
import { Lock, Check, Sun, Moon } from "lucide-react";

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
  fullWidth?: boolean;
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
  return `Unlocks ${months[unlock.getMonth()]} ${unlock.getDate()}`;
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
  fullWidth = false,
  onClick,
}: DayCardProps) {
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
        "relative text-left transition-all duration-200 overflow-hidden group w-full",
        isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-110",
      )}
      style={{
        height: "126px",
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
      }}
    >
      {/* Background image — overflows top-right (2-col) or offsets left (full-width) */}
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className={cn(
              "absolute object-cover transition-all duration-300 pointer-events-none",
              isLocked && "grayscale opacity-60",
            )}
            style={
              fullWidth
                ? { left: "224px", top: "-58px", width: "463px", height: "auto", minHeight: "242px" }
                : { right: "-0.94px", top: "-25.23px", width: "128.517px", height: "auto", minHeight: "177px" }
            }
          />
          {/* Gradient overlay so text is readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: fullWidth
                ? "linear-gradient(267.99deg, rgba(15,16,17,0) 30%, rgb(15,16,17) 65%)"
                : "linear-gradient(267.99deg, rgba(15,16,17,0) 20%, rgb(15,16,17) 75%)",
            }}
          />
        </>
      )}

      {/* State icon — top-left, Figma spec: left:12.17px, top:12.17px, 23.367×23.367 */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "12.17px", top: "12.17px", width: "23.367px", height: "23.367px" }}
      >
        {isLocked ? (
          <Lock className="w-3.5 h-3.5 text-white/30" />
        ) : isCompleted ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              isCompletedOutOfOrder ? "bg-yellow-500" : "bg-[#22c55e]"
            )}
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
        ) : isToday ? (
          <div
            className="flex items-center justify-center rounded-full bg-[#F07830]"
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <span className="text-white text-[9px] font-bold" style={{ fontFamily: "'Afacad', sans-serif" }}>
              NOW
            </span>
          </div>
        ) : (
          <div
            className="rounded-full border border-[rgba(255,255,255,0.12)]"
            style={{ width: "23.367px", height: "23.367px" }}
          />
        )}
      </div>

      {/* Text block — bottom-left, Figma: left:12.17px, top:77.094px */}
      <div
        className="absolute"
        style={{ left: "12.17px", top: "77.094px", maxWidth: fullWidth ? "340px" : "175.25px" }}
      >
        <p
          className="text-white text-[13px] leading-[16px] font-medium truncate"
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          Day {dayNumber} · {title}
        </p>
        {subtitle && (
          <p
            className="text-[rgba(255,255,255,0.45)] text-[11px] leading-[14px] truncate mt-[3px]"
            style={{ fontFamily: "'Afacad', sans-serif" }}
          >
            {subtitle}
          </p>
        )}
        {isTrackB && !isLocked && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Sun className={cn("w-2.5 h-2.5", morningCompleted ? "text-[#22c55e]" : "text-white/30")} />
              <span className={cn("text-[10px]", morningCompleted ? "text-[#22c55e]" : "text-white/30")}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                AM
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Moon className={cn("w-2.5 h-2.5", eveningCompleted ? "text-[#22c55e]" : "text-white/30")} />
              <span className={cn("text-[10px]", eveningCompleted ? "text-[#22c55e]" : "text-white/30")}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                PM
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
