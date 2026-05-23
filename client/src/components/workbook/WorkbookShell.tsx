import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronRight, Check, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { SECTIONS, SECTION_CATEGORIES, getSectionsByCategory } from "./section-definitions";
import PrayerRender from "./PrayerRender";
import SessionWrapper from "./SessionWrapper";
import type { WorkbookSummary, WorkbookEntry } from "@shared/schema";

function Section6Badge({ liesCount, truthsCount }: { liesCount: number; truthsCount: number }) {
  if (liesCount === 0) {
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
      {liesCount} {liesCount === 1 ? "lie named" : "lies named"}
      {truthsCount > 0 && (
        <span style={{ color: "rgba(255,200,100,0.6)" }}>
          {", "}
          {truthsCount} {truthsCount === 1 ? "truth claimed" : "truths claimed"}
        </span>
      )}
    </span>
  );
}

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

type ShellView = "list" | "prayer_1" | "prayer_2" | "session";

export default function WorkbookShell() {
  const [view, setView] = useState<ShellView>("list");
  const [, navigate] = useLocation();

  const { data: summary = {}, isLoading } = useQuery<WorkbookSummary>({
    queryKey: ["/api/workbook/summary"],
  });

  const { data: section6Entries = [] } = useQuery<WorkbookEntry[]>({
    queryKey: ["/api/workbook/6"],
  });
  const section6LiesCount = section6Entries.length;
  const section6TruthsCount = section6Entries.filter((e) => {
    const d = e.entryData as Record<string, string>;
    return typeof d?.truth_statement === "string" && d.truth_statement.trim().length > 0;
  }).length;

  const totalSections = SECTIONS.length;
  const completedSections = SECTIONS.filter((s) => {
    const sec = summary[s.id];
    return sec && (sec.attested || sec.count > 0);
  }).length;

  if (view === "prayer_1") {
    return <PrayerRender prayerId="prayer_1" onDone={() => setView("list")} />;
  }

  if (view === "prayer_2") {
    return <PrayerRender prayerId="prayer_2" onDone={() => setView("list")} />;
  }

  if (view === "session") {
    return <SessionWrapper onDismiss={() => setView("list")} />;
  }

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
            The Deliverance Workbook
          </h1>
          <p className="type-body-lg" style={{ color: "var(--white-60)", margin: 0 }}>
            A spiritual inventory to prepare for a long-form renunciation prayer.
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

        {/* Section list grouped by category */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <div
              className="animate-spin"
              style={{ width: "24px", height: "24px", border: "2px solid var(--white-10)", borderTopColor: "var(--white-50)", borderRadius: "50%" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {SECTION_CATEGORIES.map((category) => {
              const categorySections = getSectionsByCategory(category.id);
              const catCompleted = categorySections.filter((s) => {
                const sec = summary[s.id];
                return sec && (sec.attested || sec.count > 0);
              }).length;
              const catTotal = categorySections.length;
              const allDone = catCompleted === catTotal;

              return (
                <div key={category.id}>
                  {/* Category header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "8px",
                      marginBottom: "2px",
                      borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Afacad', sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: allDone ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {category.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Afacad', sans-serif",
                        fontSize: "0.68rem",
                        color: allDone ? "rgba(100,210,130,0.5)" : "rgba(255,255,255,0.25)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {allDone ? "✓ complete" : `${catCompleted} / ${catTotal}`}
                    </span>
                  </div>

                  {/* Sections in this category */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {categorySections.map((section) => {
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
                            {/* Check / number bubble */}
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
                                  {section.id}
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
                            {section.id === 6 ? (
                              <Section6Badge liesCount={section6LiesCount} truthsCount={section6TruthsCount} />
                            ) : (
                              <StatusBadge count={count} attested={attested} />
                            )}

                            <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Prayer & Session CTAs */}
        <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* Personal Deliverance Prayer — one-time */}
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="type-body-md" style={{ color: "rgba(255,255,255,0.7)", margin: 0, marginBottom: "2px" }}>
                Personal Deliverance Prayer
              </p>
              <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.3)", margin: 0 }}>
                Pray once, with intention, after working through the Workbook
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("prayer_1")}
              data-testid="button-begin-prayer-1"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
            >
              <BookOpen style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }} />
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Begin
              </span>
            </button>
          </div>

          {/* Generational Renunciation Prayer */}
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.015)",
              border: "0.5px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="type-body-md" style={{ color: "rgba(255,255,255,0.6)", margin: 0, marginBottom: "2px" }}>
                Generational Renunciation Prayer
              </p>
              <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.25)", margin: 0 }}>
                Binding prayer for generational and ancestral sins
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("prayer_2")}
              data-testid="button-begin-prayer-2"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
            >
              <BookOpen style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }} />
              <span style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Begin
              </span>
            </button>
          </div>

          {/* Guided Session */}
          <div
            style={{
              padding: "16px 24px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.01)",
              border: "0.5px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Guided Session — work through unfilled sections with opening & closing prayers
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("session")}
              data-testid="button-begin-session"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Begin a session
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
