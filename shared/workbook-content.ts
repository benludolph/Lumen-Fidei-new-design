import { z } from "zod";
import defaults from "./workbook-content-defaults.json";
import { PRAYER_FORMAT_COPY } from "./workbook-prayer-copy";
import type { SectionDefinition, SectionCategory } from "../client/src/components/workbook/section-definitions";
import type { PrayerTemplate, PrayerNode } from "../client/src/components/workbook/prayer-templates";

/** Editable copy only. Answer schemas, option values and prayer conditions stay in the seed structure. */
export type WorkbookDocument = { version: 1; texts: Record<string, string> };
export type WorkbookContentField = { key: string; label: string; group: string; optional: boolean };
export const WORKBOOK_FIELDS: WorkbookContentField[] = [];
const texts: Record<string, string> = {};
function add(key: string, value: string | undefined, label: string, group: string, optional = false) {
  texts[key] = value ?? "";
  WORKBOOK_FIELDS.push({ key, label, group, optional });
}
const sections = defaults.sections as SectionDefinition[];
const categories = defaults.categories as SectionCategory[];
const prayers = defaults.prayers as Record<string, PrayerTemplate>;
for (const section of sections) {
  const group = `Section ${section.id} · ${section.name}`;
  for (const property of ["name", "description", "teaching", "confession", "actionItem", "prayerHint"] as const) {
    add(`sections.${section.id}.${property}`, section[property], property, group, !["name", "description"].includes(property));
  }
  add(`sections.${section.id}.extraNote.label`, section.extraNote?.label, "Additional note heading", group, true);
  add(`sections.${section.id}.extraNote.text`, section.extraNote?.text, "Additional note text", group, true);
  for (const field of section.fields) {
    const prefix = `sections.${section.id}.fields.${field.key}`;
    add(`${prefix}.label`, field.label, `${field.label} — label`, group);
    add(`${prefix}.placeholder`, field.placeholder, `${field.label} — placeholder`, group, true);
    field.enumOptions?.forEach((option, i) => add(`${prefix}.options.${i}`, option.label, `${field.label} — option ${i + 1}`, group));
  }
}
for (const category of categories) {
  for (const property of ["name", "description"] as const) {
    add(`categories.${category.id}.${property}`, category[property], property, `Categories · ${category.name}`);
  }
}
function visitNodes(nodes: PrayerNode[], prefix: string, group: string) {
  nodes.forEach((node, i) => {
    const path = `${prefix}.${i}`;
    if (node.type === "text") add(`${path}.content`, node.content, `Text block ${i + 1}`, group, true);
    if (node.type === "inject") add(`${path}.emptyStateText`, node.emptyStateText, `Empty-answer wording ${i + 1}`, group, true);
    if (node.type === "in_prayer_textarea") {
      for (const key of ["placeholder", "before", "after"] as const) add(`${path}.${key}`, node[key], `Reflection ${key}`, group, key !== "placeholder");
    }
    if (node.type === "conditional_block") visitNodes(node.nodes, `${path}.nodes`, group);
  });
}
for (const prayer of Object.values(prayers)) {
  const group = `Prayers · ${prayer.title}`;
  add(`prayers.${prayer.id}.title`, prayer.title, "Prayer title", group);
  add(`prayers.${prayer.id}.subtitle`, prayer.subtitle, "Prayer subtitle", group, true);
  prayer.pages.forEach((page, i) => {
    const prefix = `prayers.${prayer.id}.pages.${i}`;
    const pageGroup = `${group} · ${i + 1}. ${page.title}`;
    add(`${prefix}.title`, page.title, "Page title", pageGroup);
    visitNodes(page.nodes, `${prefix}.nodes`, pageGroup);
  });
}
for (const [id, value] of Object.entries(defaults.guidance)) add(`guidance.${id}`, value, "Non-Catholic guidance", `Section ${id} · ${sections.find(s => String(s.id) === id)?.name}`, true);
for (const [key, value] of Object.entries(defaults.general)) {
  const group = key.startsWith("lies.") ? "Lies & truths · Guidance" : key.startsWith("patterns.") ? "Patterns · Guidance" : key === "acknowledgment" || key.startsWith("sources") ? "Sources & acknowledgments" : key.includes("Prayer") || key.startsWith("prayerLink") ? "Session prayers" : "Introduction & guidance";
  add(`general.${key}`, value, key.replace(/([A-Z])/g, " $1").replaceAll(".", " · "), group);
}
for (const [key, value] of Object.entries(PRAYER_FORMAT_COPY)) add(`general.formats.${key}`, value, key.replace(/([A-Z])/g, " $1"), "Prayers · Personalized sentences");
defaults.patterns.forEach((pattern, i) => add(`patterns.${i}.label`, pattern, `Pattern ${i + 1}`, "Patterns · Choices"));

export const DEFAULT_WORKBOOK_DOCUMENT: WorkbookDocument = { version: 1, texts };
const tokens = (text: string) => Array.from(text.matchAll(/\{\{[^{}]*\}\}/g)).map(match => match[0]).sort().join("\n");
export const workbookDocumentSchema = z.object({
  version: z.literal(1),
  texts: z.record(z.string().max(30000)),
}).strict().superRefine((document, ctx) => {
  const keys = new Set(WORKBOOK_FIELDS.map(field => field.key));
  for (const key of Object.keys(document.texts)) {
    if (!keys.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["texts", key], message: "Unknown or protected content field" });
  }
  for (const field of WORKBOOK_FIELDS) {
    const value = document.texts[field.key];
    if (value === undefined || (!field.optional && !value.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["texts", field.key], message: "This content field is required" });
    } else if (tokens(value) !== tokens(texts[field.key])) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["texts", field.key], message: "Personalization tokens cannot be changed" });
    }
  }
  for (const section of sections) {
    const label = document.texts[`sections.${section.id}.extraNote.label`];
    const text = document.texts[`sections.${section.id}.extraNote.text`];
    if (!!label?.trim() !== !!text?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["texts", `sections.${section.id}.extraNote.text`], message: "Provide both an additional note heading and text, or leave both blank" });
  }
});

export function workbookText(document: WorkbookDocument, key: string): string {
  if (!(key in document.texts)) throw new Error(`Workbook content key is missing: ${key}`);
  return document.texts[key];
}
export function buildWorkbookSections(document: WorkbookDocument): SectionDefinition[] {
  return sections.map(section => {
    const result = structuredClone(section);
    for (const property of ["name", "description", "teaching", "confession", "actionItem", "prayerHint"] as const) {
      const value = workbookText(document, `sections.${section.id}.${property}`);
      if (value || property === "name" || property === "description") result[property] = value;
      else delete result[property];
    }
    const label = workbookText(document, `sections.${section.id}.extraNote.label`);
    const text = workbookText(document, `sections.${section.id}.extraNote.text`);
    if (label && text) result.extraNote = { label, text }; else delete result.extraNote;
    result.fields = result.fields.map(field => ({
      ...field, label: workbookText(document, `sections.${section.id}.fields.${field.key}.label`),
      ...(workbookText(document, `sections.${section.id}.fields.${field.key}.placeholder`) ? { placeholder: workbookText(document, `sections.${section.id}.fields.${field.key}.placeholder`) } : {}),
      ...(field.enumOptions ? { enumOptions: field.enumOptions.map((option, i) => ({ ...option, label: workbookText(document, `sections.${section.id}.fields.${field.key}.options.${i}`) })) } : {}),
    }));
    // A blank placeholder explicitly removes existing copy.
    result.fields.forEach(field => {
      if (!workbookText(document, `sections.${section.id}.fields.${field.key}.placeholder`)) delete field.placeholder;
    });
    return result;
  });
}
export function buildWorkbookCategories(document: WorkbookDocument): SectionCategory[] {
  return categories.map(category => ({ ...category, name: workbookText(document, `categories.${category.id}.name`), description: workbookText(document, `categories.${category.id}.description`) }));
}
export function buildWorkbookPrayers(document: WorkbookDocument): Record<string, PrayerTemplate> {
  const result = structuredClone(prayers);
  for (const field of WORKBOOK_FIELDS.filter(field => field.key.startsWith("prayers."))) {
    const path = field.key.split(".").slice(1);
    let node: any = result;
    for (const part of path.slice(0, -1)) node = node[part];
    const key = path[path.length - 1];
    const value = workbookText(document, field.key);
    // Preserve absent optional properties in the initial document.
    if (!value && field.optional && !(key in node)) continue;
    node[key] = value;
  }
  return result;
}
export function buildWorkbookPatterns(document: WorkbookDocument): { value: string; label: string }[] {
  return defaults.patterns.map((value, i) => ({ value, label: workbookText(document, `patterns.${i}.label`) }));
}
