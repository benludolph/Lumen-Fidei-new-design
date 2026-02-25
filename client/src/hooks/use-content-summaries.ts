import { useQuery } from "@tanstack/react-query";

export interface ContentSummary {
  dayNumber: number;
  weekNumber: number;
  weekTitle: string;
  title: string;
  isReflectionDay: boolean;
  isMentorDay: boolean;
}

export function useContentSummaries() {
  return useQuery<ContentSummary[]>({
    queryKey: ["/api/content-summaries"],
  });
}
