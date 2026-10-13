import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { PRAYER_TEMPLATES } from "./prayer-templates";
import type {
  PrayerNode,
  TextNode,
  InjectNode,
  InPrayerTextareaNode,
  ConditionalBlockNode,
  InjectFilter,
  InjectFormat,
  PrayerTemplate,
} from "./prayer-templates";
import { SECTIONS } from "./section-definitions";
import WorkbookAccessGate from "./WorkbookAccessGate";
import { isFaithAnswered, useWorkbookProfile } from "@/hooks/use-workbook-profile";
import type { WorkbookEntry, PrayerId, UserProfile } from "@shared/schema";

interface PrayerRenderProps {
  prayerId: PrayerId;
  onDone: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function joinComma(items: string[]): string {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function filterEntries(
  entries: WorkbookEntry[],
  filter: InjectFilter | undefined,
): WorkbookEntry[] {
  if (!filter) return entries;
  switch (filter) {
    case "where_how_encouraged":
      return entries.filter(e => ["I encouraged, approved, or went along with it", "I encouraged, approved, or went along with it."].includes(String(e.entryData.how)));
    case "where_who_someone":
      return entries.filter(e => !String(e.entryData.who_kind ?? "").trim() || e.entryData.who_kind === "Someone who hurt me");
    case "where_who_self":
      return entries.filter(e => e.entryData.who_kind === "Myself");
    case "where_who_god":
      return entries.filter(e => e.entryData.who_kind === "My anger at God" || e.entryData.who_kind === "My anger at God.");
    case "where_kind_pact":
      return entries.filter(e => ["A spell, curse, or pact I made", "A spell, curse, or pact I made."].includes(String(e.entryData.kind)));
    case "where_amends_owed":
      return entries.filter(e => e.entryData.amends_owed === true);
    case "where_is_family_harm":
      return entries.filter((e) => {
        const v = (e.entryData as Record<string, unknown>)?.is_family_harm;
        return v === true || v === "true";
      });
    case "where_kind_curse":
      return entries.filter((e) => (e.entryData as Record<string, unknown>)?.kind === "Curse against family");
    case "where_kind_blood_contract":
      return entries.filter((e) => (e.entryData as Record<string, unknown>)?.kind === "Blood contract/ritual bond");
    case "where_spoken_by_nonempty":
      return entries.filter((e) => Boolean(((e.entryData as Record<string, unknown>)?.spoken_by as string)?.trim()));
    case "where_spoken_by_empty":
      return entries.filter((e) => !Boolean(((e.entryData as Record<string, unknown>)?.spoken_by as string)?.trim()));
    case "where_truth_nonempty":
      return entries.filter((e) => Boolean(((e.entryData as Record<string, unknown>)?.truth_statement as string)?.trim()));
    case "where_for_healing":
      return entries.filter((e) => {
        const v = (e.entryData as Record<string, unknown>)?.for_healing;
        return v === true || v === "true";
      });
    case "whose_father":
      return entries.filter((e) => (e.entryData as Record<string, unknown>)?.whose === "Father");
    case "whose_mother":
      return entries.filter((e) => (e.entryData as Record<string, unknown>)?.whose === "Mother");
    case "whose_family":
      return entries.filter((e) => (e.entryData as Record<string, unknown>)?.whose === "Family/Childhood");
    case "skip_empties":
      return entries; // handled at field extraction level
    default:
      return entries;
  }
}

export function evaluateInjectToString(
  node: InjectNode,
  allEntries: Record<number, WorkbookEntry[]>,
  profile: UserProfile | null | undefined,
): string {
  // ── User Profile ──
  if (node.profileField) {
    if (!profile) return "";
    const value = (profile as Record<string, unknown>)[node.profileField];
    if (Array.isArray(value)) {
      const items = (value as string[]).filter(v => typeof v === "string" && v.trim());
      return joinComma(items);
    }
    return typeof value === "string" ? value : "";
  }

  const sectionId = node.sectionId!;
  let entries = filterEntries(allEntries[sectionId] ?? [], node.filter);

  // ── Section 14 checklist ──
  if (node.format === "patterns_comma" || node.format === "spirits_with_every_prefix") {
    const data = entries[0]?.entryData as Record<string, unknown> | undefined;
    const checked: string[] = Array.isArray(data?.checked)
      ? (data.checked as string[]).filter(Boolean)
      : [];
    if (!checked.length) return "";
    if (node.format === "patterns_comma") return joinComma(checked);
    return joinComma(checked.map((n) => `every spirit of ${n}`));
  }

  // ── Standard list_builder fields ──
  const field = node.field!;
  let values = entries
    .map((e) => String((e.entryData as Record<string, unknown>)?.[field] ?? ""))
    .filter((v) => Boolean(v.trim()));

  if (node.filter === "skip_empties") {
    values = values.filter(Boolean);
  }

  return joinComma(values);
}

function isProfileFieldNonEmpty(
  profile: UserProfile | null | undefined,
  profileField: string,
): boolean {
  if (!profile) return false;
  const value = (profile as Record<string, unknown>)[profileField];
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(v => typeof v === "string" && v.trim());
  return false;
}

// ─── Highlighted inject span ──────────────────────────────────────────────────

const HIGHLIGHT_STYLE: React.CSSProperties = {
  display: "inline",
  color: "#e8c88a",
  padding: "2px 5px",
  borderRadius: "4px",
  background: "rgba(232,200,138,0.08)",
  border: "0.5px solid rgba(232,200,138,0.18)",
};

const EMPTY_INJECT_STYLE: React.CSSProperties = {
  display: "inline",
  fontStyle: "italic",
  color: "rgba(255,255,255,0.22)",
  padding: "2px 6px",
  borderRadius: "4px",
  background: "rgba(255,255,255,0.03)",
  border: "0.5px dashed rgba(255,255,255,0.1)",
};

const ENTRY_STYLE: React.CSSProperties = {
  display: "block",
  padding: "9px 14px",
  marginBottom: "6px",
  borderRadius: "6px",
  background: "rgba(232,200,138,0.05)",
  border: "0.5px solid rgba(232,200,138,0.15)",
  color: "rgba(255,255,255,0.84)",
  lineHeight: 1.65,
};

// ─── Page node renderer ───────────────────────────────────────────────────────

export function renderNodes(
  nodes: PrayerNode[],
  allEntries: Record<number, WorkbookEntry[]>,
  profile: UserProfile | null | undefined,
  textareaValues: Record<string, string>,
  setTextareaValue: (key: string, val: string) => void,
  pageIndex: number,
  keyPrefix = "",
): React.ReactNode {
  return nodes.map((node, ni) => {
    const key = `${keyPrefix}${pageIndex}-${ni}`;

    if (node.type === "text") {
      return <span key={key}>{(node as TextNode).content}</span>;
    }

    if (node.type === "in_prayer_textarea") {
      const ta = node as InPrayerTextareaNode;
      const val = textareaValues[key] ?? "";
      return (
        <span key={key} style={{ display: "block", margin: "10px 0" }}>
          {val.trim() && <span>{ta.before}</span>}
          <textarea
            aria-label={ta.placeholder}
            value={val}
            onChange={(e) => setTextareaValue(key, e.target.value)}
            placeholder={ta.placeholder}
            rows={3}
            data-testid={`textarea-prayer-${key}`}
            style={{
              width: "100%",
              background: val ? "rgba(232,200,138,0.06)" : "rgba(255,255,255,0.03)",
              border: val
                ? "0.5px solid rgba(232,200,138,0.3)"
                : "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "10px 14px",
              color: val ? "#e8c88a" : "rgba(255,255,255,0.28)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.95rem",
              lineHeight: 1.55,
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.15s, color 0.15s",
            }}
          />
          {val.trim() && <span>{ta.after}</span>}
        </span>
      );
    }

    if (node.type === "conditional_block") {
      const cb = node as ConditionalBlockNode;

      let shouldRender = false;
      if (cb.faith) {
        shouldRender = cb.faith === "catholic"
          ? profile?.faithTradition === "Yes"
          : isFaithAnswered(profile?.faithTradition) && profile?.faithTradition !== "Yes";
      } else if (cb.profileField) {
        shouldRender = isProfileFieldNonEmpty(profile, cb.profileField);
      } else if (cb.sectionId != null && cb.sectionField) {
        let entries = allEntries[cb.sectionId] ?? [];
        if (cb.sectionFilter) entries = filterEntries(entries, cb.sectionFilter);
        shouldRender = entries.some((e) => {
          const val = (e.entryData as Record<string, unknown>)?.[cb.sectionField!];
          if (typeof val === "boolean") return val === true;
          if (Array.isArray(val)) return val.some(v => typeof v === "string" && v.trim());
          return String(val ?? "").trim().length > 0;
        });
      }

      if (!shouldRender) return null;
      return (
        <span key={key}>
          {renderNodes(
            cb.nodes,
            allEntries,
            profile,
            textareaValues,
            setTextareaValue,
            pageIndex,
            `${key}-`,
          )}
        </span>
      );
    }

    if (node.type === "inject") {
      const inj = node as InjectNode;

      // ── Block format: infirmities_each ──
      if (inj.format === "infirmities_each") {
        const entries = filterEntries(allEntries[inj.sectionId!] ?? [], inj.filter);
        const items = entries
          .map((e) => String((e.entryData as Record<string, unknown>)?.[inj.field!] ?? ""))
          .filter(Boolean);
        if (!items.length) return null;
        return (
          <span key={key} style={{ display: "block", margin: "8px 0" }}>
            {items.map((item, ii) => (
              <span
                key={ii}
                style={{ display: "block", ...HIGHLIGHT_STYLE, marginBottom: "4px" }}
              >
                {item}, go in the Name of Jesus Christ.
              </span>
            ))}
          </span>
        );
      }

      // ── Block format: lies_with_truths ──
      if (inj.format === "lies_with_truths") {
        const entries = filterEntries(allEntries[6] ?? [], "where_truth_nonempty");
        if (!entries.length) {
          return (
            <span
              key={key}
              style={{
                display: "block",
                margin: "8px 0",
                padding: "14px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.65,
              }}
            >
              {inj.emptyStateText}
            </span>
          );
        }
        return (
          <span key={key} style={{ display: "block", margin: "8px 0" }}>
            {entries.map((e, ii) => {
              const d = e.entryData as Record<string, string>;
              return (
                <span
                  key={ii}
                  style={{
                    display: "block",
                    marginBottom: "12px",
                    padding: "12px 16px",
                    background: "rgba(232,200,138,0.05)",
                    border: "0.5px solid rgba(232,200,138,0.18)",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.65,
                  }}
                >
                  {"I reject the lie that "}
                  <strong style={{ color: "#e8c88a" }}>{d.lie}</strong>
                  {". The Lord reminds me: "}
                  <strong style={{ color: "#e8c88a" }}>{d.truth_statement}</strong>
                  {d.scripture_reference
                    && d.scripture_text?.trim()
                    ? `. As Scripture says, ${d.scripture_reference}: "${d.scripture_text}"`
                    : "."}
                </span>
              );
            })}
          </span>
        );
      }

      // ── Block formats: per-entry sentence renderers ──
      const BLOCK_FORMATS = [
        "items_each",
        "renounce_each",
        "renounce_lodge_each",
        "renounce_simple_each",
        "renounce_spirit_each",
        "forgive_each",
        "family_dead_each",
        "let_end_each",
        "ancestor_each",
        "pattern_side_each",
      ];

      if (BLOCK_FORMATS.includes(inj.format)) {
        const entries = filterEntries(allEntries[inj.sectionId!] ?? [], inj.filter);
        if (!entries.length) return null;

        const renderEntry = (e: WorkbookEntry, ii: number) => {
          const d = e.entryData as Record<string, string>;
          if (inj.format !== "family_dead_each" && !String(d[inj.field!] ?? "").trim()) return null;
          let sentence = "";

          if (inj.format === "items_each") {
            sentence = d[inj.field!] ?? "";
          } else if (inj.format === "renounce_each") {
            const val = d[inj.field!] ?? "";
            sentence = `In the name of Jesus Christ, and by the power of His Blood, I renounce ${val} in our family line.`;
          } else if (inj.format === "renounce_lodge_each") {
            const val = d[inj.field!] ?? "";
            sentence = `I renounce ${val} and every oath, degree, penalty, and curse connected to it.`;
          } else if (inj.format === "renounce_simple_each") {
            const val = d[inj.field!] ?? "";
            sentence = `I renounce ${val}.`;
          } else if (inj.format === "renounce_spirit_each") {
            const val = d[inj.field!] ?? "";
            sentence = `I renounce ${val}. I will not serve you. Jesus Christ is my only Lord.`;
          } else if (inj.format === "pattern_side_each") {
            const sides: Record<string, string> = {
              "Father's side": "father's side", "Mother's side": "mother's side",
              "Both": "both sides", "Both sides": "both sides",
              "Adoptive": "adoptive family", "Adoptive family": "adoptive family",
              "Adoptive family.": "adoptive family",
            };
            const side = sides[d.side];
            sentence = `${d[inj.field!] ?? ""}${side ? ` (${side})` : ""}`;
          } else if (inj.format === "forgive_each") {
            const person = d.person ?? "";
            const what = d.what?.trim() ? ` for ${d.what.trim()}` : "";
            sentence = `I forgive ${person}${what}.`;
          } else if (inj.format === "let_end_each") {
            const val = d[inj.field!] ?? "";
            sentence = `Let ${val} end with me.`;
          } else if (inj.format === "ancestor_each") {
            const name = d.name_or_description ?? "";
            const groups = d.groups_or_sins_involved?.trim();
            sentence = groups ? `${name} — ${groups}` : name;
          } else if (inj.format === "family_dead_each") {
            const name = d.name?.trim() || "this member of our family";
            const circumstance = d.circumstance ?? "";
            const isChild = circumstance === "Miscarried child" || circumstance === "Aborted child";
            if (isChild) {
              const childName = d.named_now?.trim() || "known to You by name";
              sentence = `I entrust this child, ${childName}, to Your mercy. I acknowledge this child as part of our family, and I mourn this child now. Receive this child into Your arms.`;
            } else {
              if (!d.name?.trim()) return null;
              sentence = `I remember ${name} before You. I mourn this loss, and I entrust ${name} to Your mercy.`;
            }
          }

          if (!sentence.trim()) return null;
          return (
            <span key={ii} style={{ ...ENTRY_STYLE, marginBottom: "8px" }}>
              {sentence}
            </span>
          );
        };

        return (
          <span key={key} style={{ display: "block", margin: "4px 0" }}>
            {entries.map((e, ii) => renderEntry(e, ii))}
          </span>
        );
      }

      // ── Inline format ──
      const value = evaluateInjectToString(inj, allEntries, profile);
      if (!value) return null;
      return (
        <span key={key} style={HIGHLIGHT_STYLE}>
          {value}
        </span>
      );
    }

    return null;
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function getVisiblePages(template: PrayerTemplate, allEntries: Record<number, WorkbookEntry[]>) {
  const hasContent = (nodes: PrayerNode[]): boolean => nodes.some(node => {
    if (node.type === "text") return Boolean(node.content.trim());
    if (node.type === "conditional_block" && node.sectionId && node.sectionField) {
      return filterEntries(allEntries[node.sectionId] ?? [], node.sectionFilter).some(e => {
        const value = e.entryData[node.sectionField!];
        return typeof value === "boolean" ? value : typeof value === "string" ? Boolean(value.trim())
          : Array.isArray(value) && value.some(v => typeof v === "string" && v.trim());
      }) && hasContent(node.nodes);
    }
    return true;
  });
  return template.pages.filter(page => {
    if (!hasContent(page.nodes)) return false;
    if (page.requiresCheckedThemes && !evaluateInjectToString(
      { type: "inject", sectionId: 14, format: "patterns_comma" }, allEntries, null,
    )) return false;
    if (page.skipIfSectionsEmpty && !page.skipIfSectionsEmpty.some(id =>
      (allEntries[id] ?? []).some(e => Object.values(e.entryData).some(value =>
        typeof value === "string" ? Boolean(value.trim()) : Array.isArray(value) && value.length > 0,
      )),
    )) return false;
    if (page.skipIfFilteredSectionEmpty) {
      const { sectionId, filter } = page.skipIfFilteredSectionEmpty;
      if (!filterEntries(allEntries[sectionId] ?? [], filter).length) return false;
    }
    return true;
  });
}

export default function PrayerRender({ prayerId, onDone }: PrayerRenderProps) {
  return <WorkbookAccessGate onDismiss={onDone}><PrayerContent key={prayerId} prayerId={prayerId} onDone={onDone} /></WorkbookAccessGate>;
}

function PrayerContent({ prayerId, onDone }: PrayerRenderProps) {
  const template = PRAYER_TEMPLATES[prayerId];
  const [pageIndex, setPageIndex] = useState(0);
  const [textareaValues, setTextareaValuesState] = useState<Record<string, string>>({});

  function setTextareaValue(key: string, val: string) {
    setTextareaValuesState((prev) => ({ ...prev, [key]: val }));
  }

  // Fetch all workbook entries
  const sectionQueries = SECTIONS.map((s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery<WorkbookEntry[]>({ queryKey: [`/api/workbook/${s.id}`] }),
  );

  const { data: profile } = useWorkbookProfile();

  const isLoading = sectionQueries.some((q) => q.isLoading);

  const allEntries: Record<number, WorkbookEntry[]> = {};
  SECTIONS.forEach((s, i) => {
    allEntries[s.id] = sectionQueries[i].data ?? [];
  });

  if (!template) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
        Prayer not found.
      </div>
    );
  }

  // Compute which pages should actually render (respecting skip rules)
  const visiblePages = getVisiblePages(template, allEntries);

  if (isLoading) return <p aria-busy="true" style={{ padding: 32 }}>Loading your prayer…</p>;
  if (sectionQueries.some(q => q.isError)) return <div role="alert" style={{ padding: 32 }}>
    Could not load your workbook. Your prayer has not been opened with missing entries.
    <button onClick={() => sectionQueries.filter(q => q.isError).forEach(q => q.refetch())}>Try again</button>
  </div>;

  const currentPage = visiblePages[pageIndex] ?? visiblePages[0];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex >= visiblePages.length - 1;

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
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <button
            type="button"
            onClick={onDone}
            data-testid="button-prayer-back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: "16px",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "rgba(255,255,255,0.3)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")
            }
          >
            <ChevronLeft style={{ width: "12px", height: "12px" }} />
            The Deliverance Workbook
          </button>

          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}
          >
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.35)",
                margin: 0,
              }}
            >
              {template.title}
            </p>
          </div>

          <h1
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(22px, 3.5vw + 6px, 38px)",
              lineHeight: 1.15,
              color: "white",
              margin: 0,
            }}
          >
            {currentPage.title}
          </h1>
        </div>

        {/* Page indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "28px",
          }}
        >
          {visiblePages.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === pageIndex ? "18px" : "6px",
                height: "4px",
                borderRadius: "999px",
                background:
                  i === pageIndex
                    ? "rgba(255,255,255,0.5)"
                    : i < pageIndex
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
              }}
            />
          ))}
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.25)",
              marginLeft: "6px",
            }}
          >
            {pageIndex + 1} / {visiblePages.length}
          </span>
        </div>

        {/* Prayer text */}
        <div
          style={{
            borderRadius: "10px",
            border: "0.5px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "28px 32px",
            marginBottom: "24px",
            minHeight: "220px",
          }}
        >
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "40px" }}>
              <div
                className="animate-spin"
                style={{
                  width: "22px",
                  height: "22px",
                  border: "2px solid rgba(255,255,255,0.1)",
                  borderTopColor: "rgba(255,255,255,0.5)",
                  borderRadius: "50%",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "1.05rem",
                lineHeight: 1.78,
                color: "rgba(255,255,255,0.75)",
                whiteSpace: "pre-wrap",
              }}
            >
              {renderNodes(
                currentPage.nodes,
                allEntries,
                profile,
                textareaValues,
                setTextareaValue,
                pageIndex,
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={isFirst}
            data-testid="button-prayer-prev"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "7px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.82rem",
              color: isFirst ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
              cursor: isFirst ? "default" : "pointer",
              opacity: isFirst ? 0.4 : 1,
            }}
          >
            <ChevronLeft style={{ width: "13px", height: "13px" }} />
            Previous
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            {isLast ? (
              <>
                {/* Done button */}
                <button
                  type="button"
                  onClick={onDone}
                  data-testid="button-prayer-done"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "7px",
                    background: "rgba(255,255,255,0.07)",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPageIndex((p) => Math.min(visiblePages.length - 1, p + 1))
                }
                data-testid="button-prayer-next"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.08)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                }}
              >
                Next
                <ChevronRight style={{ width: "13px", height: "13px" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
