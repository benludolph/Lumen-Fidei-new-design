import { cn } from "@/lib/utils";
import { Lock, Check, Clock } from "lucide-react";

const MASK19_URL = "/card_mask19.svg";
const MASK20_URL = "/card_mask20.svg";
const VECTOR_URL = "/card_vector.svg";
const VECTOR1_URL = "/card_vector1.svg";
const LOADER_ICON_URL = "/loader_icon.svg";

const VECTOR1_POSITIONS: Array<[string, string]> = [
  ["46.79%_7.79%_53.21%_91.51%", "-435.521px_-111.684px,_-435.521px_-346.085px"],
  ["46.79%_9.66%_53.21%_89.64%", "-428.276px_-111.684px,_-428.276px_-346.085px"],
  ["46.79%_11.53%_53.21%_87.77%", "-421.03px_-111.684px,_-421.03px_-346.085px"],
  ["46.79%_13.39%_53.21%_85.91%", "-413.785px_-111.684px,_-413.785px_-346.085px"],
  ["46.79%_15.26%_53.21%_84.04%", "-406.54px_-111.684px,_-406.54px_-346.085px"],
  ["46.79%_17.13%_53.21%_82.17%", "-399.295px_-111.684px,_-399.295px_-346.085px"],
  ["46.79%_5.92%_53.21%_93.38%", "-442.766px_-111.684px,_-442.766px_-346.085px"],
  ["46.79%_4.06%_53.21%_95.24%", "-450.012px_-111.684px,_-450.012px_-346.085px"],
  ["46.79%_2.19%_53.21%_97.11%", "-457.257px_-111.684px,_-457.257px_-346.085px"],
  ["46.79%_0.32%_53.21%_98.98%", "-464.502px_-111.684px,_-464.502px_-346.085px"],
  ["46.79%_-1.55%_53.21%_100.85%", "-471.747px_-111.684px,_-471.747px_-346.085px"],
  ["46.79%_28.33%_53.21%_70.97%", "-355.823px_-111.684px,_-355.823px_-346.085px"],
  ["46.79%_30.2%_53.21%_69.1%", "-348.578px_-111.684px,_-348.578px_-346.085px"],
  ["46.79%_32.07%_53.21%_67.23%", "-341.333px_-111.684px,_-341.333px_-346.085px"],
  ["46.79%_33.93%_53.21%_65.37%", "-334.087px_-111.684px,_-334.087px_-346.085px"],
  ["46.79%_35.8%_53.21%_63.5%", "-326.842px_-111.684px,_-326.842px_-346.085px"],
  ["46.79%_37.67%_53.21%_61.63%", "-319.597px_-111.684px,_-319.597px_-346.085px"],
  ["46.79%_26.46%_53.21%_72.84%", "-363.069px_-111.684px,_-363.069px_-346.085px"],
  ["46.79%_24.6%_53.21%_74.7%", "-370.314px_-111.684px,_-370.314px_-346.085px"],
  ["46.79%_22.73%_53.21%_76.57%", "-377.559px_-111.684px,_-377.559px_-346.085px"],
  ["46.79%_20.86%_53.21%_78.44%", "-384.804px_-111.684px,_-384.804px_-346.085px"],
  ["46.79%_18.99%_53.21%_80.31%", "-392.05px_-111.684px,_-392.05px_-346.085px"],
];

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
      className="flex items-center justify-center shrink-0 relative"
      style={{
        width: "23.367px",
        height: "23.367px",
        borderRadius: "3.894px",
        background: "rgba(255,255,255,0.05)",
        boxShadow: "0px 0.974px 1.947px 0px rgba(0,0,0,0.1)",
      }}
    >
      {isLocked ? (
        <Lock style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.35)" }} />
      ) : isCompleted ? (
        isCompletedOutOfOrder ? (
          <Clock style={{ width: "10px", height: "10px", color: "rgb(251,191,36)" }} />
        ) : (
          <Check style={{ width: "10px", height: "10px", color: "rgb(52,211,153)" }} />
        )
      ) : (
        <img
          src={LOADER_ICON_URL}
          alt=""
          style={{ width: "13px", height: "13px", display: "block" }}
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

  const maskStyle = {
    maskImage: `url('${MASK19_URL}'), url('${MASK20_URL}')`,
    maskSize: "100% 100%",
    maskPosition: "-181.564px 22.453px, -181.564px -211.948px",
  };

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={tooltipTitle}
      data-testid={`card-day-${dayNumber}`}
      className={cn(
        "relative flex flex-col items-start justify-between text-left w-full transition-opacity duration-200",
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
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-79.49px",
            top: "-58.49px",
            width: "463px",
            height: "209px",
            maxWidth: "736px",
            pointerEvents: "none",
            overflow: "clip",
            backgroundClip: "padding-box",
            borderColor: "transparent",
            borderStyle: "solid",
            borderWidth: "0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "182px",
              width: "388px",
              overflow: "clip",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: "198px",
                overflow: "clip",
                position: "relative",
                flexShrink: 0,
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "26.06%",
                  right: "-55.41%",
                  top: "-41.5px",
                  aspectRatio: "1024/1024",
                  ...maskStyle,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                >
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                    <img
                      alt=""
                      style={{
                        position: "absolute",
                        left: "-0.14%",
                        maxWidth: "none",
                        width: "100%",
                        height: "100%",
                        top: 0,
                      }}
                      src={backgroundImage}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "linear-gradient(267.9904458480522deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  inset: "13.13% -1.55% -16.16% 39.69%",
                }}
              >
                <div
                  className="opacity-10"
                  style={{
                    position: "absolute",
                    inset: "28.47% -1.31% 71.53% 39.69%",
                    maskImage: `url('${MASK19_URL}'), url('${MASK20_URL}')`,
                    maskSize: "100% 100%",
                    maskPosition: "-234.465px -75.418px, -234.465px -309.819px",
                  }}
                >
                  <div style={{ position: "absolute", inset: "-0.34px 0" }}>
                    <img alt="" style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }} src={VECTOR_URL} />
                  </div>
                </div>

                {VECTOR1_POSITIONS.map(([inset, maskPos], i) => (
                  <div
                    key={i}
                    className="opacity-10"
                    style={{
                      position: "absolute",
                      inset: inset.replace(/_/g, " "),
                      maskImage: `url('${MASK19_URL}'), url('${MASK20_URL}')`,
                      maskSize: "100% 100%",
                      maskPosition: maskPos.replace(/_/g, " "),
                    }}
                  >
                    <div style={{ position: "absolute", inset: "-0.34px 0" }}>
                      <img alt="" style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }} src={VECTOR1_URL} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative" style={{ zIndex: 10 }}>
        <StatusBadge
          isLocked={isLocked}
          isCompleted={isCompleted}
          isCompletedOutOfOrder={isCompletedOutOfOrder}
        />
      </div>

      <div
        className="relative flex flex-col items-start w-full"
        style={{ zIndex: 10, gap: "7.789px" }}
      >
        <div style={{ maxWidth: "175.25px" }}>
          <p
            style={{
              fontFamily: "'IT Cathdra Demo', sans-serif",
              fontSize: "16px",
              color: "#f7f8f8",
              letterSpacing: "-0.1402px",
              lineHeight: "15.539px",
              margin: 0,
            }}
          >
            {title}
          </p>
        </div>
        <div className="flex items-center justify-between w-full">
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              color: "#8a8f98",
              lineHeight: "10.223px",
              margin: 0,
            }}
          >
            {subtitle || `DAY ${dayNumber}`}
          </p>
        </div>
      </div>
    </button>
  );
}
