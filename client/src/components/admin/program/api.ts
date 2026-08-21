import { useQuery } from "@tanstack/react-query";
import { api, programsApi } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { apiPath } from "./types";

export const json = (response: Response) => response.json();

export function usePrograms() {
  return useQuery({
    queryKey: [programsApi.listPrograms.path],
    queryFn: () => apiRequest("GET", programsApi.listPrograms.path).then(json),
  });
}

export function useProgram(programId: number) {
  return useQuery({
    queryKey: [programsApi.getProgram.path, programId],
    enabled: programId > 0,
    queryFn: () =>
      apiRequest("GET", apiPath(programsApi.getProgram.path, { id: programId })).then(json),
  });
}

export function useReleases(programId: number) {
  return useQuery({
    queryKey: [programsApi.listReleases.path, programId],
    enabled: programId > 0,
    queryFn: () =>
      apiRequest("GET", apiPath(programsApi.listReleases.path, { programId })).then(json),
  });
}

export function useRelease(programId: number, releaseId: number) {
  return useQuery({
    queryKey: [programsApi.getRelease.path, programId, releaseId],
    queryFn: () =>
      apiRequest("GET", apiPath(programsApi.getRelease.path, { programId, releaseId })).then(json),
  });
}

export function useEnrollments(programId: number) {
  return useQuery({
    queryKey: [programsApi.listEnrollments.path, programId],
    queryFn: () =>
      apiRequest("GET", apiPath(programsApi.listEnrollments.path, { programId })).then(json),
  });
}

export function useProgramProgress(programId: number) {
  return useQuery({
    queryKey: [programsApi.getProgramProgress.path, programId],
    enabled: programId > 0,
    queryFn: () =>
      apiRequest("GET", apiPath(programsApi.getProgramProgress.path, { programId })).then(json),
  });
}

export function useParticipants() {
  return useQuery({
    queryKey: [api.users.list.path, "participant"],
    queryFn: () => apiRequest("GET", `${api.users.list.path}?role=participant`).then(json),
  });
}

export function useCohorts() {
  return useQuery({
    queryKey: [api.admin.listCohorts.path],
    queryFn: () => apiRequest("GET", api.admin.listCohorts.path).then(json),
  });
}