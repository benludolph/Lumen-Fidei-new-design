import defaults from "@shared/workbook-content-defaults.json";
import type { SectionDefinition, SectionCategory } from "../components/workbook/section-definitions";

// Immutable initial-copy compatibility; authored defaults exist only in JSON.
export const REVISED_CATEGORIES = defaults.categories as SectionCategory[];
export const REVISED_SECTIONS: Record<number, Partial<SectionDefinition>> = Object.fromEntries(
  (defaults.sections as SectionDefinition[]).map(section => [section.id, section]),
);
export const NON_CATHOLIC_GUIDANCE: Record<number, string> = defaults.guidance;
export const BRING_TO_THE_LORD = defaults.general.bringToTheLord;
export const WORKBOOK_INTRO = [defaults.general["intro.0"], defaults.general["intro.1"], defaults.general["intro.2"]];
export const NON_CATHOLIC_INTRO_SECOND = defaults.general.nonCatholicIntroSecond;
export const OPENING_PRAYER = defaults.general.openingPrayer;
export const CLOSING_PRAYER = defaults.general.closingPrayer;
export const NON_CATHOLIC_CLOSING_PRAYER = defaults.general.nonCatholicClosingPrayer;
