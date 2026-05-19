# Catholic Freedom Workbook — Prayer Content & Workbook Schema

This file is the source of truth for **three prayers** and the Workbook data model they pull from.

This is a Catholic deliverance prayer companion. The prayers are original Catholic prayers in the tradition of baptismal renunciations, minor exorcisms, and Catholic deliverance ministry (Unbound, Ripperger, etc.). They prepare the user for sacramental Confession; they do not replace it.

**Key architectural decisions encoded in this file:**

1. The Workbook is a **resource**, not a course — always available, no scheduling, no completion locks.
2. The previously planned standalone "Breaking Lies" tool has been **folded into Workbook Section 6** ("Lies & Truths"). It is no longer a separate tool. The spiritual operation is the same — Section 6 just does it more cohesively and feeds both the Personal Deliverance Prayer and the Daily Prayer.
3. **The Daily Prayer is daily indefinitely**, not "twice a day for 30 days." It is the ongoing daily container for the user's life with the app, with a soft streak counter, not a deadline-based cleanup ritual.
4. A new **Catholic Truth Library** is required as a separate content deliverable — see Part 7. It maps lying spirits → Scripture → first-person truth statements. Without this content, Section 6's deeper path doesn't function.
5. A new **User Profile** is introduced as separate state from the Workbook — see Part 6.

## Rules for the agent

- Do not paraphrase or "improve" the prayer text. Render verbatim.
- Slot markers use `[slot_name]` form. Each slot maps to either a Workbook section, the User Profile, or the Catholic Truth Library — defined below.
- Where a slot's source data is empty, omit the surrounding sentence gracefully.
- User-injected spans use the distinct visual treatment from the build prompt (info-color background, info-color text).
- The Catholic Truth Library is content, not code. The agent does not author any of its entries. If the library is empty at build time, ship Section 6's fast path only (name-the-lie); the deeper path comes online when the library is populated.

---

# Part 1 — Workbook schema (23 sections)

Field names use snake_case to match prayer slots.

| # | Section | Schema type | Fields | Maps to prayer slots |
|---|---|---|---|---|
| 1 | Personal sins | list_builder | `sin` (textarea) | `[personal_sins]` |
| 2 | People to forgive | list_builder | `person` (text), `what` (textarea, optional), `is_family_harm` (boolean, default false) | `[people_to_forgive]`, `[people_to_forgive_for_family_harm]` (filtered by is_family_harm) |
| 3 | Family & childhood wounds | list_builder | `whose` (enum: Father, Mother, Family/Childhood), `what` (textarea), `lie_believed` (textarea, optional) | `[father_wounds]`, `[mother_wounds]`, `[family_or_childhood_wounds]`, `[childhood_lies]` |
| 4 | Sexual sin | list_builder | `sin` (textarea), `person_or_partner` (text, optional) | `[sexual_sins]`, `[sexual_partners_or_people_connected]` |
| 5 | Occult & false spiritual power | list_builder | `practice` (text) | `[occult_practices]` |
| 6 | **Lies & Truths** | list_builder (two-stage) | See detailed schema below | `[word_curses]`, `[self_curses]`, `[word_curse_scripture_statements]` |
| 7 | Vows & inner promises | list_builder | `vow` (textarea) | `[unholy_vows_or_inner_vows]` |
| 8 | Idolatry | list_builder | `idol` (textarea) | `[idols]` |
| 9 | Pride, rebellion & control | list_builder | `pattern` (textarea) | `[pride_patterns]` |
| 10 | Abuse, trauma & wounded responses | list_builder | `event` (textarea), `sinful_response` (textarea, optional) | `[traumatic_events]`, `[sinful_responses_to_trauma]` |
| 11 | Addictions & compulsions | list_builder | `addiction` (textarea) | `[addictions_or_compulsions]` |
| 12 | False religion & spiritual mixture | list_builder | `practice` (textarea) | `[false_worship_or_other_religious_practices]`, `[false_religions]`, `[false_spiritual_practices]` |
| 13 | Harm done to others | list_builder | `harm` (textarea) | `[harm_done_to_others]` |
| 14 | Dominant spiritual patterns | checklist + free-text | See below | `[dominant_spiritual_patterns]`, `[spirits_to_renounce]` |
| 15 | Generational sins & family patterns | list_builder | `pattern_or_sin` (textarea) | `[family_patterns_or_generational_sins]`, `[generational_evils]` |
| 16 | Family members & ancestors of concern | list_builder | `name_or_description` (text), `groups_or_sins_involved` (textarea, optional) | `[ancestor_or_family_member_names]`, `[groups_or_sins_involved]` |
| 17 | Lodges, secret societies & oath-bound groups | list_builder | `group` (text), `titles_or_roles` (textarea, optional), `oaths_or_rituals` (textarea, optional) | `[lodges_or_secret_societies]`, `[known_titles_degrees_or_roles]`, `[known_oaths_or_rituals]` |
| 18 | Agreement sins | list_builder | `agreement` (textarea) | `[agreement_sins]` |
| 19 | Named spirits, false deities & unholy allegiances | list_builder | `name` (text) | `[named_spirits_or_deities]`, `[named_family_spirits]` |
| 20 | Objects of concern | list_builder | `object` (textarea) | `[objects_to_renounce]` |
| 21 | Curses, spells & blood contracts | list_builder | `kind` (enum: Curse against family, Blood contract/ritual bond), `description` (textarea) | `[curses_or_bondages]` (when kind=Curse), `[blood_contracts_or_ritual_bonds]` (when kind=Blood contract) |
| 22 | Infirmities | list_builder | `infirmity` (text), `for_healing` (boolean) | `[infirmities]`, `[healing_requests]` (filtered by for_healing) |
| 23 | Future generation concerns | list_builder | `concern` (textarea) | `[future_generation_concerns]` |

## Section 6 — Lies & Truths (detailed schema)

Replaces the previously planned standalone "Breaking Lies" tool. The two-stage flow keeps the entry path fast while making the deeper path possible.

**Fields:**

| Field | Type | Required? | Notes |
|---|---|---|---|
| `lie` | textarea | yes | "What lie are you carrying?" |
| `spoken_by` | text | no | "Who spoke this over you?" Skippable for self-spoken lies. |
| `lying_spirit` | enum (12 options) | no | The 12 spirits — see below. Unlocks Scripture suggestions when selected. |
| `scripture_reference` | text | no | Picked from suggestions filtered by `lying_spirit`, or "Browse all," or free entry. |
| `scripture_text` | textarea | no | Auto-filled from the Catholic Truth Library when reference is picked. Editable. |
| `truth_statement` | textarea | no | **Auto-filled** from the Catholic Truth Library based on the chosen Scripture. First-person counter-truth. User can edit lightly, but the app does the rewriting work. |

**The 12 lying spirits:**

| Spirit | One-line lie summary |
|---|---|
| Destruction | "You are broken, limited, your mind is not enough." |
| Hopelessness | "Nothing will change. It will not get better." |
| Weakness | "You must hide what you cannot do alone." |
| Condemnation | "You are worthless. You deserve to be hated." |
| Fear | "You are not safe. Danger is everywhere." |
| Rejection | "You do not belong. No one wants you." |
| Shame | "You are what you have done. You are dirty." |
| Unworthiness | "You do not deserve good things, or love." |
| Isolation | "You are alone. No one understands." |
| Anxiety | "You must control everything. You cannot rest." |
| Self-hatred | "You are your own enemy. You deserve punishment." |
| Confusion | "Nothing makes sense. You cannot trust your mind." |

**Two-stage user flow:**

1. **Fast path** — User taps "Add a lie," writes the lie, optionally adds who spoke it, saves. Entry persists with only `lie` (and maybe `spoken_by`) filled in.
2. **Deeper path** — Below each saved entry, a button: *"Claim a truth against this."* Tapping opens the deeper form: pick the lying spirit → see 2-3 Scripture suggestions from the Catholic Truth Library → pick one → the `truth_statement` auto-fills, the user reads it, optionally edits, saves.

**Status display:** "N lies named, M truths claimed" — nudges users back to the deeper work without forcing it.

**Truth statement preview:** After Scripture is picked, show a small preview card: *"Your declaration will read: 'I reject the lie that [lie]. The Lord reminds me: [truth_statement]. As Scripture says, [scripture_reference]: "[scripture_text]"'"*

## Section 14 — Dominant spiritual patterns (checklist)

Flat list of named spirits / patterns. Stored as a flat array of checked names plus optional free-text values.

Categories: Death, Infirmity, Divination, Rebellion, Lying, Rage, Manipulation, Domination, Control, Fear, Rejection, Lust, Shame, Addiction, Violence, Hatred, Confusion, Despair, Unbelief, Poverty, Suicide, Abuse, Occult bondage, False worship, Pride, Self-hatred, Bitterness, Accusation, Mental torment, Spiritual blindness, *Other (free-text input)*.

For `[spirits_to_renounce]`, render as `"every spirit of X, every spirit of Y, and every spirit of Z"` (prefixing each checked name with "every spirit of," joined with commas and final "and").

---

# Part 2 — Personal Deliverance Prayer

**Title in app**: Personal Deliverance Prayer
**Cadence**: Pray once, with intention, after working through the Workbook. May be repeated under spiritual direction.

## Page 1 — Opening prayer

Lord Jesus Christ, Son of the living God, I come before You in humility, faith, and repentance. I believe that You are my Savior, my Redeemer, my Lord, and my Deliverer. I believe that You died for my sins, that You rose from the dead, and that Your Precious Blood is stronger than every sin, wound, curse, demon, false agreement, unholy bond, and evil influence that has touched my life.

In Your holy name, and through the power of Your Precious Blood, I renounce Satan, all his works, and all his empty promises. I reject every evil that I have accepted through sin, ignorance, fear, rebellion, weakness, curiosity, woundedness, or deliberate choice. I reject every evil that has entered my life through my own sins, through sins committed against me, through the sins of my family line, through occult practices, through unholy relationships, through false vows, through unforgiveness, through trauma, through deception, or through any other opening known or unknown to me.

Lord Jesus, I ask You to cover me with Your Precious Blood. Wash over my mind, my body, my soul, my memory, my imagination, my heart, my home, my family, my relationships, and everything entrusted to me. Let every place of darkness be brought under Your authority. Let every place of bondage be brought under Your Cross. Let every place of fear, shame, confusion, hatred, lust, pride, rebellion, despair, or torment be touched by Your mercy.

Blessed Virgin Mary, Mother of God, spread your mantle over me and pray for me. Saint Michael the Archangel, defend me in battle. Holy angels of God, surround me, guard me, and drive far from me every evil spirit. All holy saints of God, pray for me.

Lord Jesus, as I name these sins, wounds, bonds, and agreements, give me true repentance, true renunciation, and true freedom. Amen.

## Page 2 — Personal sins

Lord Jesus Christ, I repent of all my personal sins, especially {{INJECT: Section 1, format=items_comma using `sin`}}. I confess that these sins were wrong, and I do not excuse them, hide them, defend them, or cling to them. I place them under Your Precious Blood and ask You to forgive me, cleanse me, and give me the grace to make a good Confession wherever Confession is needed.

In the holy name of Jesus, I renounce these sins. I reject every pleasure, habit, false comfort, false identity, and false promise attached to them. I break every agreement I have made with these sins, whether knowingly or unknowingly, and I reject every spirit that has gained influence in my life through them.

In the holy name of Jesus Christ, and through the power of His Precious Blood, I ask Almighty God to bind every evil spirit connected to these sins, to break its power over me, to cast it away from me, and to remove every claim, attachment, influence, or foothold it has had in my life. Lord Jesus, close every door I opened through these sins, and fill every place that has been emptied with Your Holy Spirit.

## Page 3 — Unforgiveness, resentment, and judgment

Lord Jesus Christ, I repent of all unforgiveness, bitterness, resentment, anger, hatred, revenge, accusation, and sinful judgment. I acknowledge before You the people I have refused to forgive, especially {{INJECT: Section 2, format=names_comma using `person`}}.

What happened to me mattered. The wounds were real. The injustice was real. But I do not want unforgiveness to rule my heart, and I do not want bitterness to give the evil one any place in me. Therefore, in obedience to You, and with the help of Your grace, I choose to forgive those who hurt me. I release them into Your hands. I release my demand for revenge. I release the debt they owe me, and I ask You to judge rightly, heal deeply, and restore what can be restored.

In the holy name of Jesus, I renounce unforgiveness, bitterness, resentment, hatred, revenge, accusation, and every sinful judgment I have made against others. I break every unholy bond, attachment, agreement, and spiritual claim formed through unforgiveness. I reject every spirit that has used these wounds to keep me bound.

In the holy name of Jesus Christ, and through the power of His Precious Blood, I ask Almighty God to bind every spirit of unforgiveness, bitterness, hatred, revenge, anger, resentment, accusation, judgment, and hardness of heart, to break its power over me, to cast it away from me, and to restore in me the mercy, peace, and freedom of Christ.

## Page 4 — Father, mother, family, and childhood wounds

Lord Jesus Christ, I bring before You the wounds connected to my father, my mother, my grandparents, my family, my home, and my childhood. I especially bring before You {{INJECT: Section 3 (Father), format=items_comma using `what`}}, {{INJECT: Section 3 (Mother), format=items_comma using `what`}}, and {{INJECT: Section 3 (Family/Childhood), format=items_comma using `what`}}.

I forgive those who failed to love me as they should have loved me. I forgive those who wounded me, rejected me, neglected me, abandoned me, frightened me, controlled me, used me, shamed me, or placed burdens on me that I was not meant to carry. I release sinful judgment against them, and I place them into Your hands.

In the holy name of Jesus, I renounce every lie I believed because of these wounds, especially {{INJECT: Section 3, format=items_comma using `lie_believed`, skip empties, across all whose values}}. I reject the lie that I am unwanted, unloved, unsafe, abandoned, worthless, dirty, rejected, forgotten, or beyond healing. I reject every false identity that entered through these wounds.

In the holy name of Jesus Christ, and through the power of His Precious Blood, I break every unholy bond, attachment, agreement, wound, and spiritual claim connected to these family and childhood wounds. I ask Almighty God to bind every spirit of rejection, abandonment, fear, shame, control, confusion, hatred, despair, self-hatred, and orphanhood connected to these wounds, to cast them away from me, and to restore in me the truth that I am a beloved child of the Father.

## Page 5 — Sexual sin and unholy attachments

Lord Jesus Christ, I repent of every sexual sin I have committed in thought, word, desire, imagination, memory, or action. I repent especially of {{INJECT: Section 4, format=items_comma using `sin`}}. I bring before You every person connected to these sins, especially {{INJECT: Section 4, format=names_comma using `person_or_partner`, skip empties}}.

I repent of lust, impurity, pornography, fornication, adultery, fantasy, seduction, masturbation, use of others, consent to being used, sexual manipulation, sexualized attention, and every misuse of my body or the body of another person. I repent of treating what is sacred as common, of seeking comfort apart from love, and of using sexuality in a way that separated me from You.

In the holy name of Jesus, I renounce every unholy soul tie, bond, attachment, agreement, claim, pact, vow, oath, covenant, memory, fantasy, and spiritual influence formed through these sins. I renounce every unholy attachment to the people I have named, to their past partners, to those who encouraged these sins, and to every spirit connected to these sins.

If any unholy ritual, pact, oath, vow, curse, blood covenant, or occult bond was formed through these sins, knowingly or unknowingly, I renounce it and break it now in the holy name of Jesus Christ.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of lust, impurity, perversion, shame, fantasy, seduction, addiction, domination, abuse, confusion, and unchaste attachment, to break its power over me, to cast it away from me, and to cleanse my body, mind, memory, imagination, and heart. Lord Jesus, restore in me chastity, purity, reverence, peace, and the freedom of a child of God.

## Page 6 — Occult, divination, magic, and false spiritual power

Lord Jesus Christ, I repent of every way I have sought power, knowledge, healing, comfort, protection, control, or guidance apart from You. I repent of and renounce {{INJECT: Section 5, format=items_comma using `practice`}}.

I renounce Satan and every occult practice. I renounce divination, witchcraft, sorcery, magic, tarot, astrology, psychic readings, mediumship, spiritism, séances, Ouija boards, spells, charms, curses, energy healing opposed to Christ, New Age practices, false prophecy, false light, false worship, and every attempt to gain hidden knowledge or spiritual power apart from God.

In the holy name of Jesus, I break every pact, vow, oath, ritual, curse, spell, seal, assignment, attachment, agreement, and spiritual claim connected to these practices. I reject every spirit that entered, influenced me, deceived me, tormented me, or claimed access to me through these sins.

In the holy name of Jesus Christ, and through the power of His Precious Blood, I ask Almighty God to bind every spirit connected to occult involvement, divination, witchcraft, sorcery, deception, fear, false healing, false prophecy, false light, control, and spiritual confusion, to break its power over me, to cast it away from me, and to close every door I opened through these practices. Lord Jesus, fill every place touched by darkness with the light of the Holy Spirit.

## Page 7 — Word curses, evil words, and false names

Lord Jesus Christ, I reject every evil word, curse, insult, judgment, label, false identity, and lie spoken over me by others or spoken by me against myself. I especially renounce {{INJECT: Section 6 entries where spoken_by is non-empty, format=items_comma using `lie`}} and {{INJECT: Section 6 entries where spoken_by is empty, format=items_comma using `lie`}}.

I reject the words that said I was worthless, unwanted, broken, dirty, stupid, cursed, hopeless, rejected, impossible to love, beyond healing, or destined for evil. I reject every false name that came through cruelty, abuse, rejection, humiliation, fear, shame, or despair. These words do not define me. These lies do not own me. These curses do not have authority over me.

In the holy name of Jesus, I break agreement with every word curse, false judgment, evil label, and lie spoken over me. I renounce every spirit that used these words to wound me, bind me, accuse me, shame me, confuse me, or keep me from receiving the truth of God.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of rejection, shame, condemnation, self-hatred, despair, fear, confusion, worthlessness, and accusation connected to these words, to break its power over me, and to cast it away from me. Lord Jesus, speak Your truth over me, and let Your word be stronger than every lie.

> **Note**: This page operates at the renunciation level only — it lists the lies. The truth-claiming work happens later in the Daily Prayer's Renewal of the Mind section. Users who have only named lies (without claimed truths) are fully served by this page.

## Page 8 — Vows, oaths, pledges, and interior promises

Lord Jesus Christ, I repent of every sinful vow, oath, pledge, promise, or interior agreement I have made apart from You. I renounce especially {{INJECT: Section 7, format=items_comma using `vow`}}.

I renounce every vow made from fear, hatred, pride, lust, despair, grief, revenge, control, self-protection, or unbelief. I renounce vows such as "I will never forgive," "I will never trust," "I will never need anyone," "I will always be alone," "I will get revenge," "I belong to darkness," "I cannot be free," "I am beyond help," and every similar vow spoken aloud or held silently in my heart.

In the holy name of Jesus, I break every unholy vow, oath, pledge, promise, agreement, curse, attachment, and spiritual claim connected to these words. I reject every spirit that used these vows to bind my will, harden my heart, distort my identity, or shape my future apart from God.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to these vows, to break its power over me, to cast it away from me, and to restore my will to the freedom and obedience of Christ.

## Page 9 — Idolatry and false sources of safety

Lord Jesus Christ, I repent of every form of idolatry in my life. I repent of making idols of {{INJECT: Section 8, format=items_comma using `idol`}}.

I repent of looking for ultimate safety, identity, comfort, control, pleasure, healing, power, approval, escape, or worth in anything other than You. I renounce every false god, every false altar, every false refuge, every false covering, every false comfort, and every false source of peace.

In the holy name of Jesus, I break every unholy attachment, agreement, claim, and spiritual influence connected to idolatry. I reject every spirit that has used these idols to draw me away from God, weaken my faith, enslave my desires, or keep me from surrender.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to idolatry, greed, control, lust, addiction, fear, pride, false worship, and false comfort, to break its power over me, and to cast it away from me. Jesus Christ, You alone are Lord, and I choose to worship You alone.

## Page 10 — Pride, rebellion, and control

Lord Jesus Christ, I repent of pride, rebellion, disobedience, stubbornness, self-reliance, and control. I repent especially of {{INJECT: Section 9, format=items_comma using `pattern`}}.

I repent of exalting myself, defending my sin, refusing correction, hiding from the truth, blaming others, despising authority, resisting Your will, and trying to rule my life apart from You. I repent of wanting my own way more than Your will.

In the holy name of Jesus, I renounce pride. I renounce rebellion. I renounce control. I renounce self-will. I renounce every refusal to obey God.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of pride, rebellion, control, stubbornness, arrogance, disobedience, self-exaltation, and hardness of heart, to break its power over me, to cast it away from me, and to give me a humble, obedient, and teachable heart.

## Page 11 — Generational sins and family patterns

Lord Jesus Christ, I bring before You the sins, wounds, disorders, and evil patterns that have affected my family line. I repent of my own participation in these sins and patterns, especially {{INJECT: Section 15, format=items_comma using `pattern_or_sin`}}.

I do not claim personal guilt for sins I did not commit, but I reject every evil inheritance, every sinful pattern, every curse, every bondage, every wound, and every demonic influence that has passed through my family line and affected my life. I renounce family patterns of addiction, violence, abuse, occult involvement, idolatry, adultery, abandonment, hatred, despair, suicide, greed, deception, unbelief, mental torment, sexual sin, poverty of spirit, and every pattern contrary to the kingdom of God.

In the holy name of Jesus, and through the power of His Precious Blood, I break every curse, attachment, agreement, assignment, and spiritual claim connected to the sins of my ancestors and my family line. I ask Almighty God to bind every evil spirit connected to these generational sins and patterns, to break its power over me and my family, and to cast it away from us according to His holy will.

Lord Jesus, place Your Cross between me and every evil inheritance. Let Your mercy be stronger than every sin of the past. Bless my family, living and dead, according to Your mercy, and bring repentance, healing, deliverance, and salvation wherever they are needed.

## Page 12 — Abuse, trauma, and wounded responses

Lord Jesus Christ, I bring before You the places where I was abused, harmed, violated, neglected, abandoned, humiliated, manipulated, controlled, or wounded. I bring You especially {{INJECT: Section 10, format=items_comma using `event`}}.

I do not call evil good. I do not excuse what happened. I do not take blame for what was not my fault. I place every wound, every memory, every fear, every humiliation, and every violation under Your Cross.

But I also repent of every sinful response that came from these wounds, especially {{INJECT: Section 10, format=items_comma using `sinful_response`, skip empties}}. I repent of hatred, revenge, despair, self-hatred, destructive choices, isolation, bitterness, unbelief, impurity, rage, mistrust, and every way I allowed pain to lead me away from You.

In the holy name of Jesus, I renounce every lie, vow, attachment, agreement, and spiritual claim connected to these wounds. I reject every spirit that entered through trauma, fear, rejection, shame, despair, confusion, hatred, rage, self-hatred, or torment.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every evil spirit connected to these wounds, to break its power over me, to cast it away from me, and to remove its influence from my mind, body, soul, memory, imagination, and heart. Lord Jesus, enter these memories with Your light, heal what has been wounded, and restore peace where there has been torment.

## Page 13 — Addictions and compulsions

Lord Jesus Christ, I repent of every addiction, compulsion, dependency, and destructive habit in my life, especially {{INJECT: Section 11, format=items_comma using `addiction`}}.

I repent of turning to created things for comfort, escape, control, relief, numbness, pleasure, or identity apart from You. I renounce every false comfort, every false escape, every agreement with slavery, every agreement with secrecy, every agreement with despair, and every agreement with shame.

In the holy name of Jesus, I break every unholy bond, attachment, agreement, and spiritual claim connected to these addictions and compulsions. I reject every spirit that used these habits to enslave my body, weaken my will, cloud my mind, isolate me from others, or separate me from God.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit of addiction, compulsion, slavery, secrecy, shame, despair, self-destruction, and false comfort, to break its power over me, to cast it away from me, and to strengthen me in repentance, accountability, healing, perseverance, and freedom.

## Page 14 — False religion, spiritual mixture, and false worship

Lord Jesus Christ, I repent of every participation in worship, rituals, prayers, initiations, symbols, practices, or spiritual systems opposed to You. I renounce especially {{INJECT: Section 12, format=items_comma using `practice`}}.

I reject every false god, false spirit, false worship, false blessing, false initiation, false covering, false protection, and false spiritual authority. I reject every mixture of the Catholic faith with practices that do not belong to Christ.

In the holy name of Jesus, I break every pact, vow, oath, ritual, attachment, agreement, curse, and spiritual claim connected to false worship and false religion. I reject every spirit that entered, influenced me, deceived me, or claimed access to me through these practices.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to false worship, idolatry, religious confusion, deception, fear, and spiritual bondage, to break its power over me, and to cast it away from me. I choose the Father, the Son, and the Holy Spirit. I choose Jesus Christ and the faith of His Church.

## Page 15 — Harm I have done to others

Lord Jesus Christ, I repent of the ways I have harmed other people. I repent especially of {{INJECT: Section 13, format=items_comma using `harm`}}.

I repent of selfishness, cruelty, manipulation, neglect, dishonesty, impurity, betrayal, anger, gossip, rejection, abuse, contempt, and every failure to love. I repent of the wounds I caused knowingly or unknowingly. I ask You to forgive me and to show me where I need to confess, apologize, repair, restore, or make restitution.

In the holy name of Jesus, I renounce every sin and every evil influence connected to the harm I have caused. I reject every spirit that encouraged me to wound, use, deceive, control, reject, or despise others.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind every spirit connected to these sins, to break its power over me, to cast it away from me, and to give me humility, courage, and charity.

## Page 16 — Dominant spiritual patterns

Lord Jesus Christ, I now renounce the dominant spiritual patterns that have afflicted me, tempted me, tormented me, deceived me, accused me, oppressed me, or influenced my life. I renounce especially {{INJECT: Section 14, format=patterns_comma using checked names}}.

In the holy name of Jesus, I renounce {{INJECT: Section 14, format=spirits_with_every_prefix}}. I reject each one. I break agreement with each one. I break every claim, attachment, assignment, influence, and foothold connected to each one.

Through the power of the Precious Blood of Jesus, I ask Almighty God to bind each and every evil spirit connected to these patterns, to render them powerless against me, to silence their accusations, to break their influence, to cast them away from me, and to prevent them from returning.

I belong to Jesus Christ. I am marked by baptism. I am covered by the Precious Blood of Jesus. I am not the property of the evil one.

## Page 17 — Final prayer of binding, deliverance, and protection

Lord Jesus Christ, in Your holy name and through the power of Your Precious Blood, I ask Almighty God to bind every evil spirit that has come against me, afflicted me, tempted me, tormented me, deceived me, accused me, oppressed me, influenced me, or attached itself to me through any sin, wound, curse, trauma, occult practice, false religion, family pattern, unholy relationship, sexual sin, false vow, word curse, unforgiveness, idolatry, addiction, or agreement with evil.

I ask You, Lord Jesus, to break every curse, pact, spell, hex, vex, seal, assignment, trigger, trance, vow, demonic blessing, evil prayer, ritual bond, false covering, unholy attachment, and every other demonic bondage sent against me, formed by me, accepted by me, inherited by me, or placed upon me in any way.

In the holy name of Jesus Christ, I renounce them all. I reject them all. I break their power over me through the Precious Blood of Jesus. I ask Almighty God to render every evil spirit powerless, to silence every accusation, to close every door, to remove every claim, to cast every evil spirit away from me, and to make them incapable of tempting, tormenting, afflicting, deceiving, or harming me.

Lord Jesus, wash me in Your Precious Blood. Wash my mind, my body, my soul, my heart, my memory, my imagination, my emotions, my desires, my dreams, my home, my family, my relationships, my work, and all that belongs to me. Let this place and every place under my care be made holy by Your presence and protected by Your power.

Blessed Virgin Mary, Mother of God and Queen of Angels, cover me with your mantle and pray for me. Saint Michael the Archangel, defend me in battle. Holy angels and archangels, surround me, guard me, and drive far from me every evil spirit. All holy saints of God, intercede for me before the throne of God.

Come, Holy Spirit. Fill every place that has been emptied. Fill me with faith, hope, charity, purity, humility, obedience, courage, wisdom, peace, and love. Restore in me the grace of my baptism. Strengthen me for Confession, prayer, the sacraments, forgiveness, conversion, and a life fully surrendered to Jesus Christ.

Lord Jesus Christ, I place myself under Your authority, under Your mercy, under Your Cross, and under the protection of Your Precious Blood. Keep me faithful to You, deliver me from evil, and lead me into the freedom of the children of God.

Amen.

---

# Part 3 — Generational Renunciation Prayer

**Title in app**: Generational Renunciation Prayer
**Cadence**: Pray once a day for three days after completing the Personal Deliverance Prayer.

## Page 1 — Opening

Father in heaven, I come before You in the Most Holy Name of Jesus Christ, Your Son. I confess that Jesus Christ is my Lord, my Savior, and my Deliverer. My loyalty belongs to You alone, Father, Son, and Holy Spirit.

I renounce Satan, all his works, and all his empty promises. I renounce every false god, false worship, false blessing, false protection, false allegiance, and false source of power that has touched me, my family, or my generational bloodline.

I ask in the Most Holy Name of Jesus that every evil spirit affecting me, my family, my home, my descendants, or my generational line be bound and cast out by the power of His Most Precious Blood.

If any evil has entered this family line through sin, curses, malefices, occult practices, false worship, secret societies, oaths, rituals, ceremonies, objects, blood covenants, or agreements with evil, I ask You, Lord Jesus, to break it, cast it out, and cleanse us by Your Precious Blood.

I repent of my own sins. I forgive my ancestors and all others whose sins may have affected this family line. I ask You to have mercy on them, forgive them, bless them, and free this family from every evil consequence of sin.

## Page 2 — False religions, false worship, and false spiritual systems

Father, in the Name of Jesus Christ, I renounce all blessings, curses, rituals, prayers, initiations, ceremonies, protections, spiritual benefits, and spiritual claims connected to false worship, false religion, and every spiritual system opposed to Jesus Christ, especially {{INJECT: Section 12, format=items_comma using `practice`}}.

I renounce every false spiritual practice, especially {{INJECT: Section 12, format=items_comma using `practice` — same list, rendered again for the prayer's parallelism}}.

I reject every false deity, spirit, guide, ancestral spirit, familiar spirit, unholy power, or false spiritual authority connected to these practices, especially {{INJECT: Section 19, format=names_comma using `name`}}.

I no longer want their benefits, and I will not be bound by their curses. I reject every false covering, every false protection, every false blessing, and every false claim over me, my family, or my descendants.

Jesus Christ alone is Lord. I belong to Him.

## Page 3 — Lodges, secret societies, oaths, and ritual groups

Father, in the Name of Jesus Christ, I renounce every lodge, secret society, occult order, hidden brotherhood or sisterhood, oath-bound group, ritual organization, or society opposed to the worship of the true God, especially {{INJECT: Section 17, format=items_comma using `group`}}.

I renounce every title, rank, office, degree, initiation, sign, symbol, password, secret word, handshake, garment, apron, jewel, ring, oath, penalty, curse, ceremony, obligation, hidden teaching, false brotherhood, false covering, and false protection connected to these groups.

I renounce especially {{INJECT: Section 17, format=items_comma using `titles_or_roles`, skip empties}} and {{INJECT: Section 17, format=items_comma using `oaths_or_rituals`, skip empties}}.

In the Name of Jesus Christ, I break every oath, vow, pact, curse, ritual bond, and spiritual claim connected to them. I reject every spirit of secrecy, pride, fear, control, deception, false power, false light, and false worship that has worked through them.

I revoke every consent given by me or by my ancestors to be deceived, bound, marked, covered, protected, initiated, empowered, or claimed by any spirit opposed to Jesus Christ.

## Page 4 — Agreement sins and ancestral participation

Father, I repent of every sin by which I have agreed with evil, and I ask Your mercy for the sins by which my ancestors may have agreed with evil.

I bring before You especially {{INJECT: Section 18, format=items_comma using `agreement`}}, including the participation of {{INJECT: Section 16, format=names_comma using `name_or_description`}} in {{INJECT: Section 16, format=items_comma using `groups_or_sins_involved`, skip empties}}.

I ask forgiveness for every oath, allegiance, worship, covenant, ritual, ceremony, pact, vow, participation, or agreement contrary to You. You alone are God, and You alone deserve my allegiance.

In the Most Holy Name of Jesus, I renounce every unholy oath, vow, pledge, covenant, initiation, ritual bond, curse, pact, seal, agreement, and spiritual claim connected to these things.

I separate myself, my family, and my descendants from every false allegiance and every unholy spirit connected to them.

## Page 5 — Named spirits, false deities, and unholy allegiances

In the Most Holy Name of Jesus, I completely reject and renounce every oath, allegiance, worship, covenant, ritual, prayer, offering, pact, and participation made by me or by my ancestors with any false deity, unholy spirit, familiar spirit, ancestral spirit, lodge spirit, occult spirit, spirit of false religion, or spirit of false worship.

I renounce especially {{INJECT: Section 19, format=names_comma using `name`}}.

I reject you. I renounce you. I break every agreement with you. I reject every worship, oath, pact, covenant, ritual, offering, prayer, initiation, protection, blessing, and curse connected to you.

On the authority of Jesus Christ, and not my own, I command every spirit named here, and every spirit hidden behind these names, to release me and my family. Go where Jesus Christ commands you to go.

I will not serve you. I will not belong to you. I will not receive your benefits, and I will not be bound by your curses.

Jesus Christ alone is Lord.

## Page 6 — Objects, symbols, books, jewelry, and ritual items

Father, I bring before You every object, symbol, book, image, charm, amulet, talisman, ring, garment, tool, document, statue, card, candle, oil, stone, crystal, ritual item, occult item, lodge item, false religious item, inherited object, or household object connected to evil, false worship, occult practice, oaths, curses, rituals, spells, divination, witchcraft, or unholy covenants.

I specifically renounce and reject {{INJECT: Section 20, format=items_comma using `object`}}.

In the Name of Jesus Christ, I renounce every oath, vow, pact, curse, ritual, attachment, spiritual claim, and evil influence connected to these objects.

I reject every spirit attached to them, working through them, or claiming access because of them.

By the Precious Blood of Jesus, I ask Almighty God to sever every evil connection between these objects and me, my family, my home, and my descendants.

I ask You, Lord Jesus, to make these objects powerless, to sever every evil spirit from them, and to show me what must be removed, destroyed, discarded, or brought to a priest for guidance.

In the Name of Jesus Christ, I command every evil spirit connected to these objects to leave me, my family, my home, and everything entrusted to me, and to go where the Lord Jesus Christ commands.

## Page 7 — Generational bloodline, curses, and family evils

Lord Jesus Christ, I ask in Your Most Holy Name to remove any evil spirits that may be affecting me, my family, or my generational bloodline.

If any curse, malefice, spell, pact, oath, vow, ritual, occult practice, false worship, or agreement with evil has been introduced by a member of this family, by me, by my ancestors, or from outside the family, I ask You to cast it out and cleanse us with Your Most Precious Blood.

I willingly forgive my ancestors and any others who are at fault, and I ask You to absolve them of this sin and bless them.

I repent of any evil that I have done to introduce evil into our generational line, and I ask Your forgiveness.

I particularly ask You to cleanse our generational bloodline of {{INJECT: Section 15, format=items_comma using `pattern_or_sin`}}, including all curses, illnesses, sicknesses, addictions, financial curses, divorce, abuse, violence, abandonment, occult involvement, false worship, sexual sin, hatred, despair, suicide, mental torment, fear, rejection, poverty, unbelief, and every other evil handed down through the generational line.

May Your Precious Blood wash over us and cleanse us all. May these evils end now through Your infinite mercy and through the power of Your Holy Cross.

## Page 8 — Curses, spells, hexes, vexes, triggers, trances, and bondages

Father, in the Name of Jesus and by the power of His Precious Blood, I ask You to bind and break every curse, pact, spell, seal, hex, vex, trigger, trance, vow, demonic blessing, evil prayer, ritual bond, malefice, enchantment, occult assignment, ancestral curse, spoken curse, written curse, blood curse, death curse, sickness curse, poverty curse, family curse, marriage curse, infertility curse, mental torment, spiritual blindness, and every other demonic bondage sent against me, my family, my descendants, my home, my work, my possessions, or any object connected to us.

I renounce especially {{INJECT: Section 21 where kind="Curse against family", format=items_comma using `description`}}.

I ask You to bind them all, break them all, cast them out, and make them powerless through the Precious Blood of Jesus.

If any curse, spell, malefice, enchantment, or evil work remains in place against me or my family, I ask You, Lord Jesus, to break it now by the power of Your Holy Cross.

## Page 9 — Forgiveness of those who cursed or harmed the family

If any evil entered my family line through curses, spells, malefices, rituals, enchantments, hatred, jealousy, abuse, betrayal, or evil acts done by others, I ask for the grace to forgive them.

I choose forgiveness as an act of obedience, not emotion.

I forgive {{INJECT: Section 2 where is_family_harm=true, format=names_comma using `person`}} for the effects of their sins against me and my family. I forgive them for any damage they caused, knowingly or unknowingly.

I release judgment against them, and I place them into Your hands, Lord Jesus.

I ask You to break every curse, spell, malefice, enchantment, or evil work that remains in place against us.

## Page 10 — Blocking evil from passing to future generations

Father, I ask You in the Name of Jesus to block every unholy spirit, curse, malefice, family wound, addiction, sickness, false vow, occult bond, blood covenant, oath, evil pattern, and demonic influence from passing to my children, my descendants, and future generations.

I especially ask You to block {{INJECT: Section 23, format=items_comma using `concern`}}.

Let these evils end here. Let the Precious Blood of Jesus stand between my family and every evil inheritance. Let the Cross of Christ block every spirit that seeks to pass from one generation to another.

Lord Jesus, bless my family line. Heal what has been wounded. Cleanse what has been defiled. Restore what has been damaged. Deliver what has been bound.

## Page 11 — Named spirits and dominant family spirits

In the Name of Jesus Christ and by His Precious Blood, I bind and renounce every unholy spirit affecting me or my family, separately and individually.

I renounce especially {{INJECT: Section 19, format=names_comma using `name`}} and every spirit connected to {{INJECT: Section 14, format=patterns_comma using checked names}}.

I renounce every spirit of Death, Infirmity, Divination, Rebellion, Lying, Rage, Manipulation, Domination, Control, Fear, Rejection, Lust, Shame, Addiction, Violence, Hatred, Confusion, Despair, Unbelief, Poverty, Suicide, Abuse, Occult Bondage, False Worship, and every other spirit opposed to Jesus Christ.

I break every claim, agreement, attachment, assignment, foothold, and influence connected to these spirits.

In the Name of Jesus Christ, I command every spirit I have renounced to leave me and my family now. Leave every place where you have afflicted, tempted, tormented, deceived, accused, oppressed, influenced, or harmed us.

Go where the Lord Jesus Christ commands you to go, and do not return.

## Page 12 — Blood contracts, blood covenants, and ritual bonds

In the Name of Jesus Christ and by His Precious Blood, I renounce and break every unholy blood contract, blood covenant, blood oath, blood ritual, pact, vow, pledge, exchange, offering, sacrifice, or bond made between me, my ancestors, or any other person, spirit, group, organization, false deity, or occult power, whether known or unknown, remembered or forgotten, intentional or unintentional.

I renounce especially {{INJECT: Section 21 where kind="Blood contract/ritual bond", format=items_comma using `description`}}.

I reject every spirit that claimed access through blood, ritual, oath, sacrifice, sexual sin, violence, abuse, self-harm, occult practice, or false worship.

By the Precious Blood of Jesus, I ask Almighty God to break every unholy blood bond and every evil claim connected to these things.

Let the Blood of Jesus speak louder than every other blood, every other oath, every other ritual, and every other claim.

## Page 13 — Infirmity, sickness, and physical affliction

Father, in the Holy Name of Jesus Christ, I bring before You every infirmity, sickness, weakness, affliction, pain, disorder, torment, and bodily burden that has affected me or my family.

I bring before You especially {{INJECT: Section 22, format=items_comma using `infirmity`}}.

If any infirmity is connected to sin, trauma, occult involvement, curses, family patterns, evil spirits, unholy objects, false vows, or unholy agreements, I ask You to break that connection now by the Precious Blood of Jesus.

I speak now to every spirit of infirmity affecting me or my family. In the Name of Jesus Christ, I command you to leave and take with you every root, sickness, oppression, torment, and affliction connected to you.

{{INJECT: Section 22, format=infirmities_each — one statement per line, formatted as "[infirmity name], go in the Name of Jesus Christ."}}

Father, I now ask in Jesus' Name that You release Your healing power into my body and into the bodies of my family members. Fully restore everything the thief has stolen, killed, or destroyed.

Please heal {{INJECT: Section 22 where for_healing=true, format=items_comma using `infirmity`}}, according to Your holy will.

## Page 14 — Holy Spirit-prompted additions (in-prayer input)

Father, I also bring before You every sin, oath, vow, curse, agreement, spirit, object, ritual, bond, attachment, and evil influence that I have not named because I do not know it, remember it, or understand it.

{{IN_PRAYER_TEXTAREA: "If anything specific comes to mind right now, name it here." — optional, ephemeral input. Not saved to Workbook. Renders inline if filled.}}

I ask the Holy Spirit to bring to light anything else that must be confessed, renounced, removed, destroyed, healed, or brought to prayer.

In the Name of Jesus Christ, I renounce every hidden, forgotten, unlisted, unknown, disguised, or inherited agreement with evil, and I place it all under the Precious Blood of Jesus.

I ask You, Lord Jesus, to break every evil thing that remains hidden and to bring into the light whatever still needs to be healed, confessed, renounced, or removed.

> **Note**: This page introduces a new input type — an in-prayer textarea for ephemeral, day-of input. Distinct from Workbook entries (which persist). Add `in_prayer_textarea` as a new template node type in `prayer-templates.ts`.

## Page 15 — Final command to spirits

In the Name of Jesus Christ, and by the power of His Precious Blood, I speak to every unholy spirit in or around me or my family, named or unnamed, known or unknown, hidden or exposed.

I break every remaining claim you have made. I break every legal right, attachment, agreement, foothold, assignment, and influence you have claimed through sin, curses, oaths, vows, rituals, objects, false worship, blood covenants, occult practices, sickness, trauma, generational sin, or any other evil.

I command you now in the Name of Jesus Christ to leave me, my family, my home, my body, my mind, my soul, my memory, my imagination, my possessions, my work, and everything entrusted to me.

Go where Jesus Christ commands you to go. Do not return. Do not retaliate. Do not transfer. Do not hide. Do not call upon any other spirit to replace you.

Leave now in the Holy Name of Jesus Christ.

## Page 16 — Protection over family, property, pursuits, and occupations

In the Name of Jesus Christ, I ask protection over my family, my home, my property, my body, my mind, my relationships, my work, my vocation, my ministry, my finances, my health, my prayer, my sleep, and all that belongs to me.

I ask that every attack of the enemy against us, our belongings, our pursuits, and our occupations be made ineffective by the Precious Blood of Jesus.

I declare my family, my home, my property, my work, my vocation, and everything entrusted to me to be under the lordship and protection of Jesus Christ.

Blessed Virgin Mary, spread your mantle over us.

Saint Michael the Archangel, defend us in battle.

Holy angels of God, surround us and keep far from us every evil spirit.

## Page 17 — Cleansing, healing, filling, and closing

Father, I ask You now in the Name of Jesus to release Your healing power into me and my family. Restore everything the thief has stolen, killed, or destroyed.

Cleanse us with the Precious Blood of Jesus. Cleanse my spirit, my soul, my mind, my heart, my memory, my imagination, my emotions, my body, my family line, my home, and every part of my life that has been affected by these sins, curses, spirits, and bondages.

Holy Spirit, fill every empty place. Fill every cleansed place. Fill every wounded place. Fill every place that has been touched by evil with faith, hope, charity, purity, humility, peace, obedience, courage, and holy wisdom.

Restore the grace of baptism in me. Strengthen me in Confession, the Eucharist, prayer, forgiveness, repentance, and daily conversion.

Lord Jesus Christ, reign in my heart. Reign in my home. Reign in my family. Reign in my memories. Reign in my body. Reign in my future.

Father, thank You for Your mercy, Your forgiveness, Your protection, and Your love.

I pray all of this in the Holy Name of Jesus, through the power of God the Father, and of the Son, and of the Holy Spirit.

Amen.

---

# Part 4 — Daily Prayer

**Title in app**: Daily Prayer
**Cadence**: Daily, indefinitely. Open-ended. No end date.
**Streak counter**: Tracks consecutive days as a soft motivator ("12 days with the Lord"), never a deadline. Streaks reset on missed days but the prayer remains accessible every day regardless of streak state.

> **Naming note**: This was previously called "Prayer #3 — Daily Renewal." It is renamed simply "Daily Prayer" in the app to remove any framing of "30-day cleanup" and present it as the user's ongoing Catholic daily prayer practice. All Toolkit cards, navigation labels, and copy should refer to it as "Daily Prayer."

## Page 1 — Opening

Heavenly Father, I come before You in the Most Holy Name of Jesus Christ, Your Son. I come to You through the new covenant in His Precious Blood, asking for mercy, protection, healing, and the grace to remain faithful to You.

Lord Jesus Christ, I ask You to help me deny myself, take up my cross, and follow You. Help me to die to sin, resist temptation, be led by the Holy Spirit, and no longer conform myself to the patterns of this world. Teach me to seek Your will in every decision, to remain close to You in prayer, and to take every thought captive in obedience to Christ.

Father, please provide for me and my family in every way we need. Provide for our souls, our bodies, our relationships, our work, our health, our finances, our home, and our daily responsibilities. Protect us from evil. Bless us with the grace to pursue You, listen to You, obey You, and glorify You in all that we do.

Blessed Virgin Mary, cover us with your mantle. Saint Michael the Archangel, defend us in battle. Holy angels of God, surround us, guard us, and keep far from us every evil spirit.

## Page 2 — Daily repentance and forgiveness

Father, I repent of every sin I have committed since the last time I prayed this prayer. I repent especially of {{IN_PRAYER_TEXTAREA: "Anything you want to name today?"}}.

I place these sins under the Precious Blood of Jesus, and I ask You to forgive me, cleanse me, and lead me to Confession wherever Confession is needed.

I also forgive every person who has hurt me, offended me, disappointed me, rejected me, accused me, misunderstood me, betrayed me, or sinned against me since the last time I prayed this prayer. I forgive especially {{IN_PRAYER_TEXTAREA: "Anyone you need to forgive today?"}}.

I release every sinful judgment I have made against them. I release anger, resentment, revenge, accusation, and bitterness. I place each person into Your hands, Lord Jesus, and I ask You to heal what has been wounded in me.

In the Holy Name of Jesus, I renounce every unholy soul tie, bond, attachment, agreement, and spiritual claim formed through sin, anger, unforgiveness, fear, lust, control, manipulation, dependency, or any other unhealthy connection. I renounce especially {{IN_PRAYER_TEXTAREA: "Any unhealthy attachment forming?"}}.

By the Precious Blood of Jesus, I ask You, Lord, to break these unholy bonds and restore every relationship to Your holy order.

> **Note**: This page uses three in-prayer textareas because by design "what I've done since yesterday" cannot be pre-captured in the Workbook. Inputs are ephemeral — not saved.

## Page 3 — Prayer for spouse, children, and family members

Father, I bring before You my family members, especially {{INJECT: User Profile, format=names_comma using `family_members`}}.

For my spouse, {{INJECT: User Profile, format=text using `spouse_name`}}, I ask for mercy, protection, repentance, healing, and freedom. I place {{INJECT: User Profile, format=text using `spouse_name`}} under the Precious Blood of Jesus. I ask You to forgive every sin, heal every wound, break every unholy attachment, and remove every evil influence that does not belong in his or her life.

For my children, {{INJECT: User Profile, format=names_comma using `children_names`}}, I ask for mercy, protection, repentance, healing, and freedom. I place each of them under the Precious Blood of Jesus. I ask You to forgive their sins, heal their wounds, protect their innocence, strengthen their faith, and deliver them from every evil spirit, curse, lie, temptation, fear, attachment, or influence that does not come from You.

For every member of my family, I ask You, Father, to break every unholy soul tie, bond, attachment, agreement, and spiritual claim that has formed through sin, fear, trauma, lust, manipulation, control, dependency, abuse, occult involvement, or any other evil.

In the Holy Name of Jesus, and through the power of His Precious Blood, I command every evil spirit afflicting, tempting, tormenting, deceiving, accusing, oppressing, or influencing me or my family to leave us now and go where Jesus Christ commands.

> **Note**: This page pulls from the **User Profile** (Part 6), not the Workbook. Empty profile fields cause the corresponding clauses to render gracefully — entire spouse paragraph omits if `spouse_name` is empty; same for children.

## Page 4 — Curses, word curses, and harmful words

Father, in the Name of Jesus Christ and through the power of His Precious Blood, I ask You to break every curse and every harmful word working against me or my family.

I repent of every sinful word I have spoken over myself or others. I repent especially of {{INJECT: Section 6 entries where spoken_by is empty, format=items_comma using `lie`}}.

I ask You to void every evil word, curse, judgment, insult, label, accusation, threat, written word, texted word, spoken word, or word of authority that has worked against me or my family. I ask that every evil effect of these words be removed through the Precious Blood of Jesus.

I renounce especially {{INJECT: Section 6 entries where spoken_by is non-empty, format=items_comma using `lie`}}.

In the Name of Jesus Christ, I break every curse placed upon me or my family. I break every curse, seal, spell, hex, vex, malefice, evil prayer, written curse, spoken curse, texted curse, demonic bondage, and every other unholy bondage sent against me, my family, my home, or any object we possess.

I command every spirit associated with these curses and harmful words to be bound in the Name of Jesus Christ, to leave us now, and to go where Jesus Christ commands.

## Page 5 — Cleansing of the home

In the Name of Jesus Christ and through the power of His Precious Blood, I ask You, Father, to cleanse my home and everything connected to it.

I ask You to bind and sever every cord, attachment, communication, influence, and access point of every unholy spirit operating in or around my home. I ask You to make every evil spirit inactive and every evil work ineffective against me and my family.

In the Name of Jesus Christ, I command every evil spirit in or around my home to leave now. I command every spirit connected to fear, conflict, impurity, occult objects, curses, anger, oppression, confusion, sickness, division, or any other evil to leave this home and go where Jesus Christ commands.

Lord Jesus, let Your Precious Blood wash over this home. Make it a place of peace, prayer, protection, purity, and holy order. Let every room, doorway, window, bed, object, and space be placed under Your lordship and protection.

Blessed Virgin Mary, cover this home with your mantle. Saint Michael the Archangel, defend this home. Holy angels of God, surround it and keep far from it every evil spirit.

## Page 6 — Remaining strongholds and spiritual patterns

Father, in the Name of Jesus Christ, I renounce every remaining demonic stronghold, sinful pattern, attachment, or evil influence still at work in my life or in the lives of my family members.

I renounce especially {{IN_PRAYER_TEXTAREA: "Any stronghold pressing on you today?"}}.

I also renounce every dominant spiritual pattern still affecting us, especially {{INJECT: Section 14, format=patterns_comma using checked names}}.

In the Name of Jesus Christ, I bind and renounce every named and unnamed spirit connected to these strongholds, including {{INJECT: Section 14, format=spirits_with_every_prefix}}.

I renounce every spirit of Death, Infirmity, Divination, Rebellion, Lying, Rage, Manipulation, Domination, Control, Fear, Rejection, Lust, Shame, Addiction, Violence, Hatred, Confusion, Despair, Unbelief, Pride, Self-Hatred, Condemnation, Heaviness, and every other spirit opposed to Jesus Christ.

In the Name of Jesus Christ, I break every claim, legal right, agreement, attachment, foothold, assignment, and influence these spirits have claimed through sin, wounds, curses, trauma, occult involvement, false vows, generational bondage, objects, or any other evil.

I command every spirit connected to these strongholds to leave me and my family now. Go where Jesus Christ commands you to go. Do not return. Do not retaliate. Do not transfer. Do not hide. Do not call upon any other spirit to replace you.

## Page 7 — Renewal of the mind through Scripture

Lord Jesus, help me renew my mind according to Your Word. Help me reject every lie and receive the truth of who You say I am.

I renounce every word curse, false identity, accusation, and lie that has shaped the way I see myself. I now receive the truth of Your Word.

{{INJECT: Section 6 entries where truth_statement is non-empty, format=lies_with_truths — each rendered as:

> I reject the lie that **[lie]**. The Lord reminds me: **[truth_statement]**. As Scripture says, [scripture_reference]: "[scripture_text]"

— iterate one per line. If no entries have claimed truths, render the empty-state block below.}}

**Empty-state block (when no Section 6 entries have truth_statements yet)**:

> Lord Jesus, today I have not yet named the truths You are speaking to me. I receive Your Word over me now: I am Your beloved. I am marked by baptism. I am covered by the Precious Blood. Speak to me, Lord, and I will listen.

Lord Jesus, let these truths go deeper than fear, shame, rejection, trauma, and accusation. Let Your Word become the truth I live from, not merely words I repeat.

I receive these truths as my identity in Christ, not as something I must earn, prove, or achieve.

> **Note**: This is the section that makes Section 6 worth filling out. The deeper the user goes in Section 6, the richer this page becomes day over day. New Section 6 entries appear here the next time the user prays. This is the core feedback loop of the app.

## Page 8 — Chronic issues, addictions, pain, and long-term afflictions

Lord Jesus, I bring before You every long-term chronic issue, addiction, pain, sickness, malady, affliction, or pattern that has become attached to my sense of identity.

I bring before You especially {{INJECT: User Profile, format=items_comma using `chronic_issues`}}.

I repent of every way I have accepted these things as who I am. I repent of identifying myself by sickness, pain, addiction, weakness, fear, trauma, or affliction instead of by the truth that I belong to You.

In the Name of Jesus Christ, I renounce the false identity of {{INJECT: User Profile, format=items_comma using `chronic_identity_labels`}}.

I separate who I am from what I have suffered, experienced, inherited, chosen, or endured.

In the Name of Jesus Christ, I command every spirit connected to {{INJECT: User Profile, format=items_comma using `chronic_issues`}} to leave me now and go where Jesus Christ commands.

Lord Jesus, release healing into my body, mind, soul, memory, imagination, emotions, and nervous system. Restore what has been damaged. Heal what has been wounded. Strengthen what has grown weak. Bring freedom where there has been bondage.

## Page 9 — Healing from abuse and trauma

Lord Jesus, I ask You to bring healing to every abuse, trauma, wound, violation, fear, humiliation, rejection, neglect, abandonment, and painful memory that I or my family members have experienced.

I bring before You especially {{INJECT: Section 10, format=items_comma using `event`}}.

I renounce every spirit tied to these abuses and traumas. I renounce every spirit of fear, shame, rejection, self-hatred, despair, confusion, torment, rage, grief, isolation, dissociation, mistrust, and bondage connected to these wounds.

In the Name of Jesus Christ, I command every spirit tied to these abuses and traumas to leave me and my family now. Go where Jesus Christ commands you to go.

Lord Jesus, remove the power of these memories over us. Heal them in our minds, bodies, hearts, souls, emotions, and imaginations. Restore peace where there has been torment. Restore safety where there has been fear. Restore dignity where there has been shame. Restore trust where there has been betrayal.

Where we need human help, give us the courage to receive it. Where we need protection, give us wisdom. Where we need time, give us patience and hope.

## Page 10 — Healing, restoration, and recovery of what was stolen

Father, in the Name of Jesus Christ, I ask You to release Your healing power into my body and into the bodies of my family members.

Please heal especially {{INJECT: Section 22 where for_healing=true, format=items_comma using `infirmity`}}.

Restore everything the thief has stolen, killed, or destroyed. Restore faith, hope, love, purity, peace, health, clarity, strength, joy, courage, trust, and holy desire. Restore what sin damaged. Restore what trauma wounded. Restore what curses attacked. Restore what evil spirits tried to steal.

Lord Jesus, enforce the freedom You have promised from sin and remove every evil spirit that does not belong in my life or in the lives of my family members.

Let every place that has been emptied be filled with the Holy Spirit.

## Page 11 — Memory, mind, imagination, and thoughts

Lord Jesus, I ask You to strengthen my memory, cognitive ability, thinking, imagination, attention, discernment, and ability to receive truth.

Heal every place in my mind that has been wounded, darkened, confused, tormented, scattered, or weakened by sin, trauma, fear, occult involvement, sickness, addiction, or evil spirits.

Help me to remember what I should remember, and not remember what I should forget. Help me to reject intrusive thoughts, accusations, lies, fantasies, fears, and every thought that does not come from You.

Lord Jesus, bring my mind under Your peace. Let the Word of Christ dwell richly in me. Teach me to think according to truth.

## Page 12 — Daily protection over family, property, and work

Father, in the Name of Jesus Christ, I ask protection over me and my family, especially {{INJECT: User Profile, format=names_comma using `family_members`}}.

I ask protection over our bodies, minds, souls, memories, imaginations, relationships, home, property, work, school, ministry, finances, health, prayer, sleep, travel, and all that belongs to us.

I ask that every attack of the enemy against us, our belongings, our pursuits, and our occupations be made ineffective by the Precious Blood of Jesus.

I declare that my home, my family, my work, my vocation, my ministry, my finances, my health, my prayer, my sleep, and everything entrusted to me belong to Jesus Christ and are placed under His lordship and protection.

## Page 13 — Fruit of the Holy Spirit

Holy Spirit, I ask You to bring forth Your fruit in me and in each member of my family.

Bring forth love where there has been hatred.
Bring forth joy where there has been heaviness.
Bring forth peace where there has been fear.
Bring forth patience where there has been anger.
Bring forth kindness where there has been harshness.
Bring forth goodness where there has been sin.
Bring forth faithfulness where there has been rebellion.
Bring forth gentleness where there has been control.
Bring forth self-control where there has been bondage.

Give us mercy in all that we do. Help us to lean on You each day. Help us to live in obedience, humility, prayer, forgiveness, repentance, and love.

## Page 14 — Closing

Father, I thank You for Your mercy, Your forgiveness, Your protection, and Your love. I thank You for the Precious Blood of Jesus. I thank You for the power of the Cross. I thank You for the gift of the Holy Spirit.

Lord Jesus Christ, reign in my heart. Reign in my home. Reign in my family. Reign in my thoughts. Reign in my memories. Reign in my body. Reign in my future.

Keep me faithful to You. Keep my family under Your protection. Deliver us from evil. Lead us in the freedom of the children of God.

I pray all of this in the Holy Name of Jesus, through the power of God the Father, and of the Son, and of the Holy Spirit.

Amen.

---

# Part 5 — Session prayers (for SessionWrapper)

Optional bookend prayers for SessionWrapper sessions inside the Workbook.

## Opening prayer (before working on lists)

> Holy Spirit, come and guide me as I begin this work. Bring to my mind what I need to see today — no more, no less. Quiet every voice that is not Yours. Cover me with the Precious Blood of Jesus. Saint Michael the Archangel, defend me. Blessed Mother, pray for me. Amen.

## Closing prayer (after completing a section)

> Lord Jesus, I have brought what I can see to You. If there is anything I have missed, bring it to my mind gently, in Your time. Cover what I have named with Your Precious Blood. Thank You for Your mercy. Amen.

---

# Part 6 — User Profile (new state, separate from Workbook)

The User Profile is a small, persistent data structure separate from the Workbook. It holds *who the user is and who they love*, not *what they're bringing to God for cleansing*. The Workbook is repentance and renunciation; the Profile is identity and family.

The Profile is set up during onboarding (or on first opening the Daily Prayer) and edited from a Settings screen. Empty values render gracefully.

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `family_members` | list of names | Used by Daily Prayer pages 3 and 12. |
| `spouse_name` | text | Used by Daily Prayer page 3. If empty, entire spouse paragraph omits. |
| `children_names` | list of names | Used by Daily Prayer page 3. If empty, entire children paragraph omits. |
| `chronic_issues` | list of text entries | Used by Daily Prayer page 8. Long-term issues forming part of the user's identity that they want to detach from. |
| `chronic_identity_labels` | list of text entries | Used by Daily Prayer page 8. The false identity labels the user wants to renounce (e.g., "anxious person," "broken one," "addict"). |

Profile fields are editable from a dedicated Settings screen. The Daily Prayer Toolkit entry should detect an empty profile on first open and prompt the user to set it up — but allow them to skip and pray without it.

---

# Part 7 — Catholic Truth Library (content asset, not code)

This is the content library that powers Section 6's deeper path. Without it, Section 6's spirit-and-Scripture stages cannot function — Section 6 can still accept the fast-path entries (lie + spoken_by), but the deeper truth-claiming flow needs this content.

**Structure:**

```typescript
type TruthLibraryEntry = {
  spirit: LyingSpirit; // one of the 12 enum values
  scripture_reference: string; // e.g., "Philippians 4:6-7"
  scripture_text: string; // verse text in user's preferred translation
  first_person_truth: string; // pre-authored first-person counter-truth
};

type CatholicTruthLibrary = TruthLibraryEntry[];
```

**Authoring scope:** 8–12 entries per lying spirit × 12 spirits = ~100–144 entries total.

**Example entries:**

| Spirit | Scripture | Verse text | First-person truth |
|---|---|---|---|
| Anxiety | Philippians 4:6-7 | "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus." | The Lord is my peace that surpasses understanding. I bring my anxieties to Him in prayer, and He guards my heart and my mind in Christ Jesus. |
| Anxiety | 1 Peter 5:7 | "Cast all your anxieties on him, because he cares for you." | I cast my anxieties on the Lord, because He cares for me. |
| Rejection | Isaiah 43:1 | "Fear not, for I have redeemed you; I have called you by name, you are mine." | The Lord has redeemed me. He has called me by name. I am His. |
| Shame | Romans 8:1 | "There is therefore now no condemnation for those who are in Christ Jesus." | There is no condemnation for me, because I am in Christ Jesus. |
| Fear | 2 Timothy 1:7 | "For God gave us a spirit not of fear but of power and love and self-control." | The Lord has not given me a spirit of fear, but of power, love, and self-control. |
| Condemnation | Romans 5:8 | "But God shows his love for us in that while we were still sinners, Christ died for us." | While I was still a sinner, Christ died for me. The Father's love for me is proven on the Cross. |

**Authoring rules:**

- The agent must not author any of this content.
- Scripture text should match a single Catholic-approved translation (RSV-CE, NABRE, or Douay-Rheims). Pick one and use it consistently.
- The first-person truth should be *short*, *declarative*, and *directly counter the lie of the chosen spirit*. The user reads it aloud as a claim, not a description.
- Each truth is biblically grounded but reworded for first-person devotional use.

**Empty library behavior:**

If the library is empty or partial when Section 6's deeper path is opened, the Scripture-picker shows whatever is available for the chosen spirit, plus "Browse all" and "Free entry" options. If a spirit has no entries yet, the picker says "Library entries for this spirit are being prepared. You can pick a Scripture freely or save your lie for now."

**Where this gets authored:**

Writing project, not coding task. Same author who wrote the three prayers. Recommend creating a separate doc or spreadsheet, exporting to JSON, importing as static content. The agent should treat the library file as a content dependency.

---

# Part 8 — Summary checklist

| Item | Status | Action needed |
|---|---|---|
| Personal Deliverance Prayer (17 pages) | Complete | None |
| Generational Renunciation Prayer (17 pages) | Complete | None |
| Daily Prayer (14 pages) | Complete | None |
| Section 6 redesign (Lies & Truths, two-stage flow) | Complete spec | Build per spec |
| Breaking Lies as separate tool | **Removed** | Delete from Toolkit; redirect any remaining references to Section 6 |
| User Profile (new state) | Specified | Build per spec; add onboarding flow |
| Catholic Truth Library | **Content authoring required** | Author 8–12 entries × 12 spirits before Section 6 deeper path can ship |
| Carmichael lineage in code/docs | **Action item** | Audit existing tickets, code comments, prompts; remove |
| IP attorney review | Recommended before launch | An hour of review is cheap insurance |

---

# Notes for the agent

- All prayer text in Parts 2, 3, and 4 is **original Catholic prayer content**. Render verbatim — no edits, paraphrasing, or "smoothing."
- Slot markers `{{INJECT: ...}}` interpolate from the Workbook or User Profile. `{{IN_PRAYER_TEXTAREA: ...}}` is a new node type for ephemeral in-prayer input.
- Where a slot's source data is empty, omit the surrounding sentence gracefully.
- Apply the distinct visual treatment to user-injected spans.
- The Catholic Truth Library is a content dependency. Do not author its entries.
- Breaking Lies as a standalone tool is removed. Delete any code/navigation/references; redirect surfaces to Section 6 of the Workbook.
