import { useState } from "react";
import type { CSSProperties } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { SectionDefinition } from "./section-definitions";
import type { SectionField } from "./section-definitions";
import type { WorkbookEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ListBuilderProps {
  section: SectionDefinition;
}

interface EntryData {
  [key: string]: string;
}

function EntryCard({
  entry,
  section,
  onDeleted,
}: {
  entry: WorkbookEntry;
  section: SectionDefinition;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<EntryData>(() => {
    const d = entry.entryData as EntryData;
    return section.fields.reduce((acc, f) => ({ ...acc, [f.key]: d[f.key] ?? "" }), {} as EntryData);
  });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/workbook/${section.id}`, {
        id: entry.id,
        entryData: { ...(entry.entryData as Record<string, unknown>), ...form },
        position: entry.position,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workbook/${section.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
      setEditing(false);
    },
    onError: () => {
      toast({
        title: "Couldn't save",
        description: "Your entry couldn't be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/workbook/entry/${entry.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workbook/${section.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
      onDeleted();
    },
  });

  const data = entry.entryData as EntryData;

  if (editing) {
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
        {section.fields.map((field) => {
          const fieldType = field.type ?? "textarea";
          const inputStyle: CSSProperties = {
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            padding: "8px 10px",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.95rem",
            color: "white",
            outline: "none",
            resize: "none",
          };
          return (
            <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {fieldType !== "boolean" && (
                <label
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {field.label}
                </label>
              )}
              {fieldType === "boolean" ? (
                <label
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                  data-testid={`input-entry-${entry.id}-${field.key}`}
                >
                  <input
                    type="checkbox"
                    checked={form[field.key] === "true"}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked ? "true" : "false" }))}
                    style={{ width: "14px", height: "14px", accentColor: "rgba(255,255,255,0.7)", cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>
                    {field.label}
                  </span>
                </label>
              ) : fieldType === "textarea" ? (
                <textarea
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  data-testid={`input-entry-${entry.id}-${field.key}`}
                  rows={2}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              ) : fieldType === "enum" ? (
                <select
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  data-testid={`input-entry-${entry.id}-${field.key}`}
                  style={{ ...inputStyle, appearance: "none" as const }}
                >
                  <option value="" disabled style={{ background: "#1a1a1a" }}>{field.placeholder ?? `Select ${field.label}`}</option>
                  {form[field.key] && !(field.enumOptions ?? []).some((option) => option.value === form[field.key]) && <option value={form[field.key]} style={{ background: "#1a1a1a" }}>{form[field.key]}</option>}
                  {(field.enumOptions ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "#1a1a1a" }}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  data-testid={`input-entry-${entry.id}-${field.key}`}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              )}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setEditing(false)}
            data-testid={`button-entry-cancel-${entry.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
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
            <X style={{ width: "12px", height: "12px" }} />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid={`button-entry-save-${entry.id}`}
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
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`entry-card-${entry.id}`}
      style={{
        borderRadius: "8px",
        border: "0.5px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
        {section.fields.map((field) => {
          const val = data[field.key];
          const isBool = field.type === "boolean";
          if (isBool && val !== "true") return null;
          if (!isBool && !val) return null;
          return (
            <div key={field.key}>
              {section.fields.length > 1 && (
                <span
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.3)",
                    display: "block",
                    marginBottom: "1px",
                  }}
                >
                  {field.label}
                </span>
              )}
              {!isBool && (
                <p
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.8)",
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {val as string}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "2px", flexShrink: 0, marginTop: "1px" }}>
        <button
          type="button"
          onClick={() => setEditing(true)}
          data-testid={`button-entry-edit-${entry.id}`}
          style={{
            padding: "5px",
            borderRadius: "4px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <Pencil style={{ width: "12px", height: "12px" }} />
        </button>

        {confirmDelete ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", marginLeft: "4px" }}>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
              }}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid={`button-entry-delete-confirm-${entry.id}`}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(239,68,68,0.12)",
                border: "0.5px solid rgba(239,68,68,0.25)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                color: "#f87171",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            data-testid={`button-entry-delete-${entry.id}`}
            style={{
              padding: "5px",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            <Trash2 style={{ width: "12px", height: "12px" }} />
          </button>
        )}
      </div>
    </div>
  );
}

function AddEntryForm({
  section,
  nextPosition,
  onSaved,
  onCancel,
}: {
  section: SectionDefinition;
  nextPosition: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EntryData>(() =>
    section.fields.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultValue ?? "" }), {} as EntryData)
  );
  const { toast } = useToast();

  const requiredKeys = section.fields.filter((f) => f.required).map((f) => f.key);
  const isValid = requiredKeys.every((k) => (form[k] ?? "").trim().length > 0);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/workbook/${section.id}`, {
        entryData: form,
        position: nextPosition,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workbook/${section.id}`] });
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
      {section.fields.map((field) => {
        const fieldType = field.type ?? "textarea";
        const inputStyle: CSSProperties = {
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.12)",
          borderRadius: "6px",
          padding: "8px 10px",
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.95rem",
          color: "white",
          outline: "none",
          resize: "none",
        };
        return (
          <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {fieldType !== "boolean" && (
              <label
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: "rgba(255,100,100,0.6)", marginLeft: "4px" }}>*</span>
                )}
              </label>
            )}
            {fieldType === "boolean" ? (
              <label
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                data-testid={`input-add-${field.key}`}
              >
                <input
                  type="checkbox"
                  checked={form[field.key] === "true"}
                  onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked ? "true" : "false" }))}
                  style={{ width: "14px", height: "14px", accentColor: "rgba(255,255,255,0.7)", cursor: "pointer" }}
                />
                <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>
                  {field.label}
                </span>
              </label>
            ) : fieldType === "textarea" ? (
              <textarea
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                data-testid={`input-add-${field.key}`}
                rows={2}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
            ) : fieldType === "enum" ? (
              <select
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                data-testid={`input-add-${field.key}`}
                style={{ ...inputStyle, appearance: "none" as const }}
              >
                <option value="" disabled style={{ background: "#1a1a1a" }}>{field.placeholder ?? `Select ${field.label}`}</option>
                {(field.enumOptions ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "#1a1a1a" }}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                data-testid={`input-add-${field.key}`}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
            )}
          </div>
        );
      })}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          data-testid="button-add-entry-cancel"
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
          disabled={!isValid || saveMutation.isPending}
          data-testid="button-add-entry-save"
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: isValid ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            border: `0.5px solid ${isValid ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: isValid ? "white" : "rgba(255,255,255,0.3)",
            cursor: !isValid || saveMutation.isPending ? "not-allowed" : "pointer",
            opacity: saveMutation.isPending ? 0.6 : 1,
          }}
        >
          {saveMutation.isPending ? "Adding..." : "Add entry"}
        </button>
      </div>
    </div>
  );
}

export default function ListBuilder({ section, onClose }: ListBuilderProps & { onClose?: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const { data: entries = [], isLoading } = useQuery<WorkbookEntry[]>({
    queryKey: [`/api/workbook/${section.id}`],
  });

  const { data: summaryRaw = {} } = useQuery<Record<string, { count: number; attested: boolean }>>({
    queryKey: ["/api/workbook/summary"],
  });
  const attested = summaryRaw[section.id]?.attested ?? false;

  const attestMutation = useMutation({
    mutationFn: (on: boolean) =>
      apiRequest(on ? "POST" : "DELETE", `/api/workbook/attest/${section.id}`),
    onSuccess: (_data, on) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
      if (on) onClose?.();
    },
    onError: () => {
      toast({
        title: "Couldn't save",
        description: "Your entry couldn't be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Entry list */}
      {entries.length === 0 && !showAddForm && (
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.25)",
            margin: 0,
            padding: "12px 0 4px",
            fontStyle: "italic",
          }}
        >
          Nothing added yet.
        </p>
      )}

      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          section={section}
          onDeleted={() => {}}
        />
      ))}

      {/* Add entry form or button */}
      {showAddForm ? (
        <AddEntryForm
          section={section}
          nextPosition={entries.length}
          onSaved={() => setShowAddForm(false)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          data-testid="button-add-entry"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 14px",
            borderRadius: "7px",
            background: "transparent",
            border: "0.5px dashed rgba(255,255,255,0.12)",
            cursor: "pointer",
            width: "100%",
            marginTop: entries.length > 0 ? "4px" : "0",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Plus style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.4)" }} />
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Add entry
          </span>
        </button>
      )}

      {/* Attestation toggle */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            I've considered this and have nothing to add.
          </p>
        </div>
        <button
          type="button"
          onClick={() => attestMutation.mutate(!attested)}
          disabled={attestMutation.isPending}
          data-testid="button-attest-toggle"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            borderRadius: "6px",
            background: attested ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            border: `0.5px solid ${attested ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
            cursor: attestMutation.isPending ? "wait" : "pointer",
            opacity: attestMutation.isPending ? 0.6 : 1,
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          {attested && <Check style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.6)" }} />}
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: attested ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
            }}
          >
            {attested ? "Marked done" : "Mark done"}
          </span>
        </button>
      </div>
    </div>
  );
}
