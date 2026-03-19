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
        paddingTop: "12.17px",
        paddingBottom: "14.118px",
        paddingLeft: "12.17px",
        paddingRight: "12.17px",
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
      {/* Full-span background image — covers the entire card */}
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
          {/* Bottom scrim — makes text readable over any image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(15,16,17,0.95) 0%, rgba(15,16,17,0.6) 50%, rgba(15,16,17,0.15) 100%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* State icon — Figma: left:12.17px, top:12.17px, 23.367×23.367 */}
      <div
        style={{
          position: "absolute",
          left: "12.17px",
          top: "12.17px",
          width: "23.367px",
          height: "23.367px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLocked ? (
          <div
            style={{
              width: "23.367px",
              height: "23.367px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.3)" }} />
          </div>
        ) : isCompleted ? (
          <div
            style={{
              width: "23.367px",
              height: "23.367px",
              borderRadius: "50%",
              background: isCompletedOutOfOrder ? "#eab308" : "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check style={{ width: "11px", height: "11px", color: "white", strokeWidth: 2.5 }} />
          </div>
        ) : isToday ? (
          <div
            style={{
              width: "23.367px",
              height: "23.367px",
              borderRadius: "50%",
              background: "#F07830",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "8px",
                lineHeight: 1,
                color: "white",
                fontWeight: 700,
              }}
            >
              NOW
            </span>
          </div>
        ) : (
          <div
            style={{
              width: "23.367px",
              height: "23.367px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        )}
      </div>

      {/* Text block — Figma: left:12.17px, top:77.094px */}
      <div
        style={{
          position: "absolute",
          left: "12.17px",
          top: "77.094px",
          width: variant === "full" ? "340px" : "175.25px",
          maxWidth: "calc(100% - 24px)",
        }}
      >
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "13px",
            lineHeight: "16px",
            color: "white",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "10px",
              lineHeight: "11px",
              marginTop: "23.788px",
              color: "rgba(255,255,255,0.45)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
        {isTrackB && !isLocked && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <Sun style={{ width: "10px", height: "10px", color: morningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }} />
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", color: morningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }}>AM</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <Moon style={{ width: "10px", height: "10px", color: eveningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }} />
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", color: eveningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }}>PM</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
