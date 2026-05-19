import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight, Check, BookOpen, Lock } from "lucide-react";
import { SECTIONS } from "./section-definitions";
import type { WorkbookSummary } from "@shared/schema";

function StatusBadge({ count, attested }: { count: number; attested: boolean }) {
  if (attested) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          border: "0.5px solid rgba(255,255,255,0.12)",
        }}
      >
        <Check style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.5)" }} />
        <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Done
        </span>
      </div>
    );
  }
  if (count > 0) {
    return (
      <span
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {count} {count === 1 ? "entry" : "entries"}
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "'Afacad', sans-serif",
        fontSize: "0.7rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.2)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      Empty
    </span>
  );
}

export default function WorkbookShell() {
  const { data: summary = {}, isLoading } = useQuery<WorkbookSummary>({
    queryKey: ["/api/workbook/summary"],
  });

  const totalSections = SECTIONS.length;
  const completedSections = SECTIONS.filter((s) => {
    const sec = summary[s.id];
    return sec && (sec.attested || sec.count > 0);
  }).length;

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
          <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0, marginBottom: "8px" }}>Tool · Spiritual Freedom</p>
          <h1
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(32px, 5vw + 10px, 64px)",
              lineHeight: 1.05,
              color: "white",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            Freedom Workbook
          </h1>
          <p className="type-body-lg" style={{ color: "var(--white-60)", margin: 0 }}>
            A 18-section spiritual inventory to prepare your heart for freedom prayer.
          </p>
        </div>

        {/* Progress bar */}
        {!isLoading && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
                Progress
              </span>
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                {completedSections} / {totalSections}
              </span>
            </div>
            <div style={{ height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.25)",
                  width: `${(completedSections / totalSections) * 100}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Section list */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <div
              className="animate-spin"
              style={{ width: "24px", height: "24px", border: "2px solid var(--white-10)", borderTopColor: "var(--white-50)", borderRadius: "50%" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {SECTIONS.map((section, index) => {
              const sec = summary[section.id];
              const count = sec?.count ?? 0;
              const attested = sec?.attested ?? false;
              const hasContent = attested || count > 0;

              return (
                <Link key={section.id} href={`/resources/tools/freedom-workbook/${section.id}`}>
                  <div
                    data-testid={`section-row-${section.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.0)",
                      border: "0.5px solid transparent",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.0)";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    {/* Number */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: hasContent ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                        border: `0.5px solid ${hasContent ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {attested ? (
                        <Check style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }} />
                      ) : (
                        <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: hasContent ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="type-body-md"
                        style={{
                          color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {section.name}
                      </p>
                    </div>

                    {/* Status */}
                    <StatusBadge count={count} attested={attested} />

                    <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Begin Prayer CTA — disabled until Phase 3 */}
        <div
          style={{
            marginTop: "32px",
            padding: "20px 24px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.02)",
            border: "0.5px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="type-body-md" style={{ color: "rgba(255,255,255,0.5)", margin: 0, marginBottom: "2px" }}>
              Freedom Prayer
            </p>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.25)", margin: 0 }}>
              Complete the sections above to begin your prayers.
            </p>
          </div>
          <div
            data-testid="button-begin-prayer-1"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              cursor: "not-allowed",
              opacity: 0.5,
            }}
          >
            <Lock style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Begin Prayer #1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
