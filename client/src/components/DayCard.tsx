import { cn } from "@/lib/utils";
import { Lock, Check, Sun, Moon } from "lucide-react";

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
  morningCompleted,
  eveningCompleted,
  isTrackB,
  backgroundImage,
  cohortStartDate,
  onClick,
}: DayCardProps) {
  const isFull = variant === "full";
  const tooltipTitle = isLocked && cohortStartDate
    ? getUnlockDateLabel(cohortStartDate, dayNumber)
    : undefined;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={tooltipTitle}
      data-testid={`card-day-${dayNumber}`}
      style={{
        position: "relative",
        textAlign: "left",
        overflow: "hidden",
        width: "100%",
        height: "126px",
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
        transition: "transform 0.15s ease, border-color 0.15s ease",
        opacity: isLocked ? 0.4 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isLocked) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = "translateY(-2px)";
          el.style.borderColor = "rgba(255,255,255,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isLocked) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = "";
          el.style.borderColor = "rgba(255,255,255,0.05)";
        }
      }}
    >
      {/* Background image */}
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className={cn(
              "absolute object-cover pointer-events-none",
              isLocked && "grayscale opacity-60",
            )}
            style={
              isFull
                ? { left: "224px", top: "-58px", width: "463px", height: "auto", minHeight: "242px" }
                : { right: "-0.94px", top: "-25.23px", width: "128.517px", height: "auto", minHeight: "177px" }
            }
          />
          {/* Exact Figma gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)",
            }}
          />
        </>
      )}

      {/* State icon — Figma: left:12.17px, top:12.17px, 23.367×23.367 */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "12.17px", top: "12.17px", width: "23.367px", height: "23.367px" }}
      >
        {isLocked ? (
          <div
            className="rounded-full border border-[rgba(255,255,255,0.12)] flex items-center justify-center"
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <Lock className="w-[10px] h-[10px] text-white/30" />
          </div>
        ) : isCompleted ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              isCompletedOutOfOrder ? "bg-yellow-500" : "bg-[#22c55e]",
            )}
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <Check className="w-[11px] h-[11px] text-white" strokeWidth={2.5} />
          </div>
        ) : isToday ? (
          <div
            className="flex items-center justify-center rounded-full bg-[#F07830]"
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <span
              className="text-white font-bold"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "8px", lineHeight: 1 }}
            >
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

      {/* Text block — Figma: left:12.17px, top:77.094px */}
      <div
        className="absolute"
        style={{
          left: "12.17px",
          top: "77.094px",
          maxWidth: isFull ? "340px" : "175.25px",
        }}
      >
        <p
          className="text-white leading-[16px] font-medium truncate"
          style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px" }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-[rgba(255,255,255,0.45)] leading-[14px] truncate"
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "11px",
              marginTop: "3px",
            }}
          >
            {subtitle}
          </p>
        )}
        {isTrackB && !isLocked && (
          <div className="flex items-center gap-2 mt-[4px]">
            <div className="flex items-center gap-0.5">
              <Sun
                className={cn("w-[10px] h-[10px]", morningCompleted ? "text-[#22c55e]" : "text-white/30")}
              />
              <span
                className={cn("text-[10px]", morningCompleted ? "text-[#22c55e]" : "text-white/30")}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                AM
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Moon
                className={cn("w-[10px] h-[10px]", eveningCompleted ? "text-[#22c55e]" : "text-white/30")}
              />
              <span
                className={cn("text-[10px]", eveningCompleted ? "text-[#22c55e]" : "text-white/30")}
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
