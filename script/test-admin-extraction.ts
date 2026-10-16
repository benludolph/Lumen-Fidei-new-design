import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";

// Run with --baseline <safety-commit> to verify a structural-only extraction.
const ref = process.argv[process.argv.indexOf("--baseline") + 1];
assert.ok(process.argv.includes("--baseline") && ref && /^[a-zA-Z0-9._/-]+$/.test(ref), "Usage: npx tsx script/test-admin-extraction.ts --baseline <git-ref>");
const before = execFileSync("git", ["show", `${ref}:client/src/pages/Admin.tsx`], { encoding: "utf8" });
const current = readFileSync("client/src/pages/Admin.tsx", "utf8");
const parse = (text: string) => ts.createSourceFile("Admin.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function declarations(text: string) {
  const result = new Map<string, ts.Statement>();
  for (const node of parse(text).statements) {
    let name = (node as ts.FunctionDeclaration).name?.getText();
    if (ts.isVariableStatement(node) && node.declarationList.declarations.length === 1) name = node.declarationList.declarations[0].name.getText();
    if (name) result.set(name, node);
  }
  return result;
}
const originals = declarations(before);
const present = declarations(current);
const files = readdirSync("client/src/features/admin", { recursive: true })
  .map(String).filter(path => /\.tsx?$/.test(path));
const moved = new Map<string, ts.Statement>();
for (const path of files) {
  const text = readFileSync(`client/src/features/admin/${path}`, "utf8");
  assert.ok(!text.includes("@/pages/Admin"), "Extracted features must not import Admin.tsx.");
  for (const [name, node] of declarations(text)) {
    assert.ok(!moved.has(name), `Duplicate feature declaration: ${name}`);
    moved.set(name, node);
  }
  if (/\bfetch\(/.test(text)) assert.ok(text.includes("trackFetch as fetch"), `${path} must retain the track-aware fetch import.`);
}

let preserved = 0;
let extracted = 0;
for (const [name, node] of originals) {
  if (name === "Admin" || name === "CohortSettingsView") continue;
  const match = moved.get(name) ?? present.get(name);
  assert.ok(match, `Missing declaration: ${name}`);
  assert.equal(match.getText().replace(/^export /, ""), node.getText(), `${name}: logic, JSX and class names must remain unchanged.`);
  if (moved.has(name)) {
    extracted++;
    assert.ok(!present.has(name), `${name} must not be duplicated in Admin.tsx.`);
  } else {
    preserved++;
  }
}

const tail = "      <DataExportCard />\n\n      <BackupRestoreCard />\n\n      <BulkTimerDurationCard />\n\n      <MigrateTimerCard />";
const oldCohorts = originals.get("CohortSettingsView") as ts.FunctionDeclaration;
const newCohorts = moved.get("CohortSettingsView") as ts.FunctionDeclaration;
assert.equal(newCohorts.body!.getText().replace("      {children}", tail), oldCohorts.body!.getText(), "Cohort body must be unchanged except for the settings-card composition slot.");

const oldAdmin = originals.get("Admin") as ts.FunctionDeclaration;
const newAdmin = present.get("Admin") as ts.FunctionDeclaration;
const people = moved.get("PeopleSection") as ts.FunctionDeclaration;
const localStatements = [...oldAdmin.body!.statements.slice(1, 6)];
const oldFilter = oldAdmin.body!.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations[0].name.getText() === "filteredUsers")!;
localStatements.push(oldFilter);
assert.deepEqual(people.body!.statements.slice(0, 6).map(node => node.getText()), localStatements.map(node => node.getText()), "All People query/filter state must move intact.");
let oldPeopleTab: ts.JsxElement | undefined;
function visit(node: ts.Node) {
  if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === "TabsContent" && node.openingElement.attributes.properties.some(prop =>
    ts.isJsxAttribute(prop) && prop.name.getText() === "value" && prop.initializer?.getText() === '"users"')) oldPeopleTab = node;
  ts.forEachChild(node, visit);
}
visit(oldAdmin);
const peopleReturn = people.body!.statements.at(-1) as ts.ReturnStatement;
assert.ok(peopleReturn.expression && ts.isParenthesizedExpression(peopleReturn.expression));
assert.equal(peopleReturn.expression.expression.getText(), oldPeopleTab!.getText(), "People markup must move verbatim; the component, not its state, must be inside the tab lifecycle.");

// Normalize only the two explicit composition substitutions and the moved state.
let expectedAdmin = oldAdmin.getText();
for (const statement of localStatements) expectedAdmin = expectedAdmin.replace(statement.getText(), "");
expectedAdmin = expectedAdmin.replace(oldPeopleTab!.getText(), "<PeopleSection />");
expectedAdmin = expectedAdmin.replace("<CohortSettingsView />", "<CohortSettingsView><DataExportCard /><BackupRestoreCard /><BulkTimerDurationCard /><MigrateTimerCard /></CohortSettingsView>");
const printer = ts.createPrinter({ removeComments: true });
const canonical = (text: string) => printer.printFile(parse(text)).replace(/\s+(?=<)/g, " ");
// JSX whitespace between the four settings-card elements is indentation only.
const actualAdmin = newAdmin.getText().replace(
  /<CohortSettingsView>\s*<DataExportCard \/>\s*<BackupRestoreCard \/>\s*<BulkTimerDurationCard \/>\s*<MigrateTimerCard \/>\s*<\/CohortSettingsView>/,
  "<CohortSettingsView><DataExportCard /><BackupRestoreCard /><BulkTimerDurationCard /><MigrateTimerCard /></CohortSettingsView>",
);
assert.equal(canonical(actualAdmin), canonical(expectedAdmin), "Admin shell, permissions, tab routing and unaffected content must remain unchanged.");

console.log(`PASS: ${extracted} declarations moved verbatim; ${preserved} remaining declarations unchanged; cohort composition and People markup/state preserved; no feature imports Admin.tsx.`);
