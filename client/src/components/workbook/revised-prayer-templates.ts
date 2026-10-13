import defaults from "@shared/workbook-content-defaults.json";
import type { PrayerTemplate } from "./prayer-templates";

// Compatibility for pure callers. Active React rendering uses shared builders.
export const PRAYER_TEMPLATES = defaults.prayers as Record<PrayerTemplate["id"], PrayerTemplate>;
