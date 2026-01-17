import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SendMessageRequest } from "@shared/routes";

export function useMessages(otherUserId: number) {
  return useQuery({
    queryKey: [api.chat.list.path, otherUserId],
    queryFn: async () => {
      const url = buildUrl(api.chat.list.path, { otherUserId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.chat.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const res = await fetch(api.chat.send.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.chat.send.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.chat.list.path, data.receiverId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [api.chat.list.path, data.senderId] 
      });
    },
  });
}
