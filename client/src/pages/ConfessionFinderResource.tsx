import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { ConfessionFinderSlide } from "@/components/lesson/ConfessionFinderSlide";
import heroImg from "@assets/ConfessionWalking_1778179278152.webp";

const SLIDE_CONTENT = JSON.stringify({
  allowSkip: false,
  manualEntryEnabled: true,
  confirmationReminder: "Parish schedules can change — please verify on the parish website or by calling before you go.",
  saveVariable: "confession_plan_tool",
});

function Breadcrumb() {
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
      <PageContainer variant="full" className="flex items-center gap-2">
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
          style={{ color: "var(--white-60)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}
        >
          Confession Finder
        </span>
      </PageContainer>
    </div>
  );
}

export default function ConfessionFinderResource() {
  const [formKey, setFormKey] = useState(0);

  return (
    <DashboardLayout>
      <Breadcrumb />

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
            paddingBottom: "100px",
            paddingLeft: "20px",
            paddingRight: "20px",
            width: "100%",
          }}
        >
          {/* Hero card */}
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
                src={heroImg}
                alt="Confession Finder"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "99px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "335px", background: "linear-gradient(to bottom, transparent, var(--surface-ground))", pointerEvents: "none" }} />
            </div>
            <div
              className="px-5 sm:px-10"
              style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "9.25px", alignItems: "flex-start", width: "100%", paddingBottom: "40px" }}
            >
              <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0 }}>Tool · Sacraments</p>
              <h1
                data-testid="resource-title"
                className="font-serif"
                style={{ fontWeight: 500, fontSize: "clamp(36px, 6vw + 10px, 80.2px)", lineHeight: "1.01", color: "white", margin: 0 }}
              >
                Confession Finder
              </h1>
              <p
                data-testid="resource-subtitle"
                className="type-body-lg"
                style={{ color: "var(--white-60)", margin: 0 }}
              >
                Find Confession times at nearby parishes and save them to your calendar.
              </p>
            </div>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", boxShadow: "inset 0px 1px 0px 0px var(--white-10)" }} />
          </div>

          {/* Finder below hero */}
          <div style={{ maxWidth: "960px", width: "100%", marginTop: "30px" }}>
            <ConfessionFinderSlide
              key={formKey}
              content={SLIDE_CONTENT}
              mentorId={null}
              onSaveSessionVar={() => {}}
              onInteracted={() => setFormKey((k) => k + 1)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
