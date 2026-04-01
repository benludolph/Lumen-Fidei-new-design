import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Lock, Play, X, CircleUser } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TestimonyPartWithStatus {
  id: number;
  testimonyId: number;
  partNumber: number;
  title: string;
  videoUrl: string;
  unlockKey: string;
  unlocked: boolean;
}

interface TestimonyWithStatus {
  id: number;
  position: number;
  personName: string;
  description: string;
  thumbnailUrl: string;
  fullVideoUrl: string;
  parts: TestimonyPartWithStatus[];
  unlockedCount: number;
  totalParts: number;
  fullyUnlocked: boolean;
}

function unlockHintText(unlockKey: string): string {
  if (unlockKey === "prelim") return "Complete Preliminary Modules";
  const weekFirstMatch = unlockKey.match(/^week-(\d+)-first$/);
  if (weekFirstMatch) return `Complete Week ${weekFirstMatch[1]} first lesson`;
  const weekLastMatch = unlockKey.match(/^week-(\d+)-last$/);
  if (weekLastMatch) return `Complete Week ${weekLastMatch[1]}`;
  return "Complete more lessons";
}

function getEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v");
      if (!id) id = u.pathname.split("/").filter(Boolean).pop() ?? "";
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
  } catch (_) {}
  return raw;
}

function VideoModal({
  open,
  onClose,
  videoUrl,
  title,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-3xl w-full p-0 overflow-hidden bg-black border-0"
        data-testid="dialog-video-modal"
      >
        <div className="relative">
          <button
            onClick={onClose}
            data-testid="button-close-video-modal"
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {open && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={getEmbedUrl(videoUrl)}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
        <div className="px-5 py-3 bg-black">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TestimonyCard({
  testimony,
  onPlay,
}: {
  testimony: TestimonyWithStatus;
  onPlay: (url: string, title: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLocked = testimony.unlockedCount === 0;
  const firstUnlockedPart = testimony.parts.find(p => p.unlocked);
  const lockHint = testimony.parts[0] ? unlockHintText(testimony.parts[0].unlockKey) : "Complete more lessons";

  const handleClick = () => {
    if (isLocked) return;
    if (testimony.fullyUnlocked && testimony.fullVideoUrl) {
      onPlay(testimony.fullVideoUrl, `${testimony.personName} — Full Testimony`);
    } else if (firstUnlockedPart) {
      onPlay(
        firstUnlockedPart.videoUrl,
        `${testimony.personName}${firstUnlockedPart.title ? ` — ${firstUnlockedPart.title}` : ` — Part ${firstUnlockedPart.partNumber}`}`
      );
    }
  };

  const INFO_H = 62;

  return (
    <div
      data-testid={`card-testimony-${testimony.id}`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3/4",
        background: "#101217",
        border: `1px solid ${hovered && !isLocked ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "6px",
        overflow: "hidden",
        cursor: isLocked ? "default" : "pointer",
        transition: "border-color 0.2s",
      }}
    >
      {/* Image area — mix-blend-luminosity */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: `${INFO_H}px`,
          mixBlendMode: "luminosity",
          opacity: isLocked ? 0.3 : hovered ? 0.65 : 0.5,
          transition: "opacity 0.2s",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "#0f1011" }} />
        {testimony.thumbnailUrl ? (
          <img
            alt={testimony.personName}
            src={testimony.thumbnailUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.7,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircleUser size={48} style={{ color: "rgba(255,255,255,0.12)" }} />
          </div>
        )}
      </div>

      {/* Hover play overlay (unlocked only) */}
      {!isLocked && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: `${INFO_H}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            background: "rgba(0,0,0,0.2)",
            transition: "opacity 0.2s",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={18} style={{ color: "white", fill: "white", marginLeft: "2px" }} />
          </div>
        </div>
      )}

      {/* Bottom info strip */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${INFO_H}px`,
          background: "#101217",
          borderTop: "0.5px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: "14px",
          paddingLeft: "8px",
          paddingRight: "8px",
          gap: "3px",
        }}
      >
        {/* Floating badge — centered, spans from top of strip into image */}
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "20px",
            height: "20px",
            borderRadius: "10px",
            background: "#1b1c1d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          {isLocked
            ? <Lock size={8} style={{ color: "rgba(255,255,255,0.4)" }} />
            : <CircleUser size={8} style={{ color: "rgba(255,255,255,0.5)" }} />
          }
        </div>

        {/* Subtitle / lock hint */}
        <p
          className="type-caption-sm"
          style={{
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {isLocked ? lockHint : (testimony.description || "\u00A0")}
        </p>

        {/* Person name — IvyOra Display */}
        <p
          data-testid={`text-testimony-name-${testimony.id}`}
          style={{
            fontFamily: "'IvyOra Display', serif",
            fontWeight: 500,
            fontSize: "15px",
            lineHeight: 1,
            color: isLocked ? "rgba(255,255,255,0.35)" : "white",
            margin: 0,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {testimony.personName}
        </p>
      </div>

      {/* Inset highlight border (top edge glow) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-1px",
          pointerEvents: "none",
          borderRadius: "inherit",
          boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        width: "100%",
        maxWidth: "608px",
        margin: "0 auto",
      }}
    >
      <div style={{ flex: 1, height: "1px", background: "rgba(180,188,208,0.1)", borderRadius: "9999px" }} />
      <span
        className="type-caption-sm"
        style={{
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "2.4px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        COMPLETE LESSONS TO UNLOCK
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(180,188,208,0.1)", borderRadius: "9999px" }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        width: "100%",
        aspectRatio: "3/4",
        background: "var(--surface-raised)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
      }}
    />
  );
}

export default function TestimoniesPage() {
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  const { data: testimonies = [], isLoading } = useQuery<TestimonyWithStatus[]>({
    queryKey: ["/api/testimonies"],
  });

  const openVideo = (url: string, title: string) => {
    setModalUrl(url);
    setModalTitle(title);
  };
  const closeModal = () => setModalUrl(null);

  return (
    <DashboardLayout>
      <VideoModal
        open={!!modalUrl}
        onClose={closeModal}
        videoUrl={modalUrl ?? ""}
        title={modalTitle}
      />

      <PageContainer
        variant="narrow"
        className="pt-[80px] pb-20 min-h-[calc(100vh-72px)]"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "48px" }}>

          {/* Page title */}
          <h1
            className="type-display-xl text-white text-center"
            data-testid="text-testimonies-title"
          >
            Testimonies
          </h1>

          {/* Divider */}
          <Divider />

          {/* 3×3 grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : testimonies.length === 0 ? (
            <p className="type-body-md" style={{ color: "var(--white-40)", textAlign: "center", paddingTop: "40px" }}>
              No testimonies have been added yet.
            </p>
          ) : (
            <div
              data-testid="testimonies-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full"
            >
              {testimonies.map(testimony => (
                <TestimonyCard
                  key={testimony.id}
                  testimony={testimony}
                  onPlay={openVideo}
                />
              ))}
            </div>
          )}

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
