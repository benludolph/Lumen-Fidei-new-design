import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LYING_SPIRITS,
  getSuggestedScriptures,
  getTruthLibraryEntry,
  type LyingSpirit,
} from "@/data/truth_library";
import type { WorkbookEntry } from "@shared/schema";

interface LieEntryData {
  lie: string;
  spoken_by: string;
  lying_spirit: string;
  scripture_reference: string;
  scripture_text: string;
  truth_statement: string;
}

type DeeperStage = "spirit" | "scripture" | "truth";

interface DeeperState {
  lying_spirit: LyingSpirit | "";
  scripture_reference: string;
  scripture_text: string;
  truth_statement: string;
  stage: DeeperStage;
}

function hasTruth(entry: WorkbookEntry): boolean {
  const d = entry.entryData as unknown as LieEntryData;
  return typeof d?.truth_statement === "string" && d.truth_statement.trim().length > 0;
}

function getEntryData(entry: WorkbookEntry): LieEntryData {
  const d = entry.entryData as unknown as LieEntryData;
  return {
    ...d,
    lie: d?.lie ?? "",
    spoken_by: d?.spoken_by ?? "",
    lying_spirit: d?.lying_spirit ?? "",
    scripture_reference: d?.scripture_reference ?? "",
    scripture_text: d?.scripture_text ?? "",
    truth_statement: d?.truth_statement ?? "",
  };
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: "6px",
  padding: "8px 10px",
  fontFamily: "'Afacad', sans-serif",
  fontSize: "0.95rem",
  color: "white",
  outline: "none",
  resize: "none" as const,
  boxSizing: "border-box" as const,
};

const labelStyle = {
  fontFamily: "'Afacad', sans-serif",
  fontSize: "0.68rem",
  fontWeight: 700 as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.4)",
};

function AddLieForm({
  nextPosition,
  onSaved,
  onCancel,
}: {
  nextPosition: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [lie, setLie] = useState("");
  const [spokenBy, setSpokenBy] = useState("");
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/workbook/6", {
        entryData: { lie, spoken_by: spokenBy },
        position: nextPosition,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/6"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
      onSaved();
    },
    onError: () => {
      toast({
        title: "Couldn't save",
        description: "Your entry couldn't be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div
      style={{
        borderRadius: "8px",
        border: "0.5px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={labelStyle}>
          What lie are you carrying?<span style={{ color: "rgba(255,100,100,0.6)", marginLeft: "4px" }}>*</span>
        </label>
        <textarea
          value={lie}
          onChange={(e) => setLie(e.target.value)}
          placeholder="Name the lie you have believed…"
          data-testid="input-add-lie"
          rows={3}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={labelStyle}>Who spoke this over you? (optional)</label>
        <input
          type="text"
          value={spokenBy}
          onChange={(e) => setSpokenBy(e.target.value)}
          placeholder="A person, a voice, your own heart…"
          data-testid="input-add-spoken-by"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          data-testid="button-add-lie-cancel"
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: "transparent",
            border: "0.5px solid rgba(255,255,255,0.1)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={!lie.trim() || saveMutation.isPending}
          data-testid="button-add-lie-save"
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.15)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "white",
            cursor: !lie.trim() || saveMutation.isPending ? "not-allowed" : "pointer",
            opacity: !lie.trim() || saveMutation.isPending ? 0.5 : 1,
          }}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function DeeperPathPanel({
  entry,
  onClose,
}: {
  entry: WorkbookEntry;
  onClose: () => void;
}) {
  const entryData = getEntryData(entry);
  const [state, setState] = useState<DeeperState>({
    lying_spirit: (entryData.lying_spirit as LyingSpirit) || "",
    scripture_reference: entryData.scripture_reference || "",
    scripture_text: entryData.scripture_text || "",
    truth_statement: entryData.truth_statement || "",
    stage: entryData.lying_spirit
      ? entryData.scripture_reference
        ? "truth"
        : "scripture"
      : "spirit",
  });

  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/workbook/6", {
        id: entry.id,
        entryData: {
          ...entryData,
          lying_spirit: state.lying_spirit,
          scripture_reference: state.scripture_reference,
          scripture_text: state.scripture_text,
          truth_statement: state.truth_statement,
        },
        position: entry.position,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/6"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Couldn't save",
        description: "Your entry couldn't be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  const suggestions =
    state.lying_spirit ? getSuggestedScriptures(state.lying_spirit as LyingSpirit) : [];

  function selectSpirit(spirit: LyingSpirit) {
    setState((s) => ({ ...s, lying_spirit: spirit, stage: "scripture", scripture_reference: "", scripture_text: "", truth_statement: "" }));
  }

  function selectScripture(ref: string) {
    const libEntry =
      state.lying_spirit
        ? getTruthLibraryEntry(state.lying_spirit as LyingSpirit, ref)
        : null;
    setState((s) => ({
      ...s,
      scripture_reference: ref,
      scripture_text: libEntry?.scripture_text ?? "",
      truth_statement: libEntry?.first_person_truth ?? "",
      stage: "truth",
    }));
  }

  const panelStyle = {
    marginTop: "12px",
    borderRadius: "8px",
    border: "0.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.02)",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ ...labelStyle, margin: 0 }}>Claim a truth against this lie</p>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center" }}
          data-testid="button-deeper-close"
        >
          <X style={{ width: "14px", height: "14px" }} />
        </button>
      </div>

      {/* Stage 1 — Spirit picker */}
      <div>
        <p style={{ ...labelStyle, marginBottom: "8px" }}>
          What the lie says
          {state.lying_spirit && (
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, lying_spirit: "", stage: "spirit", scripture_reference: "", scripture_text: "", truth_statement: "" }))}
              style={{ marginLeft: "8px", background: "none", border: "none", cursor: "pointer", fontFamily: "'Afacad', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textDecoration: "underline" }}
            >
              change
            </button>
          )}
        </p>

        {state.lying_spirit ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "0.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>
              {LYING_SPIRITS.find((s) => s.value === state.lying_spirit)?.label ?? state.lying_spirit}
            </p>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
              {LYING_SPIRITS.find((s) => s.value === state.lying_spirit)?.summary}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {LYING_SPIRITS.map((spirit) => (
              <button
                key={spirit.value}
                type="button"
                onClick={() => selectSpirit(spirit.value)}
                data-testid={`button-spirit-${spirit.value}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                  {spirit.label}
                </span>
                <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>
                  {spirit.summary}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stage 2 — Scripture picker */}
      {state.stage !== "spirit" && (
        <div>
          <p style={{ ...labelStyle, marginBottom: "8px" }}>
            Step 2 — Choose a Scripture
            {state.scripture_reference && (
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, stage: "scripture", scripture_reference: "", scripture_text: "", truth_statement: "" }))}
                style={{ marginLeft: "8px", background: "none", border: "none", cursor: "pointer", fontFamily: "'Afacad', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textDecoration: "underline" }}
              >
                change
              </button>
            )}
          </p>

          {state.scripture_reference ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                border: "0.5px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, marginBottom: "4px" }}>
                {state.scripture_reference}
              </p>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                "{state.scripture_text}"
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <button
                    key={s.scripture_reference}
                    type="button"
                    onClick={() => selectScripture(s.scripture_reference)}
                    data-testid={`button-scripture-${s.scripture_reference.replace(/\s+/g, "-")}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "0.5px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    }}
                  >
                    <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                      {s.scripture_reference}
                    </span>
                    <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginTop: "3px", fontStyle: "italic", lineHeight: 1.5 }}>
                      "{s.scripture_text}"
                    </span>
                  </button>
                ))
              ) : (
                <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", fontStyle: "italic", margin: 0 }}>
                  Library entries for this spirit are being prepared. You can pick a Scripture freely or save your lie for now.
                </p>
              )}

              {/* Free entry option */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ ...labelStyle, margin: 0 }}>Or enter a reference freely</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={state.scripture_reference}
                    onChange={(e) => setState((s) => ({ ...s, scripture_reference: e.target.value }))}
                    placeholder="e.g. John 3:16"
                    data-testid="input-scripture-free"
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (state.scripture_reference.trim()) {
                        setState((s) => ({ ...s, stage: "truth" }));
                      }
                    }}
                    disabled={!state.scripture_reference.trim()}
                    data-testid="button-scripture-confirm"
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.08)",
                      border: "0.5px solid rgba(255,255,255,0.15)",
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "white",
                      cursor: state.scripture_reference.trim() ? "pointer" : "not-allowed",
                      opacity: state.scripture_reference.trim() ? 1 : 0.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Use this
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 3 — Truth statement + preview */}
      {state.stage === "truth" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Your truth declaration (auto-filled — edit lightly)</label>
            <textarea
              value={state.truth_statement}
              onChange={(e) => setState((s) => ({ ...s, truth_statement: e.target.value }))}
              placeholder="The Lord reminds you…"
              data-testid="input-truth-statement"
              rows={3}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>

          {/* Preview card */}
          {state.truth_statement.trim() && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "8px",
                border: "0.5px solid rgba(255,200,100,0.15)",
                background: "rgba(255,200,100,0.04)",
              }}
            >
              <p style={{ ...labelStyle, margin: 0, marginBottom: "8px", color: "rgba(255,200,100,0.5)" }}>
                Your declaration will read
              </p>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.93rem", color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.65 }}>
                I reject the lie that{" "}
                <span style={{ color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>"{entryData.lie}"</span>.
                {state.truth_statement && (
                  <>
                    {" "}The Lord reminds me:{" "}
                    <span style={{ color: "rgba(255,255,255,0.85)" }}>{state.truth_statement}</span>.
                  </>
                )}
                {state.scripture_reference && (
                  <>
                    {" "}As Scripture says, {state.scripture_reference}
                    {state.scripture_text && (
                      <>: "<span style={{ fontStyle: "italic" }}>{state.scripture_text}</span>"</>
                    )}.
                  </>
                )}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              data-testid="button-deeper-cancel"
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "transparent",
                border: "0.5px solid rgba(255,255,255,0.1)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-deeper-save"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "white",
                cursor: saveMutation.isPending ? "wait" : "pointer",
                opacity: saveMutation.isPending ? 0.6 : 1,
              }}
            >
              <Check style={{ width: "12px", height: "12px" }} />
              {saveMutation.isPending ? "Saving…" : "Claim this truth"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LieCard({
  entry,
  onDeleted,
}: {
  entry: WorkbookEntry;
  onDeleted: () => void;
}) {
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const data = getEntryData(entry);
  const truthClaimed = hasTruth(entry);

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/workbook/entry/${entry.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/6"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
      onDeleted();
    },
  });

  return (
    <div
      data-testid={`lie-card-${entry.id}`}
      style={{
        borderRadius: "8px",
        border: `0.5px solid ${truthClaimed ? "rgba(255,200,100,0.12)" : "rgba(255,255,255,0.07)"}`,
        background: truthClaimed ? "rgba(255,200,100,0.03)" : "rgba(255,255,255,0.02)",
        padding: "14px 16px",
      }}
    >
      {/* Lie text row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.98rem",
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {data.lie}
          </p>
          {data.spoken_by && (
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", margin: 0 }}>
              Spoken by: {data.spoken_by}
            </p>
          )}
          {truthClaimed && (
            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Check style={{ width: "11px", height: "11px", color: "rgba(255,200,100,0.6)" }} />
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,200,100,0.6)" }}>
                Truth claimed
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "2px", flexShrink: 0, marginTop: "1px" }}>
          {confirmDelete ? (
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid={`button-lie-delete-confirm-${entry.id}`}
                style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.25)", fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", color: "#f87171", cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              data-testid={`button-lie-delete-${entry.id}`}
              style={{ padding: "5px", borderRadius: "4px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
            >
              <Trash2 style={{ width: "12px", height: "12px" }} />
            </button>
          )}
        </div>
      </div>

      {/* Truth preview if claimed */}
      {truthClaimed && (
        <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "6px", background: "rgba(255,200,100,0.04)", border: "0.5px solid rgba(255,200,100,0.08)" }}>
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
            {data.truth_statement}
          </p>
          {data.scripture_reference && (
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,200,100,0.45)", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {data.scripture_reference}
            </p>
          )}
        </div>
      )}

      {/* Claim a truth / deeper path toggle */}
      {!deeperOpen ? (
        <button
          type="button"
          onClick={() => setDeeperOpen(true)}
          data-testid={`button-claim-truth-${entry.id}`}
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: truthClaimed ? "rgba(255,200,100,0.45)" : "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = truthClaimed ? "rgba(255,200,100,0.7)" : "rgba(255,255,255,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = truthClaimed ? "rgba(255,200,100,0.45)" : "rgba(255,255,255,0.3)")}
        >
          <ChevronDown style={{ width: "11px", height: "11px" }} />
          {truthClaimed ? "Edit truth" : "Claim a truth against this"}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setDeeperOpen(false)}
            data-testid={`button-claim-truth-close-${entry.id}`}
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            <ChevronUp style={{ width: "11px", height: "11px" }} />
            Close
          </button>
          <DeeperPathPanel entry={entry} onClose={() => setDeeperOpen(false)} />
        </>
      )}
    </div>
  );
}

export default function LiesAndTruthsEditor() {
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: entries = [], isLoading } = useQuery<WorkbookEntry[]>({
    queryKey: ["/api/workbook/6"],
  });

  const liesCount = entries.length;
  const truthsCount = entries.filter((e) => hasTruth(e)).length;
  const nextPosition = entries.length;

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
      {/* Status summary */}
      {liesCount > 0 && (
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
          data-testid="text-lies-status"
        >
          {liesCount} {liesCount === 1 ? "lie" : "lies"} named
          {truthsCount > 0 && (
            <span style={{ color: "rgba(255,200,100,0.55)" }}>
              {", "}
              {truthsCount} {truthsCount === 1 ? "truth" : "truths"} claimed
            </span>
          )}
        </p>
      )}

      {/* Entry list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {entries.map((entry) => (
          <LieCard
            key={entry.id}
            entry={entry}
            onDeleted={() => {}}
          />
        ))}
      </div>

      {/* Add form or button */}
      {showAddForm ? (
        <AddLieForm
          nextPosition={nextPosition}
          onSaved={() => setShowAddForm(false)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          data-testid="button-add-lie"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 14px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
          }}
        >
          <Plus style={{ width: "13px", height: "13px" }} />
          Add a lie
        </button>
      )}

      {/* Empty state nudge */}
      {liesCount === 0 && !showAddForm && (
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.88rem",
            color: "rgba(255,255,255,0.28)",
            margin: 0,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          Name the lies you have carried. The app will help you find a Scripture truth to claim against each one.
        </p>
      )}
    </div>
  );
}
