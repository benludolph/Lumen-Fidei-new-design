import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { SECTION_CATEGORIES, SECTIONS } from "@/components/workbook/section-definitions";
import { ChevronDown, ChevronRight, BookOpen, Clock } from "lucide-react";

const CATEGORY_UNLOCK_DAY: Record<number, number> = {
  1: 7,
  2: 9,
  3: 11,
  4: 12,
  5: 15,
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  list_builder: "List",
  lies_and_truths: "Lies & Truths",
  patterns_checklist: "Checklist",
  strongman_checklist: "Checklist",
};

function SectionRow({ section, defaultOpen }: { section: typeof SECTIONS[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div
      style={{
        borderRadius: "8px",
        border: "0.5px solid var(--white-8)",
        background: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        transition: "background 0.15s",
        overflow: "hidden",
      }}
    >
      <button
        data-testid={`button-section-${section.id}`}
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--white-30)", flexShrink: 0 }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="type-body-md font-medium" style={{ color: "var(--white-90)", flex: 1 }}>
          {section.name}
        </span>
        <span
          className="type-body-xs"
          style={{
            color: "var(--white-30)",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "4px",
            padding: "2px 8px",
            flexShrink: 0,
          }}
        >
          {SECTION_TYPE_LABELS[section.type] ?? section.type}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px 44px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p className="type-body-sm" style={{ color: "var(--white-60)", lineHeight: "1.7", margin: 0 }}>
            {section.description}
          </p>
          {section.actionItem && (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderLeft: "2px solid var(--brand)",
                borderRadius: "0 6px 6px 0",
                padding: "12px 14px",
              }}
            >
              <p className="type-body-xs font-semibold" style={{ color: "var(--brand)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                What participants are asked to do
              </p>
              <p className="type-body-sm" style={{ color: "var(--white-60)", lineHeight: "1.65", margin: 0 }}>
                {section.actionItem}
              </p>
            </div>
          )}
          {section.fields.length > 0 && (
            <div>
              <p className="type-body-xs font-semibold" style={{ color: "var(--white-30)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Fields they fill in
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {section.fields.map(f => (
                  <div
                    key={f.key}
                    className="type-body-xs"
                    style={{ color: "var(--white-50)", display: "flex", gap: "8px", alignItems: "baseline" }}
                  >
                    <span style={{ color: "var(--white-20)", flexShrink: 0 }}>·</span>
                    <span>
                      <span style={{ color: "var(--white-70)" }}>{f.label}</span>
                      {f.type === "boolean" && (
                        <span style={{ color: "var(--white-30)" }}> — checkbox</span>
                      )}
                      {f.type === "enum" && f.enumOptions && (
                        <span style={{ color: "var(--white-30)" }}> — choose from: {f.enumOptions.map(o => o.label).join(", ")}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: typeof SECTION_CATEGORIES[0] }) {
  const [open, setOpen] = useState(false);
  const unlockDay = CATEGORY_UNLOCK_DAY[category.id];
  const sections = SECTIONS.filter(s => s.categoryId === category.id);

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "0.5px solid var(--white-10)",
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      <button
        data-testid={`button-category-${category.id}`}
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          padding: "20px 22px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "var(--brand-subtle)",
            border: "1px solid var(--brand-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <span className="type-body-sm font-bold" style={{ color: "var(--brand)" }}>{category.id}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="type-body-lg font-semibold" style={{ color: "var(--white-90)" }}>{category.name}</span>
            {unlockDay && (
              <span
                className="type-body-xs"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--white-40)",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "4px",
                  padding: "2px 8px",
                }}
              >
                <Clock size={10} />
                Unlocks Day {unlockDay}
              </span>
            )}
          </div>
          <p className="type-body-sm" style={{ color: "var(--white-50)", margin: "4px 0 0", lineHeight: "1.5" }}>
            {category.description}
          </p>
          <p className="type-body-xs" style={{ color: "var(--white-30)", margin: "8px 0 0" }}>
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </p>
        </div>

        <span style={{ color: "var(--white-30)", flexShrink: 0, marginTop: "8px" }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      {open && (
        <div
          style={{
            borderTop: "0.5px solid var(--white-8)",
            padding: "16px 22px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {sections.map((s, i) => (
            <SectionRow key={s.id} section={s} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MentorWorkbookGuide() {
  return (
    <DashboardLayout>
      <PageContainer variant="content">
        <div style={{ paddingTop: "40px", paddingBottom: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <BookOpen size={22} style={{ color: "var(--brand)" }} />
            <h1 className="type-title-lg" style={{ color: "var(--white-90)", margin: 0 }}>
              Deliverance Workbook Guide
            </h1>
          </div>
          <p className="type-body-md" style={{ color: "var(--white-50)", marginBottom: "36px", maxWidth: "560px", lineHeight: "1.65" }}>
            A reference for mentors — read through the five categories and their sections to understand what your participants are working through. Participant responses are private and not visible here.
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid var(--white-8)",
              borderRadius: "8px",
              padding: "14px 18px",
              marginBottom: "32px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <Clock size={16} style={{ color: "var(--brand)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p className="type-body-sm font-semibold" style={{ color: "var(--white-70)", margin: "0 0 2px" }}>Unlock schedule</p>
              <p className="type-body-sm" style={{ color: "var(--white-40)", margin: 0, lineHeight: "1.6" }}>
                The workbook opens in Week 2. Categories unlock on specific days: Personal Sins (Day 7), Occult (Day 9), Generational Lines (Day 11), Inner Vows (Day 12), Wounds &amp; Forgiveness (Day 15).
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {SECTION_CATEGORIES.map(cat => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
