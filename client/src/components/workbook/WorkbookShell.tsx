import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ChevronRight, Check, BookOpen, ArrowLeft } from "lucide-react";
import { SECTIONS, SECTION_CATEGORIES, getSectionsByCategory } from "./section-definitions";
import PrayerRender from "./PrayerRender";
import SessionWrapper from "./SessionWrapper";
import type { WorkbookSummary, WorkbookEntry } from "@shared/schema";

import week1Img from "@assets/Week_1_1779733414393.webp";
import week2Img from "@assets/Week_2_1779733414393.webp";
import week3Img from "@assets/Week_3_1779733414393.webp";
import week4Img from "@assets/Week_4_1779733414393.webp";
import week5Img from "@assets/Week_5_1779733414393.webp";
import workbookImg from "@assets/Workbook_1779733414393.webp";

const CATEGORY_IMAGES = [week1Img, week2Img, week3Img, week4Img, week5Img];

type ShellView = "list" | "category" | "prayer_1" | "prayer_2" | "session";

function StatusBadge({ count, attested }: { count: number; attested: boolean }) {
  if (attested) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Check style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.5)" }} />
        <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Done</span>
      </div>
    );
  }
  if (count > 0) {
    return <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{count} {count === 1 ? "entry" : "entries"}</span>;
  }
  return <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.2)" }}>Empty</span>;
}

function Section6Badge({ liesCount, truthsCount }: { liesCount: number; truthsCount: number }) {
  if (liesCount === 0) return <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.2)" }}>Empty</span>;
  return (
    <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
      {liesCount} {liesCount === 1 ? "lie" : "lies"}
      {truthsCount > 0 && <span style={{ color: "rgba(255,200,100,0.6)" }}>, {truthsCount} truth{truthsCount !== 1 ? "s" : ""}</span>}
    </span>
  );
}

export default function WorkbookShell() {
  const [view, setView] = useState<ShellView>("list");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

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

  if (view === "prayer_1") return <PrayerRender prayerId="prayer_1" onDone={() => setView("list")} />;
  if (view === "prayer_2") return <PrayerRender prayerId="prayer_2" onDone={() => setView("list")} />;
  if (view === "session") return <SessionWrapper onDismiss={() => setView("list")} />;

  const selectedCategory = SECTION_CATEGORIES.find((c) => c.id === selectedCategoryId);
  const categorySections = selectedCategoryId ? getSectionsByCategory(selectedCategoryId) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", position: "relative" }}>
      {/* ── Scrollable content ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "140px",
        }}
      >
        {view === "category" && selectedCategory ? (
          /* ── Category drill-down: section list ── */
          <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 16px" }}>
            {/* Back + category header */}
            <div style={{ padding: "24px 0 20px" }}>
              <button
                type="button"
                onClick={() => { setView("list"); setSelectedCategoryId(null); }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "20px" }}
                data-testid="button-workbook-back"
              >
                <ArrowLeft style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.5)" }} />
                <span className="type-caption-md" style={{ color: "rgba(255,255,255,0.4)" }}>Back</span>
              </button>
              <p className="type-caption-md" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>
                Category {selectedCategoryId}
              </p>
              <h2
                style={{
                  fontFamily: "'IvyOra Display', serif",
                  fontSize: "clamp(1.5rem, 5vw, 2rem)",
                  fontWeight: 400,
                  color: "white",
                  margin: "0 0 4px",
                  lineHeight: 1.15,
                }}
              >
                {selectedCategory.name}
              </h2>
              <p className="type-body-md" style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {selectedCategory.description}
              </p>
            </div>

            {/* Section rows */}
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
                        border: "1px solid rgba(255,255,255,0.04)",
                        background: hasContent ? "rgba(255,255,255,0.03)" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = hasContent ? "rgba(255,255,255,0.03)" : "transparent"; }}
                    >
                      <div
                        style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: hasContent ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${hasContent ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        {attested ? (
                          <Check style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }} />
                        ) : (
                          <span className="type-caption-sm" style={{ color: hasContent ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
                            {section.id}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="type-body-md" style={{ color: hasContent ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {section.name}
                        </p>
                      </div>
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
        ) : (
          /* ── Main overview: category cards ── */
          <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 16px 0" }}>
            {/* Page title */}
            <div style={{ marginBottom: "28px" }}>
              <p className="type-caption-md" style={{ color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>
                Tool · Spiritual Freedom
              </p>
              <h1
                style={{
                  fontFamily: "'IvyOra Display', serif",
                  fontWeight: 400,
                  fontSize: "clamp(1.8rem, 6vw, 2.6rem)",
                  lineHeight: 1.1,
                  color: "white",
                  margin: "0 0 10px",
                }}
              >
                The Deliverance Workbook
              </h1>
              <p className="type-body-lg" style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>
                A spiritual inventory to prepare for a long-form renunciation prayer.
              </p>
            </div>

            {/* Workbook cover card */}
            <div
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "10px",
                height: "160px",
                background: "#0a0a0a",
              }}
            >
              <img
                src={workbookImg}
                alt="The Deliverance Workbook"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
              {/* Text overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "20px 24px",
                  background: "linear-gradient(to right, rgba(0,0,0,0.85) 45%, transparent 100%)",
                }}
              >
                <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>
                  SUMMARY
                </p>
                <p
                  style={{
                    fontFamily: "'IvyOra Display', serif",
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.85)",
                    margin: "0 0 4px",
                    lineHeight: 1.3,
                  }}
                >
                  23 sections across 5 categories
                </p>
                {!isLoading && (
                  <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {SECTIONS.filter((s) => { const sec = summary[s.id]; return sec && (sec.attested || sec.count > 0); }).length} / {SECTIONS.length} sections touched
                  </p>
                )}
              </div>
            </div>

            {/* Category cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "0" }}>
              {SECTION_CATEGORIES.map((category, idx) => {
                const categorySections = getSectionsByCategory(category.id);
                const completed = categorySections.filter((s) => {
                  const sec = summary[s.id];
                  return sec && (sec.attested || sec.count > 0);
                }).length;
                const total = categorySections.length;
                const allDone = completed === total && total > 0;

                return (
                  <button
                    key={category.id}
                    type="button"
                    data-testid={`button-category-${category.id}`}
                    onClick={() => { setSelectedCategoryId(category.id); setView("category"); }}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
                      height: "180px",
                      background: "#0a0a0a",
                      cursor: "pointer",
                      padding: 0,
                      textAlign: "left",
                      display: "block",
                      width: "100%",
                    }}
                  >
                    {/* Full-bleed image */}
                    <img
                      src={CATEGORY_IMAGES[idx]}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                      }}
                    />

                    {/* Left-side dark gradient so text stays readable */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to right, rgba(0,0,0,0.82) 48%, rgba(0,0,0,0.15) 78%, transparent 100%)",
                      }}
                    />

                    {/* Text content */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "18px 20px",
                        maxWidth: "60%",
                      }}
                    >
                      {/* Top: week label + name */}
                      <div>
                        <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 5px" }}>
                          CATEGORY {idx + 1}
                        </p>
                        <h3
                          style={{
                            fontFamily: "'IvyOra Display', serif",
                            fontSize: "clamp(1rem, 3.5vw, 1.25rem)",
                            fontWeight: 400,
                            color: "white",
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {category.name}
                        </h3>
                      </div>

                      {/* Bottom: two-column PURPOSE | AGENDA */}
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                            PURPOSE
                          </p>
                          <p
                            style={{
                              fontFamily: "'Afacad', sans-serif",
                              fontSize: "0.7rem",
                              color: "rgba(255,255,255,0.55)",
                              margin: 0,
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            } as React.CSSProperties}
                          >
                            {category.description}
                          </p>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                            AGENDA
                          </p>
                          <p
                            style={{
                              fontFamily: "'Afacad', sans-serif",
                              fontSize: "0.7rem",
                              color: allDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.55)",
                              margin: 0,
                              lineHeight: 1.4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {allDone ? "✓ " : ""}{completed}/{total} done
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right arrow */}
                    <div
                      style={{
                        position: "absolute",
                        right: "16px",
                        bottom: "16px",
                      }}
                    >
                      <ChevronRight style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.25)" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom nav: prayer CTAs ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 20,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(10,10,10,0.88)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Personal Deliverance Prayer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 1px", fontWeight: 500 }}>
              Personal Deliverance Prayer
            </p>
            <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.3)", margin: 0 }}>
              Pray once, with intention, after working through the Workbook
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("prayer_1")}
            data-testid="button-begin-prayer-1"
            className="flex items-center gap-1 hover:opacity-75 transition-opacity"
            style={{
              padding: "7px 14px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <BookOpen style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.5)" }} />
            <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Begin</span>
          </button>
        </div>

        {/* Generational Renunciation Prayer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.55)", margin: "0 0 1px", fontWeight: 500 }}>
              Generational Renunciation Prayer
            </p>
            <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.25)", margin: 0 }}>
              Binding prayer for generational and ancestral sins
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("prayer_2")}
            data-testid="button-begin-prayer-2"
            className="flex items-center gap-1 hover:opacity-75 transition-opacity"
            style={{
              padding: "7px 14px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <BookOpen style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.4)" }} />
            <span className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Begin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
