import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getSectionById } from "./section-definitions";
import { getJuniorSpiritById } from "./strongman-data";
import ListBuilder from "./ListBuilder";
import StrongmanChecklist from "./StrongmanChecklist";
import type { WorkbookEntry } from "@shared/schema";

interface ChecklistData {
  checked: string[];
  freeTexts: Record<string, string>;
}

function Section17View() {
  const { data: sec16Entries = [], isLoading: loading16 } = useQuery<WorkbookEntry[]>({
    queryKey: ["/api/workbook/16"],
  });

  const { data: sec17Entries = [], isLoading: loading17 } = useQuery<WorkbookEntry[]>({
    queryKey: ["/api/workbook/17"],
  });

  const pendingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const saveMutation = useMutation({
    mutationFn: ({ juniorId, influence, existingId }: { juniorId: string; influence: string; existingId?: number }) =>
      apiRequest("POST", "/api/workbook/17", {
        id: existingId,
        entryData: { junior_spirit_ref: juniorId, influence },
        position: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/17"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
    },
  });

  const checkedIds: string[] = (() => {
    if (!sec16Entries.length) return [];
    const d = sec16Entries[0].entryData as Partial<ChecklistData>;
    return Array.isArray(d.checked) ? d.checked : [];
  })();

  const entriesByRef = sec17Entries.reduce<Record<string, WorkbookEntry>>((acc, e) => {
    const d = e.entryData as { junior_spirit_ref?: string };
    if (d.junior_spirit_ref) acc[d.junior_spirit_ref] = e;
    return acc;
  }, {});

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!loading17 && !initializedRef.current) {
      initializedRef.current = true;
      const vals: Record<string, string> = {};
      sec17Entries.forEach((e) => {
        const d = e.entryData as { junior_spirit_ref?: string; influence?: string };
        if (d.junior_spirit_ref) vals[d.junior_spirit_ref] = d.influence ?? "";
      });
      setLocalValues(vals);
    }
  }, [loading17, sec17Entries]);

  function handleChange(juniorId: string, value: string) {
    setLocalValues((prev) => ({ ...prev, [juniorId]: value }));
    if (pendingTimers.current[juniorId]) clearTimeout(pendingTimers.current[juniorId]);
    pendingTimers.current[juniorId] = setTimeout(() => {
      const existing = entriesByRef[juniorId];
      saveMutation.mutate({ juniorId, influence: value, existingId: existing?.id });
    }, 700);
  }

  if (loading16 || loading17) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <div
          className="animate-spin"
          style={{ width: "22px", height: "22px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", borderRadius: "50%" }}
        />
      </div>
    );
  }

  if (checkedIds.length === 0) {
    return (
      <div
        style={{
          borderRadius: "8px",
          border: "0.5px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          padding: "20px 24px",
        }}
      >
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.35)",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          No spirits identified yet. Complete Section 16 first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.4)",
          margin: 0,
          marginBottom: "4px",
        }}
      >
        For each spirit you identified in Section 16, note who or what first brought this influence into your life.
      </p>

      {checkedIds.map((juniorId) => {
        const spirit = getJuniorSpiritById(juniorId);
        if (!spirit) return null;
        return (
          <div
            key={juniorId}
            data-testid={`sec17-item-${juniorId}`}
            style={{
              borderRadius: "8px",
              border: "0.5px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {spirit.categoryName}
              </span>
              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.75)",
                  margin: 0,
                  marginTop: "1px",
                }}
              >
                {spirit.label}
              </p>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: "5px",
                }}
              >
                Who first influenced this?
              </label>
              <input
                type="text"
                value={localValues[juniorId] ?? ""}
                onChange={(e) => handleChange(juniorId, e.target.value)}
                placeholder="Name or description..."
                data-testid={`input-sec17-${juniorId}`}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  padding: "7px 10px",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.9rem",
                  color: "white",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </div>
        );
      })}

      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.25)",
          margin: 0,
          marginTop: "4px",
          fontStyle: "italic",
        }}
      >
        Your answers auto-save as you type.
      </p>
    </div>
  );
}

interface SectionViewProps {
  sectionId: number;
}

export default function SectionView({ sectionId }: SectionViewProps) {
  const section = getSectionById(sectionId);

  if (!section) {
    return (
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          padding: "60px 0",
        }}
      >
        Section not found.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
        paddingBottom: "100px",
        paddingLeft: "20px",
        paddingRight: "20px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "720px", width: "100%" }}>
        {/* Section header */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.35)",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Section {sectionId} · Freedom Workbook
          </p>
          <h1
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(26px, 4vw + 8px, 48px)",
              lineHeight: 1.1,
              color: "white",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            {section.name}
          </h1>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {section.description}
          </p>
        </div>

        {/* Content */}
        {section.type === "strongman_checklist" ? (
          <StrongmanChecklist />
        ) : sectionId === 17 ? (
          <Section17View />
        ) : (
          <ListBuilder section={section} />
        )}
      </div>
    </div>
  );
}
