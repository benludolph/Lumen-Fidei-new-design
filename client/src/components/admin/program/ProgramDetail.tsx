import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { programsApi } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FilePlus2, RotateCcw, Users } from "lucide-react";
import { json, useCohorts, useEnrollments, useParticipants, useProgram, useProgramProgress, usePrograms, useReleases } from "./api";
import { apiPath, freshDocument, RecordData } from "./types";
import { Notice, ProgramFrame } from "./ProgramFrame";

export function ProgramDetail({ programId, trackA = false, legacyEditor }: { programId: number; trackA?: boolean; legacyEditor?: ReactNode }) {
  const { data: programs, isLoading: loadingPrograms } = usePrograms();
  const actualId = trackA ? ((programs || []) as RecordData[]).find((item) => item.key === "track-a")?.id || 0 : programId;
  const { data: program, isLoading: loadingProgram, isError, refetch } = useProgram(actualId);
  const { data: releases, refetch: refetchReleases } = useReleases(actualId);
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });
  const [, setLocation] = useLocation();
  const update = useMutation({
    mutationFn: () => apiRequest("PATCH", apiPath(programsApi.updateProgram.path, { id: actualId }), form).then(json),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [programsApi.getProgram.path, actualId] }); setEditing(false); setNotice("Program details saved."); },
    onError: (error: Error) => setNotice(error.message),
  });
  const create = useMutation({
    mutationFn: () => apiRequest("POST", apiPath(programsApi.createDraftRelease.path, { programId: actualId }), { label: "Working draft", curriculum: freshDocument(program?.key || "program") }).then(json),
    onSuccess: (release) => { refetchReleases(); setLocation(`/admin/program/${actualId}/release/${release.id}`); },
    onError: (error: Error) => setNotice(error.message),
  });
  const rollback = useMutation({
    mutationFn: (releaseId: number) => apiRequest("POST", apiPath(programsApi.rollbackRelease.path, { programId: actualId, releaseId })).then(json),
    onSuccess: () => { refetchReleases(); setNotice("A new draft was created from the published release."); },
    onError: (error: Error) => setNotice(error.message),
  });
  const importTrackA = useMutation({
    mutationFn: () => apiRequest("POST", programsApi.importTrackA.path).then(json),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [programsApi.listPrograms.path] }); refetchReleases(); setNotice("Current Track A was copied into a draft. Participants were not moved."); },
    onError: (error: Error) => setNotice(error.message),
  });
  if (loadingPrograms || loadingProgram) return <ProgramFrame><div className="h-64 animate-pulse rounded-2xl bg-muted" /></ProgramFrame>;
  if (trackA && !actualId) {
    return <ProgramFrame eyebrow="Track A">
      <div className="mb-6 rounded-xl border bg-background p-5">
        <h1 className="font-serif text-3xl">Track A content</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">The proven editor remains the content surface.</p>
        {legacyEditor}
      </div>
      <Card>
        <CardHeader><CardTitle>Prepare reusable releases</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Copy the current Track A content into a draft release. This does not move participants or change what they see.</p>
          <Button disabled={importTrackA.isPending} onClick={() => importTrackA.mutate()}>
            {importTrackA.isPending ? "Copying…" : "Import current Track A"}
          </Button>
          <Notice text={notice} error={Boolean(notice && !notice.endsWith("."))} />
        </CardContent>
      </Card>
    </ProgramFrame>;
  }
  if (isError || !program) return <ProgramFrame><Card><CardContent className="p-8 text-center"><p>Program could not be loaded.</p><Button className="mt-4" onClick={() => refetch()}>Try again</Button></CardContent></Card></ProgramFrame>;
  return <ProgramFrame eyebrow={trackA ? "Track A / releases" : "Program detail"}>
    <Link href="/admin/program" className="text-sm text-muted-foreground"><ArrowLeft size={14} className="mr-2 inline" /> Catalog</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-[hsl(24_67%_48%)]">{program.key}</p><h1 className="font-serif text-4xl">{program.name}</h1><p className="mt-2 max-w-xl text-muted-foreground">{program.description}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { setForm({ name: program.name, description: program.description || "", isActive: program.isActive }); setEditing(true); }}>Edit details</Button>{trackA ? <Button variant="outline" disabled={importTrackA.isPending} onClick={() => window.confirm("Replace the current Track A draft with a fresh copy of live content? Published releases are not changed.") && importTrackA.mutate()}>Import current Track A</Button> : <Button disabled={create.isPending} onClick={() => create.mutate()}><FilePlus2 size={16} className="mr-2" /> New draft</Button>}</div></div>
    <Notice text={notice} />
    {trackA && <section className="mt-8 rounded-xl border bg-background p-5">
      <h2 className="font-serif text-2xl">Content editor</h2>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Edits stay in the live Track A workspace until you import them into a draft release.</p>
      {legacyEditor}
    </section>}
    {editing && <Card className="mt-6"><CardHeader><CardTitle>Edit program details</CardTitle></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!update.isPending) update.mutate(); }}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active program</label><div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button disabled={update.isPending}>Save details</Button></div></form></CardContent></Card>}
    <section className="mt-10"><h2 className="mb-4 font-serif text-2xl">Release history</h2><div className="space-y-3">{((releases || []) as RecordData[]).map((release) => <Card key={release.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="flex items-center gap-3"><span>Release {release.releaseNumber}</span><Badge>{release.status}</Badge></div><p className="text-sm text-muted-foreground">{release.label || "Untitled"} · {release.curriculum?.modules?.length || 0} modules</p></div>{release.status === "draft" ? <Link href={`/admin/program/${actualId}/release/${release.id}`}><Button variant="outline">Edit draft</Button></Link> : release.status === "published" && <Button variant="outline" disabled={rollback.isPending} onClick={() => window.confirm("Create a new draft from this release?") && rollback.mutate(release.id)}><RotateCcw size={14} className="mr-2" /> Roll back</Button>}</CardContent></Card>)}</div></section>
    <Assignments programId={actualId} releases={((releases || []) as RecordData[]).filter((release) => release.status === "published")} />
  </ProgramFrame>;
}

function Assignments({ programId, releases }: { programId: number; releases: RecordData[] }) {
  const { data: enrollments, refetch } = useEnrollments(programId);
  const { data: progressRows, refetch: refetchProgress } = useProgramProgress(programId);
  const { data: users } = useParticipants();
  const { data: cohorts } = useCohorts();
  const [userId, setUserId] = useState(""); const [releaseId, setReleaseId] = useState(""); const [cohortId, setCohortId] = useState(""); const [error, setError] = useState("");
  const assign = useMutation({ mutationFn: () => apiRequest("POST", apiPath(programsApi.assignEnrollment.path, { programId }), { userId: Number(userId), releaseId: Number(releaseId), ...(cohortId ? { cohortId: Number(cohortId) } : {}) }).then(json), onSuccess: () => { refetch(); refetchProgress(); setUserId(""); setError(""); }, onError: (e: Error) => setError(e.message) });
  const participantMap = new Map(((users || []) as RecordData[]).filter((user) => user.role === "participant").map((user) => [user.id, user]));
  const progressByEnrollment = new Map(((progressRows || []) as RecordData[]).map((row) => [row.enrollmentId, row]));
  return <section className="mt-12"><div className="mb-4 flex items-center gap-2"><Users size={18} /><h2 className="font-serif text-2xl">Assignments & progress</h2></div><Notice text={error} error /><Card><CardContent className="grid gap-3 p-5 sm:grid-cols-4"><select className="rounded-md border bg-background px-3 text-sm" value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">Participant</option>{Array.from(participantMap.values()).map((user) => <option key={user.id} value={user.id}>{user.name || user.email}</option>)}</select><select className="rounded-md border bg-background px-3 text-sm" value={releaseId} onChange={(e) => setReleaseId(e.target.value)}><option value="">Published release</option>{releases.map((release) => <option key={release.id} value={release.id}>Release {release.releaseNumber}</option>)}</select><select className="rounded-md border bg-background px-3 text-sm" value={cohortId} onChange={(e) => setCohortId(e.target.value)}><option value="">Cohort</option>{((cohorts || []) as RecordData[]).map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name || `Cohort ${cohort.id}`}</option>)}</select><Button data-testid="assign-participant" disabled={!userId || !releaseId || !cohortId || assign.isPending} onClick={() => assign.mutate()}>Assign</Button></CardContent></Card><div className="mt-3 space-y-2">{((enrollments || []) as RecordData[]).map((enrollment) => { const progress = progressByEnrollment.get(enrollment.id); return <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-4 py-3 text-sm"><span>{participantMap.get(enrollment.userId)?.name || participantMap.get(enrollment.userId)?.email || "Participant"}</span><span className="text-muted-foreground">Release {((releases.find((release) => release.id === enrollment.releaseId))?.releaseNumber) || enrollment.releaseId} · {progress ? `${progress.completedLessons}/${progress.totalLessons} lessons (${progress.percent}%)` : enrollment.status}</span></div>; })}</div></section>;
}