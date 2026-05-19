import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { SECTIONS } from "./section-definitions";
import SectionView from "./SectionView";
import type { WorkbookSummary } from "@shared/schema";

interface SessionWrapperProps {
  onDismiss: () => void;
}

const OPENING_PRAYER =
  "Lord, as we begin this time of reflection, we ask for Your grace and courage. " +
  "Open our hearts to Your truth and let Your light illuminate anything that needs to be brought before You. Amen.";

const CLOSING_PRAYER =
  "Lord, thank You for this time of honest reflection. " +
  "We place what we have uncovered into Your hands. May Your healing continue as we trust in Your mercy. Amen.";

export default function SessionWrapper({ onDismiss }: SessionWrapperProps) {
  const { data: summary = {}, isLoading } = useQuery<WorkbookSummary>({
    queryKey: ["/api/workbook/summary"],
  });

  const [step, setStep] = useState<"opening" | "sections" | "closing">("opening");
  const [sectionIndex, setSectionIndex] = useState(0);

  // Pick up to 2 sections the user hasn't filled (prefer unattested and entry-count = 0)
  const unfilledSections = SECTIONS.filter((s) => {
    const sec = summary[s.id];
    if (!sec) return true;
    return !sec.attested && sec.count === 0;
  }).slice(0, 2);

  const currentSection = unfilledSections[sectionIndex];
  const totalSections = unfilledSections.length;

  function advance() {
    if (step === "opening") {
      if (totalSections === 0) {
        setStep("closing");
      } else {
        setSectionIndex(0);
        setStep("sections");
      }
    } else if (step === "sections") {
      if (sectionIndex < totalSections - 1) {
        setSectionIndex((i) => i + 1);
      } else {
        setStep("closing");
      }
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
            Guided Session
          </span>
          {step === "sections" && totalSections > 0 && (
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              · Section {sectionIndex + 1} of {totalSections}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          data-testid="button-session-dismiss"
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
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")
          }
        >
          <X style={{ width: "12px", height: "12px" }} />
          Dismiss
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div
            className="animate-spin"
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "rgba(255,255,255,0.5)",
              borderRadius: "50%",
            }}
          />
        </div>
      ) : step === "opening" ? (
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
                margin: "0 0 40px",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              "{OPENING_PRAYER}"
            </p>
            {totalSections === 0 ? (
              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: "32px",
                  fontStyle: "italic",
                }}
              >
                All sections have been filled. Great work! Proceed to the closing prayer.
              </p>
            ) : (
              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: "32px",
                }}
              >
                We'll work through {totalSections} section{totalSections !== 1 ? "s" : ""} together.
              </p>
            )}
            <button
              type="button"
              onClick={advance}
              data-testid="button-session-begin"
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
            >
              {totalSections > 0 ? "Begin" : "Continue to closing"}
            </button>
          </div>
        </div>
      ) : step === "sections" && currentSection ? (
        <div style={{ position: "relative" }}>
          <SectionView sectionId={currentSection.id} />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: "40px",
            }}
          >
            <button
              type="button"
              onClick={advance}
              data-testid="button-session-next-section"
              style={{
                padding: "10px 24px",
                borderRadius: "7px",
                background: "rgba(255,255,255,0.07)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
              }}
            >
              {sectionIndex < totalSections - 1 ? "Next section →" : "Continue to closing prayer →"}
            </button>
          </div>
        </div>
      ) : (
        /* Closing */
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
            <button
              type="button"
              onClick={onDismiss}
              data-testid="button-session-finish"
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
            >
              Finish session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
