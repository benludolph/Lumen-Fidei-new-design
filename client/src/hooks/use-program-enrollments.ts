import { useQuery } from "@tanstack/react-query";
import { programsApi } from "@shared/routes";
import type { z } from "zod";

export type MyProgramEnrollment =
  z.infer<typeof programsApi.listMyEnrollments.responses[200]>[number];

export function useMyProgramEnrollments() {
  return useQuery<MyProgramEnrollment[]>({
    queryKey: [programsApi.listMyEnrollments.path],
    queryFn: async () => {
      const response = await fetch(programsApi.listMyEnrollments.path, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Unable to load your programs.");
      }
      return programsApi.listMyEnrollments.responses[200].parse(
        await response.json(),
      );
    },
  });
}