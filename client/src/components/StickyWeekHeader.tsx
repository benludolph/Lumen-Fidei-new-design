import { BookOpen } from "lucide-react";

interface StickyWeekHeaderProps {
  weekNumber: number;
  weekTheme: string;
  onGuideClick?: () => void;
  inPrelimSection?: boolean;
}

export function StickyWeekHeader({
  weekNumber,
  weekTheme,
  onGuideClick,
  inPrelimSection,
}: StickyWeekHeaderProps) {
  return (
    <div
      data-testid="sticky-week-header"
      style={{
        background: "#0f1011",
        overflow: "clip",
        borderRadius: "16px",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          top: "-180px",
          left: "-80px",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 90%)",
          mixBlendMode: "lighten",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          borderRadius: "8px",
          boxShadow: "0px 4px 32px 0px rgba(8,9,10,0.6)",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.02) 100%), linear-gradient(90deg, rgb(15,16,17) 0%, rgb(15,16,17) 100%)",
          position: "relative",
          margin: "11px 10px 8px 14px",
        }}
      >
        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "8px",
            padding: "16.5px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#d0d6e0",
                  letterSpacing: "2.4px",
                  lineHeight: "24px",
                }}
              >
                INITIAL 30 DAYS
              </p>
              <p
                className="truncate"
                style={{
                  fontFamily: "'IT Cathdra Demo', sans-serif",
                  fontWeight: 400,
                  fontSize: "18px",
                  color: "#ffffff",
                  lineHeight: "28px",
                }}
              >
                {inPrelimSection
                  ? "Getting Started"
                  : `Week ${weekNumber}: ${weekTheme}`}
              </p>
            </div>

            {onGuideClick && (
              <button
                onClick={onGuideClick}
                className="flex items-center gap-2 shrink-0 group mt-1"
                data-testid="button-overview-guide"
              >
                <BookOpen className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                <span
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontWeight: 700,
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.6)",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                  className="group-hover:text-white/90 transition-colors"
                >
                  Overview & Guide
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
