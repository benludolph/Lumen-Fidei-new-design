import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import ListBuilder from "./ListBuilder";
import LiesAndTruthsEditor from "./LiesAndTruthsEditor";
import PatternsChecklist from "./PatternsChecklist";
import { getSectionById } from "./section-definitions";

interface SectionViewProps {
  sectionId: number;
}

export default function SectionView({ sectionId }: SectionViewProps) {
  const section = getSectionById(sectionId);

  if (!section) {
    return (
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          padding: "60px 0",
        }}
      >
        Section not found.
      </p>
    );
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
        {/* Section header */}
        <div style={{ marginBottom: "32px" }}>
          <Link href="/resources/tools/freedom-workbook">
            <span
              data-testid="link-back-to-workbook"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                marginBottom: "16px",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
            >
              <ChevronLeft style={{ width: "12px", height: "12px" }} />
              The Deliverance Workbook
            </span>
          </Link>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.35)",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Section {sectionId} · The Deliverance Workbook
          </p>
          <h1
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(26px, 4vw + 8px, 48px)",
              lineHeight: 1.1,
              color: "white",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            {section.name}
          </h1>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {section.description}
          </p>
        </div>

        {/* Content — dispatch by section type */}
        {section.type === "lies_and_truths" ? (
          <LiesAndTruthsEditor />
        ) : section.type === "patterns_checklist" ? (
          <PatternsChecklist />
        ) : (
          <ListBuilder section={section} />
        )}
      </div>
    </div>
  );
}
