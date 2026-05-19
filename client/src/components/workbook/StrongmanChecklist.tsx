import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronRight } from "lucide-react";
import { STRONGMAN_CATEGORIES } from "./strongman-data";
import type { WorkbookEntry } from "@shared/schema";

const SECTION_ID = 16;

interface ChecklistData {
  checked: string[];
  freeTexts: Record<string, string>;
}

const EMPTY_DATA: ChecklistData = { checked: [], freeTexts: {} };

function parseChecklistData(entries: WorkbookEntry[]): ChecklistData {
  if (!entries.length) return EMPTY_DATA;
  const d = entries[0].entryData as Partial<ChecklistData>;
  return {
    checked: Array.isArray(d.checked) ? d.checked : [],
    freeTexts: d.freeTexts && typeof d.freeTexts === "object" ? (d.freeTexts as Record<string, string>) : {},
  };
}

export default function StrongmanChecklist() {
  const { data: entries = [], isLoading } = useQuery<WorkbookEntry[]>({
    queryKey: [`/api/workbook/${SECTION_ID}`],
  });

  const [state, setState] = useState<ChecklistData>(EMPTY_DATA);
  const entryIdRef = useRef<number | undefined>(undefined);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !initializedRef.current) {
      initializedRef.current = true;
      const parsed = parseChecklistData(entries);
      setState(parsed);
      entryIdRef.current = entries[0]?.id;

      const categoriesWithChecks = new Set<string>();
      STRONGMAN_CATEGORIES.forEach((cat) => {
        if (cat.juniors.some((j) => parsed.checked.includes(j.id))) {
          categoriesWithChecks.add(cat.id);
        }
      });
      setOpenCategories(categoriesWithChecks);
    }
  }, [isLoading, entries]);

  const saveMutation = useMutation({
    mutationFn: (data: ChecklistData) =>
      apiRequest("POST", `/api/workbook/${SECTION_ID}`, {
        id: entryIdRef.current,
        entryData: data,
        position: 0,
      }),
    onSuccess: (result: unknown) => {
      const r = result as { id?: number };
      if (r?.id && !entryIdRef.current) {
        entryIdRef.current = r.id;
      }
      queryClient.invalidateQueries({ queryKey: [`/api/workbook/${SECTION_ID}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
    },
  });

  function scheduleSave(next: ChecklistData) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMutation.mutate(next);
    }, 600);
  }

  function toggleJunior(id: string) {
    setState((prev) => {
      const checked = prev.checked.includes(id)
        ? prev.checked.filter((c) => c !== id)
        : [...prev.checked, id];
      const next = { ...prev, checked };
      scheduleSave(next);
      return next;
    });
  }

  function setFreeText(id: string, value: string) {
    setState((prev) => {
      const freeTexts = { ...prev.freeTexts, [id]: value };
      const next = { ...prev, freeTexts };
      scheduleSave(next);
      return next;
    });
  }

  function toggleCategory(catId: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <div
          className="animate-spin"
          style={{ width: "22px", height: "22px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", borderRadius: "50%" }}
        />
      </div>
    );
  }

  const totalChecked = state.checked.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {totalChecked > 0 && (
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.35)",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          {totalChecked} spirit{totalChecked !== 1 ? "s" : ""} identified
          {saveMutation.isPending && (
            <span style={{ marginLeft: "8px", opacity: 0.5 }}>Saving…</span>
          )}
        </p>
      )}

      {STRONGMAN_CATEGORIES.map((cat) => {
        const isOpen = openCategories.has(cat.id);
        const checkedInCat = cat.juniors.filter((j) => state.checked.includes(j.id)).length;

        return (
          <div
            key={cat.id}
            style={{
              borderRadius: "8px",
              border: "0.5px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => toggleCategory(cat.id)}
              data-testid={`button-strongman-category-${cat.id}`}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.02)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")
              }
            >
              {isOpen ? (
                <ChevronDown style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
              ) : (
                <ChevronRight style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: checkedInCat > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
                  flex: 1,
                }}
              >
                {cat.name}
              </span>
              {checkedInCat > 0 && (
                <span
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.4)",
                    flexShrink: 0,
                  }}
                >
                  {checkedInCat} checked
                </span>
              )}
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "4px 14px 12px",
                  background: "rgba(0,0,0,0.15)",
                  borderTop: "0.5px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {cat.juniors.map((junior) => {
                  const isChecked = state.checked.includes(junior.id);
                  return (
                    <div key={junior.id} style={{ paddingTop: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isChecked}
                          onClick={() => toggleJunior(junior.id)}
                          data-testid={`checkbox-junior-${junior.id}`}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "3px",
                            border: `1.5px solid ${isChecked ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}`,
                            background: isChecked ? "rgba(255,255,255,0.12)" : "transparent",
                            flexShrink: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.1s",
                          }}
                        >
                          {isChecked && (
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span
                          style={{
                            fontFamily: "'Afacad', sans-serif",
                            fontSize: "0.9rem",
                            color: isChecked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
                            flex: 1,
                          }}
                        >
                          {junior.label}
                        </span>
                      </div>

                      {junior.hasFreeText && isChecked && (
                        <div style={{ marginLeft: "26px", marginTop: "6px" }}>
                          <input
                            type="text"
                            value={state.freeTexts[junior.id] ?? ""}
                            onChange={(e) => setFreeText(junior.id, e.target.value)}
                            placeholder={
                              junior.id === "fear_phobias"
                                ? "List specific phobias..."
                                : junior.id === "bondage_addiction"
                                ? "List specific addictions..."
                                : "Describe..."
                            }
                            data-testid={`input-freetext-${junior.id}`}
                            style={{
                              width: "100%",
                              background: "rgba(255,255,255,0.04)",
                              border: "0.5px solid rgba(255,255,255,0.1)",
                              borderRadius: "5px",
                              padding: "5px 8px",
                              fontFamily: "'Afacad', sans-serif",
                              fontSize: "0.85rem",
                              color: "rgba(255,255,255,0.75)",
                              outline: "none",
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.25)",
          margin: 0,
          marginTop: "12px",
          fontStyle: "italic",
        }}
      >
        Your selections auto-save as you check items.
      </p>
    </div>
  );
}
