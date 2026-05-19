export interface JuniorSpirit {
  id: string;
  label: string;
  hasFreeText?: boolean;
}

export interface StrongmanCategory {
  id: string;
  name: string;
  juniors: JuniorSpirit[];
}

export const STRONGMAN_CATEGORIES: StrongmanCategory[] = [
  {
    id: "fear",
    name: "Spirit of Fear",
    juniors: [
      { id: "fear_phobias", label: "Phobias", hasFreeText: true },
      { id: "fear_anxiety", label: "Anxiety" },
      { id: "fear_worry", label: "Worry" },
      { id: "fear_terror", label: "Terror / Dread" },
      { id: "fear_nightmares", label: "Nightmares" },
      { id: "fear_cowardice", label: "Cowardice" },
      { id: "fear_torment", label: "Torment" },
      { id: "fear_paranoia", label: "Paranoia" },
    ],
  },
  {
    id: "lying",
    name: "Lying Spirit",
    juniors: [
      { id: "lying_deception", label: "Deception" },
      { id: "lying_flattery", label: "Flattery" },
      { id: "lying_false_prophecy", label: "False Prophecy" },
      { id: "lying_superstition", label: "Superstition" },
      { id: "lying_confusion", label: "Confusion" },
      { id: "lying_vain_imagination", label: "Vain Imagination" },
    ],
  },
  {
    id: "pride",
    name: "Spirit of Pride",
    juniors: [
      { id: "pride_arrogance", label: "Arrogance / Ego" },
      { id: "pride_vanity", label: "Vanity" },
      { id: "pride_self_righteousness", label: "Self-Righteousness" },
      { id: "pride_stubbornness", label: "Stubbornness" },
      { id: "pride_rebellion", label: "Rebellion" },
      { id: "pride_control", label: "Control / Domination" },
      { id: "pride_haughtiness", label: "Haughtiness" },
    ],
  },
  {
    id: "jealousy",
    name: "Spirit of Jealousy",
    juniors: [
      { id: "jealousy_envy", label: "Envy" },
      { id: "jealousy_covetousness", label: "Covetousness" },
      { id: "jealousy_anger", label: "Anger / Rage" },
      { id: "jealousy_suspicion", label: "Suspicion" },
      { id: "jealousy_competition", label: "Competition / Rivalry" },
      { id: "jealousy_bitterness", label: "Bitterness" },
    ],
  },
  {
    id: "whoredoms",
    name: "Spirit of Whoredoms",
    juniors: [
      { id: "whoredoms_lust", label: "Lust" },
      { id: "whoredoms_adultery", label: "Adultery / Fornication" },
      { id: "whoredoms_pornography", label: "Pornography" },
      { id: "whoredoms_perversion", label: "Sexual Perversion" },
      { id: "whoredoms_idolatry", label: "Idolatry" },
      { id: "whoredoms_unfaithfulness", label: "Unfaithfulness" },
    ],
  },
  {
    id: "heaviness",
    name: "Spirit of Heaviness",
    juniors: [
      { id: "heaviness_depression", label: "Depression" },
      { id: "heaviness_grief", label: "Grief / Sorrow" },
      { id: "heaviness_rejection", label: "Rejection" },
      { id: "heaviness_self_pity", label: "Self-Pity" },
      { id: "heaviness_loneliness", label: "Loneliness" },
      { id: "heaviness_hopelessness", label: "Hopelessness / Despair" },
      { id: "heaviness_mourning", label: "Unresolved Mourning" },
    ],
  },
  {
    id: "infirmity",
    name: "Spirit of Infirmity",
    juniors: [
      { id: "infirmity_weakness", label: "Weakness / Fatigue" },
      { id: "infirmity_chronic_illness", label: "Chronic Illness" },
      { id: "infirmity_self_hatred", label: "Self-Hatred / Shame" },
      { id: "infirmity_affliction", label: "Affliction" },
      { id: "infirmity_defect", label: "Sense of Defectiveness" },
    ],
  },
  {
    id: "bondage",
    name: "Spirit of Bondage",
    juniors: [
      { id: "bondage_addiction", label: "Addiction", hasFreeText: true },
      { id: "bondage_compulsion", label: "Compulsion" },
      { id: "bondage_captivity", label: "Captivity to Sin" },
      { id: "bondage_slavery", label: "Slavery to Habit" },
      { id: "bondage_perfectionism", label: "Perfectionism" },
    ],
  },
  {
    id: "familiar",
    name: "Familiar Spirit",
    juniors: [
      { id: "familiar_witchcraft", label: "Witchcraft" },
      { id: "familiar_divination", label: "Divination / Fortune-telling" },
      { id: "familiar_psychic", label: "Psychic Ability" },
      { id: "familiar_necromancy", label: "Necromancy / Séance" },
      { id: "familiar_occult", label: "Occult Practices" },
      { id: "familiar_new_age", label: "New Age" },
    ],
  },
  {
    id: "deaf_dumb",
    name: "Deaf and Dumb Spirit",
    juniors: [
      { id: "dd_seizures", label: "Seizures" },
      { id: "dd_self_harm", label: "Self-Harm" },
      { id: "dd_suicidal", label: "Suicidal Thoughts" },
      { id: "dd_muteness", label: "Inability to Speak Truth" },
      { id: "dd_spiritual_deafness", label: "Spiritual Deafness" },
    ],
  },
  {
    id: "antichrist",
    name: "Spirit of Antichrist",
    juniors: [
      { id: "ac_humanism", label: "Humanism / Secularism" },
      { id: "ac_doubt", label: "Doubt / Skepticism" },
      { id: "ac_blasphemy", label: "Blasphemy" },
      { id: "ac_apostasy", label: "Apostasy" },
      { id: "ac_deception", label: "Spiritual Deception" },
      { id: "ac_other", label: "Other", hasFreeText: true },
    ],
  },
];

export function getAllJuniorSpirits(): Array<JuniorSpirit & { categoryName: string }> {
  return STRONGMAN_CATEGORIES.flatMap((cat) =>
    cat.juniors.map((j) => ({ ...j, categoryName: cat.name }))
  );
}

export function getJuniorSpiritById(id: string): (JuniorSpirit & { categoryName: string }) | undefined {
  return getAllJuniorSpirits().find((j) => j.id === id);
}
