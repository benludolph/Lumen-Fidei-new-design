import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "wouter";
import { ChevronRight, Play, Pause, X, Clock } from "lucide-react";
import { useUserAnswers } from "@/hooks/use-answers";
import { CaptivityBuilderSlide } from "@/components/lesson/CaptivityBuilderSlide";
import heroImg from "@assets/bearcla_intrusive_thoughts_--ar_169_--profile_qin2lfz_--v_8.1__1778103896965.png";

const STANDALONE_DAY = 0;
const HOW_TO_VIDEO_URL = "https://res.cloudinary.com/dsv0rjvoi/video/upload/v1778103999/Captivity_Excercise_dhrmy9.mp4";

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

function HowToVideoWidget({ onClose }: { onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    const el = videoRef.current;
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
      data-testid="howto-video-widget"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 50,
        width: "300px",
        borderRadius: "11px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "var(--surface-ground)",
        overflow: "hidden",
        boxShadow: "inset 0px 2px 0px 0px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {/* Close button */}
      <button
        data-testid="button-close-howto-video"
        onClick={onClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          zIndex: 10,
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "white",
          flexShrink: 0,
        }}
        aria-label="Close video"
      >
        <X size={12} />
      </button>

      {/* Video area */}
      <div
        style={{ position: "relative", aspectRatio: "320/180", overflow: "hidden", cursor: "pointer" }}
        onClick={toggle}
      >
        <video
          ref={videoRef}
          src={HOW_TO_VIDEO_URL}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          onEnded={() => setPlaying(false)}
          playsInline
        />
        {/* Bottom fade */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))",
          pointerEvents: "none",
        }} />
        {/* Play / Pause overlay */}
        <div
          data-testid="button-play-pause-howto"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "62px",
            height: "62px",
            borderRadius: "999px",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: playing ? 0 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <Play style={{ width: "28px", height: "28px", color: "white", marginLeft: "2px" }} />
        </div>
        {/* Border bottom on thumbnail */}
        <div style={{ position: "absolute", inset: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none" }} />
      </div>

      {/* Info row */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span className="type-body-lg font-semibold" style={{ color: "white", letterSpacing: "-0.1px" }}>
          How to Use this Tool
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock style={{ width: "14px", height: "14px", color: "white", flexShrink: 0 }} />
          <span className="type-body-md font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            Follow-along tutorial
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CaptivityBuilderResource() {
  const { data: answers = [], isLoading } = useUserAnswers();
  const [showVideo, setShowVideo] = useState(true);

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
            paddingBottom: "80px",
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
                src={heroImg}
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

      {/* How-to video widget */}
      {showVideo && <HowToVideoWidget onClose={() => setShowVideo(false)} />}
    </DashboardLayout>
  );
}
