import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useDailyContent(day: number) {
  return useQuery({
    queryKey: [api.content.get.path, day],
    queryFn: async () => {
      const url = buildUrl(api.content.get.path, { day });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 403) throw new Error("This day is locked");
      if (res.status === 404) throw new Error("Content not found");
      if (!res.ok) throw new Error("Failed to fetch content");
      
      return api.content.get.responses[200].parse(await res.json());
    },
    retry: false,
    enabled: day > 0,
  });
}

export function useAllContent() {
  return useQuery({
    queryKey: [api.content.list.path],
    queryFn: async () => {
      const res = await fetch(api.content.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content list");
      return api.content.list.responses[200].parse(await res.json());
    }
  });
}
