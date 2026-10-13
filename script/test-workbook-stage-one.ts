import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SECTIONS, SECTION_CATEGORIES } from "../client/src/components/workbook/section-definitions";
import { REVISED_SECTIONS, OPENING_PRAYER, CLOSING_PRAYER } from "../client/src/data/workbook-revised";
import { DOMINANT_PATTERNS } from "../client/src/data/patterns_data";
import { getSuggestedScriptures } from "../client/src/data/truth_library";
import { WORKBOOK_CATEGORY_SECTIONS, WORKBOOK_SECTION_CATEGORY } from "../shared/workbook-categories";

const spec = readFileSync("attached_assets/Freedom_Workbook_—_Revised_Content_1791912374143.md", "utf8");
const ids = [1,2,3,4,5,6,7,11,13,14,15,16,20,22,23,24,25];
assert.deepEqual(Object.keys(REVISED_SECTIONS).map(Number).sort((a,b)=>a-b), ids);
for (const id of ids) {
  const match = [...spec.matchAll(/^### (.+) \(section (\d+)\)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)]
    .find(m => Number(m[2]) === id);
  assert.ok(match, `source section ${id}`);
  const section = SECTIONS.find(s => s.id === id)!;
  assert.equal(section.name, match[1], `name ${id}`);
  for (const [label,key] of [["Why it matters","description"],["What the Church teaches","teaching"],["Bring to Confession","confession"],["Invitation","actionItem"]] as const) {
    const paragraph = match[3].split("\n").find(line => line.startsWith(`**${label}.** `))?.slice(label.length+6);
    assert.equal(section[key], paragraph, `${id}: ${label}`);
  }
  for (const line of match[3].split("\n").filter(l=>l.startsWith("- `") && l.includes('Label: "'))) {
    const key = line.match(/`([^`]+)`/)![1];
    if (id === 14) continue; // dedicated checklist editor
    const field = section.fields.find(f=>f.key===key);
    assert.ok(field, `${id}: field ${key}`);
    assert.equal(field.label, line.match(/Label: "([^"]+)"/)![1], `${id}: label ${key}`);
    assert.equal(field.placeholder, line.match(/Placeholder: "([^"]+)"/)?.[1], `${id}: placeholder ${key}`);
    assert.equal(field.required === true, line.includes("— required"), `${id}: required ${key}`);
    assert.equal(field.type, line.match(/— (?:required|optional), (\w+)/)?.[1], `${id}: type ${key}`);
    const options = line.split("Options: ")[1];
    if (options) {
      assert.deepEqual(field.enumOptions?.map(o=>o.label), [...options.matchAll(/"([^"]+)"/g)].map(m=>m[1]), `${id}: options ${key}`);
      assert.equal(field.defaultValue, options.match(/"([^"]+)" \(default\)/)?.[1], `${id}: default ${key}`);
    }
  }
}
for (const category of SECTION_CATEGORIES) {
  assert.ok(spec.includes(`## Movement ${category.id}: ${category.name.replace(/^Movement \d+: /,"")}`));
  assert.ok(spec.includes(`**Category description:** ${category.description}`));
}
assert.equal(SECTIONS.length,17);
assert.equal(Object.keys(WORKBOOK_SECTION_CATEGORY).length,17);
assert.equal(new Set(Object.values(WORKBOOK_CATEGORY_SECTIONS).flat()).size,17);
for (const s of SECTIONS) assert.equal(s.categoryId,WORKBOOK_SECTION_CATEGORY[s.id]);
assert.equal(WORKBOOK_SECTION_CATEGORY[14],5);
assert.equal(WORKBOOK_SECTION_CATEGORY[24],4);
assert.equal(WORKBOOK_SECTION_CATEGORY[25],3);
// Keep impact-analysis baselines complete: the original server map contained
// every section except 25, including the unchanged section 10 in category 5.
const impactSql = readFileSync("scripts/workbook-map-impact.sql","utf8");
const oldMapText = impactSql.split("), scenarios")[0];
const oldMap = Object.fromEntries([...oldMapText.matchAll(/\((\d+),(\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]));
assert.equal(Object.keys(oldMap).length,24);
const retiredCategories: Record<number, number> = { 8:1,9:1,10:5,12:2,17:3,18:1,19:2,21:2 };
for (let id=1;id<=24;id++) assert.equal(oldMap[id], id===14||id===24 ? 1 : WORKBOOK_SECTION_CATEGORY[id] ?? retiredCategories[id], `impact baseline ${id}`);
for (const file of ["CategorySession.tsx"]) {
  const source = readFileSync(`client/src/components/workbook/${file}`,"utf8");
  assert.ok(source.includes("<WorkbookAccessGate categorySession"),`${file}: persisted intro gate`);
  assert.ok(source.includes('useWorkbookGeneral'),`${file}: unified editable session prayers`);
  assert.ok(source.includes('profile?.faithTradition === "Yes" ? CLOSING_PRAYER : NON_CATHOLIC_CLOSING_PRAYER'),`${file}: faith-specific closing`);
}
assert.deepEqual(DOMINANT_PATTERNS,["Fear","Rejection","Shame","Control","Pride","Anger","Bitterness","Lust","Addiction","Despair","Self-hatred","Confusion","Unbelief","Occult involvement","Grief","Isolation","Other"]);
assert.equal(SECTIONS.find(s=>s.id===3)!.fields[0].enumOptions!.find(o=>o.label==="Family / Childhood")!.value,"Family/Childhood");
for (const prayer of [OPENING_PRAYER,CLOSING_PRAYER]) {
  for (const paragraph of prayer.split("\n\n")) assert.ok(spec.includes(paragraph), "exact session prayer");
}
for (const spirit of ["unseen","helplessness","false_father"] as const) assert.equal(getSuggestedScriptures(spirit).length,1);
// Stage 2 intentionally replaces the prayer contracts; its separate suite checks them.
// The editor cleanup removes obsolete code definitions, not stored participant rows.
for (const id of [8,9,10,12,17,18,19,21]) assert.equal(SECTIONS.some(section => section.id === id), false, `retired section ${id} stays absent`);
console.log("Stage 1 approved initial copy/fields, 17-section map, session selectors and retired-section exclusion passed.");
