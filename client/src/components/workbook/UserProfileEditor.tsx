import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";

type ProfileData = {
  familyMembers: string[];
  spouseName: string;
  childrenNames: string[];
  chronicIssues: string[];
  chronicIdentityLabels: string[];
};

const EMPTY_PROFILE: ProfileData = {
  familyMembers: [],
  spouseName: "",
  childrenNames: [],
  chronicIssues: [],
  chronicIdentityLabels: [],
};

function parseProfile(p: UserProfile | null | undefined): ProfileData {
  if (!p) return EMPTY_PROFILE;
  return {
    familyMembers: Array.isArray(p.familyMembers) ? p.familyMembers : [],
    spouseName: p.spouseName ?? "",
    childrenNames: Array.isArray(p.childrenNames) ? p.childrenNames : [],
    chronicIssues: Array.isArray(p.chronicIssues) ? p.chronicIssues : [],
    chronicIdentityLabels: Array.isArray(p.chronicIdentityLabels) ? p.chronicIdentityLabels : [],
  };
}

function TagInput({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function commit() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && input === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ marginBottom: "6px" }}>
        <span
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        {hint && (
          <p style={{ marginTop: "2px", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
            {hint}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: values.length > 0 ? "8px 10px" : "0",
          marginBottom: values.length > 0 ? "8px" : "0",
        }}
      >
        {values.map((v, i) => (
          <div
            key={i}
            data-testid={`tag-${label.toLowerCase().replace(/\s+/g, "-")}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 10px 3px 10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.14)",
            }}
          >
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontFamily: "'Afacad', sans-serif" }}>
              {v}
            </span>
            <button
              type="button"
              data-testid={`button-remove-tag-${i}`}
              onClick={() => remove(i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                lineHeight: 1,
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder ?? "Type and press Enter"}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, "-")}`}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Afacad', sans-serif",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={commit}
          data-testid={`button-add-${label.toLowerCase().replace(/\s+/g, "-")}`}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? "rgba(255,255,255,0.08)" : "transparent",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "0.82rem",
            color: input.trim() ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontFamily: "'Afacad', sans-serif",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function UserProfileEditor() {
  const { data: rawProfile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user-profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE);
  const isHydrated = useRef(false);
  const isDirty = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (rawProfile !== undefined && !isHydrated.current) {
      isHydrated.current = true;
      if (!isDirty.current) {
        setData(parseProfile(rawProfile));
      }
    }
  }, [rawProfile]);

  const saveMutation = useMutation({
    mutationFn: async (next: ProfileData) => {
      const res = await apiRequest("PUT", "/api/user-profile", next);
      return res.json();
    },
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile"] });
      setTimeout(() => setSaveState("idle"), 1800);
    },
    onError: () => setSaveState("idle"),
  });

  function scheduleSave(next: ProfileData) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(next);
    }, 600);
  }

  function update(partial: Partial<ProfileData>) {
    isDirty.current = true;
    const next = { ...data, ...partial };
    setData(next);
    scheduleSave(next);
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <div
          style={{
            width: "22px",
            height: "22px",
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.4)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              marginBottom: "4px",
            }}
          >
            My Profile
          </h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Afacad', sans-serif" }}>
            Used by the Daily Prayer to personalize your intentions.
          </p>
        </div>
        {saveState !== "idle" && (
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: saveState === "saved" ? "rgba(120,220,120,0.7)" : "rgba(255,255,255,0.3)",
            }}
          >
            {saveState === "saving" ? "Saving…" : "Saved"}
          </span>
        )}
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "24px 24px 4px",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div style={{ marginBottom: "6px" }}>
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Spouse's Name
            </span>
            <p style={{ marginTop: "2px", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
              Used in Daily Prayer page 3. Leave empty if not applicable.
            </p>
          </div>
          <input
            type="text"
            value={data.spouseName}
            onChange={(e) => update({ spouseName: e.target.value })}
            placeholder="e.g. Maria"
            data-testid="input-spouse-name"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'Afacad', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <TagInput
          label="Children's Names"
          hint="Used in Daily Prayer page 3."
          values={data.childrenNames}
          onChange={(v) => update({ childrenNames: v })}
          placeholder="Add a child's name…"
        />

        <TagInput
          label="Family Members"
          hint="Other family members to lift up in prayer (parents, siblings, etc.)."
          values={data.familyMembers}
          onChange={(v) => update({ familyMembers: v })}
          placeholder="Add a family member…"
        />
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "24px 24px 4px",
        }}
      >
        <TagInput
          label="Chronic Issues"
          hint="Long-term struggles you want to detach your identity from (e.g. 'anxiety', 'chronic pain')."
          values={data.chronicIssues}
          onChange={(v) => update({ chronicIssues: v })}
          placeholder="Add an issue…"
        />

        <TagInput
          label="False Identity Labels"
          hint="Labels or names that do not belong to you in Christ (e.g. 'anxious person', 'broken one', 'addict')."
          values={data.chronicIdentityLabels}
          onChange={(v) => update({ chronicIdentityLabels: v })}
          placeholder="Add a label…"
        />
      </div>
    </div>
  );
}
