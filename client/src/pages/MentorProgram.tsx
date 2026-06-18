import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { DayGridView } from "@/components/DayGridView";
import { useAllTrackAContent } from "@/hooks/use-track-a-content";
import { useContentSummaries } from "@/hooks/use-content-summaries";
import { useDailyContent } from "@/hooks/use-content";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Sun, Moon } from "lucide-react";
import type { TrackAModule } from "@shared/schema";

type Track = "A" | "B";

function ContentDetailPanel({
  day,
  onClose,
}: {
  day: number;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<"morning" | "evening">("morning");
  const { data: content, isLoading } = useDailyContent(day);

  const morningText = content
    ? [
        content.morningScriptureRef ? `Scripture: ${content.morningScriptureRef}\n"${content.morningScriptureText}"` : null,
        content.morningMeditation || null,
        content.morningPrayer ? `Prayer:\n${content.morningPrayer}` : null,
      ]
        .filter(Boolean)
        .join("\n\n")
    : null;

  const eveningText = content
    ? [
        content.eveningCatechismRef ? `Catechism: ${content.eveningCatechismRef}` : null,
        content.eveningCatechism || null,
        content.eveningSummary || null,
      ]
        .filter(Boolean)
        .join("\n\n")
    : null;

  const text = period === "morning" ? morningText : eveningText;
  const dayTitle = content?.weekTitle ?? null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* Backdrop */}
      <div
        style={{ flex: 1, background: "rgba(0,0,0,0.5)", cursor: "pointer" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          width: "min(520px, 95vw)",
          background: "var(--surface-base)",
          borderLeft: "0.5px solid var(--white-8)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "0.5px solid var(--white-8)",
            position: "sticky",
            top: 0,
            background: "var(--surface-base)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            data-testid="button-close-content-panel"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--white-40)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--white-80)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--white-40)"; }}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 600, color: "white", margin: 0, lineHeight: 1.2 }}>
              Day {day}
            </h2>
            {dayTitle && (
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "var(--white-40)", margin: "2px 0 0" }}>
                {dayTitle}
              </p>
            )}
          </div>

          {/* Morning / Evening toggle */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid var(--white-8)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {(["morning", "evening"] as const).map((p) => (
              <button
                key={p}
                data-testid={`button-period-${p}`}
                onClick={() => setPeriod(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "5px 10px",
                  background: period === p ? "rgba(255,255,255,0.12)" : "none",
                  border: "none",
                  color: period === p ? "white" : "var(--white-40)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {p === "morning" ? <Sun size={11} /> : <Moon size={11} />}
                {p === "morning" ? "Morning" : "Evening"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", flex: 1 }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: "20px", height: "20px", border: "2px solid var(--white-15)", borderTopColor: "var(--white-60)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : text ? (
            <div style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "var(--white-70)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
              {text}
            </div>
          ) : (
            <div style={{ color: "var(--white-25)", fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", textAlign: "center", padding: "40px 0" }}>
              No content for this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MentorProgram() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [track, setTrack] = useState<Track>("B");

  const { data: trackASummaries } = useAllTrackAContent();
  const { data: trackBSummaries } = useContentSummaries();
  const { data: trackAModules } = useQuery<TrackAModule[]>({
    queryKey: ["/api/track-a-modules"],
  });

  const noop = () => {};
  const isTrackA = track === "A";

  return (
    <DashboardLayout>
      {/* Track toggle + label */}
      <div style={{ padding: "20px 24px 4px" }}>
        <PageContainer variant="full">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--white-30)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            >
              Read-only program browser
            </p>

            {/* Track A/B toggle */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid var(--white-8)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {(["A", "B"] as Track[]).map((t) => (
                <button
                  key={t}
                  data-testid={`button-track-${t}`}
                  onClick={() => { setTrack(t); setSelectedDay(null); }}
                  style={{
                    padding: "4px 12px",
                    background: track === t ? "rgba(255,255,255,0.1)" : "none",
                    border: "none",
                    color: track === t ? "white" : "var(--white-35)",
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    letterSpacing: "0.03em",
                  }}
                >
                  Track {t}
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Full-width grid */}
      <div className="h-full">
        <DayGridView
          currentDay={30}
          isTrackA={isTrackA}
          trackASummaries={trackASummaries}
          trackBSummaries={trackBSummaries}
          cohortStartDate={undefined}
          prayerCompletions={[]}
          isDayCompleted={() => false}
          isPeriodCompleted={() => false}
          onDaySelect={(day) => setSelectedDay(day)}
          prelimModulesData={[]}
          allPrelimsComplete={true}
          onPrelimSelect={noop}
          onWorkbookSelect={noop}
          week4Ready={false}
        />
      </div>

      {/* Content detail panel (Track B only — Track A has its own lesson flow) */}
      {selectedDay !== null && selectedDay > 0 && !isTrackA && (
        <ContentDetailPanel
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Track A note */}
      {selectedDay !== null && selectedDay > 0 && isTrackA && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            style={{
              background: "var(--surface-raised)",
              border: "0.5px solid var(--white-8)",
              borderRadius: "12px",
              padding: "28px 32px",
              maxWidth: "380px",
              width: "90vw",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "white", marginBottom: "10px", fontWeight: 600 }}>
              Track A — Day {selectedDay}
            </p>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "var(--white-50)", lineHeight: 1.6, marginBottom: "20px" }}>
              Track A uses an interactive lesson format. Admins can preview it at{" "}
              <span style={{ color: "var(--brand)", fontFamily: "monospace", fontSize: "0.8rem" }}>
                /preview/track-a/{selectedDay}
              </span>
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                padding: "7px 18px",
                background: "rgba(255,255,255,0.07)",
                border: "0.5px solid var(--white-12)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
