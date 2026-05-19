import rawLibrary from "./catholic_truth_library.json";

export type LyingSpirit =
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

type RawEntry = {
  scripture_reference: string;
  scripture_text: string;
  first_person_truth: string;
};

export const LYING_SPIRITS: { value: LyingSpirit; label: string; summary: string }[] = [
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

const library = rawLibrary as Record<string, RawEntry[]>;

export function getSuggestedScriptures(spirit: LyingSpirit): TruthLibraryEntry[] {
  const entries = library[spirit] ?? [];
  return entries.map((e) => ({ ...e, spirit }));
}

export function getTruthLibraryEntry(
  spirit: LyingSpirit,
  reference: string
): TruthLibraryEntry | null {
  const entries = library[spirit] ?? [];
  const found = entries.find((e) => e.scripture_reference === reference);
  return found ? { ...found, spirit } : null;
}

export function getAllEntries(): TruthLibraryEntry[] {
  return (Object.keys(library) as LyingSpirit[]).flatMap((spirit) =>
    (library[spirit] ?? []).map((e) => ({ ...e, spirit }))
  );
}
