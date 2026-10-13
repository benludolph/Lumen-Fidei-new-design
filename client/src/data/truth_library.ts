import libraryData from "./catholic_truth_library.json";
import defaults from "@shared/workbook-content-defaults.json";

export type LyingSpirit =
  | "unseen"
  | "helplessness"
  | "false_father"
  | "destruction"
  | "hopelessness"
  | "weakness"
  | "condemnation"
  | "fear"
  | "rejection"
  | "shame"
  | "unworthiness"
  | "isolation"
  | "anxiety"
  | "self_hatred"
  | "confusion";

export type TruthLibraryEntry = {
  spirit: LyingSpirit;
  scripture_reference: string;
  scripture_text: string;
  first_person_truth: string;
};

const SPIRIT_VALUES: LyingSpirit[] = [
  "unseen", "helplessness", "false_father", "destruction", "hopelessness",
  "weakness", "condemnation", "fear", "rejection", "shame", "unworthiness",
  "isolation", "anxiety", "self_hatred", "confusion",
];
const general = defaults.general as Record<string, string>;
export const LYING_SPIRITS: { value: LyingSpirit; label: string; summary: string }[] = SPIRIT_VALUES.map(value => ({
  value,
  label: general[`lies.spirits.${value}.label`],
  summary: general[`lies.spirits.${value}.summary`],
}));

const ALL_SPIRIT_VALUES: LyingSpirit[] = LYING_SPIRITS.map((s) => s.value);

const library: TruthLibraryEntry[] = libraryData as TruthLibraryEntry[];

export function getSuggestedScriptures(spirit: LyingSpirit): TruthLibraryEntry[] {
  return library.filter((e) => e.spirit === spirit);
}

export function getTruthLibraryEntry(
  spirit: LyingSpirit,
  reference: string
): TruthLibraryEntry | null {
  return library.find((e) => e.spirit === spirit && e.scripture_reference === reference) ?? null;
}

export function getAllEntries(): TruthLibraryEntry[] {
  return library;
}

export function getRepresentedSpirits(): LyingSpirit[] {
  const inLibrary = new Set(library.map((e) => e.spirit));
  return ALL_SPIRIT_VALUES.filter((s) => inLibrary.has(s));
}

export function getMissingSpirits(): LyingSpirit[] {
  const inLibrary = new Set(library.map((e) => e.spirit));
  return ALL_SPIRIT_VALUES.filter((s) => !inLibrary.has(s));
}
