import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUserPrayerCompletions(userId?: number) {
  return useQuery({
    queryKey: [api.prayerCompletions.list.path, userId],
    queryFn: async () => {
      const url = userId 
        ? `${api.prayerCompletions.list.path}?userId=${userId}`
        : api.prayerCompletions.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch prayer completions");
      return api.prayerCompletions.list.responses[200].parse(await res.json());
    },
  });
}

export function usePrayerCompletion(day: number, period: "morning" | "evening") {
  return useQuery({
    queryKey: [api.prayerCompletions.get.path, day, period],
    queryFn: async () => {
      const url = api.prayerCompletions.get.path
        .replace(":day", String(day))
        .replace(":period", period);
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch prayer completion");
      return await res.json();
    },
  });
}

export function useMarkPrayerComplete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { dayNumber: number; period: "morning" | "evening" }) => {
      const res = await fetch(api.prayerCompletions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to mark prayer complete");
      }
      return api.prayerCompletions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.prayerCompletions.list.path] });
      queryClient.invalidateQueries({ 
        queryKey: [api.prayerCompletions.get.path, variables.dayNumber, variables.period] 
      });
    },
  });
}

export function useUnmarkPrayerComplete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { dayNumber: number; period: "morning" | "evening" }) => {
      const url = api.prayerCompletions.delete.path
        .replace(":day", String(data.dayNumber))
        .replace(":period", data.period);
        
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to unmark prayer");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.prayerCompletions.list.path] });
      queryClient.invalidateQueries({ 
        queryKey: [api.prayerCompletions.get.path, variables.dayNumber, variables.period] 
      });
    },
  });
}
