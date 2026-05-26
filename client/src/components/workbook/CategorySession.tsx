import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SECTIONS, SECTION_CATEGORIES, getSectionsByCategory } from "./section-definitions";
import SectionView from "./SectionView";
import type { WorkbookSummary } from "@shared/schema";

interface CategorySessionProps {
  categoryId: number;
  summary: WorkbookSummary;
  onDismiss: () => void;
}

const OPENING_PRAYER =
  "Lord Jesus,\nplease guide me as I fill out these lists.\n\n" +
  "Send the Holy Spirit to help me remember what I need to bring before You: my sins, the people I need to forgive, the things I need to renounce, and anything else that needs Your mercy.\n\n" +
  "Help me be honest without fear.\nHelp me stay peaceful and clear.\nProtect this time from distraction, confusion, or discouragement.\n\n" +
  "Jesus, I trust You with everything I write down.\nAmen.";

const CLOSING_PRAYER =
  "Lord Jesus,\nI have finished these lists as best I can.\n\n" +
  "If there is anything else I need to add, please bring it to mind.\n\n" +
  "If I have forgotten something, I trust You to show me in the right time.\n" +
  "Thank You for guiding me, protecting me, and helping me be honest before You.\n" +
  "Jesus, I place everything I have written into Your mercy.\nAmen.";

type SessionStep = "prompt" | "opening" | "subsection" | "closing";

export default function CategorySession({ categoryId, summary, onDismiss }: CategorySessionProps) {
  const category = SECTION_CATEGORIES.find((c) => c.id === categoryId);
  const subsections = getSectionsByCategory(categoryId);

  const hasAnyContent = subsections.some((s) => {
    const sec = summary[s.id];
    return sec && (sec.attested || sec.count > 0);
  });

  const [step, setStep] = useState<SessionStep>(hasAnyContent ? "prompt" : "opening");
  const [subsectionIndex, setSubsectionIndex] = useState(0);

  const currentSubsection = subsections[subsectionIndex];
  const totalSubsections = subsections.length;

  function goToNextSubsection() {
    if (subsectionIndex < totalSubsections - 1) {
      setSubsectionIndex((i) => i + 1);
    } else {
      setStep("closing");
    }
  }

  function goPrevSubsection() {
    if (subsectionIndex > 0) {
      setSubsectionIndex((i) => i - 1);
    } else {
      setStep("opening");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "var(--surface-ground)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          background: "var(--black-35)",
          borderBottom: "1px solid var(--white-8)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          {step === "subsection" && totalSubsections > 0 && (
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              · {subsectionIndex + 1} of {totalSubsections}
            </span>
          )}
          {step === "opening" && (
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>
              · Opening Prayer
            </span>
          )}
          {step === "closing" && (
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>
              · Closing Prayer
            </span>
          )}
        </div>
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

      {/* Prompt — re-entry only */}
      {step === "prompt" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 20px",
            flex: 1,
          }}
        >
          <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "16px",
              }}
            >
              Returning to {category?.name}
            </p>
            <p
              className="font-serif"
              style={{
                fontSize: "clamp(1.15rem, 2vw + 0.5rem, 1.5rem)",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
                margin: "0 0 40px",
                fontWeight: 500,
              }}
            >
              Begin with an opening prayer?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                data-testid="button-pray-first"
                onClick={() => setStep("opening")}
                style={{
                  padding: "11px 24px",
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
                Yes, pray first
              </button>
              <button
                type="button"
                data-testid="button-go-straight-in"
                onClick={() => { setSubsectionIndex(0); setStep("subsection"); }}
                style={{
                  padding: "11px 24px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
              >
                Go straight in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opening prayer */}
      {step === "opening" && (
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
              Opening Prayer
            </p>
            <p
              className="font-serif"
              style={{
                fontSize: "clamp(1.1rem, 2vw + 0.5rem, 1.4rem)",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.75)",
                margin: "0 0 16px",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              "{OPENING_PRAYER}"
            </p>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "36px",
                fontStyle: "italic",
              }}
            >
              We'll work through {totalSubsections} subsection{totalSubsections !== 1 ? "s" : ""} in this category.
            </p>
            <button
              type="button"
              data-testid="button-session-begin"
              onClick={() => { setSubsectionIndex(0); setStep("subsection"); }}
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
              Begin
            </button>
          </div>
        </div>
      )}

      {/* Subsection */}
      {step === "subsection" && currentSubsection && (
        <div>
          <SectionView sectionId={currentSubsection.id} inSheet />
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
              onClick={goPrevSubsection}
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
              Back
            </button>
            <button
              type="button"
              data-testid="button-session-next"
              onClick={goToNextSubsection}
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
              {subsectionIndex < totalSubsections - 1 ? "Next subsection" : "Closing prayer"}
              <ChevronRight style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>
      )}

      {/* Closing prayer */}
      {step === "closing" && (
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
              Closing Prayer
            </p>
            <p
              className="font-serif"
              style={{
                fontSize: "clamp(1.1rem, 2vw + 0.5rem, 1.4rem)",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.75)",
                margin: "0 0 40px",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              "{CLOSING_PRAYER}"
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                data-testid="button-session-back-to-sections"
                onClick={() => { setSubsectionIndex(totalSubsections - 1); setStep("subsection"); }}
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
                ← Back
              </button>
              <button
                type="button"
                data-testid="button-session-finish"
                onClick={onDismiss}
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
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
