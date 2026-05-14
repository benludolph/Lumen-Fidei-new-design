export const SPIRITS = [
  { id: 'destruction', name: 'Destruction', desc: 'You are broken, limited, your mind is not enough.', antonym: 'has made me wonderfully and knows me intimately', scriptures: [
    { ref: 'Psalm 139:13-14', text: 'For you formed my inward parts; you knitted me together in my mother\u2019s womb. I praise you, for I am fearfully and wonderfully made.' },
    { ref: 'Genesis 1:27', text: 'So God created man in his own image, in the image of God he created him.' },
  ]},
  { id: 'hopelessness', name: 'Hopelessness', desc: 'Nothing will change. It will not get better.', antonym: 'is my hope and does not abandon me', scriptures: [
    { ref: 'Romans 12:12', text: 'Rejoice in hope, be patient in tribulation, be constant in prayer.' },
    { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, plans for welfare and not for evil, to give you a future and a hope.' },
  ]},
  { id: 'weakness', name: 'Weakness', desc: 'You must hide what you cannot do alone.', antonym: 'is my strength in my weakness', scriptures: [
    { ref: '2 Corinthians 12:9', text: 'My grace is sufficient for you, for my power is made perfect in weakness.' },
    { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.' },
  ]},
  { id: 'condemnation', name: 'Condemnation', desc: 'You are worthless. You deserve to be hated.', antonym: 'absolves me of my sins through Christ', scriptures: [
    { ref: 'Romans 8:1', text: 'There is therefore now no condemnation for those who are in Christ Jesus.' },
    { ref: 'Psalm 103:12', text: 'As far as the east is from the west, so far does he remove our transgressions from us.' },
  ]},
  { id: 'fear', name: 'Fear', desc: 'You are not safe. Danger is everywhere.', antonym: 'is my courage and my refuge', scriptures: [
    { ref: '2 Timothy 1:7', text: 'God gave us a spirit not of fear but of power and love and self-control.' },
    { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear?' },
  ]},
  { id: 'rejection', name: 'Rejection', desc: 'You do not belong. No one wants you.', antonym: 'has chosen and adopted me as His own', scriptures: [
    { ref: 'Ephesians 1:5', text: 'He predestined us for adoption as sons through Jesus Christ.' },
    { ref: 'John 15:16', text: 'You did not choose me, but I chose you.' },
  ]},
  { id: 'shame', name: 'Shame', desc: 'You are what you have done. You are dirty.', antonym: 'covers me with His righteousness', scriptures: [
    { ref: 'Isaiah 61:7', text: 'Instead of your shame there shall be a double portion.' },
    { ref: 'Psalm 34:5', text: 'Those who look to him are radiant, and their faces shall never be ashamed.' },
  ]},
  { id: 'unworthiness', name: 'Unworthiness', desc: 'You do not deserve good things, or love.', antonym: 'calls me beloved and pursues me', scriptures: [
    { ref: '1 John 3:1', text: 'See what kind of love the Father has given to us, that we should be called children of God.' },
    { ref: 'Jeremiah 31:3', text: 'I have loved you with an everlasting love.' },
  ]},
  { id: 'isolation', name: 'Isolation', desc: 'You are alone. No one understands.', antonym: 'is with me always and never leaves me', scriptures: [
    { ref: 'Hebrews 13:5', text: 'I will never leave you nor forsake you.' },
    { ref: 'Matthew 28:20', text: 'Behold, I am with you always, to the end of the age.' },
  ]},
  { id: 'anxiety', name: 'Anxiety', desc: 'You must control everything. You cannot rest.', antonym: 'is my peace that surpasses understanding', scriptures: [
    { ref: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.' },
    { ref: '1 Peter 5:7', text: 'Cast all your anxieties on him, because he cares for you.' },
  ]},
  { id: 'self-hatred', name: 'Self-hatred', desc: 'You are your own enemy. You deserve punishment.', antonym: 'loves me as His own child', scriptures: [
    { ref: 'Romans 8:15', text: 'You have received the Spirit of adoption as sons, by whom we cry, \u201cAbba! Father!\u201d' },
    { ref: 'Galatians 2:20', text: 'It is no longer I who live, but Christ who lives in me.' },
  ]},
  { id: 'confusion', name: 'Confusion', desc: 'Nothing makes sense. You cannot trust your mind.', antonym: 'gives me wisdom and clarity', scriptures: [
    { ref: '1 Corinthians 14:33', text: 'For God is not a God of confusion but of peace.' },
    { ref: 'James 1:5', text: 'If any of you lacks wisdom, let him ask God, who gives generously to all.' },
  ]},
];

export interface SavedState {
  thought: string;
  spiritId: string;
  antonym: string;
  scriptureRef: string;
  scriptureText: string;
  truth: string;
  prayer: string;
}
