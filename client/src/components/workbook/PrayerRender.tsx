import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, Check, Flame } from "lucide-react";
import { PRAYER_TEMPLATES } from "./prayer-templates";
import { SECTIONS } from "./section-definitions";
import type { WorkbookEntry } from "@shared/schema";
import type { WorkbookStreakStatus, PrayerId } from "@shared/schema";

interface PrayerRenderProps {
  prayerId: PrayerId;
  onDone: () => void;
}

// Builds a per-section map of all entries text for injection
function buildSectionTextMap(
  allEntries: Record<number, WorkbookEntry[]>
): Record<number, string> {
  const map: Record<number, string> = {};
  for (const [secIdStr, entries] of Object.entries(allEntries)) {
    const secId = Number(secIdStr);
    const section = SECTIONS.find((s) => s.id === secId);
    if (!section || !entries.length) {
      map[secId] = "";
      continue;
    }
    // Render each entry as readable text
    const lines = entries.map((e) => {
      const data = e.entryData as Record<string, string>;
      return section.fields
        .map((f) => (data[f.key] ? data[f.key] : null))
        .filter(Boolean)
        .join(" — ");
    });
    map[secId] = lines.join("\n");
  }
  return map;
}

// Injects [SECTION_N] placeholders with styled entry text
function injectSectionData(
  text: string,
  sectionMap: Record<number, string>
): string {
  return text.replace(/\[SECTION_(\d+)\]/g, (_match, num) => {
    const id = Number(num);
    return sectionMap[id] || `(Section ${id} — no entries yet)`;
  });
}

function StreakBadge({ count, prayerId }: { count: number; prayerId: PrayerId }) {
  const label =
    prayerId === "prayer_2"
      ? `Day ${count} of 3`
      : prayerId === "prayer_3"
      ? `Day ${count}`
      : null;
  if (!label || count === 0) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "999px",
        background: "rgba(240,120,48,0.12)",
        border: "0.5px solid rgba(240,120,48,0.25)",
      }}
    >
      <Flame style={{ width: "11px", height: "11px", color: "#F07830" }} />
      <span
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "#F07830",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Renders a block of prayer text, highlighting [SECTION_*] injected content
function PrayerTextBlock({
  text,
  sectionMap,
  hasSections,
}: {
  text: string;
  sectionMap: Record<number, string>;
  hasSections: boolean;
}) {
  if (!hasSections) {
    return (
      <div
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "1.05rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    );
  }

  // Split text on [SECTION_N] placeholders and render each part
  const parts = text.split(/(\[SECTION_\d+\])/g);
  return (
    <div
      style={{
        fontFamily: "'Afacad', sans-serif",
        fontSize: "1.05rem",
        lineHeight: 1.7,
        color: "rgba(255,255,255,0.75)",
        whiteSpace: "pre-wrap",
      }}
    >
      {parts.map((part, i) => {
        const match = part.match(/^\[SECTION_(\d+)\]$/);
        if (!match) return <span key={i}>{part}</span>;
        const id = Number(match[1]);
        const content = sectionMap[id] || "";
        if (!content) {
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.25)",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px dashed rgba(255,255,255,0.1)",
              }}
            >
              (Section {id} — no entries yet)
            </span>
          );
        }
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: "#e8c88a",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "rgba(232,200,138,0.08)",
              border: "0.5px solid rgba(232,200,138,0.18)",
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}

export default function PrayerRender({ prayerId, onDone }: PrayerRenderProps) {
  const template = PRAYER_TEMPLATES[prayerId];
  const [pageIndex, setPageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Fetch all workbook entries across all sections
  const sectionQueries = SECTIONS.map((s) =>
    useQuery<WorkbookEntry[]>({
      queryKey: [`/api/workbook/${s.id}`],
    })
  );

  const { data: streakStatus } = useQuery<WorkbookStreakStatus>({
    queryKey: [`/api/workbook/streak/${prayerId}`],
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/workbook/streak/${prayerId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workbook/streak/${prayerId}`] });
      setCompleted(true);
    },
  });

  const isLoading = sectionQueries.some((q) => q.isLoading);

  const allEntries: Record<number, WorkbookEntry[]> = {};
  SECTIONS.forEach((s, i) => {
    allEntries[s.id] = sectionQueries[i].data ?? [];
  });
  const sectionMap = buildSectionTextMap(allEntries);

  if (!template) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
        Prayer not found.
      </div>
    );
  }

  const currentPage = template.pages[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === template.pages.length - 1;
  const hasSections = currentPage.type === "template";
  const resolvedText =
    currentPage.type === "template"
      ? injectSectionData(currentPage.text, sectionMap)
      : currentPage.text;

  const canComplete =
    isLast && streakStatus?.canCompleteToday !== false && !completed;

  const streakCount = streakStatus?.count ?? 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
        paddingBottom: "100px",
        paddingLeft: "20px",
        paddingRight: "20px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "720px", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <button
            type="button"
            onClick={onDone}
            data-testid="button-prayer-back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: "16px",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "rgba(255,255,255,0.3)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")
            }
          >
            <ChevronLeft style={{ width: "12px", height: "12px" }} />
            Freedom Workbook
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.35)",
                margin: 0,
              }}
            >
              {template.title}
            </p>
            <StreakBadge count={streakCount} prayerId={prayerId} />
          </div>

          <h1
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(26px, 4vw + 8px, 44px)",
              lineHeight: 1.1,
              color: "white",
              margin: 0,
            }}
          >
            {template.subtitle.replace("{day}", String(streakCount + 1))}
          </h1>
        </div>

        {/* Page indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "28px",
          }}
        >
          {template.pages.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === pageIndex ? "18px" : "6px",
                height: "4px",
                borderRadius: "999px",
                background:
                  i === pageIndex
                    ? "rgba(255,255,255,0.5)"
                    : i < pageIndex
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
              }}
            />
          ))}
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.25)",
              marginLeft: "6px",
            }}
          >
            {pageIndex + 1} / {template.pages.length}
          </span>
        </div>

        {/* Prayer text */}
        <div
          style={{
            borderRadius: "10px",
            border: "0.5px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "28px 32px",
            marginBottom: "24px",
            minHeight: "220px",
          }}
        >
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "40px" }}>
              <div
                className="animate-spin"
                style={{
                  width: "22px",
                  height: "22px",
                  border: "2px solid rgba(255,255,255,0.1)",
                  borderTopColor: "rgba(255,255,255,0.5)",
                  borderRadius: "50%",
                }}
              />
            </div>
          ) : (
            <PrayerTextBlock
              text={resolvedText}
              sectionMap={sectionMap}
              hasSections={hasSections}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={isFirst}
            data-testid="button-prayer-prev"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "7px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.82rem",
              color: isFirst ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
              cursor: isFirst ? "default" : "pointer",
              opacity: isFirst ? 0.4 : 1,
            }}
          >
            <ChevronLeft style={{ width: "13px", height: "13px" }} />
            Previous
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            {isLast ? (
              <>
                {/* Mark complete (for prayer_2 and prayer_3 which have streaks) */}
                {(prayerId === "prayer_2" || prayerId === "prayer_3") && !completed && (
                  <button
                    type="button"
                    onClick={() => completeMutation.mutate()}
                    disabled={!canComplete || completeMutation.isPending}
                    data-testid="button-prayer-mark-complete"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "7px",
                      background: canComplete
                        ? "rgba(240,120,48,0.14)"
                        : "rgba(255,255,255,0.03)",
                      border: `0.5px solid ${canComplete ? "rgba(240,120,48,0.35)" : "rgba(255,255,255,0.06)"}`,
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: canComplete ? "#F07830" : "rgba(255,255,255,0.25)",
                      cursor: canComplete ? "pointer" : "default",
                      opacity: completeMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Flame style={{ width: "13px", height: "13px" }} />
                    {completeMutation.isPending
                      ? "Saving…"
                      : streakStatus?.canCompleteToday === false
                      ? "Already marked today"
                      : "Mark complete for today"}
                  </button>
                )}
                {/* Done button */}
                <button
                  type="button"
                  onClick={onDone}
                  data-testid="button-prayer-done"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "7px",
                    background: "rgba(255,255,255,0.07)",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    cursor: "pointer",
                  }}
                >
                  {completed ? <Check style={{ width: "13px", height: "13px" }} /> : null}
                  Done
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPageIndex((p) => Math.min(template.pages.length - 1, p + 1))}
                data-testid="button-prayer-next"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.08)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                }}
              >
                Next
                <ChevronRight style={{ width: "13px", height: "13px" }} />
              </button>
            )}
          </div>
        </div>

        {/* Pending text notice */}
        <div
          style={{
            marginTop: "20px",
            padding: "10px 14px",
            borderRadius: "6px",
            background: "rgba(240,120,48,0.06)",
            border: "0.5px solid rgba(240,120,48,0.15)",
          }}
        >
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(240,120,48,0.6)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            Prayer text pending — the ministry will supply the verbatim wording from the source manual shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
