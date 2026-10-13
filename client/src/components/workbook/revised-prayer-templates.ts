// Verbatim October 13 revised prayers. Conditions/slots are structure, not participant copy.
import type { PrayerNode, PrayerPage, PrayerTemplate, InjectFormat, InjectFilter } from "./prayer-templates";

const T = (content: string): PrayerNode => ({ type: "text", content });
const I = (sectionId: number, field: string, format: InjectFormat = "items_comma", filter?: InjectFilter): PrayerNode =>
  ({ type: "inject", sectionId, field, format, filter });
const C = (sectionId: number, sectionField: string, nodes: PrayerNode[], sectionFilter?: InjectFilter): PrayerNode =>
  ({ type: "conditional_block", sectionId, sectionField, sectionFilter, nodes });
const F = (faith: "catholic" | "non_catholic", content: string): PrayerNode =>
  ({ type: "conditional_block", faith, nodes: [T(content)] });
const P = (profileField: string, nodes: PrayerNode[]): PrayerNode =>
  ({ type: "conditional_block", profileField, nodes });
const PI = (profileField: string): PrayerNode => ({ type: "inject", profileField, format: "text" });
const TA = (placeholder: string, before: string, after: string): PrayerNode => ({ type: "in_prayer_textarea", placeholder, before, after });
const page = (title: string, nodes: PrayerNode[], sections?: number[]): PrayerPage =>
  ({ title, nodes, ...(sections ? { skipIfSectionsEmpty: sections } : {}) });
const lies = (emptyStateText?: string): PrayerNode => ({
  type: "inject", sectionId: 6, field: "lie", format: "lies_with_truths", emptyStateText,
});

const prayer1: PrayerTemplate = {
  id: "prayer_1", title: "Personal Prayer for Freedom", subtitle: "Personal Prayer for Freedom",
  pages: [
    page("Opening", [
      T("Father, I come to You as Your child. Jesus, You have already won the victory over sin, death, and every evil power, and I stand in that victory today. Holy Spirit, You are the one who sets me free. Lead me through this prayer.\n\nI believe that You love me and that You see me as I am. I bring You what You have shown me, trusting that You want my freedom even more than I do.\n\nI renounce Satan, all his works, and all his empty promises. I belong to Jesus Christ.\n\n"),
      F("catholic", "Blessed Virgin Mary, pray for me. Saint Michael the Archangel, defend me. My guardian angel, stay close to me."),
    ]),
    page("Turning back", [
      C(1, "sin", [T("Lord Jesus, I have turned away from You. I confess especially "), I(1, "sin"), T(". These were wrong, and I am sorry. I do not want to defend them or hold on to them.\n\n")]),
      C(1, "seeking", [T("When I did these things, I was looking for "), I(1, "seeking"), T(". You are the one who can give me what I was really looking for. Teach me to come to You first.\n\n")]),
      C(1, "how", [T("Where I encouraged or went along with the sins of others, I withdraw my agreement.\n\n")], "where_how_encouraged"),
      T("I renounce every hold these sins have had on me, and I ask You, Lord Jesus, to close every door I opened through them."),
    ], [1]),
    page("Sexuality", [
      C(4, "sin", [T("Lord Jesus, You made my body and my sexuality good, and I have used them apart from love. I confess especially "), I(4, "sin"), T(". I am sorry. Restore my purity and my dignity.\n\n")]),
      C(4, "person_or_partner", [T("I bring before You "), I(4, "person_or_partner"), T(". I release each of them to You and ask You to bless them. I renounce every unholy bond formed between us, and I ask You to set us both free.\n\n")]),
      T("I renounce lust and every evil spirit that has used these sins to hold me, and I ask You, Lord Jesus, to remove them from me. Heal my memory and imagination, and give me a chaste and generous heart."),
    ], [4]),
    page("What I run to", [
      C(11, "addiction", [T("Father, when I am hurting I have run to other things before running to You. I have run to "), I(11, "addiction"), T(".\n\n")]),
      C(11, "what_it_gives", [T("They gave me "), I(11, "what_it_gives"), T(". I want to receive what I truly need from You.\n\n")]),
      T("I renounce the false comfort and false security these have offered me. Where they have become a bondage, I ask You, Lord Jesus, to break their hold and remove every evil spirit that has used them against me. Give me the help I need from others to walk free, and the humility to accept it."),
    ], [11]),
    page("People I have hurt", [
      C(13, "harm", [T("Lord Jesus, I have hurt people You love. I bring before You "), I(13, "harm"), T(". I am sorry. Heal what I damaged, and bless each person I hurt.\n\n")]),
      C(13, "amends_owed", [T("Show me how to make amends where I owe them, and give me the courage and prudence to do it well.")], "where_amends_owed"),
    ], [13]),
    page("Seeking power apart from God", [
      C(5, "practice", [T("Father, I looked for guidance, protection, and power apart from You. I repent of it, and I renounce "), I(5, "practice"), T(".\n\n")]),
      I(5, "spirit_named", "renounce_spirit_each", "skip_empties"),
      C(5, "kind", [T("I renounce every spell, curse, and pact I made, and I take back every consent I gave.\n\n")], "where_kind_pact"),
      C(5, "practice", [T("I ask You, Lord Jesus, to break every bond these practices formed, to remove every evil spirit connected with them, and to fill those places with Your Holy Spirit.\n\n")]),
      C(20, "object", [T("I will remove from my home "), I(20, "object"), T(". Let nothing in my home stand for anyone but You.")]),
    ], [5, 20]),
    page("Lies and the truth", [
      C(6, "lie", [T("Father, I have believed things about myself, about You, and about others that are not true. I renounce these lies: "), I(6, "lie"), T(".\n\n")]),
      lies(),
      T("\n\nI break my agreement with every lie spoken to me through other people, through my own pain, or by the enemy. I choose to stand on Your word."),
    ], [6]),
    page("Vows", [
      C(7, "vow", [T("Lord Jesus, I made promises to protect myself: "), I(7, "vow"), T(". I made them in pain, and they have ruled parts of my life that belong to You. I renounce them. I give back to You the places in my heart I tried to guard on my own. Protect them Yourself.")]),
    ], [7]),
    page("Bonds that still hold me", [
      C(24, "person_or_relationship", [T("Father, some bonds still pull at me. I bring before You "), I(24, "person_or_relationship"), T(". I release each person into Your hands and I bless them. I renounce every unholy bond between us, and I ask You, Lord Jesus, to cut each one and to restore to each of us what belongs to us. Set my love in order.")]),
    ], [24]),
    page("Wounds", [
      C(3, "what", [T("Jesus, You were with me when I was hurt. I bring You these wounds: "), I(3, "what"), T(". What was done to me was not my fault, and I place it in Your hands.\n\n")]),
      C(3, "lie_believed", [T("Because of these wounds I believed "), I(3, "lie_believed"), T(". I let go of those messages and ask You to tell me what is true.\n\n")]),
      C(3, "coping", [T("I learned to protect myself by "), I(3, "coping"), T(". Thank You for carrying me through. I give these ways to You now. Where they led me into sin, forgive me, and teach me to trust You instead.\n\n")]),
      T("Come into these memories, Lord, and heal what is still wounded.\n\n"),
      C(3, "presence", [T("Thank You for showing me "), I(3, "presence"), T(".")]),
    ], [3]),
    page("Releasing", [
      C(2, "person", [T("Father, I choose to forgive.\n\n"), I(2, "person", "forgive_each", "where_who_someone"), T("\n\nI release them from the debt they owe me, place them in Your hands, and ask You to bless them. Where my feelings have not caught up, I trust You to heal my heart over time. I renounce bitterness, resentment, and the desire for revenge.\n\n")], "where_who_someone"),
      C(2, "what", [T("Father, I have held my own failures against myself, especially "), I(2, "what", "items_comma", "where_who_self"), T(". You have forgiven me. I receive Your forgiveness, and I stop condemning what You have already forgiven.\n\n")], "where_who_self"),
      C(2, "what", [T("Father, I have been angry with You about "), I(2, "what", "items_comma", "where_who_god"), T(". I tell You so honestly. I let go of my accusation against You, and I ask You to show me Your heart in what happened.")], "where_who_god"),
    ], [2]),
    { ...page("The thread", [
      T("Father, I see these threads running through my life: "), I(14, "checked", "patterns_comma"),
      T(". I renounce them. Wherever an evil spirit has used them, I renounce it in the name of Jesus Christ, and I ask You, Lord Jesus, to remove it from me and leave it no place to return.\n\n"),
      C(14, "father_word", [T("Father, speak this over me: "), I(14, "father_word"), T(". I receive it.")]),
    ]), requiresCheckedThemes: true },
    page("Closing", [
      T("Holy Spirit, fill every place in me that has been emptied today. Where there was a lie, put Your truth. Where there was a wound, put Your healing. Where there was fear, put Your peace. Leave no room in me for anything that is not from You.\n\n"),
      F("catholic", "I will bring my sins to Confession and receive Your mercy there. Blessed Virgin Mary, cover me with your mantle. Saint Michael the Archangel, defend me. All you holy saints of God, pray for me.\n\n"),
      F("non_catholic", "Give me the courage to confess my sins to a pastor or a believer I trust, so that I may be healed.\n\n"),
      T("Jesus Christ is Lord. I belong to Him, and I rest in His victory. Amen."),
    ]),
  ],
};

const prayer2: PrayerTemplate = {
  id: "prayer_2", title: "Family Line Prayer", subtitle: "Family Line Prayer",
  pages: [
    page("Standing for my family", [T("Father, I come before You for my family: my father's side and my mother's side, those who came before me and those who will come after me.\n\nI am not here to judge anyone. I cannot repent on another person's behalf, and I do not carry their guilt. I come to forgive them, to pray for them, and to refuse to carry forward anything that did not come from You.\n\nJesus, You are Lord of my family's past, present, and future. Cover us with Your mercy.")]),
    page("Patterns in my family line", [
      C(15, "pattern_or_sin", [T("Father, these patterns have run through my family:\n\n"), I(15, "pattern_or_sin", "pattern_side_each"),
        T("\n\nI forgive those whose choices began these patterns or passed them on. I renounce these patterns in my own life, and I ask You to let them end with me.")]),
    ], [15]),
    page("Family members of concern", [
      C(16, "name_or_description", [T("Father, I bring before You:\n\n"), I(16, "name_or_description", "ancestor_each"),
        T("\n\nI forgive them, and I entrust each of them to Your mercy.\n\n")]),
      C(16, "group", [T("I renounce every oath, ritual, and dedication made through "), I(16, "group"), T(", as far as they touch me and my family, and I ask You to break their hold on us.")]),
    ], [16]),
    page("The family dead", [
      T("Father of mercy, I bring before You the members of my family who died in sorrow, in violence, or without prayer.\n\n"),
      I(25, "name", "family_dead_each"),
      F("catholic", "\n\nEternal rest grant unto them, O Lord, and let perpetual light shine upon them. May their souls and the souls of all the faithful departed, through the mercy of God, rest in peace."),
      F("non_catholic", "\n\nI place each of them in Your hands. You are the Judge of all, and You are rich in mercy."),
      T("\n\nI ask that no grief or fear connected with their deaths continue in our family."),
    ], [25]),
    { ...page("Forgiving those who harmed my family", [
      C(2, "person", [T("Father, I choose to forgive those whose sins wounded my whole family:\n\n"), I(2, "person", "forgive_each", "where_is_family_harm"),
        T("\n\nI release my judgment against them and place them in Your hands.")], "where_is_family_harm"),
    ]), skipIfFilteredSectionEmpty: { sectionId: 2, filter: "where_is_family_harm" } },
    page("Body and mind", [
      C(22, "infirmity", [T("Father, I bring before You what I carry in body and mind, and what my family has carried: "), I(22, "infirmity"),
        T(". Where any of this is connected with sin or with the patterns of my family, break that connection.\n\n")]),
      C(22, "infirmity", [T("According to Your will, I ask You to heal "), I(22, "infirmity", "items_comma", "where_for_healing"), T(".\n\n")], "where_for_healing"),
      T("Bless the doctors and everyone who cares for me."),
    ], [22]),
    page("What ends with me", [
      C(23, "concern", [T("Father, let these end with me:\n\n"), I(23, "concern", "items_each")]),
      C(23, "blessing", [T("\n\nFor those who come after me, I ask: "), I(23, "blessing", "items_each"), T(".")]),
    ], [23]),
    page("Blessing over my family", [
      T("Father, where my family has known curses, give blessing. Where there has been sickness, give healing. Where there has been unbelief, give faith. Where there has been violence, give peace. Where there has been abandonment, give faithfulness.\n\nHoly Spirit, fill my family.\n\n"),
      F("catholic", "Blessed Virgin Mary, spread your mantle over this family. Saint Michael the Archangel, defend us. Holy angels of God, guard our homes and our children.\n\n"),
      T("Jesus Christ, reign in my family. Thank You for Your mercy toward me and toward all of us. Amen."),
    ]),
    page("Bringing this further", [
      F("catholic", "Bring these intentions to Mass and offer them silently at the Offertory, especially the members of your family you named among the dead. Any parish can arrange for a Mass to be offered for the deceased of your family. Return to this prayer as often as the Lord leads you."),
      F("non_catholic", "Bring these intentions with you to worship, and ask your pastor or the ministry team to pray with you. Return to this prayer as often as the Lord leads you."),
    ]),
  ],
};

const prayer3: PrayerTemplate = {
  id: "prayer_3", title: "Daily Prayer", subtitle: "Daily Prayer",
  pages: [
    page("Opening", [T("Father, I begin this day as Your child. Jesus, You are Lord over today and over everything I will face. Holy Spirit, fill me and lead me.\n\nI belong to You. I do not need to earn Your love today. Help me live from it.")]),
    page("Turning and releasing", [
      TA("Anything you want to name today?", "Lord, since I last prayed, I have turned from You in these ways: ", ". I am sorry. Forgive me and make me new.\n\n"),
      F("catholic", "Lead me to Confession where I need it.\n\n"),
      TA("Anyone you need to forgive today?", "I forgive ", ". I release them to You and ask You to bless them.\n\n"),
      TA("Anything pulling at you today?", "I renounce ", " in the name of Jesus Christ, and I ask You, Lord, to take it from me."),
    ]),
    page("The truth I stand on", [
      T("Father, I reject every lie that has shaped the way I see myself, and I receive what You say is true.\n\n"),
      lies("Father, I receive Your word over me today. I am Your beloved child. You see me. Nothing can separate me from Your love."),
      T("\n\nLet these truths go deeper than my feelings today."),
    ]),
    { ...page("The thread", [
      T("Lord Jesus, I renounce "), I(14, "checked", "patterns_comma"), T(" again today. Keep them from having any place in me.\n\n"),
      C(14, "father_word", [T("Father, remind me today: "), I(14, "father_word"), T(".")]),
    ]), requiresCheckedThemes: true },
    page("My family and home", [
      P("familyMembers", [T("Father, I place my family in Your hands, especially "), PI("familyMembers"), T(".\n\n")]),
      P("spouseName", [T("Bless "), PI("spouseName"), T(". Draw "), PI("spouseName"), T(" close to You, heal what is wounded, and keep us faithful to each other.\n\n")]),
      P("childrenNames", [T("Bless "), PI("childrenNames"), T(". Protect them, strengthen their faith, and keep them from evil.\n\n")]),
      T("Lord Jesus, protect my family and my home from every evil. Let my home be a place of peace and prayer.\n\n"),
      F("catholic", "Blessed Virgin Mary, cover us with your mantle. Saint Michael the Archangel, defend us. Holy angels of God, guard us."),
    ]),
    page("Healing", [
      P("chronicIssues", [T("Lord Jesus, I bring You what I carry: "), PI("chronicIssues"), T(".\n\n")]),
      P("chronicIdentityLabels", [T("I let go of the name "), PI("chronicIdentityLabels"), T(". My name is Your beloved.\n\n")]),
      C(22, "infirmity", [T("According to Your will, heal "), I(22, "infirmity", "items_comma", "where_for_healing"), T(".\n\n")], "where_for_healing"),
      T("Heal my mind, my memory, and my imagination today. Where I need human help, give me the courage to receive it."),
    ]),
    page("Closing", [T("Holy Spirit, bring forth Your fruit in me today: love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.\n\nJesus Christ, reign in my heart, my home, and my family today. Deliver us from evil. Amen.")]),
  ],
};

export const PRAYER_TEMPLATES: Record<string, PrayerTemplate> = {
  prayer_1: prayer1, prayer_2: prayer2, prayer_3: prayer3,
};
