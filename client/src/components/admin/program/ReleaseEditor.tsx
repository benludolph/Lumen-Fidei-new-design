import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { programsApi } from "@shared/routes";
import { validateCurriculumDocument } from "@shared/curriculum";
import { getAllBlockEntries, getBlockDefaultContent, getBlockLabel, validateBlockContent } from "./blockRegistry";
import { json, useRelease } from "./api";
import { apiPath, cloneDocument, newStableKey, RecordData, templateBag } from "./types";
import { ProgramFrame, Notice } from "./ProgramFrame";
import { LessonPreview } from "./Preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const next = [...items]; const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function ReleaseEditor({ programId, releaseId }: { programId: number; releaseId: number }) {
  const { data: release, isLoading, isError, refetch } = useRelease(programId, releaseId);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<RecordData | null>(null);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [preview, setPreview] = useState<RecordData | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const document = draft || release?.curriculum || { schemaVersion: 1, programKey: "program", modules: [], activities: [] };
  const readonly = release?.status !== "draft";
  const selectedLesson = document.modules.flatMap((module: RecordData) => module.lessons || []).find((lesson: RecordData) => lesson.key === selected);
  const update = (fn: (value: RecordData) => RecordData) => setDraft(fn(cloneDocument(document)));
  const localValidate = () => {
    const result = validateCurriculumDocument(document);
    const details = result.ok ? [] : result.errors.map((issue) => `${issue.path.join(".") || "document"}: ${issue.message}`);
    setIssues(details);
    return details.length === 0;
  };
  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", apiPath(programsApi.updateDraftRelease.path, { programId, releaseId }), { curriculum: document }).then(json),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [programsApi.getRelease.path, programId, releaseId] }); setNotice("Draft saved."); },
    onError: (error: Error) => setNotice(error.message),
  });
  const validate = useMutation({
    mutationFn: () => apiRequest("POST", apiPath(programsApi.validateRelease.path, { programId, releaseId })).then(json),
    onSuccess: (result) => { const details = result.errors || []; setIssues(details); setNotice(result.valid ? "Server validation passed." : "Server validation found issues."); },
    onError: (error: Error) => setNotice(error.message),
  });
  const publish = useMutation({
    mutationFn: async () => {
      if (!localValidate()) throw new Error("Resolve the document issues before publishing.");
      await apiRequest("PATCH", apiPath(programsApi.updateDraftRelease.path, { programId, releaseId }), { curriculum: document });
      const result = await apiRequest("POST", apiPath(programsApi.validateRelease.path, { programId, releaseId })).then(json);
      if (!result.valid) throw new Error((result.errors || ["Server validation failed."]).join(" "));
      return apiRequest("POST", apiPath(programsApi.publishRelease.path, { programId, releaseId })).then(json);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [programsApi.getRelease.path, programId, releaseId] }); setNotice("Published. This curriculum is now read-only."); },
    onError: (error: Error) => setNotice(error.message),
  });
  if (isLoading) return <ProgramFrame><div className="h-64 animate-pulse rounded-2xl bg-muted" /></ProgramFrame>;
  if (isError || !release) return <ProgramFrame><Card><CardContent className="p-8 text-center"><p>Release could not be loaded.</p><Button onClick={() => refetch()}>Try again</Button></CardContent></Card></ProgramFrame>;
  const programHref = release.curriculum?.programKey === "track-a" ? "/admin/program/track-a" : `/admin/program/${programId}`;
  return <ProgramFrame eyebrow={`Release ${release.releaseNumber} / editor`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href={programHref} className="text-sm text-muted-foreground"><ArrowLeft size={14} className="mr-2 inline" /> Program</Link><div className="flex flex-wrap gap-2"><Button data-testid="save-draft" disabled={readonly || save.isPending || Boolean(jsonError)} onClick={() => save.mutate()}><Save size={14} className="mr-2" /> Save draft</Button><Button data-testid="validate-release" variant="outline" disabled={readonly || validate.isPending || Boolean(jsonError)} onClick={() => { if (localValidate()) { save.mutate(undefined, { onSuccess: () => validate.mutate() }); } }}><ShieldCheck size={14} className="mr-2" /> Validate</Button><Button data-testid="publish-release" disabled={readonly || publish.isPending || Boolean(jsonError)} onClick={() => window.confirm("Publish this release? Published curriculum cannot be edited.") && publish.mutate()}>Publish</Button></div></div>
    <Notice text={notice} error={notice.includes("failed") || notice.includes("Resolve")} />
    {issues.length > 0 && <Card className="mb-5 border-red-200 bg-red-50"><CardHeader><CardTitle className="text-base text-red-900">Validation issues ({issues.length})</CardTitle></CardHeader><CardContent><ul className="list-disc space-y-1 pl-5 text-sm text-red-800">{issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul></CardContent></Card>}
    <div className="mb-6 flex items-center justify-between"><div><h1 className="font-serif text-3xl">{release.label || "Release editor"}</h1><p className="text-sm text-muted-foreground">{readonly ? "Published and immutable." : "Draft · changes are private until published."}</p></div><Button data-testid="preview-lesson" variant="outline" disabled={!selectedLesson} onClick={() => setPreview(selectedLesson)}><Eye size={14} className="mr-2" /> Preview</Button></div>
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]"><Card><CardHeader><CardTitle className="text-lg">Curriculum</CardTitle></CardHeader><CardContent className="space-y-4">{document.modules.map((module: RecordData, index: number) => <div key={module.key} className="rounded-lg border p-2"><div className="flex items-center gap-1"><Input className="h-8" disabled={readonly} value={module.title} onChange={(e) => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, title: e.target.value } : item) }))} /><Button size="icon" variant="ghost" disabled={readonly || index === 0} onClick={() => update((d) => ({ ...d, modules: move(d.modules, index, -1) }))}><ChevronUp size={14} /></Button><Button size="icon" variant="ghost" disabled={readonly || index === document.modules.length - 1} onClick={() => update((d) => ({ ...d, modules: move(d.modules, index, 1) }))}><ChevronDown size={14} /></Button><Button size="icon" variant="ghost" disabled={readonly} onClick={() => update((d) => ({ ...d, modules: d.modules.filter((item: RecordData) => item.key !== module.key) }))}><Trash2 size={14} /></Button></div><Input className="mt-2 h-8 text-xs" disabled={readonly} placeholder="Module subtitle" value={module.subtitle || ""} onChange={(e) => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, subtitle: e.target.value } : item) }))} /><Input className="mt-2 h-8 text-xs" disabled={readonly} placeholder="Module image URL" value={module.imageUrl || ""} onChange={(e) => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, imageUrl: e.target.value } : item) }))} />{(module.lessons || []).map((lesson: RecordData, lessonIndex: number) => <div key={lesson.key} className="mt-1 flex items-center gap-1"><button className={`min-w-0 flex-1 truncate rounded px-2 py-1 text-left text-xs ${selected === lesson.key ? "bg-[hsl(174_35%_89%)]" : "hover:bg-muted"}`} onClick={() => setSelected(lesson.key)}>{lesson.title}</button><Button size="icon" variant="ghost" disabled={readonly || lessonIndex === 0} onClick={() => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, lessons: move(item.lessons, lessonIndex, -1) } : item) }))}><ChevronUp size={12} /></Button><Button size="icon" variant="ghost" disabled={readonly || lessonIndex === module.lessons.length - 1} onClick={() => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, lessons: move(item.lessons, lessonIndex, 1) } : item) }))}><ChevronDown size={12} /></Button><Button size="icon" variant="ghost" disabled={readonly} onClick={() => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, lessons: item.lessons.filter((x: RecordData) => x.key !== lesson.key) } : item) }))}><Trash2 size={12} /></Button></div>)}<Button data-testid="add-lesson" size="sm" variant="ghost" disabled={readonly} onClick={() => update((d) => ({ ...d, modules: d.modules.map((item: RecordData) => item.key === module.key ? { ...item, lessons: [...(item.lessons || []), { key: newStableKey("lesson", "New lesson"), title: "New lesson", blocks: [] }] } : item) }))}><Plus size={13} className="mr-1" /> Add lesson</Button></div>)}<Button data-testid="add-module" className="w-full" variant="outline" disabled={readonly} onClick={() => update((d) => ({ ...d, modules: [...d.modules, { key: newStableKey("module", "New module"), title: "New module", lessons: [], sortOrder: d.modules.length }] }))}><Plus size={14} className="mr-2" /> Add module</Button></CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="font-serif text-2xl">{selectedLesson?.title || "Select a lesson"}</CardTitle><Button variant="ghost" onClick={() => { if (advanced) { if (jsonError) { setNotice("Fix the JSON syntax before returning to the visual editor."); return; } setAdvanced(false); } else { setJsonText(JSON.stringify(document, null, 2)); setJsonError(""); setAdvanced(true); } }}>{advanced ? "Visual editor" : "Advanced JSON"}</Button></div></CardHeader><CardContent>{advanced ? <div><Textarea className="min-h-[500px] font-mono text-xs" disabled={readonly} value={jsonText} onChange={(e) => { const next = e.target.value; setJsonText(next); try { setDraft(JSON.parse(next)); setJsonError(""); } catch (error) { setJsonError(error instanceof Error ? error.message : "Invalid JSON"); } }} />{jsonError && <p className="mt-2 text-xs text-red-700">{jsonError}</p>}</div> : selectedLesson ? <LessonBlocks lesson={selectedLesson} readonly={readonly} update={(fn) => update((d) => ({ ...d, modules: d.modules.map((module: RecordData) => ({ ...module, lessons: module.lessons.map((lesson: RecordData) => lesson.key === selectedLesson.key ? fn(lesson) : lesson) })) }))} /> : <div className="grid min-h-64 place-items-center text-sm text-muted-foreground">Select a lesson to edit its blocks.</div>}</CardContent></Card></div>
    {preview && <LessonPreview lesson={preview} onClose={() => setPreview(null)} />}
  </ProgramFrame>;
}

function LessonBlocks({ lesson, readonly, update }: { lesson: RecordData; readonly: boolean; update: (fn: (lesson: RecordData) => RecordData) => void }) {
  const entries = getAllBlockEntries();
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Input disabled={readonly} value={lesson.title} onChange={(e) => update((value) => ({ ...value, title: e.target.value }))} /><Input disabled={readonly} value={lesson.subtitle || ""} placeholder="Subtitle" onChange={(e) => update((value) => ({ ...value, subtitle: e.target.value }))} /></div>{(lesson.blocks || []).map((block: RecordData, index: number) => { const entry = entries.find((candidate) => candidate.type === block.type); const blockIssues = validateBlockContent(block.type, block.content || ""); return <Card key={block.key} className="bg-muted/30"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium">{getBlockLabel(block.type)} <span className="text-muted-foreground">· {entry?.category}</span></p><p className="text-xs text-muted-foreground">{entry?.description}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" disabled={readonly || index === 0} onClick={() => update((value) => ({ ...value, blocks: move(value.blocks, index, -1) }))}><ChevronUp size={14} /></Button><Button size="icon" variant="ghost" disabled={readonly || index === lesson.blocks.length - 1} onClick={() => update((value) => ({ ...value, blocks: move(value.blocks, index, 1) }))}><ChevronDown size={14} /></Button><Button size="icon" variant="ghost" disabled={readonly} onClick={() => update((value) => ({ ...value, blocks: [...value.blocks.slice(0, index + 1), { ...block, key: newStableKey("block", block.type) }, ...value.blocks.slice(index + 1)] }))}><Copy size={14} /></Button><Button size="icon" variant="ghost" disabled={readonly} onClick={() => update((value) => ({ ...value, blocks: value.blocks.filter((x: RecordData) => x.key !== block.key) }))}><Trash2 size={14} /></Button></div></div><select disabled={readonly} className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={block.type} onChange={(e) => update((value) => ({ ...value, blocks: value.blocks.map((x: RecordData) => x.key === block.key ? { ...x, type: e.target.value, content: getBlockDefaultContent(e.target.value, templateBag) } : x) }))}>{entries.map((item) => <option key={item.type} value={item.type}>{item.label} · {item.category}</option>)}</select><Textarea disabled={readonly} className="min-h-24 font-mono text-xs" value={block.content || ""} onChange={(e) => update((value) => ({ ...value, blocks: value.blocks.map((x: RecordData) => x.key === block.key ? { ...x, content: e.target.value } : x) }))} />{blockIssues.length > 0 && <ul className="list-disc pl-5 text-xs text-amber-700">{blockIssues.map((issue) => <li key={issue.code}>{issue.severity}: {issue.message}</li>)}</ul>}</CardContent></Card>; })}<Button data-testid="add-block" variant="outline" disabled={readonly} onClick={() => update((value) => ({ ...value, blocks: [...(value.blocks || []), { key: newStableKey("block", "text"), type: "text", content: getBlockDefaultContent("text", templateBag) }] }))}><Plus size={14} className="mr-2" /> Add block</Button></div>;
}