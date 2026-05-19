export type SectionType = "list_builder" | "strongman_checklist";

export interface SectionField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export interface SectionDefinition {
  id: number;
  name: string;
  type: SectionType;
  description: string;
  fields: SectionField[];
  prayerHint?: string;
}

export const SECTIONS: SectionDefinition[] = [
  {
    id: 1,
    name: "Lies I've Believed",
    type: "list_builder",
    description: "False beliefs about God, yourself, or others that have taken root.",
    fields: [{ key: "text", label: "Lie", placeholder: "e.g. God doesn't love me", required: true }],
    prayerHint: "Prayer #1",
  },
  {
    id: 2,
    name: "Fears I've Carried",
    type: "list_builder",
    description: "Persistent fears or anxieties that have shaped your life.",
    fields: [{ key: "text", label: "Fear", placeholder: "e.g. Fear of abandonment", required: true }],
    prayerHint: "Prayer #1",
  },
  {
    id: 3,
    name: "Sins Against God",
    type: "list_builder",
    description: "Ways you have directly offended or turned from God.",
    fields: [{ key: "text", label: "Sin", placeholder: "Describe briefly", required: true }],
    prayerHint: "Prayer #1",
  },
  {
    id: 4,
    name: "Sins Against Others",
    type: "list_builder",
    description: "Harms you've caused to others through words, actions, or neglect.",
    fields: [
      { key: "text", label: "Sin", placeholder: "Describe briefly", required: true },
      { key: "person", label: "Person (optional)", placeholder: "Name or relationship" },
    ],
    prayerHint: "Prayer #1",
  },
  {
    id: 5,
    name: "Sins Against Self",
    type: "list_builder",
    description: "Ways you have harmed your own body, mind, or soul.",
    fields: [{ key: "text", label: "Sin", placeholder: "Describe briefly", required: true }],
    prayerHint: "Prayer #1",
  },
  {
    id: 6,
    name: "Occult Involvement",
    type: "list_builder",
    description: "Any involvement with occult practices, New Age, or false spirituality.",
    fields: [{ key: "text", label: "Involvement", placeholder: "e.g. Ouija board, horoscopes", required: true }],
    prayerHint: "Prayer #1",
  },
  {
    id: 7,
    name: "Inner Vows I've Made",
    type: "list_builder",
    description: "Declarations you made to yourself that have bound your heart.",
    fields: [{ key: "text", label: "Vow", placeholder: "e.g. I'll never trust anyone again", required: true }],
    prayerHint: "Prayer #1",
  },
  {
    id: 8,
    name: "Ungodly Soul Ties",
    type: "list_builder",
    description: "Unhealthy emotional, sexual, or spiritual bonds with others.",
    fields: [
      { key: "person", label: "Person", placeholder: "Name or relationship", required: true },
      { key: "nature", label: "Nature of tie (optional)", placeholder: "e.g. sexual, controlling" },
    ],
    prayerHint: "Prayer #2",
  },
  {
    id: 9,
    name: "People I Need to Forgive",
    type: "list_builder",
    description: "Those who have wounded or wronged you.",
    fields: [
      { key: "person", label: "Person", placeholder: "Name or relationship", required: true },
      { key: "offense", label: "Offense (optional)", placeholder: "Brief description" },
    ],
    prayerHint: "Prayer #2",
  },
  {
    id: 10,
    name: "Childhood Wounds",
    type: "list_builder",
    description: "Formative experiences of rejection, neglect, or abuse in childhood.",
    fields: [{ key: "text", label: "Wound", placeholder: "Describe briefly", required: true }],
    prayerHint: "Prayer #2",
  },
  {
    id: 11,
    name: "Traumas I've Experienced",
    type: "list_builder",
    description: "Overwhelming events that left lasting effects on your soul.",
    fields: [{ key: "text", label: "Trauma", placeholder: "Describe briefly", required: true }],
    prayerHint: "Prayer #2",
  },
  {
    id: 12,
    name: "Sexual Wounds & Sins",
    type: "list_builder",
    description: "Wounds received or sins committed in the area of sexuality.",
    fields: [{ key: "text", label: "Item", placeholder: "Describe briefly", required: true }],
    prayerHint: "Prayer #2",
  },
  {
    id: 13,
    name: "Generational Patterns",
    type: "list_builder",
    description: "Sins or bondages repeated across generations in your family.",
    fields: [{ key: "text", label: "Pattern", placeholder: "e.g. anger, alcoholism", required: true }],
    prayerHint: "Prayer #2",
  },
  {
    id: 14,
    name: "Negative Words Spoken Over Me",
    type: "list_builder",
    description: "Harmful words declared over you by others that have taken hold.",
    fields: [
      { key: "text", label: "Words", placeholder: "e.g. You'll never amount to anything", required: true },
      { key: "source", label: "Source (optional)", placeholder: "Who said it" },
    ],
    prayerHint: "Prayer #2",
  },
  {
    id: 15,
    name: "Negative Words I've Spoken",
    type: "list_builder",
    description: "Curses or hurtful declarations you have made over others.",
    fields: [
      { key: "text", label: "Words spoken", placeholder: "What you said", required: true },
      { key: "person", label: "Person (optional)", placeholder: "Who you said it to" },
    ],
    prayerHint: "Prayer #2",
  },
  {
    id: 16,
    name: "Strongman Spirits",
    type: "strongman_checklist",
    description: "Identify the ruling spirits that may have gained footholds. (Pending pastoral review.)",
    fields: [
      { key: "name", label: "Spirit", required: true },
    ],
    prayerHint: "Prayer #3",
  },
  {
    id: 17,
    name: "Things to Renounce",
    type: "list_builder",
    description: "Specific agreements with darkness that you wish to formally renounce.",
    fields: [{ key: "text", label: "Item to renounce", placeholder: "e.g. spirit of rejection", required: true }],
    prayerHint: "Prayer #3",
  },
  {
    id: 18,
    name: "Blessings to Declare",
    type: "list_builder",
    description: "Truths and graces you want to speak over yourself and others.",
    fields: [{ key: "text", label: "Blessing", placeholder: "e.g. I am a beloved child of God", required: true }],
    prayerHint: "Prayer #3",
  },
];

export function getSectionById(id: number): SectionDefinition | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function getSectionName(id: number): string {
  return getSectionById(id)?.name ?? `Section ${id}`;
}
