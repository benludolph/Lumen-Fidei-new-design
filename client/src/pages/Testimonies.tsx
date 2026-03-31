import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Lock, Play, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

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

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const getEmbedUrl = (raw: string) => {
    try {
      const u = new URL(raw);
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        let id = u.searchParams.get("v");
        if (!id) id = u.pathname.split("/").filter(Boolean).pop() ?? "";
        return `https://www.youtube.com/embed/${id}`;
      }
      if (u.hostname.includes("vimeo.com")) {
        const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
        return `https://player.vimeo.com/video/${id}`;
      }
    } catch (_) {}
    return raw;
  };

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 w-full h-full rounded-lg"
        src={getEmbedUrl(url)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function TestimonyCard({ testimony }: { testimony: TestimonyWithStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [activePart, setActivePart] = useState<TestimonyPartWithStatus | null>(null);

  const firstUnlocked = testimony.parts.find(p => p.unlocked);
  const defaultPart = activePart ?? firstUnlocked ?? null;

  const progressPct = testimony.totalParts > 0
    ? Math.round((testimony.unlockedCount / testimony.totalParts) * 100)
    : 0;

  return (
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
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border-2 border-border">
              <span className="text-xl font-semibold text-muted-foreground">
                {testimony.personName.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base leading-snug">
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
          </div>
        </div>

        {/* Expand toggle for parts */}
        {testimony.totalParts > 0 && (
          <button
            data-testid={`button-expand-testimony-${testimony.id}`}
            onClick={() => setExpanded(e => !e)}
            className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Hide" : "Show"} parts
          </button>
        )}
      </div>

      {/* Parts list */}
      {expanded && testimony.parts.length > 0 && (
        <div className="border-t border-border">
          {testimony.parts.map(part => (
            <button
              key={part.id}
              data-testid={`button-part-${part.id}`}
              disabled={!part.unlocked}
              onClick={() => part.unlocked && setActivePart(part)}
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
              {activePart?.id === part.id && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Playing
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Video player */}
      {defaultPart && (
        <div className="border-t border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Now Playing: Part {defaultPart.partNumber}{defaultPart.title ? ` — ${defaultPart.title}` : ""}
          </p>
          <VideoEmbed url={defaultPart.videoUrl} title={`${testimony.personName} Part ${defaultPart.partNumber}`} />
        </div>
      )}

      {/* If no parts unlocked yet, show locked state */}
      {testimony.unlockedCount === 0 && testimony.totalParts > 0 && (
        <div className="border-t border-border px-5 py-4 bg-secondary/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>{unlockHintText(testimony.parts[0]?.unlockKey ?? "")}</span>
          </div>
        </div>
      )}
    </div>
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
          <div className="grid gap-5 sm:grid-cols-1">
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
