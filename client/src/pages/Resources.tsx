import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Church, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { PracticeResource } from "@shared/schema";

function formatInlineStyles(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    if (
      boldMatch &&
      boldMatch.index !== undefined &&
      (!italicMatch || italicMatch.index === undefined || boldMatch.index <= italicMatch.index)
    ) {
      if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
      parts.push(
        <strong key={key++} style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) parts.push(remaining.slice(0, italicMatch.index));
      parts.push(
        <em key={key++} style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return parts;
}

function formatContent(content: string): JSX.Element[] {
  const lines = content.split("\n");
  const result: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      result.push(
        <ol key={result.length} style={{ listStyleType: "decimal", paddingLeft: "16px", margin: "8px 0" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: "4px", color: "rgba(255,255,255,0.75)", fontFamily: "'Afacad', sans-serif", fontSize: "13px", lineHeight: "1.6" }}>
              {formatInlineStyles(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith("**") && line.endsWith("**")) {
      result.push(
        <h3 key={result.length} style={{ fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontSize: "15px", color: "white", margin: "12px 0 4px" }}>
          {line.replace(/\*\*/g, "")}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**") && line.length > 2) {
      const inner = line.slice(1, -1);
      if (!inner.includes("*")) {
        result.push(
          <p key={result.length} style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", fontStyle: "italic", margin: "6px 0" }}>
            {inner}
          </p>
        );
        i++;
        continue;
      }
    }

    if (line.startsWith("---")) {
      result.push(<hr key={result.length} style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.08)", margin: "12px 0" }} />);
      i++;
      continue;
    }

    if (line.trim() === "") {
      result.push(<div key={result.length} style={{ height: "6px" }} />);
      i++;
      continue;
    }

    result.push(
      <p key={result.length} style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.65", margin: "3px 0" }}>
        {formatInlineStyles(line)}
      </p>
    );
    i++;
  }

  return result;
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(180,188,208,0.15))" }} />
      <span style={{
        fontFamily: "'Afacad', sans-serif",
        fontWeight: 400,
        fontSize: "12px",
        color: "#d0d6e0",
        letterSpacing: "2.4px",
        textTransform: "uppercase",
        lineHeight: "24px",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(180,188,208,0.15))" }} />
    </div>
  );
}

function ResourceCard({ resource }: { resource: PracticeResource }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = resource.type === "prayer" ? BookOpen : Church;

  return (
    <div
      data-testid={`card-resource-${resource.id}`}
      style={{
        background: "#0f1011",
        border: `0.487px solid ${isOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
        borderRadius: "5.842px",
        overflow: "hidden",
        transition: "border-color 0.15s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isOpen) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        if (!isOpen) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        data-testid={`button-toggle-resource-${resource.id}`}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          minHeight: "126px",
          paddingTop: "12.17px",
          paddingLeft: "12.17px",
          paddingRight: "12.17px",
          paddingBottom: "14.118px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Top row: icon only */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{
            width: "23.367px",
            height: "23.367px",
            borderRadius: "3.894px",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0px 0.974px 1.947px 0px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon style={{ width: "13px", height: "13px", color: "white", strokeWidth: 1.8 }} />
          </div>
        </div>

        {/* Bottom: title + subtitle + chevron (bottom-right) */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
              fontWeight: 500,
              fontSize: "16px",
              color: "#f7f8f8",
              letterSpacing: "-0.1402px",
              lineHeight: "15.539px",
              marginBottom: "7.789px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {resource.name}
            </p>
            <p style={{
              fontFamily: "'Afacad', sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              color: "#8a8f98",
              lineHeight: "10.223px",
            }}>
              {resource.duration ?? (resource.type === "prayer" ? "A prayer" : "A practice")}
            </p>
          </div>
          {/* Chevron — bottom-right */}
          <div style={{ color: "rgba(255,255,255,0.35)", marginLeft: "8px", flexShrink: 0 }}>
            {isOpen
              ? <ChevronUp style={{ width: "14px", height: "14px" }} />
              : <ChevronDown style={{ width: "14px", height: "14px" }} />
            }
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div style={{
          padding: "16px 12.17px 18px",
          borderTop: "0.5px solid rgba(255,255,255,0.07)",
        }}>
          {formatContent(resource.content)}
        </div>
      )}
    </div>
  );
}

function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {children}
    </div>
  );
}

export default function Resources() {
  const { data: resources, isLoading } = useQuery<PracticeResource[]>({
    queryKey: ["/api/practice-resources"],
  });

  const prayers = resources?.filter((r) => r.type === "prayer") ?? [];
  const practices = resources?.filter((r) => r.type === "practice") ?? [];

  return (
    <DashboardLayout>
      <div
        className="px-4 sm:px-0"
        style={{
          maxWidth: "608px",
          margin: "0 auto",
          paddingTop: "32px",
          paddingBottom: "64px",
        }}
      >
        {/* Page title */}
        <h1 style={{
          fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
          fontWeight: 500,
          fontSize: "42px",
          color: "white",
          textAlign: "center",
          lineHeight: "28px",
          marginBottom: "48px",
        }}>
          Resources
        </h1>

        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "64px" }}>
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
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            {prayers.length > 0 && (
              <div>
                <SectionDivider label="Prayers" />
                <BentoGrid>
                  {prayers.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </BentoGrid>
              </div>
            )}

            {practices.length > 0 && (
              <div>
                <SectionDivider label="Practices" />
                <BentoGrid>
                  {practices.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </BentoGrid>
              </div>
            )}

            {!isLoading && prayers.length === 0 && practices.length === 0 && (
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                No resources available yet.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
