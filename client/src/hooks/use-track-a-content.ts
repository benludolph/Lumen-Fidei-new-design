import { useQuery } from "@tanstack/react-query";
import type { TrackAContent } from "@shared/schema";

export function useTrackADailyContent(day: number) {
  return useQuery<TrackAContent>({
    queryKey: ['/api/track-a-content', day],
    queryFn: async () => {
      const res = await fetch(`/api/track-a-content/${day}`, { credentials: "include" });
      if (res.status === 403) throw new Error("This day is locked");
      if (res.status === 404) throw new Error("Content not found");
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
    retry: false,
    enabled: day >= 0,
  });
}

export function useAllTrackAContent() {
  return useQuery<TrackAContent[]>({
    queryKey: ['/api/track-a-content'],
    queryFn: async () => {
      const res = await fetch('/api/track-a-content', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Track A content");
      return res.json();
    },
  });
}
