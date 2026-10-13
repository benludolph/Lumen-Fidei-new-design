import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { buildWorkbookSections, buildWorkbookCategories, buildWorkbookPrayers, buildWorkbookPatterns, workbookText, workbookDocumentSchema, type WorkbookDocument } from "@shared/workbook-content";

export const WORKBOOK_CONTENT_QUERY = ["/api/workbook/content"] as const;
export function contentSelectors(document: WorkbookDocument) {
  return {
    document,
    sections: buildWorkbookSections(document),
    categories: buildWorkbookCategories(document),
    prayers: buildWorkbookPrayers(document),
    patterns: buildWorkbookPatterns(document),
    text: (key: string) => workbookText(document, key),
  };
}
const ContentContext = createContext<ReturnType<typeof contentSelectors> | null>(null);
export function WorkbookDocumentProvider({ document, children }: { document: WorkbookDocument; children: ReactNode }) {
  const value = useMemo(() => contentSelectors(document), [document]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
export function WorkbookContentProvider({ children }: { children: ReactNode }) {
  const query = useQuery<{ document: WorkbookDocument; revision: number }>({
    queryKey: WORKBOOK_CONTENT_QUERY,
    queryFn: async () => {
      const state = await (await apiRequest("GET", "/api/workbook/content")).json();
      return { document: workbookDocumentSchema.parse(state.document), revision: state.revision };
    },
    retry: false,
  });
  if (query.isError) return <div className="p-8 max-w-xl mx-auto" role="alert">
    <h2 className="font-serif text-2xl mb-3">The workbook could not be loaded</h2>
    <p className="text-muted-foreground mb-5">Your answers are safe. Please retry to load the current workbook wording.</p>
    <Button onClick={() => query.refetch()}>Try again</Button>
  </div>;
  if (!query.data) return <div aria-busy="true" aria-label="Loading workbook content" className="p-8 max-w-2xl mx-auto space-y-5">
    <div className="h-10 w-2/3 rounded bg-muted animate-pulse" />
    {[1, 2, 3, 4].map(i => <div key={i} className="h-5 rounded bg-muted animate-pulse" />)}
  </div>;
  return <WorkbookDocumentProvider document={query.data.document}>{children}</WorkbookDocumentProvider>;
}
export function useWorkbookContent() {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useWorkbookContent must be used within WorkbookContentProvider");
  return value;
}
