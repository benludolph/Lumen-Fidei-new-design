import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DOMINANT_PATTERNS } from "@/data/patterns_data";
import type { WorkbookEntry } from "@shared/schema";

type Section14Data = {
  checked: string[];
  other_freetext: string;
};

function parseData(entry: WorkbookEntry | undefined): Section14Data {
  if (!entry) return { checked: [], other_freetext: "" };
  const d = entry.entryData as unknown as Section14Data;
  return {
    checked: Array.isArray(d?.checked) ? d.checked : [],
    other_freetext: typeof d?.other_freetext === "string" ? d.other_freetext : "",
  };
}

export default function PatternsChecklist() {
  const { data: entries = [], isLoading } = useQuery<WorkbookEntry[]>({
    queryKey: ["/api/workbook/14"],
  });

  const existingEntry = entries[0] as WorkbookEntry | undefined;

  const [data, setData] = useState<Section14Data>({ checked: [], other_freetext: "" });
  const isHydrated = useRef(false);
  const isDirty = useRef(false);

  useEffect(() => {
    if (existingEntry !== undefined && !isHydrated.current) {
      isHydrated.current = true;
      if (!isDirty.current) {
        setData(parseData(existingEntry));
      }
    }
  }, [existingEntry]);

  const saveMutation = useMutation({
    mutationFn: (nextData: Section14Data) =>
      apiRequest("POST", "/api/workbook/14", {
        id: existingEntry?.id,
        entryData: nextData as unknown as Record<string, string>,
        position: existingEntry?.position ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/14"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
    },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(next: Section14Data) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(next);
    }, 500);
  }

  function handleToggle(pattern: string, checked: boolean) {
    isDirty.current = true;
    const next: Section14Data = {
      ...data,
      checked: checked
        ? [...data.checked, pattern]
        : data.checked.filter((p) => p !== pattern),
    };
    setData(next);
    scheduleSave(next);
  }

  function handleOtherChange(val: string) {
    isDirty.current = true;
    const next: Section14Data = { ...data, other_freetext: val };
    setData(next);
    scheduleSave(next);
  }

  const namedCheckedCount = data.checked.length;
  const checkedCount = namedCheckedCount + (data.other_freetext.trim() ? 1 : 0);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
        <div
          className="animate-spin"
          style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "rgba(255,255,255,0.4)", borderRadius: "50%" }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Count summary */}
      {checkedCount > 0 && (
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.35)",
            margin: 0,
          }}
        >
          {checkedCount} {checkedCount === 1 ? "pattern" : "patterns"} identified
        </p>
      )}

      {/* Checklist — all 31 entries driven from DOMINANT_PATTERNS */}
      <div
        style={{
          borderRadius: "8px",
          border: "0.5px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          padding: "8px 4px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {DOMINANT_PATTERNS.map((pattern) => {
          const isOther = pattern === "Other";

          if (isOther) {
            return (
              <div key={pattern} style={{ padding: "10px 16px" }}>
                <label
                  style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "text" }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: `1.5px solid ${data.other_freetext.trim() ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)"}`,
                      background: data.other_freetext.trim() ? "rgba(255,255,255,0.12)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                      transition: "all 0.12s",
                    }}
                  >
                    {data.other_freetext.trim() && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontFamily: "'Afacad', sans-serif",
                        fontSize: "0.98rem",
                        color: data.other_freetext.trim() ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      Other
                    </span>
                    <input
                      type="text"
                      value={data.other_freetext}
                      onChange={(e) => handleOtherChange(e.target.value)}
                      placeholder="Describe any other pattern…"
                      data-testid="input-pattern-other"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "0.5px solid rgba(255,255,255,0.12)",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontFamily: "'Afacad', sans-serif",
                        fontSize: "0.9rem",
                        color: "white",
                        outline: "none",
                        width: "100%",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                  </div>
                </label>
              </div>
            );
          }

          const isChecked = data.checked.includes(pattern);
          return (
            <label
              key={pattern}
              data-testid={`checkbox-pattern-${pattern.replace(/\s+/g, "-").toLowerCase()}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                background: isChecked ? "rgba(255,255,255,0.04)" : "transparent",
                transition: "background 0.12s",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: `1.5px solid ${isChecked ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)"}`,
                  background: isChecked ? "rgba(255,255,255,0.12)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.12s",
                }}
              >
                {isChecked && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleToggle(pattern, e.target.checked)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                aria-hidden="true"
                tabIndex={-1}
              />
              <span
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.98rem",
                  color: isChecked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
                  transition: "color 0.12s",
                  userSelect: "none",
                }}
              >
                {pattern}
              </span>
            </label>
          );
        })}
      </div>

      {/* Auto-save indicator */}
      {saveMutation.isPending && (
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.25)",
            margin: 0,
            textAlign: "right",
          }}
        >
          Saving…
        </p>
      )}
    </div>
  );
}
