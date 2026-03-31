import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Lock, Play, ChevronDown, ChevronUp, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function TestimonyCard({ testimony }: { testimony: TestimonyWithStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  const openVideo = (url: string, title: string) => {
    setModalUrl(url);
    setModalTitle(title);
  };
  const closeModal = () => setModalUrl(null);

  const progressPct = testimony.totalParts > 0
    ? Math.round((testimony.unlockedCount / testimony.totalParts) * 100)
    : 0;

  const firstUnlockedPart = testimony.parts.find(p => p.unlocked);

  return (
    <>
      <VideoModal
        open={!!modalUrl}
        onClose={closeModal}
        videoUrl={modalUrl ?? ""}
        title={modalTitle}
      />

      <div
        className="rounded-xl border border-border bg-card overflow-hidden"
        data-testid={`card-testimony-${testimony.id}`}
      >
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {testimony.thumbnailUrl ? (
              <img
                src={testimony.thumbnailUrl}
                alt={testimony.personName}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-border"
                data-testid={`img-testimony-thumbnail-${testimony.id}`}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border-2 border-border">
                <span className="text-xl font-semibold text-muted-foreground">
                  {testimony.personName.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base leading-snug" data-testid={`text-testimony-name-${testimony.id}`}>
                {testimony.personName}
              </h3>
              {testimony.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {testimony.description}
                </p>
              )}

              {/* Progress */}
              {testimony.totalParts > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {testimony.unlockedCount} of {testimony.totalParts} part{testimony.totalParts !== 1 ? "s" : ""} unlocked
                    </span>
                    <span className="text-xs text-muted-foreground">{progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick play button for first unlocked part */}
              {firstUnlockedPart && (
                <button
                  data-testid={`button-quick-play-${testimony.id}`}
                  onClick={() => openVideo(firstUnlockedPart.videoUrl, `${testimony.personName} — Part ${firstUnlockedPart.partNumber}${firstUnlockedPart.title ? ` — ${firstUnlockedPart.title}` : ""}`)}
                  className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-primary" /> Watch now
                </button>
              )}
            </div>
          </div>

          {/* Actions row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Watch Full Testimony CTA */}
            {testimony.fullyUnlocked && testimony.fullVideoUrl && (
              <Button
                size="sm"
                data-testid={`button-watch-full-testimony-${testimony.id}`}
                onClick={() => openVideo(testimony.fullVideoUrl, `${testimony.personName} — Full Testimony`)}
                className="flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Watch Full Testimony
              </Button>
            )}

            {/* Expand/collapse parts */}
            {testimony.totalParts > 0 && (
              <button
                data-testid={`button-expand-testimony-${testimony.id}`}
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expanded ? "Hide" : "View"} parts
              </button>
            )}
          </div>
        </div>

        {/* Parts list */}
        {expanded && testimony.parts.length > 0 && (
          <div className="border-t border-border">
            {testimony.parts.map(part => (
              <button
                key={part.id}
                data-testid={`button-part-${part.id}`}
                disabled={!part.unlocked}
                onClick={() => part.unlocked && openVideo(part.videoUrl, `${testimony.personName} — Part ${part.partNumber}${part.title ? ` — ${part.title}` : ""}`)}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors border-b border-border last:border-b-0",
                  part.unlocked
                    ? "hover:bg-secondary/50 cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  part.unlocked ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {part.unlocked
                    ? <Play className="w-4 h-4 fill-primary" />
                    : <Lock className="w-3.5 h-3.5" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium leading-snug",
                    part.unlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    Part {part.partNumber}{part.title ? ` — ${part.title}` : ""}
                  </p>
                  {!part.unlocked && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {unlockHintText(part.unlockKey)}
                    </p>
                  )}
                </div>
                {part.unlocked && (
                  <Play className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* No parts unlocked yet — show first lock hint */}
        {testimony.unlockedCount === 0 && testimony.totalParts > 0 && !expanded && (
          <div className="border-t border-border px-5 py-3.5 bg-secondary/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>{unlockHintText(testimony.parts[0]?.unlockKey ?? "")}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
        <Play className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">No testimonies have been added yet.</p>
    </div>
  );
}

export default function TestimoniesPage() {
  const { data: testimonies = [], isLoading } = useQuery<TestimonyWithStatus[]>({
    queryKey: ["/api/testimonies"],
  });

  return (
    <DashboardLayout>
      <PageContainer variant="wide" className="py-8">
        <div className="mb-8">
          <h1
            className="text-foreground"
            style={{
              fontFamily: "'IvyOra Display', serif",
              fontWeight: 500,
              fontSize: "1.625rem",
            }}
          >
            Testimonies
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Hear how others have experienced healing and transformation through this journey.
            Complete lessons to unlock more stories.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : testimonies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5">
            {testimonies.map(testimony => (
              <TestimonyCard key={testimony.id} testimony={testimony} />
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
