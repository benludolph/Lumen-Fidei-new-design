import { useQuery } from "@tanstack/react-query";
import { buildUrl } from "@shared/routes";
import type { trackRequirements, practiceResources } from "@shared/schema";

export type TrackRequirement = typeof trackRequirements.$inferSelect;
export type PracticeResource = typeof practiceResources.$inferSelect;

export function useTrackRequirements(track: "A" | "B" | "C" | null, week: number) {
  return useQuery<TrackRequirement>({
    queryKey: ['/api/track-requirements', track, week],
    queryFn: async () => {
      if (!track) throw new Error("No track specified");
      const url = buildUrl('/api/track-requirements/:track/:week', { track, week });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch requirements");
      return res.json();
    },
    enabled: !!track && week > 0,
  });
}

export function usePracticeResources() {
  return useQuery<PracticeResource[]>({
    queryKey: ['/api/practice-resources'],
    queryFn: async () => {
      const res = await fetch('/api/practice-resources', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch practice resources");
      return res.json();
    },
  });
}

export function usePracticeResource(name: string | null) {
  return useQuery<PracticeResource>({
    queryKey: ['/api/practice-resources', name],
    queryFn: async () => {
      if (!name) throw new Error("No name specified");
      const url = `/api/practice-resources/${encodeURIComponent(name)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch practice resource");
      return res.json();
    },
    enabled: !!name,
  });
}
