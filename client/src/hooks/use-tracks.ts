import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Track } from "@/lib/track-context";

export function useTracks() {
  return useQuery<Track[]>({ queryKey: ["/api/tracks"] });
}

export function useCreateTrack() {
  return useMutation({
    mutationFn: async (name: string): Promise<Track> => {
      const response = await apiRequest("POST", "/api/tracks", { name });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tracks"] }),
  });
}

export function useUpdateTrack() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; status?: Track["status"] }): Promise<Track> => {
      const response = await apiRequest("PATCH", `/api/tracks/${encodeURIComponent(id)}`, data);
      return response.json();
    },
    onSuccess: (track) => queryClient.setQueryData<Track[]>(["/api/tracks"], (old) =>
      old?.map(item => item.id === track.id ? track : item)),
  });
}
