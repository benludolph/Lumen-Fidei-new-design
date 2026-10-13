import libraryData from "./catholic_truth_library.json";

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

export const LYING_SPIRITS: { value: LyingSpirit; label: string; summary: string }[] = [
  { value: "unseen", label: "Unseen", summary: "No one sees me. My pain does not matter." },
  { value: "helplessness", label: "Helplessness", summary: "I cannot resist. I have no choice." },
  { value: "false_father", label: "A false image of God", summary: "God is harsh, distant, or disappointed in me." },
  { value: "destruction", label: "Destruction", summary: "You are broken, limited, your mind is not enough." },
  { value: "hopelessness", label: "Hopelessness", summary: "Nothing will change. It will not get better." },
  { value: "weakness", label: "Weakness", summary: "You must hide what you cannot do alone." },
  { value: "condemnation", label: "Condemnation", summary: "You are worthless. You deserve to be hated." },
  { value: "fear", label: "Fear", summary: "You are not safe. Danger is everywhere." },
  { value: "rejection", label: "Rejection", summary: "You do not belong. No one wants you." },
  { value: "shame", label: "Shame", summary: "You are what you have done. You are dirty." },
  { value: "unworthiness", label: "Unworthiness", summary: "You do not deserve good things, or love." },
  { value: "isolation", label: "Isolation", summary: "You are alone. No one understands." },
  { value: "anxiety", label: "Anxiety", summary: "You must control everything. You cannot rest." },
  { value: "self_hatred", label: "Self-hatred", summary: "You are your own enemy. You deserve punishment." },
  { value: "confusion", label: "Confusion", summary: "Nothing makes sense. You cannot trust your mind." },
];

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
