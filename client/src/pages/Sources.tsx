import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useWorkbookContent } from "@/components/workbook-admin/WorkbookContentProvider";

export default function Sources() {
  const { text } = useWorkbookContent();
  const SOURCES = [text("general.acknowledgment"), ...[1, 2, 3, 4, 5].map(index => text(`general.sources.${index}`))].filter(Boolean);
  return (
    <DashboardLayout>
      <div
        style={{
          minHeight: "100%",
          background: "var(--surface-ground)",
          overflowY: "auto",
        }}
      >
        <PageContainer>
          <div style={{ maxWidth: "640px", margin: "0 auto", padding: "28px 0 80px" }}>

            {/* Breadcrumb */}
            <div style={{ marginBottom: "40px" }}>
              <Link href="/program-overview">
                <span
                  className="type-body-sm"
                  style={{
                    color: "var(--white-50)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={12} />
                  Program Overview
                </span>
              </Link>
            </div>

            {/* Title */}
            <h1
              className="font-serif"
              style={{
                color: "white",
                fontSize: "clamp(22px, 4vw, 32px)",
                fontWeight: 500,
                lineHeight: 1.15,
                margin: "0 0 10px",
              }}
            >
              {text("general.sourcesTitle")}
            </h1>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "rgba(210,180,120,0.5)",
                marginBottom: "40px",
              }}
            />

            {/* Body paragraphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {SOURCES.map((text, i) => (
                <p
                  key={i}
                  className="type-body-sm"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {text}
                </p>
              ))}
            </div>

          </div>
        </PageContainer>
      </div>
    </DashboardLayout>
  );
}
