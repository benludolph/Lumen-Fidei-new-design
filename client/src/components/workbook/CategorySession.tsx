import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Scroll } from "lucide-react";
import { useWorkbookContent } from "@/components/workbook-admin/WorkbookContentProvider";
import { useWorkbookGeneral } from "@/components/workbook-admin/use-workbook-general";
import SectionView from "./SectionView";
import type { WorkbookSummary } from "@shared/schema";
import WorkbookAccessGate from "./WorkbookAccessGate";
import { useWorkbookProfile } from "@/hooks/use-workbook-profile";

interface CategorySessionProps {
  categoryId: number;
  summary: WorkbookSummary;
  onDismiss: () => void;
}

type SessionStep = "opening" | "subsection" | "closing";

function PrayerView({
  label,
  text,
  onBegin,
  beginLabel,
  onBack,
  backLabel,
}: {
  label: string;
  text: string;
  onBegin?: () => void;
  beginLabel?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "20px",
          }}
        >
          {label}
        </p>
        <p
          className="font-serif"
          style={{
            fontSize: "clamp(1.1rem, 2vw + 0.5rem, 1.4rem)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.75)",
            margin: "0 0 36px",
            fontWeight: 500,
            whiteSpace: "pre-line",
          }}
        >
          {text}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "11px 20px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
            >
              {backLabel ?? "← Back"}
            </button>
          )}
          {onBegin && (
            <button
              type="button"
              onClick={onBegin}
              style={{
                padding: "11px 28px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)")}
            >
              {beginLabel ?? "Begin"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategorySession({ categoryId, summary, onDismiss }: CategorySessionProps) {
  return <WorkbookAccessGate categorySession onDismiss={onDismiss}><CategorySessionContent categoryId={categoryId} summary={summary} onDismiss={onDismiss} /></WorkbookAccessGate>;
}

function CategorySessionContent({ categoryId, summary, onDismiss }: CategorySessionProps) {
  const { categories: SECTION_CATEGORIES, sections } = useWorkbookContent();
  const { openingPrayer: OPENING_PRAYER, closingPrayer: CLOSING_PRAYER, nonCatholicClosingPrayer: NON_CATHOLIC_CLOSING_PRAYER } = useWorkbookGeneral();
  const { data: profile } = useWorkbookProfile();
  const category = SECTION_CATEGORIES.find((c) => c.id === categoryId);
  const subsections = sections.filter(section => section.categoryId === categoryId);
  const totalSubsections = subsections.length;

  const firstUnfilled = subsections.findIndex((s) => {
    const sec = summary[s.id];
    return !sec || (!sec.attested && sec.count === 0);
  });

  const [step, setStep] = useState<SessionStep>("opening");
  const [subsectionIndex, setSubsectionIndex] = useState(firstUnfilled >= 0 ? firstUnfilled : 0);

  const currentSubsection = subsections[subsectionIndex];

  function goNext() {
    if (step === "opening") {
      setSubsectionIndex(0);
      setStep("subsection");
    } else if (step === "subsection") {
      if (subsectionIndex < totalSubsections - 1) {
        setSubsectionIndex((i) => i + 1);
      } else {
        setStep("closing");
      }
    }
  }

  function goPrev() {
    if (step === "subsection") {
      if (subsectionIndex > 0) {
        setSubsectionIndex((i) => i - 1);
      } else {
        setStep("opening");
      }
    } else if (step === "closing") {
      setSubsectionIndex(totalSubsections - 1);
      setStep("subsection");
    }
  }

  function jumpToSection(idx: number) {
    setSubsectionIndex(idx);
    setStep("subsection");
  }

  function getSectionFilled(sectionId: number): boolean {
    const sec = summary[sectionId];
    return !!sec && (sec.attested || sec.count > 0);
  }

  function getSectionCount(sectionId: number): number {
    return summary[sectionId]?.count ?? 0;
  }

  const nextLabel =
    step === "opening"
      ? "Start sections"
      : step === "subsection" && subsectionIndex < totalSubsections - 1
      ? "Next"
      : step === "subsection"
      ? "Closing prayer"
      : null;

  const prevLabel =
    step === "subsection" && subsectionIndex === 0
      ? "Opening prayer"
      : step === "closing"
      ? "Back"
      : "Back";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "var(--surface-ground)",
        display: "flex",
        flexDirection: "column",
        overflowY: "hidden",
      }}
    >
      {/* Sticky header + index strip */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          flexShrink: 0,
          background: "var(--surface-ground)",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            background: "var(--black-35)",
            borderBottom: "1px solid var(--white-8)",
          }}
        >
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {category?.name ?? "Session"}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            data-testid="button-category-session-dismiss"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
          >
            <X style={{ width: "12px", height: "12px" }} />
            Exit
          </button>
        </div>

        {/* Section index strip */}
        <div
          style={{
            overflowX: "auto",
            scrollbarWidth: "none",
            borderBottom: "1px solid var(--white-8)",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "center",
          }}
        >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            flexShrink: 0,
          }}
        >
          {/* Opening Prayer chip */}
          <button
            type="button"
            data-testid="chip-opening-prayer"
            onClick={() => setStep("opening")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexShrink: 0,
              padding: "6px 12px",
              minHeight: "40px",
              borderRadius: "20px",
              background: step === "opening" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              border: step === "opening"
                ? "0.5px solid rgba(255,255,255,0.25)"
                : "0.5px solid rgba(255,255,255,0.07)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              fontWeight: step === "opening" ? 600 : 400,
              color: step === "opening" ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <Scroll style={{ width: "11px", height: "11px", flexShrink: 0 }} />
            Opening
          </button>

          {/* Separator dot */}
          <span style={{ color: "rgba(255,255,255,0.1)", flexShrink: 0, fontSize: "0.6rem" }}>·</span>

          {/* Section chips */}
          {subsections.map((s, idx) => {
            const active = step === "subsection" && subsectionIndex === idx;
            const filled = getSectionFilled(s.id);
            const count = getSectionCount(s.id);
            return (
              <button
                key={s.id}
                type="button"
                data-testid={`chip-section-${s.id}`}
                onClick={() => jumpToSection(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                  padding: "6px 12px",
                  minHeight: "40px",
                  borderRadius: "20px",
                  background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  border: active
                    ? "0.5px solid rgba(255,255,255,0.25)"
                    : "0.5px solid rgba(255,255,255,0.07)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name}
                </span>
                {filled && (
                  <span
                    style={{
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "10px",
                      background: active ? "rgba(255,208,0,0.25)" : "rgba(255,208,0,0.15)",
                      color: "rgba(255,208,0,0.9)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "0 4px",
                    }}
                  >
                    {count > 0 ? count : "✓"}
                  </span>
                )}
              </button>
            );
          })}

          {/* Separator dot */}
          <span style={{ color: "rgba(255,255,255,0.1)", flexShrink: 0, fontSize: "0.6rem" }}>·</span>

          {/* Closing Prayer chip */}
          <button
            type="button"
            data-testid="chip-closing-prayer"
            onClick={() => setStep("closing")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexShrink: 0,
              padding: "6px 12px",
              minHeight: "40px",
              borderRadius: "20px",
              background: step === "closing" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              border: step === "closing"
                ? "0.5px solid rgba(255,255,255,0.25)"
                : "0.5px solid rgba(255,255,255,0.07)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              fontWeight: step === "closing" ? 600 : 400,
              color: step === "closing" ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <Scroll style={{ width: "11px", height: "11px", flexShrink: 0 }} />
            Closing
          </button>
        </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Opening prayer */}
        {step === "opening" && (
          <PrayerView
            label="Opening Prayer"
            text={OPENING_PRAYER}
            onBegin={() => { setSubsectionIndex(0); setStep("subsection"); }}
            beginLabel="Start sections"
          />
        )}

        {/* Subsection */}
        {step === "subsection" && currentSubsection && (
          <div>
            <SectionView sectionId={currentSubsection.id} inSheet />
            {/* Prev / Next nav */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                maxWidth: "760px",
                margin: "0 auto",
                padding: "0 20px 48px",
                gap: "12px",
              }}
            >
              <button
                type="button"
                data-testid="button-session-prev"
                onClick={goPrev}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
              >
                <ChevronLeft style={{ width: "14px", height: "14px" }} />
                {prevLabel}
              </button>
              <button
                type="button"
                data-testid="button-session-next"
                onClick={goNext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.07)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.11)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")}
              >
                {nextLabel}
                <ChevronRight style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
          </div>
        )}

        {/* Closing prayer */}
        {step === "closing" && (
          <PrayerView
            label="Closing Prayer"
            text={profile?.faithTradition === "Yes" ? CLOSING_PRAYER : NON_CATHOLIC_CLOSING_PRAYER}
            onBack={() => { setSubsectionIndex(totalSubsections - 1); setStep("subsection"); }}
            backLabel="← Back to sections"
            onBegin={onDismiss}
            beginLabel="Done"
          />
        )}
      </div>
    </div>
  );
}
