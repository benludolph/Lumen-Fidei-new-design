import { cn } from "@/lib/utils";
import { Lock, Loader, CircleCheck, Sun, Moon } from "lucide-react";

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
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingTop: "12.17px",
        paddingLeft: "12.17px",
        paddingRight: "12.17px",
        paddingBottom: "14.118px",
        minHeight: "126px",
        transition: "transform 0.15s ease, border-color 0.15s ease",
        opacity: isLocked ? 0.4 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (isLocked) return;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        if (isLocked) return;
        (e.currentTarget as HTMLButtonElement).style.transform = "";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.05)";
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
          width: "23.367px",
          height: "23.367px",
          borderRadius: "4px",
          background: isLocked ? "transparent" : isCompleted ? "rgba(0,255,0,0.05)" : "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isLocked ? (
          <Lock style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.3)" }} />
        ) : isCompleted ? (
          <CircleCheck style={{ width: "13px", height: "13px", color: "#00ff00", strokeWidth: 1.8 }} />
        ) : (
          <Loader style={{ width: "13px", height: "13px", color: "#ffffff", strokeWidth: 1.8 }} />
        )}
      </div>

      {/* Text block — bottom of card, hugs title + subtitle with 8px gap */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <p
          style={{
            fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
            fontSize: "16px",
            lineHeight: "15.5px",
            letterSpacing: "-0.14px",
            color: "white",
            fontWeight: 500,
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
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "10px",
              lineHeight: "13px",
              letterSpacing: "0px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <Sun style={{ width: "10px", height: "10px", color: morningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }} />
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", color: morningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }}>AM</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <Moon style={{ width: "10px", height: "10px", color: eveningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }} />
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", color: eveningCompleted ? "#22c55e" : "rgba(255,255,255,0.3)" }}>PM</span>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
