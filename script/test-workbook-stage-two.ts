import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PRAYER_TEMPLATES } from "../client/src/components/workbook/prayer-templates";
import { SECTIONS } from "../client/src/components/workbook/section-definitions";
import type { WorkbookEntry, UserProfile } from "../shared/schema";

// Browser storage is imported by the app query client, but never used by these pure render tests.
Object.assign(globalThis, { React, localStorage: {}, sessionStorage: {} });
const { renderNodes, getVisiblePages, filterEntries, evaluateInjectToString } =
  await import("../client/src/components/workbook/PrayerRender");
const entry = (sectionId: number, entryData: Record<string, unknown>): WorkbookEntry =>
  ({ id: sectionId, userId: 1, sectionId, entryData, position: 0, createdAt: new Date(0) });
const entries: Record<number, WorkbookEntry[]> = {};
for (const section of SECTIONS) entries[section.id] = [entry(section.id,
  Object.fromEntries(section.fields.map(f => [f.key, f.type === "boolean" ? true : `synthetic ${f.key}`])),
)];
entries[14] = [entry(14,{checked:["Fear"],father_word:"synthetic truth"})];
entries[6] = [entry(6,{lie:"synthetic lie",truth_statement:"synthetic truth",scripture_reference:"John 1:1",scripture_text:"synthetic verse"})];
entries[2] = [
  entry(2,{person:"synthetic other",what:"synthetic hurt",is_family_harm:true}),
  entry(2,{person:"myself",what:"synthetic failure",who_kind:"Myself"}),
  entry(2,{person:"God",what:"synthetic anger",who_kind:"My anger at God."}),
];
const profile = (faithTradition: string) => ({
  faithTradition, familyMembers:["synthetic family"],spouseName:"synthetic spouse",
  childrenNames:["synthetic child"],chronicIssues:["synthetic issue"],chronicIdentityLabels:["synthetic label"],
}) as UserProfile;
function render(id: string, faith: string, data=entries, pageIndex?: number) {
  const pages = getVisiblePages(PRAYER_TEMPLATES[id],data);
  return (pageIndex === undefined ? pages : [pages[pageIndex]]).map(p =>
    renderToStaticMarkup(React.createElement(React.Fragment,null,renderNodes(p.nodes,data,profile(faith),{},()=>{},0))),
  ).join("\n");
}
assert.deepEqual(Object.values(PRAYER_TEMPLATES).map(t=>t.pages.length),[13,9,7]);
assert.deepEqual(Object.values(PRAYER_TEMPLATES).map(t=>getVisiblePages(t,entries).length),[13,9,7]);
assert.deepEqual(Object.values(PRAYER_TEMPLATES).map(t=>getVisiblePages(t,{}).length),[2,3,6]);
for (const faith of ["Yes","No, I'm a Christian of another tradition","No, I'm exploring faith"]) {
  for (const id of Object.keys(PRAYER_TEMPLATES)) {
    const html=render(id,faith);
    assert.ok(!html.includes("(not yet filled)"));
    assert.equal(html.includes("Blessed Virgin Mary"),faith==="Yes");
  }
}
assert.ok(render("prayer_1","Yes").includes("I stop condemning what You have already forgiven"));
assert.ok(render("prayer_1","Yes").includes("I let go of my accusation against You"));
assert.ok(!render("prayer_1","Yes").includes("I forgive God"));
assert.ok(render("prayer_3","Yes").includes("synthetic family"));
assert.ok(render("prayer_3","Yes",{}).includes("I am Your beloved child"));
assert.ok(!render("prayer_3","Yes",entries,1).includes("I renounce "));
const dailyNodes = PRAYER_TEMPLATES.prayer_3.pages[1].nodes;
const dailyValues = { "1-0":"synthetic sin", "1-2":"synthetic person", "1-3":"synthetic pull" };
const filledDaily = renderToStaticMarkup(React.createElement(React.Fragment,null,
  renderNodes(dailyNodes,entries,profile("Yes"),dailyValues,()=>{},1)));
assert.ok(filledDaily.includes("synthetic sin"));
assert.ok(filledDaily.includes("I renounce "));
const freshDaily = renderToStaticMarkup(React.createElement(React.Fragment,null,
  renderNodes(dailyNodes,entries,profile("Yes"),{},()=>{},1)));
assert.ok(!freshDaily.includes("synthetic sin"));
assert.ok(!freshDaily.includes("I renounce "));
for (const value of ["synthetic spouse","synthetic child","synthetic family","synthetic issue","synthetic label"])
  assert.ok(render("prayer_3","Yes").includes(value));
for (const [filter,key,values] of [
  ["where_how_encouraged","how",["I encouraged, approved, or went along with it","I encouraged, approved, or went along with it."]],
  ["where_kind_pact","kind",["A spell, curse, or pact I made","A spell, curse, or pact I made."]],
  ["where_who_god","who_kind",["My anger at God","My anger at God."]],
] as const) for (const value of values) assert.equal(filterEntries([entry(1,{[key]:value})],filter).length,1);
assert.equal(evaluateInjectToString({type:"inject",profileField:"familyMembers",format:"text"}, {}, profile("Yes")),"synthetic family");
const archivedOnly = {8:[entry(8,{idol:"ARCHIVED_SENTINEL"})]};
assert.ok(!render("prayer_1","Yes",archivedOnly).includes("ARCHIVED_SENTINEL"));
for (const t of Object.values(PRAYER_TEMPLATES)) {
  const source=JSON.stringify(t);
  for (const id of [8,9,10,12,17,18,19,21]) assert.ok(!source.includes(`"sectionId":${id},`));
}
console.log("Stage 2 prayer contracts: page counts, faith branches, empty states, profile arrays, enum aliases and archived-source exclusion passed.");
