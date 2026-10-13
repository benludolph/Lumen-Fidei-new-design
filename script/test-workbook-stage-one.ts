import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
assert.equal(SECTIONS.length,25);
assert.equal(Object.keys(WORKBOOK_SECTION_CATEGORY).length,25);
assert.equal(new Set(Object.values(WORKBOOK_CATEGORY_SECTIONS).flat()).size,25);
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
for (let id=1;id<=24;id++) assert.equal(oldMap[id], id===14||id===24 ? 1 : WORKBOOK_SECTION_CATEGORY[id], `impact baseline ${id}`);
for (const file of ["CategorySession.tsx","SessionWrapper.tsx"]) {
  const source = readFileSync(`client/src/components/workbook/${file}`,"utf8");
  assert.ok(source.includes("<WorkbookAccessGate categorySession"),`${file}: persisted intro gate`);
  assert.ok(source.includes('from "@/data/workbook-revised"'),`${file}: approved shared prayers`);
  assert.ok(source.includes('profile?.faithTradition === "Yes" ? CLOSING_PRAYER : NON_CATHOLIC_CLOSING_PRAYER'),`${file}: faith-specific closing`);
}
assert.deepEqual(DOMINANT_PATTERNS,["Fear","Rejection","Shame","Control","Pride","Anger","Bitterness","Lust","Addiction","Despair","Self-hatred","Confusion","Unbelief","Occult involvement","Grief","Isolation","Other"]);
assert.equal(SECTIONS.find(s=>s.id===3)!.fields[0].enumOptions!.find(o=>o.label==="Family / Childhood")!.value,"Family/Childhood");
for (const prayer of [OPENING_PRAYER,CLOSING_PRAYER]) {
  for (const paragraph of prayer.split("\n\n")) assert.ok(spec.includes(paragraph), "exact session prayer");
}
for (const spirit of ["unseen","helplessness","false_father"] as const) assert.equal(getSuggestedScriptures(spirit).length,1);
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
for (const [file,digest] of [
  ["prayer-templates.ts","0dddc4d6a20c70c3ba865f1a98511c1423a145e6fe1f8238b9a2117fcd882704"],
  ["PrayerRender.tsx","6d3afe4aeb8b71e0223b5766fbaf909526f098ee461603373c9317c13e982f66"],
]) assert.equal(hash(readFileSync(`client/src/components/workbook/${file}`,"utf8")),digest,`${file} unchanged`);
const baseline: Record<number,string> = {
  8:"6ef06701270c0decdf7a0f20f9a047da5246595c05a1b9639bf736ea9ed7cdfe",
  9:"1dfedde6c5245b6adc740dd82cca9bfcfdf06c1711485b9782c04e9b62e088bd",
  10:"d75b7f9b3c3b9631aae7efb2eca07d66992a2b2e5d609b9417486324e5015add",
  12:"1da12d4fb4a416a3492eae472329b8efea7bf473ca0ae83f725c867e2b39ab63",
  17:"90ed47a5c34d3d43bf24c7d3ec8b882e2c8fe00d15a702cbd15ad2e2d5cc66be",
  18:"f704d94e6789abf4d1df90a7cf089f0782cd117bd0d4e8d4e3f9a573760478cb",
  19:"e0cdbfbe077f2d5ee135baeee92e14e0291e3d7ab4d73eb258c48f6e89971722",
  21:"54bd55ce1ef3c17047c3973c3ca61df63f86533b74adcad114225660483b1a93",
};
const definitions = readFileSync("client/src/components/workbook/section-definitions.ts","utf8");
for (const [id,digest] of Object.entries(baseline)) {
  const block = definitions.match(new RegExp("  \\{\\n    id: "+id+",\\n[\\s\\S]*?\\n  \\},"))![0];
  assert.equal(hash(block),digest,`legacy section ${id} unchanged`);
}
console.log("Stage 1: exact copy/fields, 25-section map, legacy sections and prayer contracts passed.");
