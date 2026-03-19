import { useState, useRef, useCallback } from "react";
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const tooltipTitle = isLocked && cohortStartDate
    ? getUnlockDateLabel(cohortStartDate, dayNumber)
    : undefined;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const wrapperBg = isLocked && isHovering
    ? `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 40%, transparent 68%)`
    : isHovering
    ? "rgba(255,255,255,0.12)"
    : "rgba(255,255,255,0.05)";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "5.842px",
        padding: "0.487px",
        background: wrapperBg,
        transition: isHovering && isLocked ? "none" : "background 0.2s ease",
        width: "100%",
      }}
    >
      <button
        ref={btnRef}
        onClick={isLocked ? undefined : onClick}
        disabled={isLocked}
        title={tooltipTitle}
        data-testid={`card-day-${dayNumber}`}
        onMouseMove={isLocked ? handleMouseMove : undefined}
        onMouseEnter={(e) => {
          setIsHovering(true);
          if (!isLocked) {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          setIsHovering(false);
          setMousePos({ x: 0, y: 0 });
          if (!isLocked) {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }
        }}
        style={{
          position: "relative",
          textAlign: "left",
          overflow: "hidden",
          width: "100%",
          background: "#0f1011",
          border: "none",
          borderRadius: "5.355px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: "12.17px",
          paddingLeft: "12.17px",
          paddingRight: "12.17px",
          paddingBottom: "14.118px",
          minHeight: "126px",
          transition: "transform 0.15s ease",
          opacity: isLocked ? 0.45 : 1,
          cursor: isLocked ? "default" : "pointer",
        }}
      >
        {/* Spotlight inner glow — locked only */}
        {isLocked && isHovering && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.032) 0%, transparent 52%)`,
            }}
          />
        )}

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

        {/* State icon — top-left: 23.367×23.367px */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "23.367px",
            height: "23.367px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isLocked ? (
            <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.3)" }} />
            </div>
          ) : isCompleted ? (
            <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", background: isCompletedOutOfOrder ? "#eab308" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check style={{ width: "11px", height: "11px", color: "white", strokeWidth: 2.5 }} />
            </div>
          ) : isToday ? (
            <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", background: "#F07830", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "8px", lineHeight: 1, color: "white", fontWeight: 700 }}>NOW</span>
            </div>
          ) : (
            <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)" }} />
          )}
        </div>

        {/* Text block — bottom of card */}
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
    </div>
  );
}
