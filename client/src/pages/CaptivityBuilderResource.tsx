import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { useUserAnswers } from "@/hooks/use-answers";
import { CaptivityBuilderSlide } from "@/components/lesson/CaptivityBuilderSlide";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";

const STANDALONE_DAY = 0;

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
          Captivity Builder
        </span>
      </PageContainer>
    </div>
  );
}

export default function CaptivityBuilderResource() {
  const { data: answers = [], isLoading } = useUserAnswers();

  const existingAnswer = answers.find((a) => a.dayNumber === STANDALONE_DAY)?.content;

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
            paddingBottom: "60px",
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
            {/* Hero image */}
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
                src={candleBg}
                alt="Captivity Builder"
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
              {/* Top fade */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "99px",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
                pointerEvents: "none",
              }} />
              {/* Bottom fade */}
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

            {/* Card text */}
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
              <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0 }}>
                Tool · Spiritual Warfare
              </p>
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
                Captivity Builder
              </h1>
              <p
                data-testid="resource-subtitle"
                className="type-body-lg"
                style={{ color: "var(--white-60)", margin: 0 }}
              >
                Build your personalized rebuke prayer against an intrusive thought.
              </p>
            </div>

            {/* Inner shadow */}
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

          {/* Builder below hero */}
          <div
            style={{
              maxWidth: "960px",
              width: "100%",
              marginTop: "30px",
            }}
          >
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
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
              <CaptivityBuilderSlide
                dayNumber={STANDALONE_DAY}
                existingAnswer={existingAnswer}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
