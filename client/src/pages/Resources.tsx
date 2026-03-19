import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import {
  FoldVertical,
  Regex,
  Loader,
  Lightbulb,
  Lasso,
  Heart,
  Church,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import type { PracticeResource } from "@shared/schema";
import type { LucideIcon } from "lucide-react";

import retaliationImg from "@assets/Retaliation_1773942790197.webp";
import catechismImg from "@assets/Catechism_1773942790213.webp";
import divineMercyImg from "@assets/Divine_Mercy_1773942790214.webp";
import rosaryImg from "@assets/Rosary_1773942790214.webp";
import lectioImg from "@assets/Lectio_1773942790214.webp";
import examenImg from "@assets/Examen_1773942790214.webp";
import miraclePrayerImg from "@assets/Miracle_Prayer_1773942790214.webp";
import penitentImg from "@assets/Penitent_1773942790215.webp";

const IMAGE_MAP: Array<{ match: string; img: string }> = [
  { match: "retaliation", img: retaliationImg },
  { match: "catechism", img: catechismImg },
  { match: "baltimore", img: catechismImg },
  { match: "divine mercy", img: divineMercyImg },
  { match: "rosary", img: rosaryImg },
  { match: "lectio", img: lectioImg },
  { match: "examen", img: examenImg },
  { match: "miracle prayer", img: miraclePrayerImg },
  { match: "penitent", img: penitentImg },
];

const ICON_MAP: Array<{ match: string; icon: LucideIcon }> = [
  { match: "retaliation", icon: FoldVertical },
  { match: "miracle prayer", icon: Regex },
  { match: "examen", icon: Loader },
  { match: "lectio", icon: Lightbulb },
  { match: "rosary", icon: Lasso },
  { match: "divine mercy", icon: Heart },
  { match: "catechism", icon: Church },
  { match: "baltimore", icon: Church },
  { match: "penitent", icon: Shield },
];

function getResourceImage(name: string): string | undefined {
  const lower = name.toLowerCase();
  const entry = IMAGE_MAP.find((m) => lower.includes(m.match));
  return entry?.img;
}

function getResourceIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  const entry = ICON_MAP.find((m) => lower.includes(m.match));
  return entry?.icon ?? Church;
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
  const Icon = getResourceIcon(resource.name);
  const bgImage = getResourceImage(resource.name);

  return (
    <Link href={`/resources/${resource.id}`}>
      <div
        data-testid={`card-resource-${resource.id}`}
        style={{
          position: "relative",
          background: bgImage
            ? `url(${bgImage}) center/cover no-repeat #0f1011`
            : "#0f1011",
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
        {bgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.18)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
        )}

        {/* Top: icon */}
        <div style={{ display: "flex", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
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
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 1 }}>
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

function ResourceGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="resource-grid"
      style={{ gap: "16px", width: "100%" }}
    >
      <style>{`
        .resource-grid {
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .resource-grid {
            grid-template-columns: 199.59fr 188.20fr 188.20fr;
          }
        }
      `}</style>
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
                <SectionDivider label="PRAYERS" />
                <ResourceGrid>
                  {prayers.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </ResourceGrid>
              </div>
            )}

            {practices.length > 0 && (
              <div>
                <SectionDivider label="ADDITIONAL SUPPORT" />
                <ResourceGrid>
                  {practices.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </ResourceGrid>
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
