import { useQuery } from "@tanstack/react-query";
import { trackFetch as fetch } from "@/lib/track-context";
import { api } from "@shared/routes";

export function useCohortStartDate() {
  return useQuery<{ startDate: string | null; currentDay: number }>({
    queryKey: [api.cohort.getStartDate.path],
    queryFn: async () => {
      const res = await fetch(api.cohort.getStartDate.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cohort start date");
      return res.json();
    },
  });
}
