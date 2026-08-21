import { useLocation } from "wouter";
import { Catalog } from "./Catalog";
import { ProgramDetail } from "./ProgramDetail";
import { ReleaseEditor } from "./ReleaseEditor";
import { ProgramWorkspaceProps } from "./types";

export default function ProgramWorkspace({ legacyTrackAEditor }: ProgramWorkspaceProps) {
  const [location] = useLocation();
  const release = location.match(/\/admin\/program\/(\d+)\/release\/(\d+)/);
  const program = location.match(/\/admin\/program\/(\d+)/);
  if (release) return <ReleaseEditor programId={Number(release[1])} releaseId={Number(release[2])} />;
  if (location.startsWith("/admin/program/track-a")) {
    return <ProgramDetail programId={-1} trackA legacyEditor={legacyTrackAEditor} />;
  }
  if (program) return <ProgramDetail programId={Number(program[1])} />;
  return <Catalog />;
}

export type { ProgramWorkspaceProps };