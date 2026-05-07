import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
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
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import type { PracticeResource } from "@shared/schema";
import type { LucideIcon } from "lucide-react";

import intrusiveImg from "@assets/intrusive_v2_default.webp";
import intrusiveHoverImg from "@assets/intrusive_v2_hover.webp";
import confessionImg from "@assets/confession_1778179196096.png";
import confessionHoverImg from "@assets/confession__hover_1778179196097.png";

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

const RESOURCE_SUBTEXTS: { match: string; subtext: string }[] = [
  { match: "retaliation", subtext: "Renouncing past spiritual ties" },
  { match: "miracle", subtext: "Asking God to intervene" },
  { match: "examen", subtext: "Daily review with God" },
  { match: "lectio", subtext: "Slow, prayerful Scripture reading" },
  { match: "rosary", subtext: "Meditation on Christ's life" },
  { match: "divine mercy", subtext: "Prayer of trust in mercy" },
];

function getResourceSubtext(name: string): string {
  const lower = name.toLowerCase();
  return RESOURCE_SUBTEXTS.find((m) => lower.includes(m.match))?.subtext ?? "";
}

function BreakingLiesCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/resources/tools/captivity-builder">
      <div
        data-testid="card-tool-captivity-builder"
        className="resource-card-hover relative flex flex-col justify-between overflow-hidden cursor-pointer pt-3 px-3 pb-[14px] h-[126px]"
        style={{ backgroundColor: "#0F1011", border: "0.5px solid var(--white-5)", borderRadius: "6px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${intrusiveImg})`, backgroundSize: "cover", backgroundPosition: "center right", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${intrusiveHoverImg})`, backgroundSize: "cover", backgroundPosition: "center right", opacity: hovered ? 1 : 0, transition: "opacity 0.2s ease-out", pointerEvents: "none", zIndex: 1 }} />
        <div className="flex items-start relative z-[3]">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--white-5)", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)" }}
          >
            <Wrench style={{ width: "13px", height: "13px", color: "white", strokeWidth: 1.8 }} />
          </div>
        </div>
        <div className="flex items-end justify-between w-full relative z-[3]">
          <div className="flex-1 min-w-0">
            <p className="type-display-sm mb-2 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "#f7f8f8", letterSpacing: "-0.1402px" }}>
              Breaking Lies
            </p>
            <p className="type-body-xs" style={{ color: "#8a8f98" }}>
              Build a personalized rebuke prayer
            </p>
          </div>
          <div className="ml-2 shrink-0" style={{ color: "var(--white-35)" }}>
            <ArrowRight style={{ width: "14px", height: "14px" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ConfessionFinderCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/resources/tools/confession-finder">
      <div
        data-testid="card-tool-confession-finder"
        className="resource-card-hover relative flex flex-col justify-between overflow-hidden cursor-pointer pt-3 px-3 pb-[14px] h-[126px]"
        style={{ backgroundColor: "#0F1011", border: "0.5px solid var(--white-5)", borderRadius: "6px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${confessionImg})`, backgroundSize: "cover", backgroundPosition: "center right", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${confessionHoverImg})`, backgroundSize: "cover", backgroundPosition: "center right", opacity: hovered ? 1 : 0, transition: "opacity 0.2s ease-out", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)", pointerEvents: "none", zIndex: 2 }} />
        <div className="flex items-start relative z-[3]">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--white-5)", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)" }}
          >
            <Church style={{ width: "13px", height: "13px", color: "white", strokeWidth: 1.8 }} />
          </div>
        </div>
        <div className="flex items-end justify-between w-full relative z-[3]">
          <div className="flex-1 min-w-0">
            <p className="type-display-sm mb-2 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "#f7f8f8", letterSpacing: "-0.1402px" }}>
              Confession Finder
            </p>
            <p className="type-body-xs" style={{ color: "#8a8f98" }}>
              Find nearby Confession times
            </p>
          </div>
          <div className="ml-2 shrink-0" style={{ color: "var(--white-35)" }}>
            <ArrowRight style={{ width: "14px", height: "14px" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-12">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(180,188,208,0.15))" }} />
      <span className="type-caption-md whitespace-nowrap" style={{ color: "#d0d6e0" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(180,188,208,0.15))" }} />
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
        className="resource-card-hover relative flex flex-col justify-between overflow-hidden cursor-pointer pt-3 px-3 pb-[14px] h-[126px]"
        style={{
          backgroundColor: "#0F1011",
          border: "0.5px solid var(--white-5)",
          borderRadius: "6px",
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

        <div className="flex items-start relative z-[3]">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--white-5)", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)" }}
          >
            <Icon style={{ width: "13px", height: "13px", color: "white", strokeWidth: 1.8 }} />
          </div>
        </div>

        <div className="flex items-end justify-between w-full relative z-[3]">
          <div className="flex-1 min-w-0">
            <p className="type-display-sm mb-2 whitespace-nowrap overflow-hidden text-ellipsis" style={{
              color: "#f7f8f8",
              letterSpacing: "-0.1402px",
            }}>
              {resource.name}
            </p>
            <p className="type-body-xs" style={{ color: "#8a8f98" }}>
              {getResourceSubtext(resource.name) || resource.duration || ""}
            </p>
          </div>
          <div className="ml-2 shrink-0" style={{ color: "var(--white-35)" }}>
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
        className="resource-card-hover relative flex flex-col justify-between overflow-hidden cursor-pointer pt-3 px-3 pb-[14px] h-[126px]"
        style={{
          backgroundColor: "#0F1011",
          border: "0.5px solid var(--white-5)",
          borderRadius: "6px",
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

        <div className="flex items-start relative z-[3]">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--white-5)", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.1)" }}
          >
            <Icon style={{ width: "13px", height: "13px", color: "white", strokeWidth: 1.8 }} />
          </div>
        </div>

        <div className="flex items-end justify-between w-full relative z-[3]">
          <div className="flex-1 min-w-0">
            <p className="type-display-sm mb-2 whitespace-nowrap overflow-hidden text-ellipsis" style={{
              color: "#f7f8f8",
              letterSpacing: "-0.1402px",
            }}>
              {name}
            </p>
            <p className="type-body-xs" style={{ color: "#8a8f98" }}>
              {description}
            </p>
          </div>
          <div className="ml-2 shrink-0" style={{ color: "var(--white-35)" }}>
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
      <PageContainer variant="narrow" className="pt-[80px] pb-16">
        <h1 className="type-display-xl text-center text-white mb-12">
          Resources
        </h1>

        {isLoading ? (
          <div className="flex items-center justify-center pt-16">
            <div
              className="animate-spin"
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid var(--white-10)",
                borderTopColor: "var(--white-50)",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {/* PRAYERS — 3 equal columns, exactly 6 cards in 2 rows */}
            <div>
              <SectionDivider label="PRAYERS" />
              <div
                className="resource-grid-equal gap-2 w-full"
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
                    <div key={i} style={{ height: "126px", border: "0.5px solid var(--white-3)", borderRadius: "6px", backgroundColor: "var(--surface-ground)" }} />
                  )
                )}
              </div>
            </div>

            {/* TOOLS */}
            <div>
              <SectionDivider label="TOOLS" />
              <div className="resource-grid-equal gap-2 w-full">
                <BreakingLiesCard />
                <ConfessionFinderCard />
              </div>
            </div>

            {/* ADDITIONAL RESOURCES — catechism (1 col) + penitent (2 cols) */}
            <div>
              <SectionDivider label="ADDITIONAL RESOURCES" />
              <div
                className="resource-grid-additional gap-2 w-full"
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
                  description="Foundations of Church teaching"
                  href="https://www.catechism.cc/catechisms/Baltimore_Catechism.pdf"
                  bgImage={catechismImg}
                  hoverBgImage={catechismHoverImg}
                  iconName="catechism"
                  colSpan={1}
                />
                <ExternalCard
                  name="Penitent Soldiers of Mary"
                  description="Marian apostolate + community"
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
      </PageContainer>
    </DashboardLayout>
  );
}
