import { useMemo, useState } from "react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { buildWorkbookSections, buildWorkbookPrayers, type WorkbookDocument } from "@shared/workbook-content";
import type { PrayerId } from "@shared/schema";
import SectionView from "@/components/workbook/SectionView";
import PrayerRender from "@/components/workbook/PrayerRender";
import WorkbookAccessGate from "@/components/workbook/WorkbookAccessGate";
import { WorkbookDocumentProvider } from "./WorkbookContentProvider";
import { WorkbookPreviewContext } from "./preview-context";

// Participant writers consult this context; only the real component tree is rendered.
export default function WorkbookPreview({ document }: { document: WorkbookDocument }) {
  const [faith, setFaith] = useState("Yes");
  const [kind, setKind] = useState("section");
  const sections = useMemo(() => buildWorkbookSections(document), [document]);
  const prayers = useMemo(() => buildWorkbookPrayers(document), [document]);
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? 1);
  const [prayerId, setPrayerId] = useState<PrayerId>("prayer_1");
  const client = useMemo(() => {
    const isolated = new QueryClient({
      mutationCache: new MutationCache({ onMutate: () => { throw new Error("Participant writes are disabled in editorial preview."); } }),
      defaultOptions: {
      queries: { staleTime: Infinity, retry: false, refetchOnMount: false, refetchOnWindowFocus: false, queryFn: async () => { throw new Error("No live data is available in editorial preview."); } },
      mutations: { retry: false, mutationFn: async () => { throw new Error("Participant writes are disabled in editorial preview."); } },
    } });
    isolated.setQueryData(["/api/user"], { id: -1, name: "Editorial preview", role: "participant", track: "A", workbookExempt: false });
    isolated.setQueryData(["/api/user-profile"], {
      id: -1, userId: -1, faithTradition: faith, workbookIntroAcknowledged: kind !== "intro",
      name: "Preview participant", fatherName: "Sample father", motherName: "Sample mother",
      familyNames: ["Sample family"], familyMembers: ["Sample relative"], spouseName: "Sample spouse",
      childrenNames: ["Sample child"], chronicIssues: ["Sample health concern"],
      chronicIdentityLabels: ["Sample label"], chronicComplaints: ["Sample concern"],
    });
    const summary: Record<number, { count: number; attested: boolean }> = {};
    sections.forEach(section => {
      const entryData: Record<string, unknown> = {};
      section.fields.forEach(field => {
        entryData[field.key] = field.type === "boolean" ? true : field.type === "enum" ? field.enumOptions?.[0]?.value ?? "" : `Sample ${field.key.replaceAll("_", " ")}`;
      });
      if (section.id === 6) Object.assign(entryData, { lie: "I am alone", spoken_by: "A remembered voice", lying_spirit: "", truth_statement: "The Lord is with me", scripture_reference: "Isaiah 41:10", scripture_text: "Do not fear, for I am with you." });
      if (section.id === 14) Object.assign(entryData, { checked: ["Fear", "Rejection"], other_freetext: "", father_word: "You are loved." });
      // Include each protected option value so conditional prayer branches can
      // be reviewed without consulting or copying a participant's answers.
      const variants = [entryData, ...section.fields.flatMap(field =>
        (field.enumOptions ?? []).slice(1).map(option => ({ ...entryData, [field.key]: option.value })),
      )];
      isolated.setQueryData([`/api/workbook/${section.id}`], variants.map((data, index) => ({
        id: -(section.id * 100 + index), userId: -1, sectionId: section.id,
        entryData: data, position: index, createdAt: new Date(0).toISOString(),
      })));
      summary[section.id] = { count: variants.length, attested: false };
    });
    isolated.setQueryData(["/api/workbook/summary"], summary);
    return isolated;
  }, [faith, kind, sections]);
  return <div>
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <label className="text-sm">Faith view <select aria-label="Preview faith tradition" className="ml-2 p-2 border rounded bg-background" value={faith} onChange={e => setFaith(e.target.value)}><option value="Yes">Catholic</option><option value="No, I'm a Christian of another tradition">Non-Catholic Christian</option><option value="No, I'm exploring faith">Exploring faith</option></select></label>
      <label className="text-sm">Preview <select aria-label="Preview content type" className="ml-2 p-2 border rounded bg-background" value={kind} onChange={e => setKind(e.target.value)}><option value="section">Section</option><option value="prayer">Personalized prayer</option><option value="intro">Introduction</option></select></label>
      {kind === "section" && <select aria-label="Preview workbook section" className="p-2 border rounded bg-background max-w-full" value={sectionId} onChange={e => setSectionId(Number(e.target.value))}>{sections.map(section => <option value={section.id} key={section.id}>{section.name}</option>)}</select>}
      {kind === "prayer" && <select aria-label="Preview personalized prayer" className="p-2 border rounded bg-background" value={prayerId} onChange={e => setPrayerId(e.target.value as PrayerId)}>{Object.values(prayers).map(prayer => <option key={prayer.id} value={prayer.id}>{prayer.title}</option>)}</select>}
    </div>
    <p className="text-xs text-muted-foreground mb-3">Synthetic examples are highlighted within prayers. Form changes are disabled; prayer navigation remains available.</p>
    <QueryClientProvider client={client}><WorkbookPreviewContext.Provider value={true}><WorkbookDocumentProvider document={document}>
      <div className="workbook-editor-preview" key={`${kind}-${faith}`}>
        {kind === "section" && <SectionView sectionId={sectionId} inSheet />}
        {kind === "prayer" && <PrayerRender key={prayerId} prayerId={prayerId} onDone={() => setKind("section")} />}
        {kind === "intro" && <fieldset disabled style={{ border: 0, padding: 0, margin: 0 }}><WorkbookAccessGate categorySession><span /></WorkbookAccessGate></fieldset>}
      </div>
    </WorkbookDocumentProvider></WorkbookPreviewContext.Provider></QueryClientProvider>
    <Button variant="ghost" className="mt-2 text-xs" onClick={() => { setFaith("Yes"); setKind("section"); setSectionId(sections[0]?.id ?? 1); setPrayerId("prayer_1"); }}>Reset preview</Button>
  </div>;
}
