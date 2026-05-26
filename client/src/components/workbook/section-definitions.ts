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

export interface SectionCategory {
  id: number;
  name: string;
  description: string;
}

export interface SectionDefinition {
  id: number;
  categoryId: number;
  name: string;
  type: SectionType;
  description: string;
  actionItem?: string;
  fields: SectionField[];
  prayerHint?: string;
}

export const SECTION_CATEGORIES: SectionCategory[] = [
  {
    id: 1,
    name: "Personal Sins",
    description: "Sin, brokenness, and the patterns that give the enemy ground in your life.",
  },
  {
    id: 2,
    name: "Occult & Dark Powers",
    description: "Involvement with occult practices, false religions, and spiritual powers that are not from God.",
  },
  {
    id: 3,
    name: "Generational Lines",
    description: "Sins, patterns, and bondages inherited from your family line.",
  },
  {
    id: 4,
    name: "Inner Vows",
    description: "The lies you have believed and the vows you have made that quietly govern your life.",
  },
  {
    id: 5,
    name: "Wounds & Forgiveness",
    description: "The wounds you have received, the people you need to forgive, and the trauma that shaped you.",
  },
];

export const SECTIONS: SectionDefinition[] = [
  {
    id: 1,
    categoryId: 1,
    name: "Personal Sins",
    type: "list_builder",
    description: `Use this section for personal sins that don't belong in one of the specialized sections that follow — things like pride, anger, envy, gossip, dishonesty, neglected prayer, unkindness, and the ordinary failures of daily life. Sexual sin, occult involvement, idolatry, vows, addictions, and soul ties each have their own dedicated section later. Bring only what doesn't fit there. Nothing you name here is too large for mercy, and nothing is too small to matter.`,
    actionItem: `Ask the Holy Spirit to surface the personal sins you've committed in thought, word, deed, or omission that belong here. Write each one plainly — no explanations, no minimizing. One entry per sin. These are what you'll bring to the priest in Confession.`,
    fields: [
      { key: "sin", label: "Sin", placeholder: "A sin to bring to Confession", required: true, type: "textarea" },
    ],
  },
  {
    id: 2,
    categoryId: 5,
    name: "People to Forgive",
    type: "list_builder",
    description: `Unforgiveness often leads to significant torment in people's lives. Forgiveness is a choice rather than an emotion. It involves choosing to forgive someone who has harmed you. Forgiveness does not require you to reconcile with that person nor allow that person back into your life. It is a one-sided action that you do. Forgiveness does not mean you agree with what that person did to you. It merely means you release your judgment against that person and free them from your heart so you can be freed from basanizo torment (Matthew 18:34–35).`,
    actionItem: `Make a list of everyone who has hurt you—either directly against you or indirectly against a loved one—whether they are still living or dead (include yourself if you have unforgiveness toward yourself, and include God if you have held resentment toward Him). Then list every hurt they did to you. You don't need to soften or explain what happened. Simply name it honestly and move on. Examples: My father, for the way he spoke to me. My ex-spouse, for the affair. The driver who killed my brother. Myself, for the abortion I can't forgive.`,
    fields: [
      { key: "person", label: "Person", placeholder: "Name or relationship", required: true, type: "text" },
      { key: "what", label: "What happened (optional)", placeholder: "Brief description", type: "textarea" },
      { key: "is_family_harm", label: "This affected my whole family, not just me", type: "boolean" },
    ],
  },
  {
    id: 3,
    categoryId: 5,
    name: "Family & Childhood Wounds",
    type: "list_builder",
    description: `The home is where the heart is first shaped, and it is also where the deepest wounds are often inflicted—not always through cruelty, but sometimes through absence, neglect, favoritism, or words spoken in a moment of anger that lodged in a child's soul for decades. These early wounds form the lens through which you still see yourself, God, and authority. Bringing them into the light is not about blaming your family; it is about letting Jesus heal the boy or girl who first received the wound.`,
    actionItem: `Go back through your childhood and adolescence and write down the moments that still sting—the things said over you, the comparisons, the time you were overlooked, the home that was too loud or too silent. Note the wound and the message you took from it. Examples: "You'll never amount to anything" → I am a failure. Being left out at school → I don't belong. A parent's coldness → I am unlovable.`,
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
    categoryId: 1,
    name: "Sexual Sin",
    type: "list_builder",
    description: `Sexuality is meant to be a sacred bond, and precisely because it is so powerful, sin in this area creates ties that linger long after the act is over. Pornography, fornication, adultery, fantasy, and abuse all leave imprints—soul ties to past partners, shame that whispers you are "damaged," and patterns that demand to be fed. God is neither shocked nor disgusted by what you bring here. He longs to break every ungodly tie and restore your purity and dignity.`,
    actionItem: `With honesty and without graphic detail, write down areas of sexual sin and brokenness—relationships, habits, and exposures, including those done to you that left a stain you've carried as guilt. List people you have been sexually involved with, by name where possible, so that soul ties can be named and severed. Examples: Years of pornography use. A relationship with [name]. Sins from a season I've never told anyone about.`,
    fields: [
      { key: "sin", label: "Sin", placeholder: "Describe briefly", required: true, type: "textarea" },
      { key: "person_or_partner", label: "Person connected (optional)", placeholder: "Name or description", type: "text" },
    ],
  },
  {
    id: 5,
    categoryId: 2,
    name: "Occult & False Spiritual Power",
    type: "list_builder",
    description: `There is real power in the spiritual world, and not all of it comes from God. Any attempt to gain knowledge, control, or protection apart from Him—however curious, harmless, or "just for fun" it seemed—opens a door to the enemy. This includes practices many treat as entertainment. The point is not fear but renunciation: you are closing doors you may have opened without realizing where they led.`,
    actionItem: `List every occult or false-power practice you have engaged with, even once, even as a child or "as a joke." Examples: Ouija boards, tarot or fortune-telling, psychics and mediums, horoscopes, séances, witchcraft or spells, Reiki and energy healing, New Age channeling, charms and amulets, blood pacts, summoning games. Note who introduced you to it and roughly when.`,
    fields: [
      { key: "practice", label: "Practice or involvement", placeholder: "e.g. tarot, astrology, energy healing", required: true, type: "text" },
    ],
  },
  {
    id: 6,
    categoryId: 4,
    name: "Lies & Truths",
    type: "lies_and_truths",
    description: `The enemy is called the father of lies, and his strategy is rarely a single dramatic deception—it is a quiet sentence about you that you came to accept as fact. These lies become the agreements that govern your life: "I am worthless," "God could never love someone like me," "I have to earn my place." Freedom comes when each lie is renounced and replaced with what God actually says is true. Truth is not a feeling; it is a foundation you choose to stand on.`,
    actionItem: `Write down the lies you have believed about yourself, about God, and about others. Beside each one, write the truth from Scripture or the heart of God that replaces it. Examples: Lie: "I am a mistake." → Truth: "I am fearfully and wonderfully made (Ps 139:14)." Lie: "I have to be perfect to be loved." → Truth: "While I was still a sinner, Christ died for me (Rom 5:8)."`,
    fields: [],
  },
  {
    id: 7,
    categoryId: 4,
    name: "Vows & Inner Promises",
    type: "list_builder",
    description: `In moments of deep pain we often make silent vows—"I will never let anyone hurt me again," "I will never cry," "I will never be like my mother," "I will never trust again." These promises feel like protection, but they hand control of our hearts to the wound rather than to God. An inner vow can quietly steer decades of decisions, walling off the very places that need healing. Renouncing them returns the throne of your heart to Christ.`,
    actionItem: `Recall the vows and inner promises you have made, especially in seasons of hurt, fear, or anger. They often begin with "I will always…" or "I will never…". Write each one out. Examples: "I'll never depend on anyone." "I'll never let them see me weak." "I'll never forgive him." "I'll always be the strong one."`,
    fields: [
      { key: "vow", label: "Vow or inner promise", placeholder: "e.g. I will never trust anyone again", required: true, type: "textarea" },
    ],
  },
  {
    id: 8,
    categoryId: 1,
    name: "Idolatry",
    type: "list_builder",
    description: `An idol is anything that takes the place that belongs to God alone—the thing you run to for security, comfort, identity, or worth. Idols are rarely golden statues; they are usually good things loved in a disordered way: career, money, a relationship, approval, control, comfort, even ministry. The test is simple: what would devastate you to lose, more than losing God? Naming an idol is not about contempt for the thing, but about restoring God to first place.`,
    actionItem: `Ask yourself where you have placed your trust, identity, or ultimate hope outside of God, and write each one down. Examples: My career and reputation. Money and security. My children's approval. A romantic relationship. Control over my life. Food or comfort. The opinions of others. Be honest about which of these you serve more than God.`,
    fields: [
      { key: "idol", label: "Idol or false source", placeholder: "e.g. approval, money, a relationship", required: true, type: "textarea" },
    ],
  },
  {
    id: 9,
    categoryId: 1,
    name: "Pride, Rebellion & Control",
    type: "list_builder",
    description: `At the root of the first sin was a refusal to let God be God—a desire to decide good and evil for ourselves. Pride, rebellion, and control are that same root, grown into the everyday habits of needing to be right, resenting authority, manipulating outcomes, and refusing to submit. They masquerade as strength but leave us isolated and unable to receive. Humility is not weakness; it is the soil in which every other grace can grow.`,
    actionItem: `Write down the ways pride, rebellion, and control show up in your life—toward God, toward those in authority over you, and in your relationships. Examples: Refusing to admit I'm wrong. Resentment toward the Church or its teachings. Manipulating people to get my way. Rebelling against my parents, boss, or spouse. Insisting on controlling every detail. Looking down on others.`,
    fields: [
      { key: "pattern", label: "Pattern or behavior", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 10,
    categoryId: 5,
    name: "Abuse, Trauma & Wounded Responses",
    type: "list_builder",
    description: `When someone is abused or deeply traumatized, two things happen: a wound is inflicted, and the soul learns a way to survive it. Those survival responses—numbing, dissociation, rage, perfectionism, people-pleasing, hyper-control—were once protective, but they often outlive the danger and keep you bound. None of the abuse was your fault, and naming it is not weakness; it is the first step in letting the Lord enter the place that was violated. (If you are working through severe trauma, please walk this section gently and alongside a trusted priest, counselor, or therapist—spiritual healing and professional care work together, not against each other.)`,
    actionItem: `Without forcing yourself to relive every detail, write down the abuses and traumas you have suffered, and beside each, the way you learned to cope with it. Examples: Physical abuse by a parent → I keep everyone at arm's length. A betrayal → I trust no one. A frightening accident → I try to control everything. Sexual abuse → I shut down emotionally. Name what happened to you and the wounded response it produced.`,
    fields: [
      { key: "event", label: "What happened", placeholder: "Describe the event or harm", required: true, type: "textarea" },
      { key: "sinful_response", label: "Sinful response (optional)", placeholder: "e.g. hatred, self-destruction, isolation", type: "textarea" },
    ],
  },
  {
    id: 11,
    categoryId: 1,
    name: "Addictions & Compulsions",
    type: "list_builder",
    description: `An addiction is rarely just about the substance or behavior—it is a counterfeit comfort the soul reaches for to soothe a deeper ache it doesn't know how to name. Alcohol, drugs, pornography, food, spending, screens, gambling, work: each promises relief and delivers bondage. Compulsion is a sign that something underneath is unhealed and unfed. Bringing these into the light invites Christ to meet the real hunger they were trying to fill.`,
    actionItem: `List the addictions and compulsions that have a grip on you, whether obvious or hidden. Beside each, note what it tends to numb or soothe. Examples: Alcohol → I drink to quiet my anxiety. Pornography → I turn to it when I feel rejected. Compulsive eating → I eat when I'm lonely. Phone or scrolling → I escape rather than feel. Overworking → I prove my worth.`,
    fields: [
      { key: "addiction", label: "Addiction or compulsion", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 12,
    categoryId: 2,
    name: "False Religion & Spiritual Mixture",
    type: "list_builder",
    description: `Spiritual mixture is the attempt to follow Christ while also holding on to spiritual practices, beliefs, or sources of power that do not come from Him. It often feels open-minded or harmless—"taking the good from every path"—but it divides loyalty and leaves a door cracked open. This includes time spent in false religions, syncretistic devotions, and "Christian" practices borrowed from the occult. The call is to belong wholly to the one true God.`,
    actionItem: `Write down any involvement with false religion or spiritual mixture, past or present, including practices you blended into your faith. Examples: Participation in another religion's worship or initiation. New Age or "Christianized" energy practices. Folk-magic devotions, superstitions, or charms used alongside prayer. Yoga or meditation tied to false spirituality. Ancestor veneration outside the communion of saints.`,
    fields: [
      { key: "practice", label: "Practice or religion", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 13,
    categoryId: 1,
    name: "Harm Done to Others",
    type: "list_builder",
    description: `This section turns the mirror around. We are quick to remember our wounds and slow to remember the wounds we have caused. Yet the harm we have done to others—through words, betrayal, neglect, abuse of power, or simple selfishness—weighs on the conscience and often calls for more than confession: it calls for restitution and, where possible and prudent, reconciliation. Owning what we have done frees both us and, sometimes, those we have hurt.`,
    actionItem: `Make a list of people you have harmed and how. Be specific and refuse to make excuses for yourself. Note where an apology or restitution may be owed. Examples: My children, for years of harsh words. A former employee, for the way I treated them. My spouse, for my infidelity. A friend I betrayed. The person I cheated or stole from. Mark any that require an act of restitution or a conversation.`,
    fields: [
      { key: "harm", label: "Harm done", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 14,
    categoryId: 1,
    name: "Dominant Spiritual Patterns",
    type: "patterns_checklist",
    description: `When you step back and look at the whole picture—your sins, wounds, vows, and the lies you've believed—recurring themes usually emerge. The same kind of struggle keeps reappearing in different costumes: a spirit of fear, of rejection, of control, of lust, of unworthiness, of heaviness. Identifying these dominant patterns helps you stop fighting symptoms one at a time and address the root the enemy keeps returning to.`,
    actionItem: `Review everything you've written so far and look for the recurring threads. Name the two or three dominant patterns that seem to run through your life. Examples: A pattern of fear and anxiety in every season. A deep root of rejection and never feeling wanted. Control as my answer to everything. Heaviness or despair I can't shake. Lust as my go-to comfort. Write them down as the strongholds you most want to be free from.`,
    fields: [],
  },
  {
    id: 15,
    categoryId: 3,
    name: "Generational Sins & Family Patterns",
    type: "list_builder",
    description: `Scripture speaks of sin and its consequences passing down through family lines (Exodus 20:5), and most families carry recognizable patterns—divorce, addiction, abuse, occult involvement, suicide, rage, poverty, infidelity—that repeat generation after generation as if on a track. You are not guilty of your ancestors' sins, but you can renounce their effects and refuse to pass them on. Naming the pattern breaks the silent assumption that "this is just how our family is."`,
    actionItem: `Map the patterns you can see running through your family line on both sides. Write down the recurring sins and afflictions across the generations you know of. Examples: Alcoholism on my father's side for three generations. Repeated divorce and abandonment. A history of occult involvement or "the gift" being passed down. Suicide, depression, or a pattern of early death. Generational poverty or rage.`,
    fields: [
      { key: "pattern_or_sin", label: "Pattern or sin", placeholder: "e.g. alcoholism, rage, abandonment", required: true, type: "textarea" },
    ],
  },
  {
    id: 16,
    categoryId: 3,
    name: "Family Members & Ancestors of Concern",
    type: "list_builder",
    description: `Sometimes a specific person in the family line stands out—an ancestor known to have practiced witchcraft, made a pact, joined a secret society, dedicated descendants to a false god, or lived in deep unrepentant darkness. Their choices can cast a long shadow. This is not about judging the dead; it is about identifying specific doorways that may need to be renounced and closed on behalf of your line.`,
    actionItem: `List by name (or relationship, if the name is unknown) any specific family members or ancestors who concern you spiritually, and why. Examples: My grandmother, who was known as the village healer/witch. An uncle who was a Freemason. An ancestor said to have made a vow or dedication. A relative deeply involved in the occult. A parent who cursed the family.`,
    fields: [
      { key: "name_or_description", label: "Name or description", placeholder: "e.g. grandfather, great-uncle", required: true, type: "text" },
      { key: "groups_or_sins_involved", label: "Groups or sins involved (optional)", placeholder: "e.g. Freemasonry, occult, violence", type: "textarea" },
    ],
  },
  {
    id: 17,
    categoryId: 3,
    name: "Lodges, Secret Societies & Oath-Bound Groups",
    type: "list_builder",
    description: `Secret societies bind their members through oaths, hidden rituals, and divided loyalties—often invoking false gods or swearing blood-curses upon themselves and their descendants if the oath is broken. Freemasonry is the most common, but there are many others. The Church has long warned against them precisely because the oaths create real spiritual bondage. Renouncing membership—your own or an ancestor's—severs those oaths and their inherited effects.`,
    actionItem: `List any involvement, by you or your ancestors, with lodges, secret societies, or oath-bound groups, along with the degree or rank if known. Examples: Freemasonry (and any of its branches such as the Shriners or Eastern Star). The Odd Fellows, Elks, or similar lodges. College or fraternal secret societies with binding oaths. Mafia or gang blood oaths. Any group requiring secret initiation or vows.`,
    fields: [
      { key: "group", label: "Group name", placeholder: "e.g. Freemasonry, Odd Fellows", required: true, type: "text" },
      { key: "titles_or_roles", label: "Titles, degrees, or roles (optional)", placeholder: "e.g. 32nd Degree, Grand Master", type: "textarea" },
      { key: "oaths_or_rituals", label: "Known oaths or rituals (optional)", placeholder: "Describe if known", type: "textarea" },
    ],
  },
  {
    id: 18,
    categoryId: 1,
    name: "Agreement Sins",
    type: "list_builder",
    description: `Some sins we don't commit ourselves—we agree with, approve of, encourage, or fail to oppose. Scripture treats this consent seriously (Romans 1:32): standing by while someone is harmed, cheering on another's revenge, encouraging a friend's sin, voting for or funding grave evil, or silently approving what we knew was wrong. Agreement joins us to the sin even when our own hands seem clean. Renouncing these agreements withdraws your consent.`,
    actionItem: `Write down the sins you did not commit directly but agreed with, encouraged, enabled, or refused to stand against. Examples: Pressuring or supporting someone through an abortion. Egging on a friend's affair or revenge. Going along with gossip or slander to fit in. Staying silent while someone was abused or wronged. Approving of grave evil because it benefited me.`,
    fields: [
      { key: "agreement", label: "Agreement or cooperation with evil", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 19,
    categoryId: 2,
    name: "Named Spirits, False Deities & Unholy Allegiances",
    type: "list_builder",
    description: `Idolatry and the occult are not merely abstract; they often involve specific named spirits, false gods, or beings to whom devotion, sacrifice, or allegiance was given—by you or your ancestors. A santo, an orisha, a "spirit guide," a familiar spirit, a deity invoked in a ritual, a being you bargained with: each name represents an allegiance that must be specifically renounced. The enemy clings to ground that has never been explicitly reclaimed.`,
    actionItem: `List any named spirits, false deities, or beings to whom you (or your family) have given devotion, allegiance, or invitation. Examples: A "spirit guide" or "guardian" from New Age practice. Named deities from Santería, Voodoo, Hinduism, or folk religion. A familiar spirit invited through ritual or game. An imaginary "friend" that took on a spiritual presence. Any being you made a deal with. Where you don't know the name, describe the encounter.`,
    fields: [
      { key: "name", label: "Name of spirit or deity", placeholder: "e.g. specific named entity, ancestral spirit", required: true, type: "text" },
    ],
  },
  {
    id: 20,
    categoryId: 2,
    name: "Objects of Concern",
    type: "list_builder",
    description: `Physical objects can carry spiritual significance—either because they were dedicated to a false power, used in occult practice, or simply because they keep a sin or allegiance alive in your home. Scripture records believers burning their occult items as part of repentance (Acts 19:19). This is not superstition about "haunted" objects; it is about removing what stands as a banner or invitation for the enemy in your space.`,
    actionItem: `Walk through your home (and storage, attic, jewelry box, bookshelves, devices) and list objects that may need to be removed, destroyed, or blessed. Examples: Occult or New Age books, tarot decks, Ouija boards. Idols, statues, or charms from false religions. Items received in initiations or rituals. Pornography. Gifts or heirlooms tied to occult or lodge membership. Anything tied to a sinful relationship you're holding onto.`,
    fields: [
      { key: "object", label: "Object", placeholder: "Describe the item", required: true, type: "textarea" },
    ],
  },
  {
    id: 21,
    categoryId: 2,
    name: "Curses, Spells & Blood Contracts",
    type: "list_builder",
    description: `A curse is the use of spiritual power to wish or invoke harm, and curses can be spoken over us, inherited from our line, or even pronounced over ourselves in moments of self-hatred. Spells, hexes, and blood contracts are deliberate acts of the same kind. Whether you fear someone cursed you, suspect a generational curse, or recognize the harsh words you've spoken over yourself or your children, these can be renounced and broken in the authority of Christ.`,
    actionItem: `List any curses, spells, or blood contracts you are aware of—spoken over you, inherited, made by you, or made against others. Examples: A relative who said they would curse the family. Words spoken over me as a child ("you're cursed," "you'll end up just like him"). A spell I cast or had cast for me. Curses I've spoken over myself ("I hate myself," "I wish I'd never been born") or over my children. A blood pact or written contract.`,
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
    categoryId: 3,
    name: "Infirmities",
    type: "list_builder",
    description: `Not every illness is spiritual—but some physical and emotional afflictions are tied to wounds, sins, generational patterns, or oppression, and persist despite every natural remedy. Listing them is not a diagnosis and never a replacement for medical care; it is bringing your body and mind before the Healer and asking whether anything in this workbook may be connected to what you suffer. Often the chronic ailment lifts once the root is addressed.`,
    actionItem: `Write down the physical and emotional infirmities you carry, especially those that are chronic, unexplained, or that "run in the family." Note any that began after a specific event. Examples: Lifelong anxiety or depression. Chronic pain or illness no doctor can explain. A recurring affliction also suffered by my parent or grandparent. Insomnia or torment that started after an occult experience. Panic that began after a trauma. Continue any prescribed medical treatment as you pray.`,
    fields: [
      { key: "infirmity", label: "Infirmity or condition", placeholder: "Name or describe it", required: true, type: "text" },
      { key: "for_healing", label: "I am specifically asking God for healing of this", type: "boolean" },
    ],
  },
  {
    id: 23,
    categoryId: 3,
    name: "Future Generation Concerns",
    type: "list_builder",
    description: `Just as sin and wounds can pass down a family line, so can blessing. Having worked to close the doors of your own life, this final section turns toward those who come after you—your children, grandchildren, and descendants not yet born. Here you renounce, on their behalf, the patterns you refuse to pass on, and you intentionally speak blessing and protection over your line. You become the one in whom the old pattern stops and the new inheritance begins.`,
    actionItem: `Name the patterns, curses, or bondages you most want to ensure are not passed to your children and descendants, and write a blessing you want to speak over them instead. Examples: "The addiction in our family stops with me." "No more divorce and abandonment in this line." "I renounce the occult inheritance on behalf of my children." Then: "I bless my children with faith, freedom, and the love of God. I declare they will know they are wanted and treasured."`,
    fields: [
      { key: "concern", label: "Concern", placeholder: "Describe briefly", required: true, type: "textarea" },
    ],
  },
  {
    id: 24,
    categoryId: 1,
    name: "Soul ties & unhealthy bonds",
    type: "list_builder",
    description: `A soul tie is an ungodly spiritual bond formed when two souls become joined in a way that gives one person an unhealthy hold over another. These bonds differ from ordinary forgiveness work (Section 2) and sexual sin (Section 4)—they are persistent attachments where a person still has a grip on you long after the relationship ended or the harm was done. They can form through sexual union, trauma, emotional dependency, spiritual abuse, grief, occult ritual, or any relationship where control, idolatry, or fear created a bond stronger than it should have been. The sign is the "pull"—the way a person still occupies space in your mind, emotions, or decisions even when you know they shouldn't.`,
    actionItem: `Ask the Holy Spirit to show you the people who still have a hold on you—people you find yourself mentally rehearsing conversations with, emotionally tethered to, or unable to move freely past. Write down each person, how the bond was formed, and whether you feel that pull is still active. These are the ties that need to be severed in prayer.`,
    fields: [
      {
        key: "person_or_relationship",
        label: "Who still has a hold on you?",
        placeholder: "Name or describe the person",
        required: true,
        type: "text",
      },
      {
        key: "how_formed",
        label: "How did this bond form?",
        type: "enum",
        enumOptions: [
          { label: "Sexual", value: "Sexual" },
          { label: "Abusive / controlling", value: "Abusive/controlling" },
          { label: "Trauma bond", value: "Trauma bond" },
          { label: "Emotional dependence / idolatry", value: "Emotional dependence/idolatry" },
          { label: "Family / parental control", value: "Family/parental control" },
          { label: "Addiction companion", value: "Addiction companion" },
          { label: "Grief / the dead", value: "Grief/the dead" },
          { label: "Occult / ritual", value: "Occult/ritual" },
          { label: "Other", value: "Other" },
        ],
      },
      {
        key: "still_pulls_at_me",
        label: "Does this person still have a grip on you, even after you've forgiven them?",
        type: "boolean",
      },
    ],
  },
];

export function getSectionById(id: number): SectionDefinition | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function getSectionName(id: number): string {
  return getSectionById(id)?.name ?? `Section ${id}`;
}

export function getSectionsByCategory(categoryId: number): SectionDefinition[] {
  return SECTIONS.filter((s) => s.categoryId === categoryId);
}
