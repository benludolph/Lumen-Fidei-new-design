/** Prayer contracts. Approved copy lives in revised-prayer-templates.ts. */
export type InjectFormat =
  | "items_comma" | "names_comma" | "patterns_comma" | "spirits_with_every_prefix"
  | "infirmities_each" | "lies_with_truths" | "text" | "items_each"
  | "renounce_each" | "renounce_lodge_each" | "renounce_simple_each"
  | "renounce_spirit_each" | "forgive_each" | "family_dead_each"
  | "let_end_each" | "ancestor_each" | "pattern_side_each";
export type InjectFilter =
  | "skip_empties" | "where_is_family_harm" | "where_kind_curse"
  | "where_kind_blood_contract" | "where_spoken_by_nonempty" | "where_spoken_by_empty"
  | "where_truth_nonempty" | "where_for_healing" | "whose_father" | "whose_mother" | "whose_family"
  | "where_how_encouraged" | "where_who_someone" | "where_who_self" | "where_who_god"
  | "where_kind_pact" | "where_amends_owed";
export type TextNode = { type: "text"; content: string };
export type InjectNode = {
  type: "inject";
  sectionId?: number;
  profileField?: string;
  format: InjectFormat;
  field?: string;
  filter?: InjectFilter;
  emptyStateText?: string;
};
export type InPrayerTextareaNode = { type: "in_prayer_textarea"; placeholder: string; before?: string; after?: string };
export type ConditionalBlockNode = {
  type: "conditional_block";
  faith?: "catholic" | "non_catholic";
  profileField?: string;
  sectionId?: number;
  sectionField?: string;
  sectionFilter?: InjectFilter;
  nodes: PrayerNode[];
};
export type PrayerNode = TextNode | InjectNode | InPrayerTextareaNode | ConditionalBlockNode;
export type PrayerPage = {
  title: string;
  nodes: PrayerNode[];
  skipIfSectionsEmpty?: number[];
  skipIfFilteredSectionEmpty?: { sectionId: number; filter: InjectFilter };
  requiresCheckedThemes?: boolean;
};
export type PrayerTemplate = {
  id: "prayer_1" | "prayer_2" | "prayer_3";
  title: string;
  subtitle: string;
  pages: PrayerPage[];
};
export { PRAYER_TEMPLATES } from "./revised-prayer-templates";
