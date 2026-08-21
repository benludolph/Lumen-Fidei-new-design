import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { programsApi } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Layers3, Plus, Upload } from "lucide-react";
import { usePrograms, json } from "./api";
import { ProgramFrame, Notice } from "./ProgramFrame";
import { RecordData } from "./types";

export function Catalog() {
  const { data, isLoading, isError, refetch } = usePrograms();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "" });
  const [notice, setNotice] = useState("");
  const create = useMutation({
    mutationFn: () => apiRequest("POST", programsApi.createProgram.path, form).then(json),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [programsApi.listPrograms.path] });
      setOpen(false);
      setForm({ key: "", name: "", description: "" });
      setNotice("Program created.");
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const importTrackA = useMutation({
    mutationFn: () => apiRequest("POST", programsApi.importTrackA.path).then(json),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [programsApi.listPrograms.path] });
      setNotice("Current Track A was copied into a draft. Participants were not moved.");
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const programs = (data ?? []) as RecordData[];

  return (
    <ProgramFrame>
      <header className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs uppercase tracking-[.25em] text-[hsl(24_67%_48%)]">The quiet center</p>
        <h1 className="font-serif text-4xl leading-tight sm:text-6xl">Programs, held with care.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Shape the learning journey, review each release, and keep every participant anchored to the version they began.</p>
      </header>
      <Notice text={notice} error={Boolean(notice && !notice.endsWith("."))} />
      <div className="mb-6 flex flex-wrap gap-3">
        <Button data-testid="create-program" onClick={() => setOpen(true)}><Plus size={16} className="mr-2" /> New program</Button>
        <Button data-testid="import-track-a" variant="outline" disabled={importTrackA.isPending} onClick={() => importTrackA.mutate()}>
          <Upload size={16} className="mr-2" /> {importTrackA.isPending ? "Copying…" : "Import current Track A"}
        </Button>
      </div>
      {isLoading && <div className="grid gap-4 md:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-[hsl(40_20%_91%)]" /><div className="h-36 animate-pulse rounded-2xl bg-[hsl(40_20%_91%)]" /></div>}
      {isError && <Card><CardContent className="p-8 text-center"><p>Programs could not be loaded.</p><Button className="mt-4" onClick={() => refetch()}>Try again</Button></CardContent></Card>}
      {!isLoading && !isError && programs.length === 0 && <Card><CardContent className="p-12 text-center"><Layers3 className="mx-auto mb-4 text-[hsl(24_67%_48%)]" /><p className="font-serif text-2xl">Begin with a program</p><p className="mt-2 text-sm text-muted-foreground">Import Track A or create a new formation path.</p></CardContent></Card>}
      <div data-testid="program-catalog" className="grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <Link key={program.id} href={program.key === "track-a" ? "/admin/program/track-a" : `/admin/program/${program.id}`} className="group">
            <Card className="h-full border-[hsl(40_22%_87%)] bg-[hsl(42_38%_99%)] transition-transform hover:-translate-y-1">
              <CardHeader><div className="flex items-start justify-between"><div><CardTitle className="font-serif text-2xl">{program.name}</CardTitle><CardDescription className="mt-1 font-mono text-xs">{program.key}</CardDescription></div><Badge>{program.isActive ? "Active" : "Paused"}</Badge></div></CardHeader>
              <CardContent><p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{program.description || "No description yet."}</p><p className="mt-5 text-xs text-[hsl(24_67%_48%)]">Open program <FilePlus2 className="inline" size={14} /></p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {open && <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(182_24%_18%/.45)] p-4"><Card className="w-full max-w-lg"><CardHeader><CardTitle className="font-serif text-2xl">Create a program</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!create.isPending) create.mutate(); }}><Input placeholder="Stable key, e.g. track-b" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} required /><Input placeholder="Program name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button data-testid="save-create-program" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create program"}</Button></div></form></CardContent></Card></div>}
    </ProgramFrame>
  );
}