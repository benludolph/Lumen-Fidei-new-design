import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import ListBuilder from "./ListBuilder";
import { getSectionById } from "./section-definitions";
import type { SectionDefinition } from "./section-definitions";

function PlaceholderView({ section }: { section: SectionDefinition }) {
  const isLiesAndTruths = section.type === "lies_and_truths";
  return (
    <div
      style={{
        borderRadius: "8px",
        border: "0.5px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        padding: "24px",
      }}
    >
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.35)",
          margin: 0,
          fontStyle: "italic",
          lineHeight: 1.6,
        }}
      >
        {isLiesAndTruths
          ? "The full Lies & Truths editor is coming soon. This section will let you name the lies you carry and claim a Scripture truth against each one."
          : "The Dominant Spiritual Patterns checklist is coming soon. This section will let you identify ruling spirits and patterns that have influenced your life."}
      </p>
    </div>
  );
}

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
              Freedom Workbook
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
            Section {sectionId} · Freedom Workbook
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

        {/* Content */}
        {section.type === "lies_and_truths" || section.type === "patterns_checklist" ? (
          <PlaceholderView section={section} />
        ) : (
          <ListBuilder section={section} />
        )}
      </div>
    </div>
  );
}
