import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";

export const FAITH_OPTIONS = ["Yes", "No, I'm a Christian of another tradition", "No, I'm exploring faith"] as const;
export type FaithTradition = typeof FAITH_OPTIONS[number];
export type WorkbookProfile = UserProfile & {
  faithTradition: FaithTradition | null;
  workbookIntroAcknowledged: boolean;
};
export function isFaithAnswered(value: unknown): value is FaithTradition {
  return FAITH_OPTIONS.some((option) => option === value);
}
export function useWorkbookProfile() {
  return useQuery<WorkbookProfile | null>({ queryKey: ["/api/user-profile"] });
}
export function useUpdateWorkbookProfile() {
  return useMutation({
    mutationFn: async (partial: { faithTradition?: FaithTradition; workbookIntroAcknowledged?: boolean }) => {
      const response = await apiRequest("PUT", "/api/user-profile", partial);
      return response.json() as Promise<WorkbookProfile>;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["/api/user-profile"], profile);
    },
  });
}
