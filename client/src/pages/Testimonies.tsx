import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Lock, Play, X } from "lucide-react";
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
  if (unlockKey === "prelim") return "Complete Preliminary Modules to unlock";
  const weekFirstMatch = unlockKey.match(/^week-(\d+)-first$/);
  if (weekFirstMatch) return `Complete your first Week ${weekFirstMatch[1]} lesson to unlock`;
  const weekLastMatch = unlockKey.match(/^week-(\d+)-last$/);
  if (weekLastMatch) return `Complete Week ${weekLastMatch[1]} to unlock`;
  return "Complete more lessons to unlock";
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
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black border-0" data-testid="dialog-video-modal">
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
  const isFullyLocked = testimony.unlockedCount === 0;
  const firstUnlockedPart = testimony.parts.find(p => p.unlocked);
  const lockHint = testimony.parts[0] ? unlockHintText(testimony.parts[0].unlockKey) : "Complete more lessons to unlock";

  const handleClick = () => {
    if (isFullyLocked) return;
    if (testimony.fullyUnlocked && testimony.fullVideoUrl) {
      onPlay(testimony.fullVideoUrl, `${testimony.personName} — Full Testimony`);
    } else if (firstUnlockedPart) {
      onPlay(
        firstUnlockedPart.videoUrl,
        `${testimony.personName}${firstUnlockedPart.title ? ` — ${firstUnlockedPart.title}` : ` — Part ${firstUnlockedPart.partNumber}`}`
      );
    }
  };

  return (
    <div
      data-testid={`card-testimony-${testimony.id}`}
      onClick={handleClick}
      style={{
        position: "relative",
        flex: "1 0 0",
        minWidth: "200px",
        height: "298px",
        background: "var(--surface-raised)",
        border: "1.25px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: isFullyLocked ? "default" : "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => {
        if (!isFullyLocked) {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.22)";
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      {/* Thumbnail */}
      {testimony.thumbnailUrl ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "0 0 56px 0",
            mixBlendMode: "luminosity",
            opacity: isFullyLocked ? 0.35 : 0.6,
            transition: "opacity 0.2s",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "#0f1011" }} />
          <img
            alt={testimony.personName}
            src={testimony.thumbnailUrl}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: "0 0 56px 0",
            background: "var(--surface-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "40px", color: "var(--white-20)", fontFamily: "'IvyOra Display', serif", fontWeight: 500 }}>
            {testimony.personName.charAt(0)}
          </span>
        </div>
      )}

      {/* Lock overlay */}
      {isFullyLocked && (
        <div
          style={{
            position: "absolute",
            inset: "0 0 56px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          </div>
        </div>
      )}

      {/* Play icon overlay for unlocked cards (hover) */}
      {!isFullyLocked && (
        <div
          className="play-overlay"
          style={{
            position: "absolute",
            inset: "0 0 56px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
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
          height: "56px",
          background: "var(--surface-raised)",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
          padding: "10px 10px 8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "3px",
        }}
      >
        {isFullyLocked ? (
          <p
            className="type-caption-sm"
            style={{
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lockHint}
          </p>
        ) : testimony.description ? (
          <p
            className="type-caption-sm"
            style={{
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {testimony.description}
          </p>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
          <p
            className="type-body-sm"
            data-testid={`text-testimony-name-${testimony.id}`}
            style={{
              color: isFullyLocked ? "rgba(255,255,255,0.4)" : "white",
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              fontWeight: 500,
            }}
          >
            {testimony.personName}
          </p>
          {!isFullyLocked && (
            <Play
              size={12}
              style={{ color: "var(--brand)", fill: "var(--brand)", flexShrink: 0 }}
            />
          )}
          {isFullyLocked && (
            <Lock
              size={11}
              style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%", maxWidth: "608px", margin: "0 auto" }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(180,188,208,0.1)", borderRadius: "9999px" }} />
      <span
        className="type-caption-sm"
        style={{
          color: "var(--white-40, rgba(255,255,255,0.4))",
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
        flex: "1 0 0",
        minWidth: "200px",
        height: "298px",
        background: "var(--surface-raised)",
        border: "1.25px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
        overflow: "hidden",
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
        variant="full"
        className="pt-[80px] pb-16 min-h-[calc(100vh-72px)]"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "48px" }}
      >
        {/* Page title */}
        <h1
          className="type-display-xl text-white text-center"
          data-testid="text-testimonies-title"
        >
          Testimonies
        </h1>

        {/* Divider */}
        <Divider />

        {/* Cards */}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              gap: "20px",
              width: "100%",
              maxWidth: "960px",
            }}
          >
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : testimonies.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "60px" }}>
            <p className="type-body-md" style={{ color: "var(--white-40)" }}>
              No testimonies have been added yet.
            </p>
          </div>
        ) : (
          <div
            data-testid="testimonies-grid"
            style={{
              display: "flex",
              gap: "20px",
              width: "100%",
              maxWidth: "960px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
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
      </PageContainer>

      <style>{`
        [data-testid^="card-testimony-"]:hover .play-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}
