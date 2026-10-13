/**
 * Static documentation export only. Does not connect to a database or read users.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";
import { SECTION_CATEGORIES, SECTIONS } from "../client/src/components/workbook/section-definitions";
import { PRAYER_TEMPLATES, type PrayerNode } from "../client/src/components/workbook/prayer-templates";
import { STRONGMAN_CATEGORIES } from "../client/src/components/workbook/strongman-data";
import { DOMINANT_PATTERNS } from "../client/src/data/patterns_data";
import { LYING_SPIRITS, getAllEntries } from "../client/src/data/truth_library";

const output = "generated-artifacts/deliverance-workbook";
await mkdir(output, { recursive: true });
const sources: Record<string, string> = {};
async function source(path: string) {
  return sources[path] ??= await readFile(path, "utf8");
}
function staticString(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticString(node.left), right = staticString(node.right);
    if (left !== undefined && right !== undefined) return left + right;
  }
}
const sessionPath = "client/src/components/workbook/CategorySession.tsx";
const session = ts.createSourceFile(sessionPath, await source(sessionPath), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const sessionPrayers: Record<string, string> = {};
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ["OPENING_PRAYER", "CLOSING_PRAYER"].includes(node.name.text) && node.initializer) {
    const text = staticString(node.initializer);
    if (text === undefined) throw new Error(`Cannot extract ${node.name.text}`);
    sessionPrayers[node.name.text] = text;
  }
  ts.forEachChild(node, visit);
}
visit(session);
if (Object.keys(sessionPrayers).length !== 2) throw new Error("Missing session prayers");

const behavior = {
  scope: "Static workbook content and current implementation; no participant answers or account records.",
  distinction: "This is the personal Deliverance/Freedom Workbook, not the separate lesson-attached workbook modules or the complete teaching curriculum.",
  sectionCount: SECTIONS.length,
  categoryCount: SECTION_CATEGORIES.length,
  entryTypes: {
    list_builder: "Repeatable entries using each section's declared fields; add, edit, delete and attest that there is nothing to add.",
    lies_and_truths: {
      sectionId: 6,
      fields: ["lie", "spoken_by", "lying_spirit", "scripture_reference", "scripture_text", "truth_statement"],
      flow: "Record a lie and optional speaker, then select a lying-spirit category, Scripture and a first-person truth. Prayer rendering can filter for completed truths.",
    },
    patterns_checklist: { sectionId: 14, fields: ["checked", "other_freetext"], behavior: "A checklist entry; toggles save after a 500ms debounce." },
    strongman_checklist: { sectionId: 16, fields: ["checked", "freeTexts"], behavior: "Stores selected junior-spirit IDs and per-item free text in a checklist entry." },
    juniorSpiritDetails: { sectionId: 17, behavior: "Related detail entries are keyed by junior_spirit_ref; the server upserts an existing matching spirit rather than duplicating it." },
  },
  persistence: "Workbook entries, attestations, prayer streaks and profile information are personal, user-keyed records, not curriculum templates. Entries contain an ordered position and a flexible entryData object.",
  api: {
    read: ["GET /api/workbook/summary", "GET /api/workbook/unlock-status", "GET /api/workbook/week4-ready", "GET /api/workbook/:sectionId"],
    write: ["POST /api/workbook/:sectionId", "DELETE /api/workbook/entry/:id", "POST /api/workbook/attest/:sectionId", "DELETE /api/workbook/attest/:sectionId"],
    ownership: "Routes use the authenticated user's identity. Entry update and deletion are user-scoped.",
  },
  unlocks: {
    triggers: { 7: 1, 9: 2, 11: 3, 12: 4, 15: 5 },
    rule: "Morning completion on the trigger day OR pre-existing entries/attestation in any section of the server's category mapping.",
    privileged: "Admin and superuser are treated as unlocked/ready.",
    exemption: "Exempt participants see empty summary/entries and cannot write workbook records; readiness bypasses the workbook.",
    currentLimitation: "The inspected unlock/readiness routes still explicitly require user.track === 'A' for ordinary users. Do not assume new shared tracks have parity here.",
    mappingNote: "The current server category map differs from the client definition for section 24 and omits section 25. The export preserves both, rather than silently correcting this.",
    serverCategorySections: { 1: [1,4,8,9,11,13,14,18,24], 2: [5,12,19,20,21], 3: [15,16,17,22,23], 4: [6,7], 5: [2,3,10] },
    readiness: "At least one entry OR attestation in each of the five server categories, not every individual section completed.",
  },
  prayerRendering: {
    text: "Static prayer text is preserved verbatim.",
    inject: "Insert saved section values or profile fields using the declared format/filter. Empty-state and conditional behavior are defined in the templates and renderer reference.",
    conditional_block: "Only include when its specified profile field or qualifying section data is nonempty.",
    in_prayer_textarea: "Day-of input lives in component state; it is not saved to the database.",
    pageSkipping: "skipIfSectionsEmpty omits a page when all referenced sections have no entries; skipIfFilteredSectionEmpty uses the declared filter.",
    profileInputs: ["familyMembers", "spouseName", "childrenNames", "chronicIssues", "chronicIdentityLabels"],
  },
  streakStorage: "Current storage compares UTC calendar dates for canCompleteToday, treats <=48 hours since last completion as active, increments within that window and resets to 1 outside it. This describes storage logic, not a guarantee that all displayed prayer flows invoke it.",
};

const data = {
  title: "Lumen Fidei — Deliverance Workbook: Content and How It Works",
  behavior,
  categorySessionPrayers: sessionPrayers,
  categories: SECTION_CATEGORIES,
  sections: SECTIONS,
  dominantPatterns: DOMINANT_PATTERNS,
  strongmanCategories: STRONGMAN_CATEGORIES,
  lyingSpiritOptions: LYING_SPIRITS,
  scriptureTruthLibrary: getAllEntries(),
  prayerTemplates: PRAYER_TEMPLATES,
};

function renderNode(node: PrayerNode): string {
  if (node.type === "text") return node.content;
  if (node.type === "in_prayer_textarea") return `[[DAY-OF INPUT — not saved: ${node.placeholder}]]`;
  if (node.type === "inject") return `[[INSERT ${JSON.stringify(node)}]]`;
  const { nodes, ...condition } = node;
  return `\n[[CONDITIONAL BEGIN ${JSON.stringify(condition)}]]\n${nodes.map(renderNode).join("")}\n[[CONDITIONAL END]]\n`;
}
const jsonBlock = (value: unknown) => "\n```json\n" + JSON.stringify(value, null, 2) + "\n```\n";
let markdown = `# ${data.title}

## Purpose and privacy
This document contains the workbook's authored content and current behavior for use as context with another AI. No database was queried. No participant answers, names, profile values, credentials, or account data are included.

The prayers and descriptions below are the application's religious content, preserved as written—not independent medical advice or an external verification of their claims. This export does not include the full teaching curriculum or the separate lesson-attached workbook slides.

## How to use with another AI
Upload this Markdown document for readable content and implementation explanations. The companion JSON contains the same definitions in a machine-readable form. Bracketed INSERT/DAY-OF/CONDITIONAL markers represent dynamic slots, not missing participant data. Do not invent personal answers for these slots.

## Current behavior and known limitations
${jsonBlock(behavior)}
## Category-session prayers
`;
for (const [name, text] of Object.entries(sessionPrayers)) markdown += `\n### ${name}\n\n${text}\n`;
markdown += "\n## Categories and complete section definitions\n";
for (const category of SECTION_CATEGORIES) {
  markdown += `\n### Category ${category.id}: ${category.name}\n\n${category.description}\n`;
  for (const section of SECTIONS.filter(s => s.categoryId === category.id)) {
    markdown += `\n#### Section ${section.id}: ${section.name}\n\n**Editor:** ${section.type}\n\n${section.description}\n\n**Action:** ${section.actionItem || "(No separate action text)"}\n`;
    if (section.prayerHint) markdown += `\n**Prayer hint:** ${section.prayerHint}\n`;
    markdown += `\n**Exact fields and options:**\n${jsonBlock(section.fields)}`;
  }
}
markdown += "\n## Dominant-pattern checklist\n" + DOMINANT_PATTERNS.map(p => `- ${p}`).join("\n") + "\n";
markdown += "\n## Strongman categories and junior spirits\n" + jsonBlock(STRONGMAN_CATEGORIES);
markdown += "\n## Lies and truths: selection options\n" + jsonBlock(LYING_SPIRITS);
markdown += "\n## Complete Scripture and first-person-truth library\n";
for (const entry of getAllEntries()) markdown += `\n### ${entry.spirit} — ${entry.scripture_reference}\n\n${entry.scripture_text}\n\n**First-person truth:** ${entry.first_person_truth}\n`;
markdown += "\n## Full prayer text and dynamic-slot placement\n";
for (const prayer of Object.values(PRAYER_TEMPLATES)) {
  markdown += `\n### ${prayer.title} (${prayer.id})\n\n${prayer.subtitle}\n`;
  for (const [index, page] of prayer.pages.entries()) {
    markdown += `\n#### Page ${index + 1}: ${page.title}\n`;
    if (page.skipIfSectionsEmpty || page.skipIfFilteredSectionEmpty) markdown += jsonBlock({ skipIfSectionsEmpty: page.skipIfSectionsEmpty, skipIfFilteredSectionEmpty: page.skipIfFilteredSectionEmpty });
    markdown += "\n" + page.nodes.map(renderNode).join("") + "\n";
  }
}
// Exact code excerpts clarify filters/sentence generation and server enforcement,
// without importing server modules, reading private rows, or exporting secrets.
markdown += "\n## Technical reference: exact implementation excerpts\n\nThese excerpts document behavior, not a separately runnable application. They may expose implementation limitations; the export does not change the app.\n";
const references = [
  { path: "client/src/components/workbook/PrayerRender.tsx", start: "function joinComma", end: "export default function PrayerRender" },
  { path: "server/routes.ts", start: "  // === Deliverance Workbook ===", end: "  // === User Profile ===" },
  { path: "server/storage.ts", start: "  // Deliverance Workbook\n", end: "  // User Profile\n" },
  { path: "shared/schema.ts", start: "// === DELIVERANCE WORKBOOK TABLES ===", end: "// === USER PROFILE TABLE ===" },
];
for (const ref of references) {
  const text = await source(ref.path);
  const start = text.lastIndexOf(ref.start), end = text.indexOf(ref.end, start);
  if (start < 0 || end < 0) throw new Error(`Reference markers missing: ${ref.path}`);
  markdown += `\n### Reference: ${ref.path}\n\n\`\`\`typescript\n${text.slice(start, end)}\n\`\`\`\n`;
}
for (const path of [
  "client/src/components/workbook/section-definitions.ts",
  "client/src/components/workbook/prayer-templates.ts",
  "client/src/components/workbook/strongman-data.ts",
  "client/src/data/patterns_data.ts",
  "client/src/data/catholic_truth_library.json",
]) await source(path);
markdown += "\n## Source verification\n\nStatic source SHA-256 fingerprints identify the version exported. No participant data is included.\n";
markdown += jsonBlock(Object.fromEntries(Object.entries(sources).map(([path, text]) => [path, createHash("sha256").update(text).digest("hex")])));
await writeFile(`${output}/deliverance-workbook.md`, markdown);
await writeFile(`${output}/deliverance-workbook.json`, JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({
  sections: SECTIONS.length, categories: SECTION_CATEGORIES.length,
  prayers: Object.keys(PRAYER_TEMPLATES).length,
  prayerPages: Object.values(PRAYER_TEMPLATES).reduce((n, p) => n + p.pages.length, 0),
  patterns: DOMINANT_PATTERNS.length, scriptureEntries: getAllEntries().length,
  markdownBytes: Buffer.byteLength(markdown), databaseAccess: false,
}));
