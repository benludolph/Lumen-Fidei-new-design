import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Eye, LockKeyhole, Save, Search } from "lucide-react";
import { apiRequest, ApiRequestError } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORKBOOK_FIELDS, workbookDocumentSchema, type WorkbookDocument } from "@shared/workbook-content";
import { WORKBOOK_CONTENT_QUERY } from "./WorkbookContentProvider";
import { useEditorNavigation } from "./use-editor-navigation";
import WorkbookPreview from "./WorkbookPreview";
import "./editor.css";

type EditorState = { draft: WorkbookDocument; applied: WorkbookDocument; revision: number };
const EDITOR_QUERY = ["/api/admin/workbook-content"];
async function readState(response: Response): Promise<EditorState> {
  const state = await response.json();
  if (!Number.isInteger(state.revision)) throw new Error("The saved workbook revision is invalid. Reload before editing.");
  return {
    draft: workbookDocumentSchema.parse(state.draft),
    applied: workbookDocumentSchema.parse(state.applied),
    revision: state.revision,
  };
}
function same(a: WorkbookDocument, b: WorkbookDocument) {
  return WORKBOOK_FIELDS.every(field => a.texts[field.key] === b.texts[field.key]);
}
export default function WorkbookContentEditor() {
  const client = useQueryClient();
  const query = useQuery<EditorState>({
    queryKey: EDITOR_QUERY,
    queryFn: async () => readState(await apiRequest("GET", "/api/admin/workbook-content")),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [local, setLocal] = useState<WorkbookDocument | null>(null);
  const initialized = useRef(false);
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState("");
  const groups = useMemo(() => Array.from(new Set(WORKBOOK_FIELDS.map(field => field.group))), []);
  useEffect(() => {
    if (query.data && !initialized.current) {
      setLocal(structuredClone(query.data.draft));
      initialized.current = true;
      setGroup(groups[0] ?? "");
    }
  }, [query.data, groups]);
  const dirty = !!(local && query.data && !same(local, query.data.draft));
  const unapplied = !!(query.data && !same(query.data.draft, query.data.applied));
  const save = useMutation({
    mutationFn: async () => readState(await apiRequest("PUT", "/api/admin/workbook-content/draft", {
      document: local, revision: query.data!.revision,
    })),
    onSuccess: state => {
      client.setQueryData(EDITOR_QUERY, state);
      setLocal(structuredClone(state.draft));
      setConflict(false);
      setNotice("Draft saved. Participant wording has not changed.");
    },
    onError: error => { setConflict(error instanceof ApiRequestError && error.status === 409); setNotice(error.message); },
  });
  const apply = useMutation({
    mutationFn: async () => readState(await apiRequest("POST", "/api/admin/workbook-content/apply", { revision: query.data!.revision })),
    onSuccess: state => {
      client.setQueryData(EDITOR_QUERY, state);
      client.setQueryData(WORKBOOK_CONTENT_QUERY, { document: state.applied, revision: state.revision });
      setConfirmApply(false);
      setNotice("Saved draft applied in this environment. This project has not been published.");
    },
    onError: error => { setConfirmApply(false); setConflict(error instanceof ApiRequestError && error.status === 409); setNotice(error.message); },
  });
  const busy = save.isPending || apply.isPending;
  useEditorNavigation(dirty, busy);
  async function reload() {
    if (dirty && !window.confirm("Reload the latest saved draft? Your unsaved changes will be discarded.")) return;
    const result = await query.refetch();
    if (result.data && !result.isError) {
      setLocal(structuredClone(result.data.draft));
      setConflict(false); setNotice("Latest saved draft loaded.");
    }
  }
  if (query.isError) return <div role="alert" className="rounded-lg border p-8">
    <h2 className="workbook-editor-title text-2xl mb-2">Workbook content is unavailable</h2>
    <p className="text-muted-foreground mb-4">No draft has been loaded. Please try again.</p>
    <Button onClick={() => query.refetch()}>Retry</Button>
  </div>;
  if (!local || !query.data) return <div className="space-y-4 p-6" aria-busy="true" aria-label="Loading workbook editor">
    {[40, 90, 75, 90].map((width, index) => <div key={index} className="h-10 rounded bg-muted animate-pulse" style={{ width: `${width}%` }} />)}
  </div>;
  const fields = WORKBOOK_FIELDS.filter(field => search
    ? `${field.label} ${field.group} ${local.texts[field.key]}`.toLowerCase().includes(search.toLowerCase())
    : field.group === group);
  return <section className="workbook-editor rounded-xl border bg-card" data-testid="workbook-content-editor">
    <header className="p-5 sm:p-7 border-b">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[.16em] text-muted-foreground mb-2">Global workbook · All tracks</p>
          <h2 className="workbook-editor-title text-3xl">The Deliverance Workbook</h2>
          <p className="text-muted-foreground mt-2 max-w-xl">Revise the words, not the journey. Participant answers and workbook mechanics remain unchanged.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}><Eye className="w-4 h-4 mr-2" />Preview</Button>
          <Button variant="outline" disabled={!dirty || busy || conflict} onClick={() => { setNotice(""); save.mutate(); }} data-testid="button-workbook-save-draft">
            <Save className="w-4 h-4 mr-2" />{save.isPending ? "Saving draft…" : "Save draft"}
          </Button>
          <Button disabled={dirty || !unapplied || busy || conflict} onClick={() => setConfirmApply(true)} data-testid="button-workbook-apply">Apply changes</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mt-5">
        <span className="flex gap-2 items-center"><Check className="w-4 h-4" />{dirty ? "Unsaved edits" : "Draft saved"} · Revision {query.data.revision}</span>
        <span>{unapplied ? "Saved draft differs from applied content" : "Saved draft matches applied content"}</span>
      </div>
      {dirty && <p className="text-sm mt-2 text-muted-foreground">Save your edits before applying. Preview includes your unsaved wording.</p>}
      {notice && <p className="text-sm mt-4" role={save.isError || apply.isError ? "alert" : "status"}>{notice}</p>}
      {conflict && <div role="alert" className="mt-4 p-4 border rounded-lg bg-muted"><p className="mb-3">Someone else changed this workbook. Reload the latest saved draft before making further changes. Your edits have not replaced theirs.</p><Button variant="outline" onClick={reload}>Reload latest draft</Button></div>}
    </header>
    <div className="p-5 sm:p-7 workbook-editor-grid">
      <nav className="workbook-editor-nav" aria-label="Workbook content groups">
        <div className="relative mb-4"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find wording…" aria-label="Search workbook wording" /></div>
        <div className="space-y-1">{groups.map(name => <button key={name} type="button" className={`w-full text-left rounded-md py-2 px-3 text-sm ${name === group && !search ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`} onClick={() => { setGroup(name); setSearch(""); }} aria-current={name === group && !search ? "page" : undefined}>{name}</button>)}</div>
      </nav>
      <div className="min-w-0">
        <div className="flex gap-2 items-center text-xs text-muted-foreground mb-5"><LockKeyhole className="w-4 h-4 shrink-0" />Text only. Keys, answer types, option values and prayer insertions are protected.</div>
        <h3 className="workbook-editor-title text-2xl">{search ? `Search results (${fields.length})` : group}</h3>
        {fields.length === 0 && <div className="py-12 text-center"><BookOpen className="w-6 h-6 mx-auto text-muted-foreground mb-3" /><p>No wording matches your search.</p><Button className="mt-3" variant="ghost" onClick={() => setSearch("")}>Clear search</Button></div>}
        {fields.map(field => <div key={field.key} className="workbook-editor-field">
          <label htmlFor={`workbook-text-${field.key}`} className="block text-sm font-medium mb-2">{field.label}</label>
          {search && <p className="text-xs text-muted-foreground mb-2">{field.group}</p>}
          <Textarea id={`workbook-text-${field.key}`} data-testid={`workbook-field-${field.key}`} value={local.texts[field.key] ?? ""} rows={(local.texts[field.key]?.length ?? 0) > 180 ? 5 : 2} disabled={busy || conflict} onChange={event => {
            const value = event.target.value;
            setLocal(previous => previous ? { version: 1, texts: { ...previous.texts, [field.key]: value } } : previous);
            setNotice("");
          }} className="resize-y leading-relaxed" />
          {(local.texts[field.key]?.match(/\{\{[^{}]+\}\}/g) ?? []).length > 0 && <p className="text-xs text-muted-foreground mt-2">
            Protected insertions: <span className="font-mono">{Array.from(new Set(local.texts[field.key].match(/\{\{[^{}]+\}\}/g) ?? [])).join(", ")}</span>. Keep each insertion intact.
          </p>}
          {field.optional && <p className="text-xs text-muted-foreground mt-2">Optional block. Leave blank to hide it from the workbook.</p>}
        </div>)}
      </div>
    </div>
    <Dialog open={confirmApply} onOpenChange={setConfirmApply}><DialogContent><DialogHeader>
      <DialogTitle className="workbook-editor-title">Apply the saved draft?</DialogTitle>
      <DialogDescription>Participant workbook wording in the current environment will use this saved draft. This does not publish the project or change participant answers, fields, unlocks or prayer logic.</DialogDescription>
    </DialogHeader><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setConfirmApply(false)} disabled={busy}>Cancel</Button><Button disabled={busy || dirty || conflict} onClick={() => apply.mutate()}>{apply.isPending ? "Applying…" : "Apply saved draft"}</Button></div></DialogContent></Dialog>
    <Dialog open={preview} onOpenChange={setPreview}><DialogContent className="max-w-5xl max-h-[95dvh] overflow-y-auto"><DialogHeader><DialogTitle className="workbook-editor-title">Participant preview</DialogTitle><DialogDescription>Current wording with synthetic answers only. Participant writes are disabled.</DialogDescription></DialogHeader><WorkbookPreview document={local} /></DialogContent></Dialog>
  </section>;
}
