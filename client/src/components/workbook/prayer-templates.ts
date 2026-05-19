/**
 * prayer-templates.ts
 *
 * STUB FILE — prayer text will be filled in once the source manual is provided.
 *
 * Each prayer is an array of pages. A page is either:
 *  - { type: "static", text: string }               — verbatim prayer text, no user data needed
 *  - { type: "template", text: string, sections: number[] } — prayer text referencing workbook sections
 *
 * The text field on template pages uses [SECTION_N] placeholders that PrayerRender
 * replaces with the user's actual entries from those sections.
 *
 * ⚠️  DO NOT author or paraphrase prayer text here.
 * Insert verbatim wording from the source manual when it is available.
 */

export type StaticPage = {
  type: "static";
  text: string;
};

export type TemplatePage = {
  type: "template";
  text: string;
  /** Which workbook section IDs are referenced in this page */
  sections: number[];
};

export type PrayerPage = StaticPage | TemplatePage;

export type PrayerTemplate = {
  id: "prayer_1" | "prayer_2" | "prayer_3";
  title: string;
  subtitle: string;
  pages: PrayerPage[];
};

// ─── PRAYER #1 ────────────────────────────────────────────────────────────────
// One-time freedom prayer. Covers sections 1–15 (lies, fears, sins, occult,
// vows, soul ties, forgiveness wounds, generational patterns, negative words).
// Sections 16–18 are covered by Prayer #2 / Prayer #3.
// ─────────────────────────────────────────────────────────────────────────────
export const PRAYER_1: PrayerTemplate = {
  id: "prayer_1",
  title: "Freedom Prayer #1",
  subtitle: "Renouncing lies, sins, and wounds",
  pages: [
    // ── PAGE 1 ──
    // ⚠️ Replace with verbatim text from source manual (Prayer #1, page 1)
    {
      type: "static",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\n" +
        "This page will contain the verbatim opening of Prayer #1 from the source manual.\n" +
        "The ministry team will supply the exact wording.",
    },
    // ── PAGE 2 ──
    // ⚠️ Replace with verbatim text — references Section 1 (Lies I've Believed)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\n" +
        "This page will reference the user's entries from Section 1 (Lies I've Believed): [SECTION_1]",
      sections: [1],
    },
    // ── PAGE 3 ──
    // ⚠️ References Section 2 (Fears I've Carried)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 2 entries: [SECTION_2]",
      sections: [2],
    },
    // ── PAGE 4 ──
    // ⚠️ References Sections 3 + 4 + 5 (Sins Against God / Others / Self)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 3: [SECTION_3]\nSection 4: [SECTION_4]\nSection 5: [SECTION_5]",
      sections: [3, 4, 5],
    },
    // ── PAGE 5 ──
    // ⚠️ References Section 6 (Occult Involvement)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 6: [SECTION_6]",
      sections: [6],
    },
    // ── PAGE 6 ──
    // ⚠️ References Section 7 (Inner Vows)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 7: [SECTION_7]",
      sections: [7],
    },
    // ── PAGE 7 ──
    // ⚠️ References Section 8 (Soul Ties)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 8: [SECTION_8]",
      sections: [8],
    },
    // ── PAGE 8 ──
    // ⚠️ References Section 9 (Forgiveness)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 9: [SECTION_9]",
      sections: [9],
    },
    // ── PAGE 9 ──
    // ⚠️ References Sections 10 + 11 + 12 (Childhood Wounds / Traumas / Sexual)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 10: [SECTION_10]\nSection 11: [SECTION_11]\nSection 12: [SECTION_12]",
      sections: [10, 11, 12],
    },
    // ── PAGE 10 ──
    // ⚠️ References Sections 13 + 14 + 15 (Generational / Negative words)
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nSection 13: [SECTION_13]\nSection 14: [SECTION_14]\nSection 15: [SECTION_15]",
      sections: [13, 14, 15],
    },
    // ── CLOSING PAGE ──
    {
      type: "static",
      text: "[PRAYER SOURCE TEXT PENDING — closing prayer]",
    },
  ],
};

// ─── PRAYER #2 ────────────────────────────────────────────────────────────────
// 3-day streak prayer. References Section 16 (Strongman Spirits) and
// Section 17 (Things to Renounce).
// ─────────────────────────────────────────────────────────────────────────────
export const PRAYER_2: PrayerTemplate = {
  id: "prayer_2",
  title: "Freedom Prayer #2",
  subtitle: "Binding strongman spirits — Day {day} of 3",
  pages: [
    {
      type: "static",
      text: "[PRAYER SOURCE TEXT PENDING — Prayer #2 opening]",
    },
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nStrongman spirits identified (Section 16): [SECTION_16]\nThings to renounce (Section 17): [SECTION_17]",
      sections: [16, 17],
    },
    {
      type: "static",
      text: "[PRAYER SOURCE TEXT PENDING — Prayer #2 closing]",
    },
  ],
};

// ─── PRAYER #3 ────────────────────────────────────────────────────────────────
// Daily Renewal — ongoing streak prayer. References Section 18 (Blessings).
// ─────────────────────────────────────────────────────────────────────────────
export const PRAYER_3: PrayerTemplate = {
  id: "prayer_3",
  title: "Daily Renewal Prayer",
  subtitle: "Day {day} streak",
  pages: [
    {
      type: "static",
      text: "[PRAYER SOURCE TEXT PENDING — Daily Renewal opening]",
    },
    {
      type: "template",
      text:
        "[PRAYER SOURCE TEXT PENDING]\n\nBlessings to declare (Section 18): [SECTION_18]",
      sections: [18],
    },
    {
      type: "static",
      text: "[PRAYER SOURCE TEXT PENDING — Daily Renewal closing]",
    },
  ],
};

export const PRAYER_TEMPLATES: Record<string, PrayerTemplate> = {
  prayer_1: PRAYER_1,
  prayer_2: PRAYER_2,
  prayer_3: PRAYER_3,
};
