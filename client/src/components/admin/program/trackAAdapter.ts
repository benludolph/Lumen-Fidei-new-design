/**
 * Track A Adapter — maps existing Track A API data into the shared
 * Program → Module → Lesson → Block read model.
 *
 * Design constraints:
 *  - Read-only: never mutates source objects or calls any API.
 *  - Deterministic stable keys derived from durable identifiers
 *    (weekNumber / dayNumber / slide position).
 *  - Each Block preserves the original { type, content } source reference
 *    so existing save paths in Admin.tsx continue to work unchanged.
 *  - No React, no side-effects, pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Source types (mirrors Admin.tsx local types — no shared/ import needed)
// ---------------------------------------------------------------------------

export interface SourceSlide {
  type: string;
  content: string;
}

export interface SourceDayContent {
  id: number;
  dayNumber: number;
  weekNumber: number;
  centralTheme: string;
  subtitle: string | null;
  slides: SourceSlide[] | null;
  imageUrl: string | null;
  completionMessage?: string | null;
  openingPrayerText?: string | null;
  openingPrayerAudio?: string | null;
  closingPrayerText?: string | null;
  closingPrayerAudio?: string | null;
}

export interface SourceModule {
  id: number;
  weekNumber: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface SourcePrelimModule {
  id: number;
  position: number;
  title: string;
  subtitle: string | null;
  slides: SourceSlide[] | null;
  imageUrl: string | null;
}

// ---------------------------------------------------------------------------
// Read-model types (Program → Module → Lesson → Block hierarchy)
// ---------------------------------------------------------------------------

/**
 * A Block is the atomic unit of a lesson.  It wraps the raw slide without
 * copying it, so mutations via the existing Admin.tsx patterns still work.
 */
export interface Block {
  /** Stable key: "ta-d{dayNumber}-s{slideIndex}" or "pm-p{position}-s{slideIndex}" */
  id: string;
  /** Zero-based position within the lesson */
  index: number;
  /** The underlying raw slide (same object reference — do not mutate) */
  source: Readonly<SourceSlide>;
}

/**
 * A Lesson corresponds to a Track A day or a Prelim module position.
 */
export interface Lesson {
  /**
   * Stable key:
   *  - Track A day: "ta-d{dayNumber}"
   *  - Prelim: "pm-p{position}"
   */
  id: string;
  title: string;
  subtitle: string | null;
  /** Day number (Track A) or position (Prelim, stored as negative for uniqueness) */
  dayNumber: number;
  /** The source object; preserves all fields needed for existing save calls */
  source: Readonly<SourceDayContent> | Readonly<SourcePrelimModule>;
  blocks: Block[];
  /** "track_a" | "prelim" */
  kind: "track_a" | "prelim";
}

/**
 * A Module groups multiple Lessons.
 */
export interface ProgramModule {
  /**
   * Stable key:
   *  - Track A week: "ta-w{weekNumber}"
   *  - Prelim group: "ta-prelim"
   */
  id: string;
  title: string;
  subtitle: string | null;
  weekNumber: number | null;
  imageUrl: string | null;
  source: Readonly<SourceModule> | null;
  lessons: Lesson[];
}

/**
 * The top-level Program read model.
 */
export interface Program {
  id: "track_a";
  label: "Track A";
  modules: ProgramModule[];
  /** Prelim (pre-cohort) group, or null if none loaded */
  prelimGroup: ProgramModule | null;
}

// ---------------------------------------------------------------------------
// Stable key helpers
// ---------------------------------------------------------------------------

/** Stable block ID from day number and slide position */
function blockId(kind: "ta" | "pm", ref: number, slideIndex: number): string {
  return kind === "ta"
    ? `ta-d${ref}-s${slideIndex}`
    : `pm-p${ref}-s${slideIndex}`;
}

/** Stable lesson ID */
function lessonId(kind: "ta" | "pm", ref: number): string {
  return kind === "ta" ? `ta-d${ref}` : `pm-p${ref}`;
}

/** Stable module ID */
function moduleId(weekNumber: number): string {
  return `ta-w${weekNumber}`;
}

const PRELIM_MODULE_ID = "ta-prelim";

// ---------------------------------------------------------------------------
// Adapter functions
// ---------------------------------------------------------------------------

/** Convert a raw slide array into an ordered list of Blocks. */
function adaptBlocks(
  slides: SourceSlide[] | null | undefined,
  kind: "ta" | "pm",
  ref: number,
): Block[] {
  if (!slides) return [];
  return slides.map((slide, index) => ({
    id: blockId(kind, ref, index),
    index,
    source: slide,
  }));
}

/** Convert a Track A day content record into a Lesson. */
function adaptDayLesson(day: SourceDayContent): Lesson {
  return {
    id: lessonId("ta", day.dayNumber),
    title: day.centralTheme || `Day ${day.dayNumber}`,
    subtitle: day.subtitle ?? null,
    dayNumber: day.dayNumber,
    source: day,
    blocks: adaptBlocks(day.slides, "ta", day.dayNumber),
    kind: "track_a",
  };
}

/** Convert a Prelim module record into a Lesson. */
function adaptPrelimLesson(prelim: SourcePrelimModule): Lesson {
  return {
    id: lessonId("pm", prelim.position),
    title: prelim.title || `Pre-Module ${prelim.position}`,
    subtitle: prelim.subtitle ?? null,
    // Use negative day numbers for prelim to avoid collision with Track A days
    dayNumber: -prelim.position,
    source: prelim,
    blocks: adaptBlocks(prelim.slides, "pm", prelim.position),
    kind: "prelim",
  };
}

/**
 * Build the full Program read model from raw API data.
 *
 * @param modules   - Result of /api/track-a-modules
 * @param allContent - Result of /api/track-a-content
 * @param prelims   - Result of /api/prelim-modules (optional)
 */
export function buildTrackAProgram(
  modules: SourceModule[],
  allContent: SourceDayContent[],
  prelims?: SourcePrelimModule[],
): Program {
  // Index days by week for efficient lookup
  const daysByWeek = new Map<number, SourceDayContent[]>();
  for (const day of allContent) {
    const list = daysByWeek.get(day.weekNumber) ?? [];
    list.push(day);
    daysByWeek.set(day.weekNumber, list);
  }

  // Sort days within each week by dayNumber
  Array.from(daysByWeek.values()).forEach((list) => {
    list.sort((a: SourceDayContent, b: SourceDayContent) => a.dayNumber - b.dayNumber);
  });

  // Sort modules by sortOrder then weekNumber
  const sortedModules = [...modules].sort((a, b) =>
    a.sortOrder !== b.sortOrder
      ? a.sortOrder - b.sortOrder
      : a.weekNumber - b.weekNumber,
  );

  const programModules: ProgramModule[] = sortedModules.map((mod) => {
    const days = daysByWeek.get(mod.weekNumber) ?? [];
    return {
      id: moduleId(mod.weekNumber),
      title: mod.title,
      subtitle: mod.subtitle || null,
      weekNumber: mod.weekNumber,
      imageUrl: mod.imageUrl,
      source: mod,
      lessons: days.map(adaptDayLesson),
    };
  });

  // Intro (day 0) goes at front of program as a synthetic module if present
  const day0 = allContent.find((c) => c.dayNumber === 0);
  if (day0) {
    programModules.unshift({
      id: "ta-intro",
      title: "Introduction",
      subtitle: null,
      weekNumber: 0,
      imageUrl: day0.imageUrl ?? null,
      source: null,
      lessons: [adaptDayLesson(day0)],
    });
  }

  // Prelim group
  let prelimGroup: ProgramModule | null = null;
  if (prelims && prelims.length > 0) {
    const sorted = [...prelims].sort((a, b) => a.position - b.position);
    prelimGroup = {
      id: PRELIM_MODULE_ID,
      title: "Pre-Modules",
      subtitle: "Pre-cohort onboarding",
      weekNumber: null,
      imageUrl: null,
      source: null,
      lessons: sorted.map(adaptPrelimLesson),
    };
  }

  return {
    id: "track_a",
    label: "Track A",
    modules: programModules,
    prelimGroup,
  };
}

// ---------------------------------------------------------------------------
// Convenience lookup helpers
// ---------------------------------------------------------------------------

/** Find a Lesson by its stable ID within a built Program. */
export function findLessonById(
  program: Program,
  lessonId: string,
): Lesson | undefined {
  for (const mod of program.modules) {
    const found = mod.lessons.find((l) => l.id === lessonId);
    if (found) return found;
  }
  if (program.prelimGroup) {
    const found = program.prelimGroup.lessons.find((l) => l.id === lessonId);
    if (found) return found;
  }
  return undefined;
}

/** Find a Block by its stable ID within a built Program. */
export function findBlockById(
  program: Program,
  blockId: string,
): Block | undefined {
  for (const mod of program.modules) {
    for (const lesson of mod.lessons) {
      const found = lesson.blocks.find((b) => b.id === blockId);
      if (found) return found;
    }
  }
  if (program.prelimGroup) {
    for (const lesson of program.prelimGroup.lessons) {
      const found = lesson.blocks.find((b) => b.id === blockId);
      if (found) return found;
    }
  }
  return undefined;
}

/** Return the stable lesson ID for a Track A day number. */
export function trackADayLessonId(dayNumber: number): string {
  return lessonId("ta", dayNumber);
}

/** Return the stable lesson ID for a Prelim position. */
export function prelimLessonId(position: number): string {
  return lessonId("pm", position);
}
