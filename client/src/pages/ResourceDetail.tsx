import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronRight, Play, Pause, Clock } from "lucide-react";
import { useState, useRef } from "react";
import type { PracticeResource } from "@shared/schema";
import { formatContent } from "@/lib/formatContent";

import divineMercyDetailImg from "@assets/Divine_Mercy_(1)_1773954727973.webp";
import retaliationDetailImg from "@assets/Retaliation_image_1773954733102.webp";
import miracleDetailImg from "@assets/Miracle_1773955016570.jpg";
import lectioDetailImg from "@assets/LectoDivina_1773955016570.png";
import examenDetailImg from "@assets/Examenn_1773955016571.png";

const DETAIL_IMAGE_MAP: Array<{ match: string; img: string }> = [
  { match: "divine mercy", img: divineMercyDetailImg },
  { match: "retaliation", img: retaliationDetailImg },
  { match: "miracle prayer", img: miracleDetailImg },
  { match: "lectio", img: lectioDetailImg },
  { match: "examen", img: examenDetailImg },
];

function getDetailImage(name: string): string | null {
  const lower = name.toLowerCase();
  return DETAIL_IMAGE_MAP.find((m) => lower.includes(m.match))?.img ?? null;
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <div
      style={{
        position: "sticky",
        top: "72px",
        zIndex: 40,
        height: "60px",
        display: "flex",
        alignItems: "center",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "var(--black-35)",
        borderBottom: "1px solid var(--white-8)",
        boxShadow: "0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="px-4 sm:px-[107px]"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <Link href="/resources">
          <span
            data-testid="breadcrumb-resources"
            className="type-body-lg"
            style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Resources
          </span>
        </Link>

        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>

        <span
          data-testid="breadcrumb-current"
          className="type-body-lg"
          style={{
            color: "var(--white-60)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "300px",
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "100px" }}>
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
  );
}

function AudioCard({ imageUrl, audioUrl, duration }: { imageUrl: string; audioUrl: string; duration?: string | null }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
    }
  };

  return (
    <div
      data-testid="audio-card"
      style={{
        position: "sticky",
        top: "148px",
        backgroundColor: "var(--surface-ground)",
        borderRadius: "11px",
        border: "1px solid var(--white-10)",
        boxShadow: "inset 0px 2px 0px 0px var(--white-10)",
        overflow: "hidden",
        cursor: "pointer",
        flexShrink: 0,
      }}
      onClick={toggle}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setPlaying(false)}
        style={{ display: "none" }}
      />

      {/* Thumbnail — 320:180 aspect ratio */}
      <div style={{ position: "relative", aspectRatio: "320 / 180", overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt="Listen to audio"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {/* Bottom fade on thumbnail */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "80px",
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))",
          pointerEvents: "none",
        }} />
        {/* Play / Pause button */}
        <div
          data-testid="button-play-pause-audio"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "62px",
            height: "62px",
            borderRadius: "999px",
            backgroundColor: "var(--black-40)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing
            ? <Pause style={{ width: "28px", height: "28px", color: "white" }} />
            : <Play style={{ width: "28px", height: "28px", color: "white", marginLeft: "2px" }} />}
        </div>
        {/* Border on thumbnail */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderBottom: "1px solid var(--white-10)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Info row */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span className="type-body-lg font-semibold" style={{ color: "white", letterSpacing: "-0.1px" }}>
          Listen to Audio
        </span>

        {duration && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock style={{ width: "14px", height: "14px", color: "white", flexShrink: 0 }} />
            <span className="type-body-md font-medium" style={{ color: "var(--white-60)" }}>
              {duration}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: resource, isLoading, isError } = useQuery<PracticeResource>({
    queryKey: [`/api/practice-resources/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <Breadcrumb name="…" />
        <div style={{ backgroundColor: "var(--surface-ground)", minHeight: "685px" }}>
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !resource) {
    return (
      <DashboardLayout>
        <Breadcrumb name="Not found" />
        <div style={{ backgroundColor: "var(--surface-ground)", minHeight: "685px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "80px" }}>
          <p className="type-body-md" style={{ color: "var(--white-40)", marginBottom: "20px" }}>
            This resource could not be found.
          </p>
          <Link href="/resources">
            <span className="type-body-md" style={{ color: "var(--brand)", cursor: "pointer" }}>
              ← Back to Resources
            </span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const heroImage = getDetailImage(resource.name) ?? resource.imageUrl ?? "/dashboard_bg_cathedral.png";
  const hasAudio = !!resource.audioUrl;

  return (
    <DashboardLayout>
      <Breadcrumb name={resource.name} />

      {/* Body — black bg fills below navbar */}
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "685px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "40px",
            paddingBottom: "50px",
            paddingLeft: "20px",
            paddingRight: "20px",
            width: "100%",
          }}
        >
          {/* Hero card — max-w-960, bg-black, border rgba(255,255,255,0.05), rounded-8 */}
          <div
            data-testid="hero-card-resource"
            style={{
              position: "relative",
              backgroundColor: "var(--surface-ground)",
              border: "1px solid var(--white-5)",
              borderRadius: "8px",
              overflow: "clip",
              paddingTop: "379.94px",
              maxWidth: "960px",
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              flexDirection: "column",
            }}
          >
            {/* Hero image — absolutely positioned at top of card */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: "-3px",
                right: "-3px",
                height: "470px",
                overflow: "hidden",
                backgroundColor: "var(--surface-ground)",
              }}
            >
              <img
                src={heroImage}
                alt={resource.name}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                }}
              />
              {/* Top edge fade */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "99px",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
                pointerEvents: "none",
              }} />
              {/* Bottom fade — dissolves into card bg */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "335px",
                background: "linear-gradient(to bottom, transparent, var(--surface-ground))",
                pointerEvents: "none",
              }} />
            </div>

            {/* Card text content — position: relative + z-index: 1 ensures it paints above the absolute hero image */}
            <div
              className="px-5 sm:px-10"
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "9.25px",
                alignItems: "flex-start",
                width: "100%",
                paddingBottom: "40px",
              }}
            >
              {/* Duration / type badge */}
              <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0 }}>
                {[resource.duration, resource.type === "prayer" ? "Prayer" : "Practice"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {/* Resource title hero — approved exception: fluid clamp sizing (36→80px).
                  The type scale tops out at type-display-xl (34/48px) which is too small
                  for this full-bleed hero. font-serif sets the correct typeface. */}
              <h1
                data-testid="resource-title"
                className="font-serif"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(36px, 6vw + 10px, 80.2px)",
                  lineHeight: "1.01",
                  color: "white",
                  margin: 0,
                }}
              >
                {resource.name}
              </h1>

              {/* Subtitle — Afacad body-lg, 60% white */}
              {resource.subtitle && (
                <p
                  data-testid="resource-subtitle"
                  className="type-body-lg"
                  style={{
                    color: "var(--white-60)",
                    margin: 0,
                  }}
                >
                  {resource.subtitle}
                </p>
              )}
            </div>

            {/* Inner shadow overlay — Figma node 2978-3065 inset 0px 1px 0px 0px rgba(255,255,255,0.1) */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                borderRadius: "inherit",
                boxShadow: "inset 0px 1px 0px 0px var(--white-10)",
              }}
            />
          </div>

          {/* Below-card content area: single-column on mobile, two-column on sm+ when audio exists */}
          <div
            className="flex flex-col sm:flex-row"
            style={{
              maxWidth: "960px",
              width: "100%",
              marginTop: "30px",
              gap: "30px",
              alignItems: "flex-start",
            }}
          >
            {/* Left column — formatted content */}
            <div
              data-testid="resource-content"
              style={{ flex: 1, minWidth: 0 }}
            >
              {formatContent(resource.content)}
            </div>

            {/* Right column — sticky audio card (only shown when audioUrl exists) */}
            {hasAudio && (
              <div
                className="hidden sm:block"
                style={{ width: "300px", flexShrink: 0 }}
              >
                <AudioCard
                  imageUrl={heroImage}
                  audioUrl={resource.audioUrl!}
                  duration={resource.duration}
                />
              </div>
            )}
          </div>

          {/* Mobile audio player — full-width below content when audioUrl exists */}
          {hasAudio && (
            <div
              className="sm:hidden"
              style={{ maxWidth: "960px", width: "100%", marginTop: "20px" }}
            >
              <AudioCard
                imageUrl={heroImage}
                audioUrl={resource.audioUrl!}
                duration={resource.duration}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
