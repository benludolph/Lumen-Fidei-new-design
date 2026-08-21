import type { ReactNode } from "react";

export type RecordData = Record<string, any>;
export type ProgramWorkspaceProps = { legacyTrackAEditor?: ReactNode };

export const templateBag = {
  ORIGIN_OF_THE_WEIGHT_TEMPLATE: JSON.stringify({ intro: "", turns: [] }),
  PATH_SELECTOR_DEFAULT: JSON.stringify({ title: "", options: [] }),
  CROSS_GRID_DEFAULT: JSON.stringify({ cells: [] }),
  STORY_CHOICE_DEFAULT: JSON.stringify({ intro: "", choices: [] }),
  IMAGE_CAROUSEL_DEFAULT: JSON.stringify({ images: [] }),
  BEFORE_AFTER_DEFAULT: JSON.stringify({ before: {}, after: {} }),
  SELECTION_REVEAL_DEFAULT: JSON.stringify({ options: [] }),
  BENTO_REVEAL_DEFAULT: JSON.stringify({ cards: [] }),
  GUIDED_PRAYER_DEFAULT_TRACK_A: JSON.stringify({ steps: [] }),
  GUIDED_PRAYER_DEFAULT_PRELIM: JSON.stringify({ steps: [] }),
};

export const cloneDocument = (value: RecordData): RecordData =>
  JSON.parse(JSON.stringify(value));

export const freshDocument = (programKey: string): RecordData => ({
  schemaVersion: 1,
  programKey,
  modules: [],
  activities: [],
});

export const apiPath = (template: string, values: RecordData) =>
  template.replace(/:([a-zA-Z]+)/g, (_, name) => String(values[name]));

export const newStableKey = (prefix: string, title: string) =>
  `${prefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled"}-${Math.random().toString(36).slice(2, 7)}`;