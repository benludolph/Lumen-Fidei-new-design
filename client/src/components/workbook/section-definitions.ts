import defaults from "@shared/workbook-content-defaults.json";
import { WORKBOOK_MAX_SECTION_ID } from "@shared/schema";
import { WORKBOOK_CATEGORY_SECTIONS } from "@shared/workbook-categories";

export type SectionType = "list_builder" | "strongman_checklist" | "lies_and_truths" | "patterns_checklist";
export interface SectionFieldOption { label: string; value: string }
export interface SectionField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  type?: "text" | "textarea" | "enum" | "boolean";
  enumOptions?: SectionFieldOption[];
}
export interface SectionCategory { id: number; name: string; description: string }
export interface SectionDefinition {
  id: number;
  categoryId: number;
  name: string;
  type: SectionType;
  description: string;
  actionItem?: string;
  fields: SectionField[];
  prayerHint?: string;
  revised?: boolean;
  teaching?: string;
  confession?: string;
  extraNote?: { label: string; text: string };
}

// Baseline compatibility only. Rendering components use useWorkbookContent().
// The shared builder imports JSON, never this client module.
export const SECTION_CATEGORIES = defaults.categories as SectionCategory[];
export const SECTIONS = defaults.sections as SectionDefinition[];
if (Math.max(...SECTIONS.map(section => section.id)) !== WORKBOOK_MAX_SECTION_ID) {
  throw new Error("WORKBOOK_MAX_SECTION_ID is out of sync with the workbook baseline.");
}
export { WORKBOOK_MAX_SECTION_ID };
export function getSectionById(id: number): SectionDefinition | undefined {
  return SECTIONS.find(section => section.id === id);
}
export function getSectionName(id: number): string {
  return getSectionById(id)?.name ?? `Section ${id}`;
}
export function getSectionsByCategory(categoryId: number): SectionDefinition[] {
  const ids = WORKBOOK_CATEGORY_SECTIONS[categoryId] ?? [];
  return SECTIONS.filter(section => ids.includes(section.id));
}
