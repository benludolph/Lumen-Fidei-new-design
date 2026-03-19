import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Church, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { PracticeResource } from "@shared/schema";

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
  const Icon = resource.type === "prayer" ? BookOpen : Church;

  return (
    <Link href={`/resources/${resource.id}`}>
      <div
        data-testid={`card-resource-${resource.id}`}
        style={{
          background: "#0f1011",
          border: "0.487px solid rgba(255,255,255,0.05)",
          borderRadius: "5.842px",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "126px",
          paddingTop: "12.17px",
          paddingLeft: "12.17px",
          paddingRight: "12.17px",
          paddingBottom: "14.118px",
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
        }}
      >
        {/* Top: icon */}
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

        {/* Bottom: title + subtitle + arrow */}
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
          {/* Arrow — bottom-right, signals navigation */}
          <div style={{ color: "rgba(255,255,255,0.35)", marginLeft: "8px", flexShrink: 0 }}>
            <ArrowRight style={{ width: "14px", height: "14px" }} />
          </div>
        </div>
      </div>
    </Link>
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
          lineHeight: "1.1",
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
