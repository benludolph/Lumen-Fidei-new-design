export type SectionType =
  | "list_builder"
  | "strongman_checklist"
  | "lies_and_truths"
  | "patterns_checklist";

export interface SectionFieldOption {
  label: string;
  value: string;
}

export interface SectionField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** Controls the rendered input control. Defaults to "textarea". */
  type?: "text" | "textarea" | "enum" | "boolean";
  /** Options list — required when type is "enum". */
  enumOptions?: SectionFieldOption[];
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
    name: "Personal Sins",
    type: "list_builder",
    description: "Sins you have committed — things you need to repent of and bring before God.",
    fields: [
      { key: "sin", label: "Sin", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 2,
    name: "People to Forgive",
    type: "list_builder",
    description: "Those who have hurt or wronged you. Naming them is the first step toward release.",
    fields: [
      { key: "person", label: "Person", placeholder: "Name or relationship", required: true, type: "text" },
      { key: "what", label: "What happened (optional)", placeholder: "Brief description", type: "textarea" },
      { key: "is_family_harm", label: "This affected my whole family, not just me", type: "boolean" },
    ],
  },
  {
    id: 3,
    name: "Family & Childhood Wounds",
    type: "list_builder",
    description: "Wounds that came through your father, mother, or family and home life growing up.",
    fields: [
      {
        key: "whose",
        label: "Source",
        placeholder: "Select source",
        required: true,
        type: "enum",
        enumOptions: [
          { label: "Father", value: "Father" },
          { label: "Mother", value: "Mother" },
          { label: "Family / Childhood", value: "Family/Childhood" },
        ],
      },
      { key: "what", label: "What happened", placeholder: "Describe the wound or pattern", required: true, type: "textarea" },
      { key: "lie_believed", label: "Lie I believed because of this (optional)", placeholder: "e.g. I am not wanted", type: "textarea" },
    ],
  },
  {
    id: 4,
    name: "Sexual Sin",
    type: "list_builder",
    description: "Sins in the area of sexuality — thought, desire, or action.",
    fields: [
      { key: "sin", label: "Sin", placeholder: "Describe briefly", required: true, type: "textarea" },
      { key: "person_or_partner", label: "Person connected (optional)", placeholder: "Name or description", type: "text" },
    ],
  },
  {
    id: 5,
    name: "Occult & False Spiritual Power",
    type: "list_builder",
    description: "Any involvement with occult practices, New Age, divination, or false spirituality.",
    fields: [
      { key: "practice", label: "Practice or involvement", placeholder: "e.g. tarot, astrology, energy healing", required: true, type: "text" },
    ],
  },
  {
    id: 6,
    name: "Lies & Truths",
    type: "lies_and_truths",
    description: "False beliefs you have carried — lies spoken over you or accepted in your heart — and the Scripture truths that counter them.",
    fields: [],
  },
  {
    id: 7,
    name: "Vows & Inner Promises",
    type: "list_builder",
    description: "Declarations you made to yourself that have bound your heart — spoken aloud or held silently.",
    fields: [
      { key: "vow", label: "Vow or inner promise", placeholder: "e.g. I will never trust anyone again", required: true, type: "textarea" },
    ],
  },
  {
    id: 8,
    name: "Idolatry",
    type: "list_builder",
    description: "Things you have elevated to the place of God — for safety, identity, comfort, or worth.",
    fields: [
      { key: "idol", label: "Idol or false source", placeholder: "e.g. approval, money, a relationship", required: true, type: "textarea" },
    ],
  },
  {
    id: 9,
    name: "Pride, Rebellion & Control",
    type: "list_builder",
    description: "Patterns of self-will, stubbornness, resistance to authority, or needing to be in control.",
    fields: [
      { key: "pattern", label: "Pattern or behavior", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 10,
    name: "Abuse, Trauma & Wounded Responses",
    type: "list_builder",
    description: "Events where you were harmed, and the sinful responses those wounds produced in you.",
    fields: [
      { key: "event", label: "What happened", placeholder: "Describe the event or harm", required: true, type: "textarea" },
      { key: "sinful_response", label: "Sinful response (optional)", placeholder: "e.g. hatred, self-destruction, isolation", type: "textarea" },
    ],
  },
  {
    id: 11,
    name: "Addictions & Compulsions",
    type: "list_builder",
    description: "Substances, behaviors, or patterns you have been unable to stop despite wanting to.",
    fields: [
      { key: "addiction", label: "Addiction or compulsion", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 12,
    name: "False Religion & Spiritual Mixture",
    type: "list_builder",
    description: "Involvement with false religions, cults, or mixing non-Christian spiritual practices with the faith.",
    fields: [
      { key: "practice", label: "Practice or religion", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 13,
    name: "Harm Done to Others",
    type: "list_builder",
    description: "Ways you have hurt, used, abused, or wronged other people.",
    fields: [
      { key: "harm", label: "Harm done", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 14,
    name: "Dominant Spiritual Patterns",
    type: "patterns_checklist",
    description: "Named spirits or patterns that have had a dominant influence in your life. Check all that apply.",
    fields: [],
  },
  {
    id: 15,
    name: "Generational Sins & Family Patterns",
    type: "list_builder",
    description: "Sins or bondages that have repeated across generations in your family line.",
    fields: [
      { key: "pattern_or_sin", label: "Pattern or sin", placeholder: "e.g. alcoholism, rage, abandonment", required: true, type: "textarea" },
    ],
  },
  {
    id: 16,
    name: "Family Members & Ancestors of Concern",
    type: "list_builder",
    description: "Specific people in your family history — living or deceased — whose sins or involvements may have affected your line.",
    fields: [
      { key: "name_or_description", label: "Name or description", placeholder: "e.g. grandfather, great-uncle", required: true, type: "text" },
      { key: "groups_or_sins_involved", label: "Groups or sins involved (optional)", placeholder: "e.g. Freemasonry, occult, violence", type: "textarea" },
    ],
  },
  {
    id: 17,
    name: "Lodges, Secret Societies & Oath-Bound Groups",
    type: "list_builder",
    description: "Membership in Freemasonry, secret societies, or any group that required oaths, rituals, or secret allegiances.",
    fields: [
      { key: "group", label: "Group name", placeholder: "e.g. Freemasonry, Odd Fellows", required: true, type: "text" },
      { key: "titles_or_roles", label: "Titles, degrees, or roles (optional)", placeholder: "e.g. 32nd Degree, Grand Master", type: "textarea" },
      { key: "oaths_or_rituals", label: "Known oaths or rituals (optional)", placeholder: "Describe if known", type: "textarea" },
    ],
  },
  {
    id: 18,
    name: "Agreement Sins",
    type: "list_builder",
    description: "Sins you committed through agreement — going along with or enabling evil done by others.",
    fields: [
      { key: "agreement", label: "Agreement or cooperation with evil", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 19,
    name: "Named Spirits, False Deities & Unholy Allegiances",
    type: "list_builder",
    description: "Any spirits, false gods, or entities you knowingly or unknowingly gave allegiance or devotion to.",
    fields: [
      { key: "name", label: "Name of spirit or deity", placeholder: "e.g. specific named entity, ancestral spirit", required: true, type: "text" },
    ],
  },
  {
    id: 20,
    name: "Objects of Concern",
    type: "list_builder",
    description: "Physical objects in your possession that may carry a spiritual attachment — occult artifacts, inherited items, cursed objects.",
    fields: [
      { key: "object", label: "Object", placeholder: "Describe the item", required: true, type: "textarea" },
    ],
  },
  {
    id: 21,
    name: "Curses, Spells & Blood Contracts",
    type: "list_builder",
    description: "Known curses spoken against you or your family, and any blood covenants or ritual bonds you are aware of.",
    fields: [
      {
        key: "kind",
        label: "Kind",
        placeholder: "Select kind",
        required: true,
        type: "enum",
        enumOptions: [
          { label: "Curse against me or my family", value: "Curse against family" },
          { label: "Blood contract / ritual bond", value: "Blood contract/ritual bond" },
        ],
      },
      { key: "description", label: "Description", placeholder: "Describe what you know", required: true, type: "textarea" },
    ],
  },
  {
    id: 22,
    name: "Infirmities",
    type: "list_builder",
    description: "Physical or mental infirmities you are carrying — especially those you want to bring before God for healing.",
    fields: [
      { key: "infirmity", label: "Infirmity or condition", placeholder: "Name or describe it", required: true, type: "text" },
      { key: "for_healing", label: "I am specifically asking God for healing of this", type: "boolean" },
    ],
  },
  {
    id: 23,
    name: "Future Generation Concerns",
    type: "list_builder",
    description: "Concerns you have for your children, grandchildren, or future generations — patterns you do not want passed on.",
    fields: [
      { key: "concern", label: "Concern", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
];

export function getSectionById(id: number): SectionDefinition | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function getSectionName(id: number): string {
  return getSectionById(id)?.name ?? `Section ${id}`;
}
