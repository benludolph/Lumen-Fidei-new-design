import { useState } from "react";
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
  ExternalLink,
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

import retaliationHoverImg from "@assets/Retaliation_hover_1773947410450.webp";
import catechismHoverImg from "@assets/Catechism_hover_1773947410450.webp";
import divineMercyHoverImg from "@assets/Divine_Mercy_hover_1773947410450.webp";
import rosaryHoverImg from "@assets/Rosary_hover_1773947410450.webp";
import lectioHoverImg from "@assets/Lectio_hover_1773947410450.webp";
import examenHoverImg from "@assets/Examen_hover_1773947410450.webp";
import miraclePrayerHoverImg from "@assets/Miracle_hover_1773947410449.webp";
import penitentHoverImg from "@assets/Penitent_hover_1773947410450.webp";

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

const HOVER_IMAGE_MAP: Array<{ match: string; img: string }> = [
  { match: "retaliation", img: retaliationHoverImg },
  { match: "catechism", img: catechismHoverImg },
  { match: "baltimore", img: catechismHoverImg },
  { match: "divine mercy", img: divineMercyHoverImg },
  { match: "rosary", img: rosaryHoverImg },
  { match: "lectio", img: lectioHoverImg },
  { match: "examen", img: examenHoverImg },
  { match: "miracle prayer", img: miraclePrayerHoverImg },
  { match: "penitent", img: penitentHoverImg },
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

function getResourceHoverImage(name: string): string | undefined {
  const lower = name.toLowerCase();
  const entry = HOVER_IMAGE_MAP.find((m) => lower.includes(m.match));
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
        fontFamily: "Afacad, sans-serif",
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
  const [hovered, setHovered] = useState(false);
  const Icon = getResourceIcon(resource.name);
  const bgImage = getResourceImage(resource.name);
  const hoverImage = getResourceHoverImage(resource.name);

  return (
    <Link href={`/resources/${resource.id}`}>
      <div
        data-testid={`card-resource-${resource.id}`}
        style={{
          position: "relative",
          backgroundColor: "#0f1011",
          border: `0.487px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}`,
          borderRadius: "5.842px",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "126px",
          paddingTop: "12.17px",
          paddingLeft: "12.17px",
          paddingRight: "12.17px",
          paddingBottom: "14.118px",
          transition: "border-color 0.2s ease-out",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Default image */}
        {bgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
          }} />
        )}
        {/* Dark overlay on default */}
        {bgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.18)",
            pointerEvents: "none",
            zIndex: 1,
          }} />
        )}
        {/* Hover image — dissolves in at 200ms ease-out */}
        {hoverImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${hoverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease-out",
            pointerEvents: "none",
            zIndex: 2,
          }} />
        )}

        <div style={{ display: "flex", alignItems: "flex-start", position: "relative", zIndex: 3 }}>
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

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 3 }}>
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
              fontFamily: "Afacad, sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              color: "#8a8f98",
              lineHeight: "10.223px",
            }}>
              {resource.duration ?? (resource.type === "prayer" ? "A prayer" : "A practice")}
            </p>
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", marginLeft: "8px", flexShrink: 0 }}>
            <ArrowRight style={{ width: "14px", height: "14px" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ExternalCard({
  name,
  description,
  href,
  bgImage,
  hoverBgImage,
  iconName,
  colSpan = 1,
}: {
  name: string;
  description: string;
  href: string;
  bgImage?: string;
  hoverBgImage?: string;
  iconName?: string;
  colSpan?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = iconName ? getResourceIcon(iconName) : ExternalLink;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={`card-external-${name.toLowerCase().replace(/\s+/g, "-")}`}
      style={{ gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined, textDecoration: "none" }}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "#0f1011",
          border: `0.487px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}`,
          borderRadius: "5.842px",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "126px",
          paddingTop: "12.17px",
          paddingLeft: "12.17px",
          paddingRight: "12.17px",
          paddingBottom: "14.118px",
          transition: "border-color 0.2s ease-out",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Default image */}
        {bgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
          }} />
        )}
        {/* Dark overlay on default */}
        {bgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            pointerEvents: "none",
            zIndex: 1,
          }} />
        )}
        {/* Hover image — dissolves in at 200ms ease-out */}
        {hoverBgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${hoverBgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease-out",
            pointerEvents: "none",
            zIndex: 2,
          }} />
        )}

        <div style={{ display: "flex", alignItems: "flex-start", position: "relative", zIndex: 3 }}>
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

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 3 }}>
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
              {name}
            </p>
            <p style={{
              fontFamily: "Afacad, sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              color: "#8a8f98",
              lineHeight: "10.223px",
            }}>
              {description}
            </p>
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", marginLeft: "8px", flexShrink: 0 }}>
            <ExternalLink style={{ width: "14px", height: "14px" }} />
          </div>
        </div>
      </div>
    </a>
  );
}

const PRAYER_NAMES = [
  "retaliation",
  "miracle prayer",
  "examen",
  "lectio",
  "rosary",
  "divine mercy",
];

function matchesPrayer(name: string, match: string) {
  return name.toLowerCase().includes(match);
}

export default function Resources() {
  const { data: resources, isLoading } = useQuery<PracticeResource[]>({
    queryKey: ["/api/practice-resources"],
  });

  const prayerCards: (PracticeResource | null)[] = PRAYER_NAMES.map((match) =>
    resources?.find((r) => matchesPrayer(r.name, match)) ?? null
  );

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
            {/* PRAYERS — 3 equal columns, exactly 6 cards in 2 rows */}
            <div>
              <SectionDivider label="PRAYERS" />
              <div
                className="resource-grid-equal"
                style={{ gap: "8px", width: "100%" }}
              >
                <style>{`
                  .resource-grid-equal {
                    display: grid;
                    grid-template-columns: 1fr;
                  }
                  @media (min-width: 640px) {
                    .resource-grid-equal {
                      grid-template-columns: repeat(3, 1fr);
                    }
                  }
                `}</style>
                {prayerCards.map((resource, i) =>
                  resource ? (
                    <ResourceCard key={resource.id} resource={resource} />
                  ) : (
                    <div key={i} style={{ height: "126px", border: "0.487px solid rgba(255,255,255,0.03)", borderRadius: "5.842px", backgroundColor: "#0a0a0a" }} />
                  )
                )}
              </div>
            </div>

            {/* ADDITIONAL RESOURCES — catechism (1 col) + penitent (2 cols) */}
            <div>
              <SectionDivider label="ADDITIONAL RESOURCES" />
              <div
                className="resource-grid-additional"
                style={{ gap: "8px", width: "100%" }}
              >
                <style>{`
                  .resource-grid-additional {
                    display: grid;
                    grid-template-columns: 1fr;
                  }
                  @media (min-width: 640px) {
                    .resource-grid-additional {
                      grid-template-columns: repeat(3, 1fr);
                    }
                  }
                `}</style>
                <ExternalCard
                  name="Baltimore Catechism"
                  description="Classic Catholic reference"
                  href="https://www.catechism.cc/catechisms/Baltimore_Catechism.pdf"
                  bgImage={catechismImg}
                  hoverBgImage={catechismHoverImg}
                  iconName="catechism"
                  colSpan={1}
                />
                <ExternalCard
                  name="Penitent Soldiers of Mary"
                  description="Marian devotion community"
                  href="https://penitentsoldiersofmary.org/"
                  bgImage={penitentImg}
                  hoverBgImage={penitentHoverImg}
                  iconName="penitent"
                  colSpan={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
