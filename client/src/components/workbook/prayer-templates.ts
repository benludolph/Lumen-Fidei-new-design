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
  | "text";

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
  nodes: Array<TextNode | InjectNode | InPrayerTextareaNode>;
};
export type PrayerNode = TextNode | InjectNode | InPrayerTextareaNode | ConditionalBlockNode;

export type PrayerPage = {
  title: string;
  nodes: PrayerNode[];
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
): ConditionalBlockNode => ({
  type: "conditional_block",
  sectionId,
  sectionField,
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
    // Page 1 — Opening
    {
      title: "Opening",
      nodes: [
        T(
          "Father in heaven, I come before You in the Most Holy Name of Jesus Christ, Your Son. I confess that Jesus Christ is my Lord, my Savior, and my Deliverer. My loyalty belongs to You alone, Father, Son, and Holy Spirit.\n\nI renounce Satan, all his works, and all his empty promises. I renounce every false god, false worship, false blessing, false protection, false allegiance, and false source of power that has touched me, my family, or my generational bloodline.\n\nI ask in the Most Holy Name of Jesus that every evil spirit affecting me, my family, my home, my descendants, or my generational line be bound and cast out by the power of His Most Precious Blood.\n\nIf any evil has entered this family line through sin, curses, malefices, occult practices, false worship, secret societies, oaths, rituals, ceremonies, objects, blood covenants, or agreements with evil, I ask You, Lord Jesus, to break it, cast it out, and cleanse us by Your Precious Blood.\n\nI repent of my own sins. I forgive my ancestors and all others whose sins may have affected this family line. I ask You to have mercy on them, forgive them, bless them, and free this family from every evil consequence of sin.",
        ),
      ],
    },

    // Page 2 — False religions, false worship, and false spiritual systems
    {
      title: "False religions, false worship, and false spiritual systems",
      nodes: [
        T(
          "Father, in the Name of Jesus Christ, I renounce all blessings, curses, rituals, prayers, initiations, ceremonies, protections, spiritual benefits, and spiritual claims connected to false worship, false religion, and every spiritual system opposed to Jesus Christ, especially ",
        ),
        I(12, "practice", "items_comma"),
        T(
          ".\n\nI renounce every false spiritual practice, especially ",
        ),
        I(12, "practice", "items_comma"),
        T(
          ".\n\nI reject every false deity, spirit, guide, ancestral spirit, familiar spirit, unholy power, or false spiritual authority connected to these practices, especially ",
        ),
        I(19, "name", "names_comma"),
        T(
          ".\n\nI no longer want their benefits, and I will not be bound by their curses. I reject every false covering, every false protection, every false blessing, and every false claim over me, my family, or my descendants.\n\nJesus Christ alone is Lord. I belong to Him.",
        ),
      ],
    },

    // Page 3 — Lodges, secret societies, oaths, and ritual groups
    {
      title: "Lodges, secret societies, oaths, and ritual groups",
      nodes: [
        T(
          "Father, in the Name of Jesus Christ, I renounce every lodge, secret society, occult order, hidden brotherhood or sisterhood, oath-bound group, ritual organization, or society opposed to the worship of the true God, especially ",
        ),
        I(17, "group", "items_comma"),
        T(
          ".\n\nI renounce every title, rank, office, degree, initiation, sign, symbol, password, secret word, handshake, garment, apron, jewel, ring, oath, penalty, curse, ceremony, obligation, hidden teaching, false brotherhood, false covering, and false protection connected to these groups.\n\nI renounce especially ",
        ),
        I(17, "titles_or_roles", "items_comma", "skip_empties"),
        T(" and "),
        I(17, "oaths_or_rituals", "items_comma", "skip_empties"),
        T(
          ".\n\nIn the Name of Jesus Christ, I break every oath, vow, pact, curse, ritual bond, and spiritual claim connected to them. I reject every spirit of secrecy, pride, fear, control, deception, false power, false light, and false worship that has worked through them.\n\nI revoke every consent given by me or by my ancestors to be deceived, bound, marked, covered, protected, initiated, empowered, or claimed by any spirit opposed to Jesus Christ.",
        ),
      ],
    },

    // Page 4 — Agreement sins and ancestral participation
    {
      title: "Agreement sins and ancestral participation",
      nodes: [
        T(
          "Father, I repent of every sin by which I have agreed with evil, and I ask Your mercy for the sins by which my ancestors may have agreed with evil.\n\nI bring before You especially ",
        ),
        I(18, "agreement", "items_comma"),
        T(", including the participation of "),
        I(16, "name_or_description", "names_comma"),
        T(" in "),
        I(16, "groups_or_sins_involved", "items_comma", "skip_empties"),
        T(
          ".\n\nI ask forgiveness for every oath, allegiance, worship, covenant, ritual, ceremony, pact, vow, participation, or agreement contrary to You. You alone are God, and You alone deserve my allegiance.\n\nIn the Most Holy Name of Jesus, I renounce every unholy oath, vow, pledge, covenant, initiation, ritual bond, curse, pact, seal, agreement, and spiritual claim connected to these things.\n\nI separate myself, my family, and my descendants from every false allegiance and every unholy spirit connected to them.",
        ),
      ],
    },

    // Page 5 — Named spirits, false deities, and unholy allegiances
    {
      title: "Named spirits, false deities, and unholy allegiances",
      nodes: [
        T(
          "In the Most Holy Name of Jesus, I completely reject and renounce every oath, allegiance, worship, covenant, ritual, prayer, offering, pact, and participation made by me or by my ancestors with any false deity, unholy spirit, familiar spirit, ancestral spirit, lodge spirit, occult spirit, spirit of false religion, or spirit of false worship.\n\nI renounce especially ",
        ),
        I(19, "name", "names_comma"),
        T(
          ".\n\nI reject you. I renounce you. I break every agreement with you. I reject every worship, oath, pact, covenant, ritual, offering, prayer, initiation, protection, blessing, and curse connected to you.\n\nOn the authority of Jesus Christ, and not my own, I command every spirit named here, and every spirit hidden behind these names, to release me and my family. Go where Jesus Christ commands you to go.\n\nI will not serve you. I will not belong to you. I will not receive your benefits, and I will not be bound by your curses.\n\nJesus Christ alone is Lord.",
        ),
      ],
    },

    // Page 6 — Objects, symbols, books, jewelry, and ritual items
    {
      title: "Objects, symbols, books, jewelry, and ritual items",
      nodes: [
        T(
          "Father, I bring before You every object, symbol, book, image, charm, amulet, talisman, ring, garment, tool, document, statue, card, candle, oil, stone, crystal, ritual item, occult item, lodge item, false religious item, inherited object, or household object connected to evil, false worship, occult practice, oaths, curses, rituals, spells, divination, witchcraft, or unholy covenants.\n\nI specifically renounce and reject ",
        ),
        I(20, "object", "items_comma"),
        T(
          ".\n\nIn the Name of Jesus Christ, I renounce every oath, vow, pact, curse, ritual, attachment, spiritual claim, and evil influence connected to these objects.\n\nI reject every spirit attached to them, working through them, or claiming access because of them.\n\nBy the Precious Blood of Jesus, I ask Almighty God to sever every evil connection between these objects and me, my family, my home, and my descendants.\n\nI ask You, Lord Jesus, to make these objects powerless, to sever every evil spirit from them, and to show me what must be removed, destroyed, discarded, or brought to a priest for guidance.\n\nIn the Name of Jesus Christ, I command every evil spirit connected to these objects to leave me, my family, my home, and everything entrusted to me, and to go where the Lord Jesus Christ commands.",
        ),
      ],
    },

    // Page 7 — Generational bloodline, curses, and family evils
    {
      title: "Generational bloodline, curses, and family evils",
      nodes: [
        T(
          "Lord Jesus Christ, I ask in Your Most Holy Name to remove any evil spirits that may be affecting me, my family, or my generational bloodline.\n\nIf any curse, malefice, spell, pact, oath, vow, ritual, occult practice, false worship, or agreement with evil has been introduced by a member of this family, by me, by my ancestors, or from outside the family, I ask You to cast it out and cleanse us with Your Most Precious Blood.\n\nI willingly forgive my ancestors and any others who are at fault, and I ask You to absolve them of this sin and bless them.\n\nI repent of any evil that I have done to introduce evil into our generational line, and I ask Your forgiveness.\n\nI particularly ask You to cleanse our generational bloodline of ",
        ),
        I(15, "pattern_or_sin", "items_comma"),
        T(
          ", including all curses, illnesses, sicknesses, addictions, financial curses, divorce, abuse, violence, abandonment, occult involvement, false worship, sexual sin, hatred, despair, suicide, mental torment, fear, rejection, poverty, unbelief, and every other evil handed down through the generational line.\n\nMay Your Precious Blood wash over us and cleanse us all. May these evils end now through Your infinite mercy and through the power of Your Holy Cross.",
        ),
      ],
    },

    // Page 8 — Curses, spells, hexes, vexes, triggers, trances, and bondages
    {
      title: "Curses, spells, hexes, vexes, triggers, trances, and bondages",
      nodes: [
        T(
          "Father, in the Name of Jesus and by the power of His Precious Blood, I ask You to bind and break every curse, pact, spell, seal, hex, vex, trigger, trance, vow, demonic blessing, evil prayer, ritual bond, malefice, enchantment, occult assignment, ancestral curse, spoken curse, written curse, blood curse, death curse, sickness curse, poverty curse, family curse, marriage curse, infertility curse, mental torment, spiritual blindness, and every other demonic bondage sent against me, my family, my descendants, my home, my work, my possessions, or any object connected to us.\n\nI renounce especially ",
        ),
        I(21, "description", "items_comma", "where_kind_curse"),
        T(
          ".\n\nI ask You to bind them all, break them all, cast them out, and make them powerless through the Precious Blood of Jesus.\n\nIf any curse, spell, malefice, enchantment, or evil work remains in place against me or my family, I ask You, Lord Jesus, to break it now by the power of Your Holy Cross.",
        ),
      ],
    },

    // Page 9 — Forgiveness of those who cursed or harmed the family
    {
      title: "Forgiveness of those who cursed or harmed the family",
      nodes: [
        T(
          "If any evil entered my family line through curses, spells, malefices, rituals, enchantments, hatred, jealousy, abuse, betrayal, or evil acts done by others, I ask for the grace to forgive them.\n\nI choose forgiveness as an act of obedience, not emotion.\n\nI forgive ",
        ),
        I(2, "person", "names_comma", "where_is_family_harm"),
        T(
          " for the effects of their sins against me and my family. I forgive them for any damage they caused, knowingly or unknowingly.\n\nI release judgment against them, and I place them into Your hands, Lord Jesus.\n\nI ask You to break every curse, spell, malefice, enchantment, or evil work that remains in place against us.",
        ),
      ],
    },

    // Page 10 — Blocking evil from passing to future generations
    {
      title: "Blocking evil from passing to future generations",
      nodes: [
        T(
          "Father, I ask You in the Name of Jesus to block every unholy spirit, curse, malefice, family wound, addiction, sickness, false vow, occult bond, blood covenant, oath, evil pattern, and demonic influence from passing to my children, my descendants, and future generations.\n\nI especially ask You to block ",
        ),
        I(23, "concern", "items_comma"),
        T(
          ".\n\nLet these evils end here. Let the Precious Blood of Jesus stand between my family and every evil inheritance. Let the Cross of Christ block every spirit that seeks to pass from one generation to another.\n\nLord Jesus, bless my family line. Heal what has been wounded. Cleanse what has been defiled. Restore what has been damaged. Deliver what has been bound.",
        ),
      ],
    },

    // Page 11 — Named spirits and dominant family spirits
    {
      title: "Named spirits and dominant family spirits",
      nodes: [
        T(
          "In the Name of Jesus Christ and by His Precious Blood, I bind and renounce every unholy spirit affecting me or my family, separately and individually.\n\nI renounce especially ",
        ),
        I(19, "name", "names_comma"),
        T(" and every spirit connected to "),
        S14("patterns_comma"),
        T(
          ".\n\nI renounce every spirit of Death, Infirmity, Divination, Rebellion, Lying, Rage, Manipulation, Domination, Control, Fear, Rejection, Lust, Shame, Addiction, Violence, Hatred, Confusion, Despair, Unbelief, Poverty, Suicide, Abuse, Occult Bondage, False Worship, and every other spirit opposed to Jesus Christ.\n\nI break every claim, agreement, attachment, assignment, foothold, and influence connected to these spirits.\n\nIn the Name of Jesus Christ, I command every spirit I have renounced to leave me and my family now. Leave every place where you have afflicted, tempted, tormented, deceived, accused, oppressed, influenced, or harmed us.\n\nGo where the Lord Jesus Christ commands you to go, and do not return.",
        ),
      ],
    },

    // Page 12 — Blood contracts, blood covenants, and ritual bonds
    {
      title: "Blood contracts, blood covenants, and ritual bonds",
      nodes: [
        T(
          "In the Name of Jesus Christ and by His Precious Blood, I renounce and break every unholy blood contract, blood covenant, blood oath, blood ritual, pact, vow, pledge, exchange, offering, sacrifice, or bond made between me, my ancestors, or any other person, spirit, group, organization, false deity, or occult power, whether known or unknown, remembered or forgotten, intentional or unintentional.\n\nI renounce especially ",
        ),
        I(21, "description", "items_comma", "where_kind_blood_contract"),
        T(
          ".\n\nI reject every spirit that claimed access through blood, ritual, oath, sacrifice, sexual sin, violence, abuse, self-harm, occult practice, or false worship.\n\nBy the Precious Blood of Jesus, I ask Almighty God to break every unholy blood bond and every evil claim connected to these things.\n\nLet the Blood of Jesus speak louder than every other blood, every other oath, every other ritual, and every other claim.",
        ),
      ],
    },

    // Page 13 — Infirmity, sickness, and physical affliction
    {
      title: "Infirmity, sickness, and physical affliction",
      nodes: [
        T(
          "Father, in the Holy Name of Jesus Christ, I bring before You every infirmity, sickness, weakness, affliction, pain, disorder, torment, and bodily burden that has affected me or my family.\n\nI bring before You especially ",
        ),
        I(22, "infirmity", "items_comma"),
        T(
          ".\n\nIf any infirmity is connected to sin, trauma, occult involvement, curses, family patterns, evil spirits, unholy objects, false vows, or unholy agreements, I ask You to break that connection now by the Precious Blood of Jesus.\n\nI speak now to every spirit of infirmity affecting me or my family. In the Name of Jesus Christ, I command you to leave and take with you every root, sickness, oppression, torment, and affliction connected to you.\n\n",
        ),
        I(22, "infirmity", "infirmities_each"),
        T(
          "\n\nFather, I now ask in Jesus' Name that You release Your healing power into my body and into the bodies of my family members. Fully restore everything the thief has stolen, killed, or destroyed.\n\nPlease heal ",
        ),
        I(22, "infirmity", "items_comma", "where_for_healing"),
        T(", according to Your holy will."),
      ],
    },

    // Page 14 — Holy Spirit-prompted additions (in-prayer input)
    {
      title: "Holy Spirit-prompted additions",
      nodes: [
        T(
          "Father, I also bring before You every sin, oath, vow, curse, agreement, spirit, object, ritual, bond, attachment, and evil influence that I have not named because I do not know it, remember it, or understand it.\n\n",
        ),
        TA("If anything specific comes to mind right now, name it here."),
        T(
          "\n\nI ask the Holy Spirit to bring to light anything else that must be confessed, renounced, removed, destroyed, healed, or brought to prayer.\n\nIn the Name of Jesus Christ, I renounce every hidden, forgotten, unlisted, unknown, disguised, or inherited agreement with evil, and I place it all under the Precious Blood of Jesus.\n\nI ask You, Lord Jesus, to break every evil thing that remains hidden and to bring into the light whatever still needs to be healed, confessed, renounced, or removed.",
        ),
      ],
    },

    // Page 15 — Final command to spirits
    {
      title: "Final command to spirits",
      nodes: [
        T(
          "In the Name of Jesus Christ, and by the power of His Precious Blood, I speak to every unholy spirit in or around me or my family, named or unnamed, known or unknown, hidden or exposed.\n\nI break every remaining claim you have made. I break every legal right, attachment, agreement, foothold, assignment, and influence you have claimed through sin, curses, oaths, vows, rituals, objects, false worship, blood covenants, occult practices, sickness, trauma, generational sin, or any other evil.\n\nI command you now in the Name of Jesus Christ to leave me, my family, my home, my body, my mind, my soul, my memory, my imagination, my possessions, my work, and everything entrusted to me.\n\nGo where Jesus Christ commands you to go. Do not return. Do not retaliate. Do not transfer. Do not hide. Do not call upon any other spirit to replace you.\n\nLeave now in the Holy Name of Jesus Christ.",
        ),
      ],
    },

    // Page 16 — Protection over family, property, pursuits, and occupations
    {
      title: "Protection over family, property, pursuits, and occupations",
      nodes: [
        T(
          "In the Name of Jesus Christ, I ask protection over my family, my home, my property, my body, my mind, my relationships, my work, my vocation, my ministry, my finances, my health, my prayer, my sleep, and all that belongs to me.\n\nI ask that every attack of the enemy against us, our belongings, our pursuits, and our occupations be made ineffective by the Precious Blood of Jesus.\n\nI declare my family, my home, my property, my work, my vocation, and everything entrusted to me to be under the lordship and protection of Jesus Christ.\n\nBlessed Virgin Mary, spread your mantle over us.\n\nSaint Michael the Archangel, defend us in battle.\n\nHoly angels of God, surround us and keep far from us every evil spirit.",
        ),
      ],
    },

    // Page 17 — Cleansing, healing, filling, and closing
    {
      title: "Cleansing, healing, filling, and closing",
      nodes: [
        T(
          "Father, I ask You now in the Name of Jesus to release Your healing power into me and my family. Restore everything the thief has stolen, killed, or destroyed.\n\nCleanse us with the Precious Blood of Jesus. Cleanse my spirit, my soul, my mind, my heart, my memory, my imagination, my emotions, my body, my family line, my home, and every part of my life that has been affected by these sins, curses, spirits, and bondages.\n\nHoly Spirit, fill every empty place. Fill every cleansed place. Fill every wounded place. Fill every place that has been touched by evil with faith, hope, charity, purity, humility, peace, obedience, courage, and holy wisdom.\n\nRestore the grace of baptism in me. Strengthen me in Confession, the Eucharist, prayer, forgiveness, repentance, and daily conversion.\n\nLord Jesus Christ, reign in my heart. Reign in my home. Reign in my family. Reign in my memories. Reign in my body. Reign in my future.\n\nFather, thank You for Your mercy, Your forgiveness, Your protection, and Your love.\n\nI pray all of this in the Holy Name of Jesus, through the power of God the Father, and of the Son, and of the Holy Spirit.\n\nAmen.",
        ),
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
