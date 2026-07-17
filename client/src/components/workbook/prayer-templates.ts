/**
 * prayer-templates.ts
 *
 * Three Catholic deliverance prayers with verbatim text from the source manual.
 * Each prayer is a paginated array of mixed nodes:
 *   - { type: "text" }              — verbatim static text
 *   - { type: "inject" }            — workbook section or user-profile slot
 *   - { type: "in_prayer_textarea" }— ephemeral day-of input (not saved)
 *   - { type: "conditional_block" } — renders only when a profile field is non-empty
 *
 * Do not paraphrase or alter prayer text. Render verbatim.
 */

// ─── Node types ───────────────────────────────────────────────────────────────

export type InjectFormat =
  | "items_comma"
  | "names_comma"
  | "patterns_comma"
  | "spirits_with_every_prefix"
  | "infirmities_each"
  | "lies_with_truths"
  | "text"
  | "items_each"
  | "renounce_each"
  | "renounce_lodge_each"
  | "renounce_simple_each"
  | "renounce_spirit_each"
  | "forgive_each"
  | "family_dead_each"
  | "let_end_each"
  | "ancestor_each";

export type InjectFilter =
  | "skip_empties"
  | "where_is_family_harm"
  | "where_kind_curse"
  | "where_kind_blood_contract"
  | "where_spoken_by_nonempty"
  | "where_spoken_by_empty"
  | "where_truth_nonempty"
  | "where_for_healing"
  | "whose_father"
  | "whose_mother"
  | "whose_family";

export type TextNode = { type: "text"; content: string };
export type InjectNode = {
  type: "inject";
  /** Workbook section id (1–23) */
  sectionId?: number;
  /** User-profile camelCase field name */
  profileField?: string;
  format: InjectFormat;
  /** Field key on entryData (for list_builder sections) */
  field?: string;
  filter?: InjectFilter;
  /** Fallback text shown when lies_with_truths has no qualifying entries */
  emptyStateText?: string;
};
export type InPrayerTextareaNode = { type: "in_prayer_textarea"; placeholder: string };
export type ConditionalBlockNode = {
  type: "conditional_block";
  /** Render inner nodes only when this profile field is non-empty */
  profileField?: string;
  /** Render inner nodes only when this section has at least one non-empty value for the given field */
  sectionId?: number;
  sectionField?: string;
  /** Apply this filter before checking for non-empty entries */
  sectionFilter?: InjectFilter;
  nodes: Array<TextNode | InjectNode | InPrayerTextareaNode>;
};
export type PrayerNode = TextNode | InjectNode | InPrayerTextareaNode | ConditionalBlockNode;

export type PrayerPage = {
  title: string;
  nodes: PrayerNode[];
  /**
   * Skip this entire page if ALL of the listed sections have zero entries.
   * (Show the page if at least one listed section has at least one entry.)
   */
  skipIfSectionsEmpty?: number[];
  /**
   * Skip this entire page if the filtered entries from the given section are empty.
   */
  skipIfFilteredSectionEmpty?: { sectionId: number; filter: InjectFilter };
};

export type PrayerTemplate = {
  id: "prayer_1" | "prayer_2" | "prayer_3";
  title: string;
  subtitle: string;
  pages: PrayerPage[];
};

// ─── Shorthand builders (file-local) ─────────────────────────────────────────

const T = (content: string): TextNode => ({ type: "text", content });

const I = (
  sectionId: number,
  field: string,
  format: InjectFormat,
  filter?: InjectFilter,
): InjectNode => ({
  type: "inject",
  sectionId,
  field,
  format,
  ...(filter ? { filter } : {}),
});

/** Section 14 checklist — no field key needed */
const S14 = (format: "patterns_comma" | "spirits_with_every_prefix"): InjectNode => ({
  type: "inject",
  sectionId: 14,
  format,
});

const P = (profileField: string, format: InjectFormat): InjectNode => ({
  type: "inject",
  profileField,
  format,
});

const TA = (placeholder: string): InPrayerTextareaNode => ({
  type: "in_prayer_textarea",
  placeholder,
});

const C = (
  profileField: string,
  nodes: Array<TextNode | InjectNode | InPrayerTextareaNode>,
): ConditionalBlockNode => ({
  type: "conditional_block",
  profileField,
  nodes,
});

/** Conditional block that renders only when a section has at least one non-empty entry for the given field */
const CS = (
  sectionId: number,
  sectionField: string,
  nodes: Array<TextNode | InjectNode | InPrayerTextareaNode>,
  sectionFilter?: InjectFilter,
): ConditionalBlockNode => ({
  type: "conditional_block",
  sectionId,
  sectionField,
  ...(sectionFilter ? { sectionFilter } : {}),
  nodes,
});

const LIES_WITH_TRUTHS: InjectNode = {
  type: "inject",
  sectionId: 6,
  format: "lies_with_truths",
  filter: "where_truth_nonempty",
  emptyStateText:
    "Lord Jesus, today I have not yet named the truths You are speaking to me. I receive Your Word over me now: I am Your beloved. I am marked by baptism. I am covered by the Precious Blood. Speak to me, Lord, and I will listen.",
};

// ─── Prayer 1 — Personal Deliverance Prayer (17 pages) ───────────────────────

export const PRAYER_1: PrayerTemplate = {
  id: "prayer_1",
  title: "Personal Deliverance Prayer",
  subtitle: "Personal Deliverance Prayer",
  pages: [
    // Page 1 — Opening prayer
    {
      title: "Opening prayer",
      nodes: [
        T(
          "Lord Jesus Christ, Son of the living God, I come before You in humility, faith, and repentance. I believe that You are my Savior, my Redeemer, my Lord, and my Deliverer. I believe that You died for my sins, that You rose from the dead, and that Your Precious Blood is stronger than every sin, wound, curse, demon, false agreement, unholy bond, and evil influence that has touched my life.\n\nIn Your holy name, and through the power of Your Precious Blood, I renounce Satan, all his works, and all his empty promises. I reject every evil that I have accepted through sin, ignorance, fear, rebellion, weakness, curiosity, woundedness, or deliberate choice. I reject every evil that has entered my life through my own sins, through sins committed against me, through the sins of my family line, through occult practices, through unholy relationships, through false vows, through unforgiveness, through trauma, through deception, or through any other opening known or unknown to me.\n\nLord Jesus, I ask You to cover me with Your Precious Blood. Wash over my mind, my body, my soul, my memory, my imagination, my heart, my home, my family, my relationships, and everything entrusted to me. Let every place of darkness be brought under Your authority. Let every place of bondage be brought under Your Cross. Let every place of fear, shame, confusion, hatred, lust, pride, rebellion, despair, or torment be touched by Your mercy.\n\nBlessed Virgin Mary, Mother of God, spread your mantle over me and pray for me. Saint Michael the Archangel, defend me in battle. Holy angels of God, surround me, guard me, and drive far from me every evil spirit. All holy saints of God, pray for me.\n\nLord Jesus, as I name these sins, wounds, bonds, and agreements, give me true repentance, true renunciation, and true freedom. Amen.",
        ),
      ],
    },

    // Page 2 — Personal sins
    {
      title: "Personal sins",
      nodes: [
        T("Lord Jesus Christ, I repent of all my personal sins, especially "),
        I(1, "sin", "items_comma"),
        T(
          ". I confess that these sins were wrong, and I do not excuse them, hide them, defend them, or cling to them. I place them under Your Precious Blood and ask You to forgive me, cleanse me, and give me the grace to make a good Confession wherever Confession is needed.\n\nIn the holy name of Jesus, I renounce these sins. I reject every pleasure, habit, false comfort, false identity, and false promise attached to them. I break every agreement I have made with these sins, whether knowingly or unknowingly, and I reject every spirit that has gained influence in my life through them.\n\nIn the holy name of Jesus Christ, and through the power of His Precious Blood, I ask Almighty God to bind every evil spirit connected to these sins, to break its power over me, to cast it away from me, and to remove every claim, attachment, influence, or foothold it has had in my life. Lord Jesus, close every door I opened through these sins, and fill every place that has been emptied with Your Holy Spirit.",
        ),
      ],
    },

    // Page 3 — Unforgiveness, resentment, and judgment
    {
      title: "Unforgiveness, resentment, and judgment",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of all unforgiveness, bitterness, resentment, anger, hatred, revenge, accusation, and sinful judgment. I acknowledge before You the people I have refused to forgive, especially ",
        ),
        I(2, "person", "names_comma"),
        T(
          ".\n\nWhat happened to me mattered. The wounds were real. The injustice was real. But I do not want unforgiveness to rule my heart, and I do not want bitterness to give the evil one any place in me. Therefore, in obedience to You, and with the help of Your grace, I choose to forgive those who hurt me. I release them into Your hands. I release my demand for revenge. I release the debt they owe me, and I ask You to judge rightly, heal deeply, and restore what can be restored.\n\nIn the holy name of Jesus, I renounce unforgiveness, bitterness, resentment, hatred, revenge, accusation, and every sinful judgment I have made against others. I break every unholy bond, attachment, agreement, and spiritual claim formed through unforgiveness. I reject every spirit that has used these wounds to keep me bound.\n\nIn the holy name of Jesus Christ, and through the power of His Precious Blood, I ask Almighty God to bind every spirit of unforgiveness, bitterness, hatred, revenge, anger, resentment, accusation, judgment, and hardness of heart, to break its power over me, to cast it away from me, and to restore in me the mercy, peace, and freedom of Christ.",
        ),
      ],
    },

    // Page 4 — Father, mother, family, and childhood wounds
    {
      title: "Father, mother, family, and childhood wounds",
      nodes: [
        T(
          "Lord Jesus Christ, I bring before You the wounds connected to my father, my mother, my grandparents, my family, my home, and my childhood. I especially bring before You ",
        ),
        I(3, "what", "items_comma", "whose_father"),
        T(", "),
        I(3, "what", "items_comma", "whose_mother"),
        T(", and "),
        I(3, "what", "items_comma", "whose_family"),
        T(
          ".\n\nI forgive those who failed to love me as they should have loved me. I forgive those who wounded me, rejected me, neglected me, abandoned me, frightened me, controlled me, used me, shamed me, or placed burdens on me that I was not meant to carry. I release sinful judgment against them, and I place them into Your hands.\n\nIn the holy name of Jesus, I renounce every lie I believed because of these wounds, especially ",
        ),
        I(3, "lie_believed", "items_comma", "skip_empties"),
        T(
          ". I reject the lie that I am unwanted, unloved, unsafe, abandoned, worthless, dirty, rejected, forgotten, or beyond healing. I reject every false identity that entered through these wounds.\n\nIn the holy name of Jesus Christ, and through the power of His Precious Blood, I break every unholy bond, attachment, agreement, wound, and spiritual claim connected to these family and childhood wounds. I ask Almighty God to bind every spirit of rejection, abandonment, fear, shame, control, confusion, hatred, despair, self-hatred, and orphanhood connected to these wounds, to cast them away from me, and to restore in me the truth that I am a beloved child of the Father.",
        ),
      ],
    },

    // Page 5 — Sexual sin and unholy attachments
    {
      title: "Sexual sin and unholy attachments",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of every sexual sin I have committed in thought, word, desire, imagination, memory, or action. I repent especially of ",
        ),
        I(4, "sin", "items_comma"),
        T(
          ". I bring before You every person connected to these sins, especially ",
        ),
        I(4, "person_or_partner", "names_comma", "skip_empties"),
        T(
          ".\n\nI repent of lust, impurity, pornography, fornication, adultery, fantasy, seduction, masturbation, use of others, consent to being used, sexual manipulation, sexualized attention, and every misuse of my body or the body of another person. I repent of treating what is sacred as common, of seeking comfort apart from love, and of using sexuality in a way that separated me from You.\n\nIn the holy name of Jesus, I renounce every unholy soul tie, bond, attachment, agreement, claim, pact, vow, oath, covenant, memory, fantasy, and spiritual influence formed through these sins. I renounce every unholy attachment to the people I have named, to their past partners, to those who encouraged these sins, and to every spirit connected to these sins.\n\nIf any unholy ritual, pact, oath, vow, curse, blood covenant, or occult bond was formed through these sins, knowingly or unknowingly, I renounce it and break it now in the holy name of Jesus Christ.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of lust, impurity, perversion, shame, fantasy, seduction, addiction, domination, abuse, confusion, and unchaste attachment, to break its power over me, to cast it away from me, and to cleanse my body, mind, memory, imagination, and heart. Lord Jesus, restore in me chastity, purity, reverence, peace, and the freedom of a child of God.",
        ),
      ],
    },

    // Page 6 — Soul ties and unhealthy bonds
    {
      title: "Soul ties and unhealthy bonds",
      nodes: [
        T(
          "Lord Jesus Christ, I bring before You every soul tie, unhealthy bond, and disordered attachment that has given another person an ungodly hold over my heart, my will, my emotions, my body, or my peace.",
        ),
        CS(24, "person_or_relationship", [
          T(" I bring before You especially "),
          I(24, "person_or_relationship", "names_comma"),
          T("."),
        ]),
        T(
          "\n\nI acknowledge that these bonds were not holy. I renounce every ungodly soul tie, unhealthy attachment, emotional dependency, and disordered connection formed through sexual sin, trauma, abuse, grief, occult involvement, idolatry of persons, or any relationship where fear, control, or disordered love gave another person ungodly influence over me. I release each person I have named into Your hands. I release myself from every claim these bonds have exercised over my mind, my emotions, my will, my body, and my spiritual life.\n\nIn the holy name of Jesus, I renounce every soul tie, bond, tether, and unholy agreement — spoken or unspoken — formed through these relationships. I reject every spirit that gained access, influence, or torment over me through these bonds.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to sever every ungodly soul tie, to reclaim every part of my heart, soul, mind, will, and body that was given away or taken through these bonds, and to restore what was damaged. Lord Jesus, bind every spirit of soul bondage, unhealthy attachment, emotional dependency, control, domination, grief bondage, and spiritual manipulation, break its power over me, cast it away from me, and restore in me love that is free, ordered, and wholly surrendered to You.",
        ),
      ],
    },

    // Page 7 — Occult, divination, magic, and false spiritual power
    {
      title: "Occult, divination, magic, and false spiritual power",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of every way I have sought power, knowledge, healing, comfort, protection, control, or guidance apart from You. I repent of and renounce ",
        ),
        I(5, "practice", "items_comma"),
        T(
          ".\n\nI renounce Satan and every occult practice. I renounce divination, witchcraft, sorcery, magic, tarot, astrology, psychic readings, mediumship, spiritism, séances, Ouija boards, spells, charms, curses, energy healing opposed to Christ, New Age practices, false prophecy, false light, false worship, and every attempt to gain hidden knowledge or spiritual power apart from God.\n\nIn the holy name of Jesus, I break every pact, vow, oath, ritual, curse, spell, seal, assignment, attachment, agreement, and spiritual claim connected to these practices. I reject every spirit that entered, influenced me, deceived me, tormented me, or claimed access to me through these sins.\n\nIn the holy name of Jesus Christ, and through the power of His Precious Blood, I ask Almighty God to bind every spirit connected to occult involvement, divination, witchcraft, sorcery, deception, fear, false healing, false prophecy, false light, control, and spiritual confusion, to break its power over me, to cast it away from me, and to close every door I opened through these practices. Lord Jesus, fill every place touched by darkness with the light of the Holy Spirit.",
        ),
      ],
    },

    // Page 7 — Word curses, evil words, and false names
    {
      title: "Word curses, evil words, and false names",
      nodes: [
        T(
          "Lord Jesus Christ, I reject every evil word, curse, insult, judgment, label, false identity, and lie spoken over me by others or spoken by me against myself. I especially renounce ",
        ),
        I(6, "lie", "items_comma", "where_spoken_by_nonempty"),
        T(" and "),
        I(6, "lie", "items_comma", "where_spoken_by_empty"),
        T(
          ".\n\nI reject the words that said I was worthless, unwanted, broken, dirty, stupid, cursed, hopeless, rejected, impossible to love, beyond healing, or destined for evil. I reject every false name that came through cruelty, abuse, rejection, humiliation, fear, shame, or despair. These words do not define me. These lies do not own me. These curses do not have authority over me.\n\nIn the holy name of Jesus, I break agreement with every word curse, false judgment, evil label, and lie spoken over me. I renounce every spirit that used these words to wound me, bind me, accuse me, shame me, confuse me, or keep me from receiving the truth of God.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of rejection, shame, condemnation, self-hatred, despair, fear, confusion, worthlessness, and accusation connected to these words, to break its power over me, and to cast it away from me. Lord Jesus, speak Your truth over me, and let Your word be stronger than every lie.",
        ),
      ],
    },

    // Page 8 — Vows, oaths, pledges, and interior promises
    {
      title: "Vows, oaths, pledges, and interior promises",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of every sinful vow, oath, pledge, promise, or interior agreement I have made apart from You. I renounce especially ",
        ),
        I(7, "vow", "items_comma"),
        T(
          ".\n\nI renounce every vow made from fear, hatred, pride, lust, despair, grief, revenge, control, self-protection, or unbelief. I renounce vows such as \"I will never forgive,\" \"I will never trust,\" \"I will never need anyone,\" \"I will always be alone,\" \"I will get revenge,\" \"I belong to darkness,\" \"I cannot be free,\" \"I am beyond help,\" and every similar vow spoken aloud or held silently in my heart.\n\nIn the holy name of Jesus, I break every unholy vow, oath, pledge, promise, agreement, curse, attachment, and spiritual claim connected to these words. I reject every spirit that used these vows to bind my will, harden my heart, distort my identity, or shape my future apart from God.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to these vows, to break its power over me, to cast it away from me, and to restore my will to the freedom and obedience of Christ.",
        ),
      ],
    },

    // Page 9 — Idolatry and false sources of safety
    {
      title: "Idolatry and false sources of safety",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of every form of idolatry in my life. I repent of making idols of ",
        ),
        I(8, "idol", "items_comma"),
        T(
          ".\n\nI repent of looking for ultimate safety, identity, comfort, control, pleasure, healing, power, approval, escape, or worth in anything other than You. I renounce every false god, every false altar, every false refuge, every false covering, every false comfort, and every false source of peace.\n\nIn the holy name of Jesus, I break every unholy attachment, agreement, claim, and spiritual influence connected to idolatry. I reject every spirit that has used these idols to draw me away from God, weaken my faith, enslave my desires, or keep me from surrender.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to idolatry, greed, control, lust, addiction, fear, pride, false worship, and false comfort, to break its power over me, and to cast it away from me. Jesus Christ, You alone are Lord, and I choose to worship You alone.",
        ),
      ],
    },

    // Page 10 — Pride, rebellion, and control
    {
      title: "Pride, rebellion, and control",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of pride, rebellion, disobedience, stubbornness, self-reliance, and control. I repent especially of ",
        ),
        I(9, "pattern", "items_comma"),
        T(
          ".\n\nI repent of exalting myself, defending my sin, refusing correction, hiding from the truth, blaming others, despising authority, resisting Your will, and trying to rule my life apart from You. I repent of wanting my own way more than Your will.\n\nIn the holy name of Jesus, I renounce pride. I renounce rebellion. I renounce control. I renounce self-will. I renounce every refusal to obey God.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of pride, rebellion, control, stubbornness, arrogance, disobedience, self-exaltation, and hardness of heart, to break its power over me, to cast it away from me, and to give me a humble, obedient, and teachable heart.",
        ),
      ],
    },

    // Page 11 — Generational sins and family patterns
    {
      title: "Generational sins and family patterns",
      nodes: [
        T(
          "Lord Jesus Christ, I bring before You the sins, wounds, disorders, and evil patterns that have affected my family line. I repent of my own participation in these sins and patterns, especially ",
        ),
        I(15, "pattern_or_sin", "items_comma"),
        T(
          ".\n\nI do not claim personal guilt for sins I did not commit, but I reject every evil inheritance, every sinful pattern, every curse, every bondage, every wound, and every demonic influence that has passed through my family line and affected my life. I renounce family patterns of addiction, violence, abuse, occult involvement, idolatry, adultery, abandonment, hatred, despair, suicide, greed, deception, unbelief, mental torment, sexual sin, poverty of spirit, and every pattern contrary to the kingdom of God.\n\nIn the holy name of Jesus, and through the power of His Precious Blood, I break every curse, attachment, agreement, assignment, and spiritual claim connected to the sins of my ancestors and my family line. I ask Almighty God to bind every evil spirit connected to these generational sins and patterns, to break its power over me and my family, and to cast it away from us according to His holy will.\n\nLord Jesus, place Your Cross between me and every evil inheritance. Let Your mercy be stronger than every sin of the past. Bless my family, living and dead, according to Your mercy, and bring repentance, healing, deliverance, and salvation wherever they are needed.",
        ),
      ],
    },

    // Page 12 — Abuse, trauma, and wounded responses
    {
      title: "Abuse, trauma, and wounded responses",
      nodes: [
        T(
          "Lord Jesus Christ, I bring before You the places where I was abused, harmed, violated, neglected, abandoned, humiliated, manipulated, controlled, or wounded. I bring You especially ",
        ),
        I(10, "event", "items_comma"),
        T(
          ".\n\nI do not call evil good. I do not excuse what happened. I do not take blame for what was not my fault. I place every wound, every memory, every fear, every humiliation, and every violation under Your Cross.\n\nBut I also repent of every sinful response that came from these wounds, especially ",
        ),
        I(10, "sinful_response", "items_comma", "skip_empties"),
        T(
          ". I repent of hatred, revenge, despair, self-hatred, destructive choices, isolation, bitterness, unbelief, impurity, rage, mistrust, and every way I allowed pain to lead me away from You.\n\nIn the holy name of Jesus, I renounce every lie, vow, attachment, agreement, and spiritual claim connected to these wounds. I reject every spirit that entered through trauma, fear, rejection, shame, despair, confusion, hatred, rage, self-hatred, or torment.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every evil spirit connected to these wounds, to break its power over me, to cast it away from me, and to remove its influence from my mind, body, soul, memory, imagination, and heart. Lord Jesus, enter these memories with Your light, heal what has been wounded, and restore peace where there has been torment.",
        ),
      ],
    },

    // Page 13 — Addictions and compulsions
    {
      title: "Addictions and compulsions",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of every addiction, compulsion, dependency, and destructive habit in my life, especially ",
        ),
        I(11, "addiction", "items_comma"),
        T(
          ".\n\nI repent of turning to created things for comfort, escape, control, relief, numbness, pleasure, or identity apart from You. I renounce every false comfort, every false escape, every agreement with slavery, every agreement with secrecy, every agreement with despair, and every agreement with shame.\n\nIn the holy name of Jesus, I break every unholy bond, attachment, agreement, and spiritual claim connected to these addictions and compulsions. I reject every spirit that used these habits to enslave my body, weaken my will, cloud my mind, isolate me from others, or separate me from God.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of addiction, compulsion, slavery, secrecy, shame, despair, self-destruction, and false comfort, to break its power over me, to cast it away from me, and to strengthen me in repentance, accountability, healing, perseverance, and freedom.",
        ),
      ],
    },

    // Page 14 — False religion, spiritual mixture, and false worship
    {
      title: "False religion, spiritual mixture, and false worship",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of every participation in worship, rituals, prayers, initiations, symbols, practices, or spiritual systems opposed to You. I renounce especially ",
        ),
        I(12, "practice", "items_comma"),
        T(
          ".\n\nI reject every false god, false spirit, false worship, false blessing, false initiation, false covering, false protection, and false spiritual authority. I reject every mixture of the Catholic faith with practices that do not belong to Christ.\n\nIn the holy name of Jesus, I break every pact, vow, oath, ritual, attachment, agreement, curse, and spiritual claim connected to false worship and false religion. I reject every spirit that entered, influenced me, deceived me, or claimed access to me through these practices.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to false worship, idolatry, religious confusion, deception, fear, and spiritual bondage, to break its power over me, and to cast it away from me. I choose the Father, the Son, and the Holy Spirit. I choose Jesus Christ and the faith of His Church.",
        ),
      ],
    },

    // Page 15 — Harm I have done to others
    {
      title: "Harm I have done to others",
      nodes: [
        T(
          "Lord Jesus Christ, I repent of the ways I have harmed other people. I repent especially of ",
        ),
        I(13, "harm", "items_comma"),
        T(
          ".\n\nI repent of selfishness, cruelty, manipulation, neglect, dishonesty, impurity, betrayal, anger, gossip, rejection, abuse, contempt, and every failure to love. I repent of the wounds I caused knowingly or unknowingly. I ask You to forgive me and to show me where I need to confess, apologize, repair, restore, or make restitution.\n\nIn the holy name of Jesus, I renounce every sin and every evil influence connected to the harm I have caused. I reject every spirit that encouraged me to wound, use, deceive, control, reject, or despise others.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to these sins, to break its power over me, to cast it away from me, and to give me humility, courage, and charity.",
        ),
      ],
    },

    // Page 16 — Dominant spiritual patterns
    {
      title: "Dominant spiritual patterns",
      nodes: [
        T(
          "Lord Jesus Christ, I now renounce the dominant spiritual patterns that have afflicted me, tempted me, tormented me, deceived me, accused me, oppressed me, or influenced my life. I renounce especially ",
        ),
        S14("patterns_comma"),
        T(
          ".\n\nIn the holy name of Jesus, I renounce ",
        ),
        S14("spirits_with_every_prefix"),
        T(
          ". I reject each one. I break agreement with each one. I break every claim, attachment, assignment, influence, and foothold connected to each one.\n\nThrough the power of the Precious Blood of Jesus, I ask Almighty God to bind each and every evil spirit connected to these patterns, to render them powerless against me, to silence their accusations, to break their influence, to cast them away from me, and to prevent them from returning.\n\nI belong to Jesus Christ. I am marked by baptism. I am covered by the Precious Blood of Jesus. I am not the property of the evil one.",
        ),
      ],
    },

    // Page 17 — Final prayer of binding, deliverance, and protection
    {
      title: "Final prayer of binding, deliverance, and protection",
      nodes: [
        T(
          "Lord Jesus Christ, in Your holy name and through the power of Your Precious Blood, I ask Almighty God to bind every evil spirit that has come against me, afflicted me, tempted me, tormented me, deceived me, accused me, oppressed me, influenced me, or attached itself to me through any sin, wound, curse, trauma, occult practice, false religion, family pattern, unholy relationship, sexual sin, false vow, word curse, unforgiveness, idolatry, addiction, or agreement with evil.\n\nI ask You, Lord Jesus, to break every curse, pact, spell, hex, vex, seal, assignment, trigger, trance, vow, demonic blessing, evil prayer, ritual bond, false covering, unholy attachment, and every other demonic bondage sent against me, formed by me, accepted by me, inherited by me, or placed upon me in any way.\n\nIn the holy name of Jesus Christ, I renounce them all. I reject them all. I break their power over me through the Precious Blood of Jesus. I ask Almighty God to render every evil spirit powerless, to silence every accusation, to close every door, to remove every claim, to cast every evil spirit away from me, and to make them incapable of tempting, tormenting, afflicting, deceiving, or harming me.\n\nLord Jesus, wash me in Your Precious Blood. Wash my mind, my body, my soul, my heart, my memory, my imagination, my emotions, my desires, my dreams, my home, my family, my relationships, my work, and all that belongs to me. Let this place and every place under my care be made holy by Your presence and protected by Your power.\n\nBlessed Virgin Mary, Mother of God and Queen of Angels, cover me with your mantle and pray for me. Saint Michael the Archangel, defend me in battle. Holy angels and archangels, surround me, guard me, and drive far from me every evil spirit. All holy saints of God, intercede for me before the throne of God.\n\nCome, Holy Spirit. Fill every place that has been emptied. Fill me with faith, hope, charity, purity, humility, obedience, courage, wisdom, peace, and love. Restore in me the grace of my baptism. Strengthen me for Confession, prayer, the sacraments, forgiveness, conversion, and a life fully surrendered to Jesus Christ.\n\nLord Jesus Christ, I place myself under Your authority, under Your mercy, under Your Cross, and under the protection of Your Precious Blood. Keep me faithful to You, deliver me from evil, and lead me into the freedom of the children of God.\n\nAmen.",
        ),
      ],
    },
  ],
};

// ─── Prayer 2 — Generational Renunciation Prayer (17 pages) ──────────────────

export const PRAYER_2: PrayerTemplate = {
  id: "prayer_2",
  title: "Generational Renunciation Prayer",
  subtitle: "Generational Renunciation Prayer",
  pages: [
    // Page 1 — Opening (always)
    {
      title: "Standing for My Family Line",
      nodes: [
        T(
          "Father in heaven, I come before You in the Most Holy Name of Jesus Christ, Your Son. I confess that Jesus Christ is my Lord, my Savior, and my Deliverer.\n\nI stand before You as a representative of my family — both my father's line and my mother's line, the generations that came before me and the generations that will come after me. I do not stand here to judge my ancestors, but to intercede for them, to forgive them, and to renounce on behalf of this family every agreement with evil that was ever made in our line.\n\nI renounce Satan, all his works, and all his empty promises — for myself and on behalf of my family line. Everything I renounce in this prayer, I renounce completely: every oath, pact, ritual, curse, and claim attached to it, known or unknown, remembered or forgotten. Let this intention stand over every word I pray.\n\nLord Jesus, cover me and my whole family line with Your Precious Blood.",
        ),
      ],
    },

    // Page 2 — Generational Sins (skip if Section 15 empty)
    {
      title: "Generational Sins and Family Patterns",
      skipIfSectionsEmpty: [15],
      nodes: [
        T("Father, I bring before You the sinful patterns that have run through our family line:\n\n"),
        I(15, "pattern_or_sin", "renounce_each"),
        T("\n\nI willingly forgive my ancestors and all whose sins introduced these patterns, and I ask You to forgive them, bless them, and free this family from every consequence of their sins. Let these patterns end in our line now."),
      ],
    },

    // Page 3 — Ancestors, Lodges (skip if Sections 16 & 17 both empty)
    {
      title: "Ancestors of Concern, Lodges, and Oath-Bound Groups",
      skipIfSectionsEmpty: [16, 17],
      nodes: [
        CS(16, "name_or_description", [
          T("Father, I bring before You the specific members of our line whose choices opened doors:\n\n"),
          I(16, "name_or_description", "ancestor_each"),
          T("\n\n"),
        ]),
        CS(17, "group", [
          T("On behalf of my family, I renounce every lodge, secret society, and oath-bound group our line was joined to, especially:\n\n"),
          I(17, "group", "renounce_lodge_each"),
          T("\n\n"),
        ]),
        T("I revoke every consent given by my ancestors to be bound, marked, or claimed by any spirit opposed to Jesus Christ. I forgive them, and I ask Your mercy on them."),
      ],
    },

    // Page 4 — False Religion, Named Spirits (skip if Sections 12 & 19 both empty)
    {
      title: "False Religion, Named Spirits, and Unholy Allegiances",
      skipIfSectionsEmpty: [12, 19],
      nodes: [
        CS(12, "practice", [
          T("Father, I renounce every false worship and spiritual practice in my life and in our family line, especially:\n\n"),
          I(12, "practice", "renounce_simple_each"),
          T("\n\n"),
        ]),
        CS(19, "name", [
          T("I renounce every false deity, familiar spirit, and being to whom devotion or allegiance was given, by me or by my ancestors:\n\n"),
          I(19, "name", "renounce_spirit_each"),
          T("\n\n"),
        ]),
        T("Jesus Christ alone is Lord. This family belongs to Him."),
      ],
    },

    // Page 5 — Agreement Sins (skip if Section 18 empty)
    {
      title: "Agreement Sins",
      skipIfSectionsEmpty: [18],
      nodes: [
        T("Father, I repent of the sins I did not commit directly but agreed with, encouraged, or failed to oppose, especially:\n\n"),
        I(18, "agreement", "items_each"),
        T("\n\nI withdraw my consent from every one of them, and I ask forgiveness for every similar agreement made in our family line."),
      ],
    },

    // Page 6 — Curses, Spells, Blood Contracts (skip if Section 21 empty)
    {
      title: "Curses, Spells, and Blood Contracts",
      skipIfSectionsEmpty: [21],
      nodes: [
        T("Father, in the Name of Jesus and by the power of His Precious Blood, I renounce and break:\n\n"),
        I(21, "description", "items_each"),
        T("\n\nI take the Sword of the Spirit, which is the Word of God, and I break every curse upon this family line, and I cancel the assignment of every familiar spirit that has operated in our family. Let the Blood of Jesus speak louder than every other blood, every other oath, and every other claim."),
      ],
    },

    // Page 7 — Objects (skip if Section 20 empty)
    {
      title: "Objects of Concern",
      skipIfSectionsEmpty: [20],
      nodes: [
        T("Father, I renounce every object connected to evil, false worship, or occult practice in my home or inherited through our line, especially:\n\n"),
        I(20, "object", "items_each"),
        T("\n\nSever every evil connection between these objects and my family, make them powerless, and show me what must be removed, destroyed, or brought to a priest."),
      ],
    },

    // Page 8 — The Family Dead (skip if Section 25 empty)
    {
      title: "The Family Dead",
      skipIfSectionsEmpty: [25],
      nodes: [
        T("Father of mercy, I now bring before You the members of our family line who died in sorrow, in violence, or without prayer — the ones who were never fully mourned.\n\n"),
        I(25, "name", "family_dead_each"),
        T("\n\nWhat was never grieved in our family, I grieve now. What was never prayed for, I pray for now. Eternal rest grant unto them, O Lord, and let perpetual light shine upon them. May their souls, and the souls of all the departed of our family line, through the mercy of God, rest in peace.\n\nI release every one of them into Your hands, and I ask that no grief, fear, or affliction connected to their deaths continue down our family line."),
      ],
    },

    // Page 9 — Forgiving Those Who Harmed the Family (skip if no family-flagged Section 2 entries)
    {
      title: "Forgiving Those Who Harmed the Family",
      skipIfFilteredSectionEmpty: { sectionId: 2, filter: "where_is_family_harm" },
      nodes: [
        T("As an act of obedience, not emotion, I choose to forgive those whose sins wounded not only me but my whole family:\n\n"),
        I(2, "person", "forgive_each", "where_is_family_harm"),
        T("\n\nI release judgment against them and place them into Your hands."),
      ],
    },

    // Page 10 — Infirmities (skip if Section 22 empty)
    {
      title: "Infirmities",
      skipIfSectionsEmpty: [22],
      nodes: [
        T("Father, I bring before You the infirmities carried in my body and in our family line:\n\n"),
        I(22, "infirmity", "items_each"),
        T("\n\nIf any of these is connected to sin, curses, or the patterns of our line, break that connection now by the Precious Blood of Jesus."),
        CS(22, "for_healing", [
          T(" And according to Your holy will, I ask You to heal:\n\n"),
          I(22, "infirmity", "items_each", "where_for_healing"),
        ], "where_for_healing"),
      ],
    },

    // Page 11 — Comprehensive Binding (always)
    {
      title: "Comprehensive Binding and Blocking",
      nodes: [
        T("Father, in the Name of Jesus Christ and by the power of His Precious Blood, I now bring before You everything I have renounced in this prayer, together with everything hidden, forgotten, or unknown in our family line.\n\nI ask You to bind and break every curse, pact, spell, hex, seal, oath, vow, ritual bond, blood covenant, malefice, assignment, ancestral curse, and every other demonic bondage operating in our family line — and to cast out every evil spirit that has claimed access to this family through any of it.\n\nI ask You to block every one of these evils from passing to my children, my descendants, and all future generations, especially:\n\n"),
        CS(23, "concern", [
          I(23, "concern", "let_end_each"),
          T("\n\n"),
        ]),
        T("Let the Precious Blood of Jesus stand between my family and every evil inheritance. Let these evils end now, in this generation, through Your infinite mercy and the power of the Holy Cross."),
      ],
    },

    // Page 12 — Blessing (always)
    {
      title: "Blessing over the Line",
      nodes: [
        T("Father, I now ask for blessings where there have been curses, and healing where there has been sickness — physical, psychological, or spiritual — throughout our whole family line.\n\nBless my ancestors, living and dead, according to Your mercy. Bless my children and descendants; let them inherit faith where there was unbelief, peace where there was violence, fidelity where there was abandonment, and life where there was death.\n\nHoly Spirit, fill every place in our family line that has been emptied of evil. Blessed Virgin Mary, spread your mantle over this family. Saint Michael the Archangel, defend us. Holy angels of God, surround our homes and our children.\n\nLord Jesus Christ, reign in this family — in our past, our present, and our future. Thank You for Your mercy and Your kindness toward me and all my family. Amen."),
      ],
    },

    // Page 13 — Mass Hand-off (always)
    {
      title: "Bringing This to the Mass",
      nodes: [
        T("This prayer is completed at the altar. Bring these intentions — especially the members of your family line you named among the Family Dead — to Mass, and offer them silently with the bread and wine at the Offertory. If you are able, request a Mass to be offered for the deceased of your family line; any parish can arrange this. Generational healing may need to be prayed more than once — return to this prayer, and to the Mass, as often as the Lord leads you."),
      ],
    },
  ],
};

// ─── Prayer 3 — Daily Prayer (14 pages) ──────────────────────────────────────

export const PRAYER_3: PrayerTemplate = {
  id: "prayer_3",
  title: "Daily Prayer",
  subtitle: "Daily Prayer",
  pages: [
    // Page 1 — Opening
    {
      title: "Opening",
      nodes: [
        T(
          "Heavenly Father, I come before You in the Most Holy Name of Jesus Christ, Your Son. I come to You through the new covenant in His Precious Blood, asking for mercy, protection, healing, and the grace to remain faithful to You.\n\nLord Jesus Christ, I ask You to help me deny myself, take up my cross, and follow You. Help me to die to sin, resist temptation, be led by the Holy Spirit, and no longer conform myself to the patterns of this world. Teach me to seek Your will in every decision, to remain close to You in prayer, and to take every thought captive in obedience to Christ.\n\nFather, please provide for me and my family in every way we need. Provide for our souls, our bodies, our relationships, our work, our health, our finances, our home, and our daily responsibilities. Protect us from evil. Bless us with the grace to pursue You, listen to You, obey You, and glorify You in all that we do.\n\nBlessed Virgin Mary, cover us with your mantle. Saint Michael the Archangel, defend us in battle. Holy angels of God, surround us, guard us, and keep far from us every evil spirit.",
        ),
      ],
    },

    // Page 2 — Daily repentance and forgiveness
    {
      title: "Daily repentance and forgiveness",
      nodes: [
        T(
          "Father, I repent of every sin I have committed since the last time I prayed this prayer. I repent especially of ",
        ),
        TA("Anything you want to name today?"),
        T(
          ".\n\nI place these sins under the Precious Blood of Jesus, and I ask You to forgive me, cleanse me, and lead me to Confession wherever Confession is needed.\n\nI also forgive every person who has hurt me, offended me, disappointed me, rejected me, accused me, misunderstood me, betrayed me, or sinned against me since the last time I prayed this prayer. I forgive especially ",
        ),
        TA("Anyone you need to forgive today?"),
        T(
          ".\n\nI release every sinful judgment I have made against them. I release anger, resentment, revenge, accusation, and bitterness. I place each person into Your hands, Lord Jesus, and I ask You to heal what has been wounded in me.\n\nIn the Holy Name of Jesus, I renounce every unholy soul tie, bond, attachment, agreement, and spiritual claim formed through sin, anger, unforgiveness, fear, lust, control, manipulation, dependency, or any other unhealthy connection. I renounce especially ",
        ),
        TA("Any unhealthy attachment forming?"),
        T(
          ".\n\nBy the Precious Blood of Jesus, I ask You, Lord, to break these unholy bonds and restore every relationship to Your holy order.",
        ),
      ],
    },

    // Page 3 — Prayer for spouse, children, and family members
    {
      title: "Prayer for spouse, children, and family members",
      nodes: [
        T("Father, I bring before You my family members, especially "),
        P("familyMembers", "names_comma"),
        T(".\n\n"),
        C("spouseName", [
          T("For my spouse, "),
          P("spouseName", "text"),
          T(
            ", I ask for mercy, protection, repentance, healing, and freedom. I place ",
          ),
          P("spouseName", "text"),
          T(
            " under the Precious Blood of Jesus. I ask You to forgive every sin, heal every wound, break every unholy attachment, and remove every evil influence that does not belong in his or her life.\n\n",
          ),
        ]),
        C("childrenNames", [
          T("For my children, "),
          P("childrenNames", "names_comma"),
          T(
            ", I ask for mercy, protection, repentance, healing, and freedom. I place each of them under the Precious Blood of Jesus. I ask You to forgive their sins, heal their wounds, protect their innocence, strengthen their faith, and deliver them from every evil spirit, curse, lie, temptation, fear, attachment, or influence that does not come from You.\n\n",
          ),
        ]),
        T(
          "For every member of my family, I ask You, Father, to break every unholy soul tie, bond, attachment, agreement, and spiritual claim that has formed through sin, fear, trauma, lust, manipulation, control, dependency, abuse, occult involvement, or any other evil.\n\nIn the Holy Name of Jesus, and through the power of His Precious Blood, I command every evil spirit afflicting, tempting, tormenting, deceiving, accusing, oppressing, or influencing me or my family to leave us now and go where Jesus Christ commands.",
        ),
      ],
    },

    // Page 4 — Curses, word curses, and harmful words
    {
      title: "Curses, word curses, and harmful words",
      nodes: [
        T(
          "Father, in the Name of Jesus Christ and through the power of His Precious Blood, I ask You to break every curse and every harmful word working against me or my family.\n\nI repent of every sinful word I have spoken over myself or others. I repent especially of ",
        ),
        I(6, "lie", "items_comma", "where_spoken_by_empty"),
        T(
          ".\n\nI ask You to void every evil word, curse, judgment, insult, label, accusation, threat, written word, texted word, spoken word, or word of authority that has worked against me or my family. I ask that every evil effect of these words be removed through the Precious Blood of Jesus.\n\nI renounce especially ",
        ),
        I(6, "lie", "items_comma", "where_spoken_by_nonempty"),
        T(
          ".\n\nIn the Name of Jesus Christ, I break every curse placed upon me or my family. I break every curse, seal, spell, hex, vex, malefice, evil prayer, written curse, spoken curse, texted curse, demonic bondage, and every other unholy bondage sent against me, my family, my home, or any object we possess.\n\nI command every spirit associated with these curses and harmful words to be bound in the Name of Jesus Christ, to leave us now, and to go where Jesus Christ commands.",
        ),
      ],
    },

    // Page 5 — Cleansing of the home
    {
      title: "Cleansing of the home",
      nodes: [
        T(
          "In the Name of Jesus Christ and through the power of His Precious Blood, I ask You, Father, to cleanse my home and everything connected to it.\n\nI ask You to bind and sever every cord, attachment, communication, influence, and access point of every unholy spirit operating in or around my home. I ask You to make every evil spirit inactive and every evil work ineffective against me and my family.\n\nIn the Name of Jesus Christ, I command every evil spirit in or around my home to leave now. I command every spirit connected to fear, conflict, impurity, occult objects, curses, anger, oppression, confusion, sickness, division, or any other evil to leave this home and go where Jesus Christ commands.\n\nLord Jesus, let Your Precious Blood wash over this home. Make it a place of peace, prayer, protection, purity, and holy order. Let every room, doorway, window, bed, object, and space be placed under Your lordship and protection.\n\nBlessed Virgin Mary, cover this home with your mantle. Saint Michael the Archangel, defend this home. Holy angels of God, surround it and keep far from it every evil spirit.",
        ),
      ],
    },

    // Page 6 — Remaining strongholds and spiritual patterns
    {
      title: "Remaining strongholds and spiritual patterns",
      nodes: [
        T(
          "Father, in the Name of Jesus Christ, I renounce every remaining demonic stronghold, sinful pattern, attachment, or evil influence still at work in my life or in the lives of my family members.\n\nI renounce especially ",
        ),
        TA("Any stronghold pressing on you today?"),
        T(
          ".\n\nI also renounce every dominant spiritual pattern still affecting us, especially ",
        ),
        S14("patterns_comma"),
        T(
          ".\n\nIn the Name of Jesus Christ, I bind and renounce every named and unnamed spirit connected to these strongholds, including ",
        ),
        S14("spirits_with_every_prefix"),
        T(
          ".\n\nI renounce every spirit of Death, Infirmity, Divination, Rebellion, Lying, Rage, Manipulation, Domination, Control, Fear, Rejection, Lust, Shame, Addiction, Violence, Hatred, Confusion, Despair, Unbelief, Pride, Self-Hatred, Condemnation, Heaviness, and every other spirit opposed to Jesus Christ.\n\nIn the Name of Jesus Christ, I break every claim, legal right, agreement, attachment, foothold, assignment, and influence these spirits have claimed through sin, wounds, curses, trauma, occult involvement, false vows, generational bondage, objects, or any other evil.\n\nI command every spirit connected to these strongholds to leave me and my family now. Go where Jesus Christ commands you to go. Do not return. Do not retaliate. Do not transfer. Do not hide. Do not call upon any other spirit to replace you.",
        ),
      ],
    },

    // Page 7 — Renewal of the mind through Scripture
    {
      title: "Renewal of the mind through Scripture",
      nodes: [
        T(
          "Lord Jesus, help me renew my mind according to Your Word. Help me reject every lie and receive the truth of who You say I am.\n\nI renounce every word curse, false identity, accusation, and lie that has shaped the way I see myself. I now receive the truth of Your Word.\n\n",
        ),
        LIES_WITH_TRUTHS,
        T(
          "\n\nLord Jesus, let these truths go deeper than fear, shame, rejection, trauma, and accusation. Let Your Word become the truth I live from, not merely words I repeat.\n\nI receive these truths as my identity in Christ, not as something I must earn, prove, or achieve.",
        ),
      ],
    },

    // Page 8 — Chronic issues, addictions, pain, and long-term afflictions
    {
      title: "Chronic issues, addictions, pain, and long-term afflictions",
      nodes: [
        T(
          "Lord Jesus, I bring before You every long-term chronic issue, addiction, pain, sickness, malady, affliction, or pattern that has become attached to my sense of identity.\n\nI bring before You especially ",
        ),
        P("chronicIssues", "items_comma"),
        T(
          ".\n\nI repent of every way I have accepted these things as who I am. I repent of identifying myself by sickness, pain, addiction, weakness, fear, trauma, or affliction instead of by the truth that I belong to You.\n\nIn the Name of Jesus Christ, I renounce the false identity of ",
        ),
        P("chronicIdentityLabels", "items_comma"),
        T(
          ".\n\nI separate who I am from what I have suffered, experienced, inherited, chosen, or endured.\n\nIn the Name of Jesus Christ, I command every spirit connected to ",
        ),
        P("chronicIssues", "items_comma"),
        T(
          " to leave me now and go where Jesus Christ commands.\n\nLord Jesus, release healing into my body, mind, soul, memory, imagination, emotions, and nervous system. Restore what has been damaged. Heal what has been wounded. Strengthen what has grown weak. Bring freedom where there has been bondage.",
        ),
      ],
    },

    // Page 9 — Healing from abuse and trauma
    {
      title: "Healing from abuse and trauma",
      nodes: [
        T(
          "Lord Jesus, I ask You to bring healing to every abuse, trauma, wound, violation, fear, humiliation, rejection, neglect, abandonment, and painful memory that I or my family members have experienced.\n\nI bring before You especially ",
        ),
        I(10, "event", "items_comma"),
        T(
          ".\n\nI renounce every spirit tied to these abuses and traumas. I renounce every spirit of fear, shame, rejection, self-hatred, despair, confusion, torment, rage, grief, isolation, dissociation, mistrust, and bondage connected to these wounds.\n\nIn the Name of Jesus Christ, I command every spirit tied to these abuses and traumas to leave me and my family now. Go where Jesus Christ commands you to go.\n\nLord Jesus, remove the power of these memories over us. Heal them in our minds, bodies, hearts, souls, emotions, and imaginations. Restore peace where there has been torment. Restore safety where there has been fear. Restore dignity where there has been shame. Restore trust where there has been betrayal.\n\nWhere we need human help, give us the courage to receive it. Where we need protection, give us wisdom. Where we need time, give us patience and hope.",
        ),
      ],
    },

    // Page 10 — Healing, restoration, and recovery of what was stolen
    {
      title: "Healing, restoration, and recovery of what was stolen",
      nodes: [
        T(
          "Father, in the Name of Jesus Christ, I ask You to release Your healing power into my body and into the bodies of my family members.\n\nPlease heal especially ",
        ),
        I(22, "infirmity", "items_comma", "where_for_healing"),
        T(
          ".\n\nRestore everything the thief has stolen, killed, or destroyed. Restore faith, hope, love, purity, peace, health, clarity, strength, joy, courage, trust, and holy desire. Restore what sin damaged. Restore what trauma wounded. Restore what curses attacked. Restore what evil spirits tried to steal.\n\nLord Jesus, enforce the freedom You have promised from sin and remove every evil spirit that does not belong in my life or in the lives of my family members.\n\nLet every place that has been emptied be filled with the Holy Spirit.",
        ),
      ],
    },

    // Page 11 — Memory, mind, imagination, and thoughts
    {
      title: "Memory, mind, imagination, and thoughts",
      nodes: [
        T(
          "Lord Jesus, I ask You to strengthen my memory, cognitive ability, thinking, imagination, attention, discernment, and ability to receive truth.\n\nHeal every place in my mind that has been wounded, darkened, confused, tormented, scattered, or weakened by sin, trauma, fear, occult involvement, sickness, addiction, or evil spirits.\n\nHelp me to remember what I should remember, and not remember what I should forget. Help me to reject intrusive thoughts, accusations, lies, fantasies, fears, and every thought that does not come from You.\n\nLord Jesus, bring my mind under Your peace. Let the Word of Christ dwell richly in me. Teach me to think according to truth.",
        ),
      ],
    },

    // Page 12 — Daily protection over family, property, and work
    {
      title: "Daily protection over family, property, and work",
      nodes: [
        T(
          "Father, in the Name of Jesus Christ, I ask protection over me and my family, especially ",
        ),
        P("familyMembers", "names_comma"),
        T(
          ".\n\nI ask protection over our bodies, minds, souls, memories, imaginations, relationships, home, property, work, school, ministry, finances, health, prayer, sleep, travel, and all that belongs to us.\n\nI ask that every attack of the enemy against us, our belongings, our pursuits, and our occupations be made ineffective by the Precious Blood of Jesus.\n\nI declare that my home, my family, my work, my vocation, my ministry, my finances, my health, my prayer, my sleep, and everything entrusted to me belong to Jesus Christ and are placed under His lordship and protection.",
        ),
      ],
    },

    // Page 13 — Fruit of the Holy Spirit
    {
      title: "Fruit of the Holy Spirit",
      nodes: [
        T(
          "Holy Spirit, I ask You to bring forth Your fruit in me and in each member of my family.\n\nBring forth love where there has been hatred.\nBring forth joy where there has been heaviness.\nBring forth peace where there has been fear.\nBring forth patience where there has been anger.\nBring forth kindness where there has been harshness.\nBring forth goodness where there has been sin.\nBring forth faithfulness where there has been rebellion.\nBring forth gentleness where there has been control.\nBring forth self-control where there has been bondage.\n\nGive us mercy in all that we do. Help us to lean on You each day. Help us to live in obedience, humility, prayer, forgiveness, repentance, and love.",
        ),
      ],
    },

    // Page 14 — Closing
    {
      title: "Closing",
      nodes: [
        T(
          "Father, I thank You for Your mercy, Your forgiveness, Your protection, and Your love. I thank You for the Precious Blood of Jesus. I thank You for the power of the Cross. I thank You for the gift of the Holy Spirit.\n\nLord Jesus Christ, reign in my heart. Reign in my home. Reign in my family. Reign in my thoughts. Reign in my memories. Reign in my body. Reign in my future.\n\nKeep me faithful to You. Keep my family under Your protection. Deliver us from evil. Lead us in the freedom of the children of God.\n\nI pray all of this in the Holy Name of Jesus, through the power of God the Father, and of the Son, and of the Holy Spirit.\n\nAmen.",
        ),
      ],
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const PRAYER_TEMPLATES: Record<string, PrayerTemplate> = {
  prayer_1: PRAYER_1,
  prayer_2: PRAYER_2,
  prayer_3: PRAYER_3,
};
