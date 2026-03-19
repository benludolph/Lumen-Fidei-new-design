import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { PracticeResource } from "@shared/schema";
import { formatContent } from "@/lib/formatContent";

function Breadcrumb({ name }: { name: string }) {
  return (
    <div
      style={{
        position: "sticky",
        top: "72px",
        zIndex: 40,
        height: "52px",
        display: "flex",
        alignItems: "center",
        paddingLeft: "20px",
        paddingRight: "20px",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "rgba(11,11,11,0.7)",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)",
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
              color: "rgba(255,255,255,0.6)",
              opacity: 0.6,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLSpanElement).style.opacity = "1")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLSpanElement).style.opacity = "0.6")}
          >
            Resources
          </span>
        </Link>
        <ChevronRight
          style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}
        />
        <span
          data-testid="breadcrumb-current"
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "15px",
            color: "rgba(255,255,255,0.6)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "240px",
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function DarkSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px" }}>
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
    queryKey: [`/api/practice-resources/id/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <Breadcrumb name="…" />
        <DarkSpinner />
      </DashboardLayout>
    );
  }

  if (isError || !resource) {
    return (
      <DashboardLayout>
        <Breadcrumb name="Not found" />
        <div style={{ maxWidth: "608px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.4)", marginBottom: "24px" }}>
            This resource could not be found.
          </p>
          <Link href="/resources">
            <span
              data-testid="link-back-resources"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Afacad', sans-serif", fontSize: "14px", color: "#F07830", cursor: "pointer" }}
            >
              <ArrowLeft style={{ width: "14px", height: "14px" }} /> Back to Resources
            </span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const heroImageSrc = resource.imageUrl ?? "/dashboard_bg_cathedral.png";

  return (
    <DashboardLayout>
      <Breadcrumb name={resource.name} />

      {/* Content column */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          paddingTop: "40px",
          paddingBottom: "50px",
          paddingLeft: "20px",
          paddingRight: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "30px",
        }}
      >
        {/* Hero card */}
        <div
          data-testid="hero-card-resource"
          style={{
            background: "black",
            border: "0.5px solid rgba(255,255,255,0.05)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* Hero image section */}
          <div style={{ position: "relative", height: "360px", overflow: "hidden" }}>
            {/* Background image */}
            <img
              src={heroImageSrc}
              alt={resource.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            {/* Side-fade gradient — left */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%)",
                pointerEvents: "none",
              }}
            />
            {/* Bottom-fade gradient */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "200px",
                background: "linear-gradient(to bottom, transparent, black)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Card content below image */}
          <div style={{ padding: "32px 40px 40px" }}>
            {/* Type badge */}
            <span style={{
              display: "inline-block",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "11px",
              fontWeight: 400,
              color: "#d0d6e0",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}>
              {resource.type === "prayer" ? "Prayer" : "Practice"}
              {resource.duration && ` · ${resource.duration}`}
            </span>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
              fontWeight: 500,
              fontSize: "32px",
              color: "white",
              lineHeight: "1.2",
              marginBottom: "24px",
            }}>
              {resource.name}
            </h1>

            {/* Audio player */}
            {resource.audioUrl && (
              <div style={{ marginBottom: "32px" }}>
                <audio
                  data-testid="audio-player"
                  controls
                  src={resource.audioUrl}
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "6px",
                    outline: "none",
                    accentColor: "#F07830",
                  }}
                />
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", marginBottom: "28px" }} />

            {/* Formatted content */}
            <div data-testid="resource-content">
              {formatContent(resource.content)}
            </div>
          </div>
        </div>

        {/* Back link */}
        <div>
          <Link href="/resources">
            <span
              data-testid="link-back-bottom"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.4)")}
            >
              <ArrowLeft style={{ width: "14px", height: "14px" }} /> Back to Resources
            </span>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
