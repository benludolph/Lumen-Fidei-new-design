import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { LessonFlow } from "@/components/lesson/LessonFlow";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrackAContent } from "@shared/schema";

interface PrayerWrapPayload {
  opening: { text: string; audioUrl: string | null } | null;
  closing: { text: string; audioUrl: string | null } | null;
}

export default function PreviewLesson() {
  const { user } = useAuth();
  const params = useParams<{ day: string }>();
  const [, setLocation] = useLocation();
  const day = Number(params.day);

  const { data: content, isLoading, isError } = useQuery<TrackAContent>({
    queryKey: ["/api/track-a-content", day],
    queryFn: async () => {
      const res = await fetch(`/api/track-a-content/${day}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load lesson");
      return res.json();
    },
    enabled: !!user && !isNaN(day),
  });

  const { data: prayerWrapData } = useQuery<PrayerWrapPayload>({
    queryKey: ["/api/track-a/prayers", day],
    queryFn: async () => {
      const res = await fetch(`/api/track-a/prayers/${day}`, { credentials: "include" });
      if (!res.ok) return { opening: null, closing: null };
      return res.json();
    },
    enabled: !!user && !isNaN(day),
    staleTime: 60_000,
  });

  if (!user || user.role !== "admin") return null;

  const handleExit = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/admin");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading Day {day} preview…</p>
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertCircle className="w-12 h-12 text-white/40" />
        <p className="text-white/80 font-medium">Could not load Day {day}</p>
        <p className="text-white/40 text-sm">The day may not have content yet.</p>
        <Button variant="outline" className="mt-2 text-white border-white/20 hover:bg-white/10" onClick={handleExit}>
          Back to Admin
        </Button>
      </div>
    );
  }

  return (
    <LessonFlow
      key={`preview-${day}`}
      content={content}
      dayNumber={day}
      previewMode
      onExit={handleExit}
      onComplete={handleExit}
      openingPrayer={prayerWrapData?.opening ?? null}
      closingPrayer={prayerWrapData?.closing ?? null}
      canSkipPrayer={true}
    />
  );
}
