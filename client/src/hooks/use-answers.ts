import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateAnswerRequest } from "@shared/routes";

export function useUserAnswers(userId?: number) {
  return useQuery({
    queryKey: [api.answers.list.path, userId],
    queryFn: async () => {
      const url = userId 
        ? `${api.answers.list.path}?userId=${userId}`
        : api.answers.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch answers");
      return api.answers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAnswerRequest) => {
      const res = await fetch(api.answers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to save answer");
      return api.answers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.answers.list.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
    },
  });
}
