/** Initial per-answer prayer wording. Tokens are protected; editors change surrounding copy only. */
export const PRAYER_FORMAT_COPY = {
  everySpirit: "every spirit of {{value}}",
  infirmity: "{{value}}, go in the Name of Jesus Christ.",
  lie: "I reject the lie that {{lie}}. The Lord reminds me: {{truth}}",
  scripture: '. As Scripture says, {{reference}}: "{{scripture}}"',
  renounce: "In the name of Jesus Christ, and by the power of His Blood, I renounce {{value}} in our family line.",
  lodge: "I renounce {{value}} and every oath, degree, penalty, and curse connected to it.",
  simple: "I renounce {{value}}.",
  spirit: "I renounce {{value}}. I will not serve you. Jesus Christ is my only Lord.",
  forgive: "I forgive {{name}}.",
  forgiveWithHarm: "I forgive {{name}} for {{value}}.",
  letEnd: "Let {{value}} end with me.",
  familyMember: "this member of our family",
  childName: "known to You by name",
  child: "I entrust this child, {{name}}, to Your mercy. I acknowledge this child as part of our family, and I mourn this child now. Receive this child into Your arms.",
  familyDead: "I remember {{name}} before You. I mourn this loss, and I entrust {{name}} to Your mercy.",
  fathersSide: "father's side",
  mothersSide: "mother's side",
  bothSides: "both sides",
  adoptiveFamily: "adoptive family",
};
export type PrayerFormatCopy = Record<keyof typeof PRAYER_FORMAT_COPY, string>;
export function formatPrayerCopy(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([^{}]+)\}\}/g, (_token, key: string) => {
    if (!(key in values)) throw new Error(`Missing protected prayer token: ${key}`);
    return values[key];
  });
}
