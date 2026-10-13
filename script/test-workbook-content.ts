import assert from "node:assert/strict";
import defaults from "../shared/workbook-content-defaults.json";
import { PRAYER_FORMAT_COPY, formatPrayerCopy } from "../shared/workbook-prayer-copy";
import { DEFAULT_WORKBOOK_DOCUMENT, WORKBOOK_FIELDS, workbookDocumentSchema, buildWorkbookSections, buildWorkbookCategories, buildWorkbookPrayers, buildWorkbookPatterns } from "../shared/workbook-content";

const baseline = structuredClone(DEFAULT_WORKBOOK_DOCUMENT);
assert.ok(workbookDocumentSchema.safeParse(baseline).success, "initial document is valid");
assert.equal(new Set(WORKBOOK_FIELDS.map(field => field.key)).size, WORKBOOK_FIELDS.length, "keys unique");
assert.deepEqual(buildWorkbookSections(baseline), defaults.sections, "all section copy and structure preserved");
assert.deepEqual(buildWorkbookCategories(baseline), defaults.categories, "category copy preserved");
assert.deepEqual(buildWorkbookPrayers(baseline), defaults.prayers, "prayer text and injection rules preserved");
assert.deepEqual(buildWorkbookPatterns(baseline).map(pattern => pattern.value), defaults.patterns);

const edited = structuredClone(baseline);
edited.texts["sections.1.name"] = "An editorial title";
edited.texts["sections.1.fields.sin.label"] = "Edited display label";
edited.texts["sections.1.fields.sin.placeholder"] = "";
edited.texts["patterns.0.label"] = "A revised pattern label";
edited.texts["sections.1.teaching"] = "";
edited.texts["prayers.prayer_1.pages.0.nodes.0.content"] = "Edited prayer text";
assert.ok(workbookDocumentSchema.safeParse(edited).success);
const built = buildWorkbookSections(edited);
assert.equal(built[0].name, "An editorial title");
assert.equal(built[0].fields[0].key, defaults.sections[0].fields[0].key, "saved-answer key protected");
assert.equal(built[0].fields[0].placeholder, undefined);
assert.equal(built[0].teaching, undefined);
assert.equal(buildWorkbookPatterns(edited)[0].value, defaults.patterns[0]);
assert.equal(buildWorkbookPatterns(edited)[0].label, "A revised pattern label");
assert.deepEqual(buildWorkbookPrayers(edited).prayer_1.pages[0].nodes.slice(1), defaults.prayers.prayer_1.pages[0].nodes.slice(1));
assert.deepEqual(DEFAULT_WORKBOOK_DOCUMENT, baseline, "builders never mutate defaults");
assert.equal(formatPrayerCopy(PRAYER_FORMAT_COPY.familyDead, { name: "Sample relative" }), "I remember Sample relative before You. I mourn this loss, and I entrust Sample relative to Your mercy.");
assert.equal(formatPrayerCopy(PRAYER_FORMAT_COPY.forgiveWithHarm, { name: "Sample person", value: "{{name}}" }), "I forgive Sample person for {{name}}.", "user answers are not re-interpolated");

for (const key of ["sections.1.id", "sections.1.type", "sections.1.fields.sin.key", "sections.1.fields.sin.required", "prayers.prayer_1.pages.0.nodes.0.type"]) {
  const invalid = structuredClone(baseline);
  invalid.texts[key] = "malicious";
  assert.equal(workbookDocumentSchema.safeParse(invalid).success, false, `protected ${key}`);
}
const missing = structuredClone(baseline);
delete missing.texts["sections.1.name"];
assert.equal(workbookDocumentSchema.safeParse(missing).success, false);
const blank = structuredClone(baseline);
blank.texts["sections.1.name"] = " ";
assert.equal(workbookDocumentSchema.safeParse(blank).success, false);
const token = structuredClone(baseline);
token.texts["sections.1.name"] += "{{profile.password}}";
assert.equal(workbookDocumentSchema.safeParse(token).success, false, "cannot invent dynamic tokens");
const incompleteNote = structuredClone(baseline);
incompleteNote.texts["sections.1.extraNote.label"] = "Note without body";
assert.equal(workbookDocumentSchema.safeParse(incompleteNote).success, false);
for (const id of [14, 23]) assert.equal(buildWorkbookSections(baseline).find(s => s.id === id)?.confession, undefined, "intentional absent Confession blocks preserved");
assert.equal(buildWorkbookSections(baseline).find(s => s.id === 14)?.teaching, undefined);
console.log(`Workbook content: ${WORKBOOK_FIELDS.length} fields; exact-copy parity, protected structure, optional blocks, tokens and pure builders passed.`);
