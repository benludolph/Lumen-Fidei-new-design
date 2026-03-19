import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronRight } from "lucide-react";
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
        paddingLeft: "20px",
        paddingRight: "20px",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "rgba(0,0,0,0.35)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        {/* Inner body padding — matches Figma pt-40 pb-50 px-20 */}
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
          {/* Card — max-w-960, bg-black, 1px border rgba(255,255,255,0.05), rounded-8, overflow-clip */}
          {/* pt-[379.94px] creates space for the absolute hero image at top */}
          <div
            data-testid="hero-card-resource"
            className="resource-card"
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
            {/* === Hero image — absolutely positioned in top of card === */}
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

            {/* === Card text content — below the image space === */}
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

              {/* Resource title in Ivy Ora Display */}
              <h1 style={{
                fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                fontWeight: 500,
                fontSize: "36px",
                color: "white",
                lineHeight: "1.15",
                margin: 0,
              }}>
                {resource.name}
              </h1>

              {/* Optional audio player */}
              {resource.audioUrl && (
                <audio
                  data-testid="audio-player"
                  controls
                  src={resource.audioUrl}
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "6px",
                    outline: "none",
                    marginTop: "6px",
                    accentColor: "#F07830",
                  }}
                />
              )}

              {/* Divider */}
              <div style={{
                height: "0.5px",
                background: "rgba(255,255,255,0.08)",
                width: "100%",
                marginTop: "18px",
                marginBottom: "6px",
                flexShrink: 0,
              }} />

              {/* Formatted prayer / practice content */}
              <div data-testid="resource-content" style={{ width: "100%" }}>
                {formatContent(resource.content)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
