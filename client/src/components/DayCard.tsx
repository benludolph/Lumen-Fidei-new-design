import { cn } from "@/lib/utils";
import { Lock, Check, Clock } from "lucide-react";

const MASK19 = "/bento_mask19.svg";
const MASK20 = "/bento_mask20.svg";
const VECTOR = "/bento_vector.svg";
const VECTOR1 = "/bento_vector1.svg";
const LOADER = "/loader_icon.svg";

const MASK_IMAGE = `url('${MASK19}'), url('${MASK20}')`;

const VECTOR_POSITIONS: Array<{ inset: string; maskPos: string }> = [
  { inset: "21.2% 20.74% 78.8% -20.74%", maskPos: "0.001px -21.119px, 0.001px -169.273px" },
  { inset: "39.06% 20.36% 60.94% 78.5%", maskPos: "-170.057px -47.111px, -170.057px -195.265px" },
  { inset: "39.06% 23.39% 60.94% 75.47%", maskPos: "-164.864px -47.111px, -164.864px -195.265px" },
  { inset: "39.06% 26.42% 60.94% 72.44%", maskPos: "-159.672px -47.111px, -159.672px -195.265px" },
  { inset: "39.06% 29.45% 60.94% 69.41%", maskPos: "-154.479px -47.111px, -154.479px -195.265px" },
  { inset: "39.06% 32.48% 60.94% 66.38%", maskPos: "-149.286px -47.111px, -149.286px -195.265px" },
  { inset: "39.06% 35.51% 60.94% 63.35%", maskPos: "-144.094px -47.111px, -144.094px -195.265px" },
  { inset: "39.06% 38.54% 60.94% 60.32%", maskPos: "-138.901px -47.111px, -138.901px -195.265px" },
  { inset: "39.06% 41.57% 60.94% 57.29%", maskPos: "-133.708px -47.111px, -133.709px -195.265px" },
  { inset: "39.06% 44.6% 60.94% 54.26%", maskPos: "-128.516px -47.111px, -128.516px -195.265px" },
  { inset: "39.06% 47.63% 60.94% 51.23%", maskPos: "-123.323px -47.111px, -123.324px -195.265px" },
  { inset: "39.06% 50.66% 60.94% 48.2%", maskPos: "-118.131px -47.111px, -118.131px -195.265px" },
  { inset: "39.06% 53.69% 60.94% 45.17%", maskPos: "-112.938px -47.111px, -112.938px -195.265px" },
  { inset: "39.06% 56.72% 60.94% 42.14%", maskPos: "-107.746px -47.111px, -107.746px -195.265px" },
  { inset: "39.06% 59.75% 60.94% 39.11%", maskPos: "-102.553px -47.111px, -102.553px -195.265px" },
  { inset: "39.06% 62.78% 60.94% 36.08%", maskPos: "-97.360px -47.111px, -97.360px -195.265px" },
  { inset: "39.06% 65.81% 60.94% 33.05%", maskPos: "-92.168px -47.111px, -92.168px -195.265px" },
  { inset: "39.06% 68.85% 60.94% 30.02%", maskPos: "-86.975px -47.111px, -86.975px -195.265px" },
  { inset: "39.06% 71.88% 60.94% 26.99%", maskPos: "-81.782px -47.111px, -81.783px -195.265px" },
  { inset: "39.06% 74.91% 60.94% 23.96%", maskPos: "-76.59px -47.111px, -76.59px -195.265px" },
  { inset: "39.06% 77.94% 60.94% 20.93%", maskPos: "-71.397px -47.111px, -71.397px -195.265px" },
  { inset: "39.06% 80.97% 60.94% 17.9%", maskPos: "-66.205px -47.111px, -66.205px -195.265px" },
  { inset: "39.06% 84% 60.94% 14.87%", maskPos: "-61.012px -47.111px, -61.012px -195.265px" },
  { inset: "56.91% 20.74% 43.09% -20.74%", maskPos: "0.001px -56.866px, 0.001px -205.02px" },
  { inset: "74.77% 20.36% 25.23% 78.5%", maskPos: "-170.057px -92.622px, -170.057px -240.776px" },
  { inset: "74.77% 35.51% 25.23% 63.35%", maskPos: "-144.094px -92.622px, -144.094px -240.776px" },
  { inset: "74.77% 50.66% 25.23% 48.2%", maskPos: "-118.131px -92.622px, -118.131px -240.776px" },
  { inset: "74.77% 65.81% 25.23% 33.05%", maskPos: "-92.168px -92.622px, -92.168px -240.776px" },
  { inset: "74.77% 80.97% 25.23% 17.9%", maskPos: "-66.205px -92.622px, -66.205px -240.776px" },
  { inset: "92.63% 20.74% 7.37% -20.74%", maskPos: "0.001px -92.622px, 0.001px -240.776px" },
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
      style={{
        width: "23.367px",
        height: "23.367px",
        borderRadius: "3.894px",
        background: "rgba(255,255,255,0.05)",
        boxShadow: "0px 0.974px 1.947px 0px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
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
        <img src={LOADER} alt="" style={{ width: "13px", height: "13px", display: "block" }} />
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
            right: "-1.44px",
            top: "-25.23px",
            width: "128.517px",
            maxWidth: "736px",
            pointerEvents: "none",
            overflow: "clip",
            backgroundClip: "padding-box",
            borderColor: "transparent",
            borderStyle: "solid",
            borderWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: "inherit",
              overflow: "clip",
              position: "relative",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "145.555px",
                width: "171.356px",
                overflow: "clip",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  height: "145.555px",
                  overflow: "clip",
                  position: "relative",
                  flexShrink: 0,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "3.88%",
                    right: "0.66%",
                    top: "-0.4px",
                    aspectRatio: "1024/1024",
                    maskImage: MASK_IMAGE,
                    maskSize: "100% 100%",
                    maskPosition: "-42.189px 10.14px, -42.189px -138.014px",
                  }}
                >
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <img
                      alt=""
                      style={{
                        position: "absolute",
                        maxWidth: "none",
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                      src={backgroundImage}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "linear-gradient(267.9904459701475deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)",
                      }}
                    />
                  </div>
                </div>

                <div style={{ position: "absolute", inset: "6.24% 20.36% -6.69% -20.74%", display: "contents" }}>
                  {VECTOR_POSITIONS.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        inset: v.inset,
                        opacity: 0.1,
                        maskImage: MASK_IMAGE,
                        maskSize: "100% 100%",
                        maskPosition: v.maskPos,
                      }}
                    >
                      <div style={{ position: "absolute", inset: "-0.24px 0" }}>
                        <img
                          alt=""
                          style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }}
                          src={i === 0 || i === 23 || i === 29 ? VECTOR : VECTOR1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 10 }}>
        <StatusBadge
          isLocked={isLocked}
          isCompleted={isCompleted}
          isCompletedOutOfOrder={isCompletedOutOfOrder}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "100%",
          gap: "7.789px",
        }}
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
              whiteSpace: "normal",
            }}
          >
            {title}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
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
