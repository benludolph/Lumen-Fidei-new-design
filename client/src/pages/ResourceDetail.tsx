import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronRight, Play, Pause, Clock } from "lucide-react";
import { useState, useRef } from "react";
import type { PracticeResource } from "@shared/schema";
import { formatContent } from "@/lib/formatContent";

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
        background: "rgba(0,0,0,0.35)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
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
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "15px",
              lineHeight: "15px",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Resources
          </span>
        </Link>

        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>

        <span
          data-testid="breadcrumb-current"
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "15px",
            lineHeight: "15px",
            color: "rgba(255,255,255,0.6)",
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
          border: "2px solid rgba(255,255,255,0.1)",
          borderTopColor: "rgba(255,255,255,0.5)",
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
        backgroundColor: "black",
        borderRadius: "11px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset 0px 2px 0px 0px rgba(255,255,255,0.1)",
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
            backgroundColor: "rgba(0,0,0,0.4)",
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
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Info row */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{
          fontFamily: "'Afacad', sans-serif",
          fontWeight: 600,
          fontSize: "15.6px",
          lineHeight: "24px",
          color: "white",
          letterSpacing: "-0.1px",
        }}>
          Listen to Audio
        </span>

        {duration && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock style={{ width: "14px", height: "14px", color: "white", flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Afacad', sans-serif",
              fontWeight: 500,
              fontSize: "13.5px",
              lineHeight: "16.8px",
              color: "rgba(255,255,255,0.6)",
            }}>
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
        <div style={{ backgroundColor: "black", minHeight: "685px" }}>
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !resource) {
    return (
      <DashboardLayout>
        <Breadcrumb name="Not found" />
        <div style={{ backgroundColor: "black", minHeight: "685px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "80px" }}>
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>
            This resource could not be found.
          </p>
          <Link href="/resources">
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "14px", color: "#F07830", cursor: "pointer" }}>
              ← Back to Resources
            </span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const heroImage = resource.imageUrl ?? "/dashboard_bg_cathedral.png";
  const hasAudio = !!resource.audioUrl;

  return (
    <DashboardLayout>
      <Breadcrumb name={resource.name} />

      {/* Body — black bg fills below navbar */}
      <div
        style={{
          backgroundColor: "black",
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
              backgroundColor: "black",
              border: "1px solid rgba(255,255,255,0.05)",
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
                backgroundColor: "black",
              }}
            >
              <img
                src={heroImage}
                alt={resource.name}
                style={{
                  position: "absolute",
                  top: "90px",
                  left: 0,
                  width: "100%",
                  height: "542px",
                  objectFit: "cover",
                  objectPosition: "center",
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
              {/* Bottom fade — dissolves into black card bg */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "335px",
                background: "linear-gradient(to bottom, transparent, black)",
                pointerEvents: "none",
              }} />
            </div>

            {/* Card text content — below the image space */}
            <div
              className="px-5 sm:px-10"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "9.25px",
                alignItems: "flex-start",
                width: "100%",
                paddingBottom: "40px",
              }}
            >
              {/* Duration / type badge */}
              <p style={{
                fontFamily: "'Afacad', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                color: "#d0d6e0",
                letterSpacing: "2.4px",
                textTransform: "uppercase",
                lineHeight: "1",
                margin: 0,
              }}>
                {[resource.duration, resource.type === "prayer" ? "Prayer" : "Practice"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {/* Resource title — 80.2px Ivy Ora Display as per Figma node 2978-3065 */}
              <h1
                data-testid="resource-title"
                style={{
                  fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                  fontWeight: 500,
                  fontSize: "80.2px",
                  lineHeight: "80.75px",
                  color: "white",
                  margin: 0,
                }}
              >
                {resource.name}
              </h1>

              {/* Subtitle — Afacad Regular 22.5px, 60% white */}
              {resource.subtitle && (
                <p
                  data-testid="resource-subtitle"
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontWeight: 400,
                    fontSize: "22.5px",
                    lineHeight: "31.2px",
                    color: "rgba(255,255,255,0.6)",
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
                boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.1)",
              }}
            />
          </div>

          {/* Below-card content area: two-column on desktop when audio exists */}
          <div
            style={{
              maxWidth: "960px",
              width: "100%",
              marginTop: "30px",
              display: "flex",
              flexDirection: "row",
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
