/**
 * Block Registry — single source of truth for every Track A / Prelim slide type.
 *
 * Scope:
 *  - Canonical type list (SlideBlockType)
 *  - Human-readable label + optional category / description
 *  - Safe default content factory
 *  - Pure validation helpers (no React, no side-effects)
 *  - "isSpecializedActivity" flag used by UI to show the structured editor
 *    instead of the generic rich-text textarea
 *
 * Nothing in this file touches participant data, APIs, or component state.
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * Every slide type exposed by the Track A / Prelim add-slide selectors.
 * Mirrors LessonSlide.tsx `SlideType` exactly; kept here as a plain string
 * union so no component import is required.
 */
export type SlideBlockType =
  | "text"
  | "media"
  | "multi_select"
  | "single_select"
  | "text_input"
  | "mentor_message"
  | "timer"
  | "knowledge_check"
  | "knowledge_quiz"
  | "quiz"
  | "survey"
  | "scenario"
  | "chat_flow"
  | "path_selector"
  | "cross_grid"
  | "story_choice"
  | "image_carousel"
  | "before_after"
  | "scripture_practice"
  | "scene"
  | "captivity_builder"
  | "confession_finder"
  | "pdf_download"
  | "guided_prayer_process"
  | "workbook_link"
  | "workbook_session"
  | "prayer_link"
  | "selection_reveal"
  | "bento_reveal"
  | "action";

export type BlockCategory =
  | "content"       // Text, media, mentor message
  | "interaction"   // Selects, text input, action, chat_flow
  | "quiz"          // Quiz, knowledge_check, knowledge_quiz, survey
  | "activity"      // Specialized interactive activities
  | "utility"       // Timer, scripture_practice, workbook, prayer, pdf
  | "layout";       // Image carousel, before/after, bento, selection_reveal

export interface BlockRegistryEntry {
  /** The raw slide type string used in persistence layer */
  type: SlideBlockType;
  /** Human-readable display label */
  label: string;
  /** Optional category for grouping in UI */
  category: BlockCategory;
  /** One-liner description for tooltips / selection help */
  description: string;
  /**
   * When true, the slide has a dedicated structured editor component and
   * does NOT fall back to the generic RichText textarea.
   */
  isSpecializedActivity: boolean;
  /**
   * Whether this type is available in Track A lessons.
   * "action" and "scenario" are excluded from Track A.
   */
  availableInTrackA: boolean;
  /**
   * Whether this type is available in Prelim / Pre-cohort modules.
   * Currently all types are available in prelim.
   */
  availableInPrelim: boolean;
  /**
   * Return safe default content string for a freshly-added block of this type.
   * Receives the string constants from Admin.tsx as arguments so the registry
   * stays pure and does NOT duplicate the large template strings.
   */
  defaultContent: (templates: BlockDefaultTemplates) => string;
}

/**
 * Large template strings live in Admin.tsx (they were there first); we accept
 * them as parameters so the registry does not duplicate them.
 * Each key corresponds exactly to the constant name in Admin.tsx.
 */
export interface BlockDefaultTemplates {
  ORIGIN_OF_THE_WEIGHT_TEMPLATE: string;
  PATH_SELECTOR_DEFAULT: string;
  CROSS_GRID_DEFAULT: string;
  STORY_CHOICE_DEFAULT: string;
  IMAGE_CAROUSEL_DEFAULT: string;
  BEFORE_AFTER_DEFAULT: string;
  SELECTION_REVEAL_DEFAULT: string;
  BENTO_REVEAL_DEFAULT: string;
  /** Track A uses a different guided-prayer default from Prelim */
  GUIDED_PRAYER_DEFAULT_TRACK_A: string;
  /** Prelim uses GUIDED_PRAYER_OCCULT_DEFAULT */
  GUIDED_PRAYER_DEFAULT_PRELIM: string;
}

// ---------------------------------------------------------------------------
// Registry entries
// ---------------------------------------------------------------------------

/**
 * The canonical registry. Order determines the display order in the add-slide
 * selector (grouped by category in the UI adapter).
 */
const REGISTRY: BlockRegistryEntry[] = [
  // ── Content ──────────────────────────────────────────────────────────────
  {
    type: "text",
    label: "Text",
    category: "content",
    description: "Rich-text paragraph, heading, or list.",
    isSpecializedActivity: false,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  {
    type: "media",
    label: "Media",
    category: "content",
    description: "Image, video (YouTube / Vimeo / MP4), or audio player.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => JSON.stringify({ url: "", text: "" }),
  },
  {
    type: "mentor_message",
    label: "Mentor Message",
    category: "content",
    description: "A message that appears to come from the participant's mentor.",
    isSpecializedActivity: false,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  // ── Interaction ───────────────────────────────────────────────────────────
  {
    type: "multi_select",
    label: "Multi Select",
    category: "interaction",
    description: "Participants tap to check one or more items in a list.",
    isSpecializedActivity: false,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  {
    type: "single_select",
    label: "Single Select",
    category: "interaction",
    description: "Participants choose one option from a list.",
    isSpecializedActivity: false,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  {
    type: "text_input",
    label: "Text Input",
    category: "interaction",
    description: "Free-form journal or reflection text entry.",
    isSpecializedActivity: false,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  {
    type: "action",
    label: "Action",
    category: "interaction",
    description: "A participant completes a real-world task and confirms it.",
    isSpecializedActivity: false,
    availableInTrackA: false,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  {
    type: "chat_flow",
    label: "Chat Flow",
    category: "interaction",
    description: "Branching conversational experience with narrator + participant turns.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.ORIGIN_OF_THE_WEIGHT_TEMPLATE,
  },
  {
    type: "path_selector",
    label: "Path Selector",
    category: "interaction",
    description: "Full-bleed image cards that branch to different slide content.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.PATH_SELECTOR_DEFAULT,
  },
  {
    type: "confession_finder",
    label: "Confession Finder",
    category: "interaction",
    description: "Helps participants locate a nearby Confession time.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify(
        {
          title: "Find a Confession",
          subtitle: "Make a plan to receive the Sacrament.",
          introText:
            "Enter your ZIP code and we'll show you listed Confession times at nearby parishes.",
          searchLabel: "Your ZIP code",
          searchPlaceholder: "e.g. 60611",
          confirmationReminder:
            "Parish schedules can change — please verify on the parish website or by calling before you go.",
          manualEntryEnabled: true,
          allowSkip: true,
          skipText: "I need help finding a time",
          saveVariable: "confession_plan",
        },
        null,
        2,
      ),
  },
  // ── Quiz ─────────────────────────────────────────────────────────────────
  {
    type: "quiz",
    label: "Quiz",
    category: "quiz",
    description: "Personality-style quiz that maps answers to a result.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify({
        questions: [{ question: "", options: ["", "", "", ""] }],
        results: {
          A: { title: "", description: "" },
          B: { title: "", description: "" },
          C: { title: "", description: "" },
          D: { title: "", description: "" },
        },
      }),
  },
  {
    type: "knowledge_check",
    label: "Knowledge Check",
    category: "quiz",
    description: "Single question with a correct answer and explanation.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify({
        question: "",
        options: ["", ""],
        correctIndex: 0,
        explanation: "",
      }),
  },
  {
    type: "knowledge_quiz",
    label: "Knowledge Quiz",
    category: "quiz",
    description: "Multi-question quiz with correct answers and a conclusion screen.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify({
        intro: { title: "Test Your Knowledge", subtitle: "" },
        questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }],
        conclusion: "",
      }),
  },
  {
    type: "survey",
    label: "Survey",
    category: "quiz",
    description: "Anonymous multi-question survey with aggregate results.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "",
  },
  {
    type: "scenario",
    label: "Scenario Stepper",
    category: "quiz",
    description: "Step-by-step scenario revealed one image + caption at a time.",
    isSpecializedActivity: true,
    availableInTrackA: false,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify({
        headline: "Imagine the following scenario",
        steps: [{ imageUrl: "", text: "" }],
      }),
  },
  // ── Activity ──────────────────────────────────────────────────────────────
  {
    type: "scene",
    label: "Interactive Scene",
    category: "activity",
    description: "Self-contained Pot & Bandage interactive scene — no config required.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => "{}",
  },
  {
    type: "captivity_builder",
    label: "Breaking Lies",
    category: "activity",
    description: "Captivity-builder activity; 12 spirits and prayer template are built in.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => JSON.stringify({ intro: "" }),
  },
  {
    type: "guided_prayer_process",
    label: "Guided Prayer",
    category: "activity",
    description: "Multi-step guided prayer process with user inputs.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    // Context-specific: Track A uses GUIDED_PRAYER_DEFAULT_TRACK_A,
    // Prelim uses GUIDED_PRAYER_DEFAULT_PRELIM.  The caller sets the right one
    // in the template bag via makeRegistryTemplates(isPrelim).
    defaultContent: (t) => t.GUIDED_PRAYER_DEFAULT_TRACK_A,
  },
  {
    type: "cross_grid",
    label: "Cross Grid Puzzle",
    category: "activity",
    description: "Interactive grid puzzle with tap-to-reveal cells.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.CROSS_GRID_DEFAULT,
  },
  {
    type: "story_choice",
    label: "Story Choice",
    category: "activity",
    description: "Branching story with illustrated choice cards.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.STORY_CHOICE_DEFAULT,
  },
  // ── Utility ───────────────────────────────────────────────────────────────
  {
    type: "timer",
    label: "Timer",
    category: "utility",
    description: "Countdown timer with optional scripture text and audio.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => JSON.stringify({ duration: 60, text: "" }),
  },
  {
    type: "scripture_practice",
    label: "Scripture Practice",
    category: "utility",
    description: "Three-tab scripture practice: listen, chunk-select, reflect.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify({ duration: 60, text: "", audioUrl: "", chunks: [] }),
  },
  {
    type: "workbook_link",
    label: "Workbook Link",
    category: "utility",
    description: "Links directly to one or more workbook sections.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => JSON.stringify({ sectionId: null, label: "" }),
  },
  {
    type: "workbook_session",
    label: "Workbook Session",
    category: "utility",
    description: "Inline workbook session for completing one or more sections.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () =>
      JSON.stringify({
        heading: "Your open work",
        subheading: "Work through what you can.",
      }),
  },
  {
    type: "prayer_link",
    label: "Prayer Link",
    category: "utility",
    description: "Links to one of the three saved prayers in the participant's Toolkit.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => JSON.stringify({ prayerId: "prayer_1", label: "" }),
  },
  {
    type: "pdf_download",
    label: "PDF Download",
    category: "utility",
    description: "Download card for a PDF resource file.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: () => JSON.stringify({ url: "", label: "" }),
  },
  // ── Layout ────────────────────────────────────────────────────────────────
  {
    type: "image_carousel",
    label: "Image Carousel",
    category: "layout",
    description: "Swipeable horizontal image carousel.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.IMAGE_CAROUSEL_DEFAULT,
  },
  {
    type: "before_after",
    label: "Before / After Slider",
    category: "layout",
    description: "Side-by-side image reveal with a drag handle.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.BEFORE_AFTER_DEFAULT,
  },
  {
    type: "selection_reveal",
    label: "Selection Reveal",
    category: "layout",
    description: "Participant selects chips to reveal associated content.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.SELECTION_REVEAL_DEFAULT,
  },
  {
    type: "bento_reveal",
    label: "Bento Reveal",
    category: "layout",
    description: "Grid of tap-to-reveal bento-style cards.",
    isSpecializedActivity: true,
    availableInTrackA: true,
    availableInPrelim: true,
    defaultContent: (t) => t.BENTO_REVEAL_DEFAULT,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Lookup map: type → entry (O(1)). */
const BY_TYPE = new Map<SlideBlockType, BlockRegistryEntry>(
  REGISTRY.map((e) => [e.type, e]),
);

/** Get a single entry by type. Returns undefined for unknown types. */
export function getBlockEntry(type: string): BlockRegistryEntry | undefined {
  return BY_TYPE.get(type as SlideBlockType);
}

/** Ordered list of all entries (same order as REGISTRY). */
export function getAllBlockEntries(): readonly BlockRegistryEntry[] {
  return REGISTRY;
}

/**
 * Types available in Track A day editors (excludes "action", "scenario").
 * Order preserved from REGISTRY.
 */
export function getTrackABlockTypes(): readonly BlockRegistryEntry[] {
  return REGISTRY.filter((e) => e.availableInTrackA);
}

/**
 * Types available in Prelim / Pre-cohort module editors.
 * Currently all types.
 */
export function getPrelimBlockTypes(): readonly BlockRegistryEntry[] {
  return REGISTRY.filter((e) => e.availableInPrelim);
}

/** Human-readable label for any type string (falls back to the raw type). */
export function getBlockLabel(type: string): string {
  return BY_TYPE.get(type as SlideBlockType)?.label ?? type;
}

/**
 * Get safe default content for a given type.
 * Requires the template bag from Admin.tsx because the large JSON templates
 * live there and should not be duplicated.
 */
export function getBlockDefaultContent(
  type: string,
  templates: BlockDefaultTemplates,
): string {
  const entry = BY_TYPE.get(type as SlideBlockType);
  if (!entry) return "";
  return entry.defaultContent(templates);
}

// ---------------------------------------------------------------------------
// Pure validation helpers
// ---------------------------------------------------------------------------

export interface BlockValidationIssue {
  /** Short machine key for the issue kind */
  code: string;
  /** Human-readable description */
  message: string;
  /** Severity */
  severity: "error" | "warning";
}

/** Validate a single block's content string. Returns an array of issues. */
export function validateBlockContent(
  type: string,
  content: string,
): BlockValidationIssue[] {
  const issues: BlockValidationIssue[] = [];

  /** JSON-parse helper — returns undefined on failure */
  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };

  /** Assert that content parses as JSON */
  const requireJson = (): unknown | undefined => {
    const parsed = tryParse(content);
    if (parsed === undefined) {
      issues.push({
        code: "invalid_json",
        message: "Content must be valid JSON for this slide type.",
        severity: "error",
      });
    }
    return parsed;
  };

  switch (type as SlideBlockType) {
    case "text":
    case "multi_select":
    case "single_select":
    case "text_input":
    case "action":
    case "mentor_message": {
      if (!content || content.trim() === "") {
        issues.push({
          code: "empty_content",
          message: "Slide content is empty.",
          severity: "warning",
        });
      }
      break;
    }

    case "media": {
      const parsed = tryParse(content);
      const url: string =
        parsed && typeof (parsed as any).url === "string"
          ? (parsed as any).url
          : typeof content === "string"
          ? content
          : "";
      if (!url || url.trim() === "") {
        issues.push({
          code: "media_url_missing",
          message: "Media slide has no URL.",
          severity: "error",
        });
      }
      break;
    }

    case "timer": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (typeof parsed.duration !== "number" || parsed.duration <= 0) {
          issues.push({
            code: "timer_duration_invalid",
            message: "Timer duration must be a positive number of seconds.",
            severity: "error",
          });
        }
      }
      break;
    }

    case "quiz": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          issues.push({
            code: "quiz_no_questions",
            message: "Quiz must have at least one question.",
            severity: "error",
          });
        } else {
          parsed.questions.forEach((q: any, i: number) => {
            if (!q.question || q.question.trim() === "") {
              issues.push({
                code: `quiz_empty_question_${i}`,
                message: `Question ${i + 1} text is empty.`,
                severity: "warning",
              });
            }
            if (!Array.isArray(q.options) || q.options.length < 2) {
              issues.push({
                code: `quiz_insufficient_options_${i}`,
                message: `Question ${i + 1} needs at least 2 options.`,
                severity: "error",
              });
            }
          });
        }
      }
      break;
    }

    case "knowledge_check": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!parsed.question || parsed.question.trim() === "") {
          issues.push({
            code: "kc_empty_question",
            message: "Knowledge check question is empty.",
            severity: "error",
          });
        }
        if (!Array.isArray(parsed.options) || parsed.options.length < 2) {
          issues.push({
            code: "kc_insufficient_options",
            message: "Knowledge check needs at least 2 options.",
            severity: "error",
          });
        }
        if (
          typeof parsed.correctIndex !== "number" ||
          parsed.correctIndex < 0 ||
          parsed.correctIndex >= (parsed.options?.length ?? 0)
        ) {
          issues.push({
            code: "kc_invalid_correct_index",
            message: "Correct answer index is out of range.",
            severity: "error",
          });
        }
      }
      break;
    }

    case "knowledge_quiz": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          issues.push({
            code: "kquiz_no_questions",
            message: "Knowledge quiz must have at least one question.",
            severity: "error",
          });
        } else {
          parsed.questions.forEach((q: any, i: number) => {
            if (!q.question || q.question.trim() === "") {
              issues.push({
                code: `kquiz_empty_q_${i}`,
                message: `Question ${i + 1} text is empty.`,
                severity: "warning",
              });
            }
            if (
              typeof q.correctIndex !== "number" ||
              q.correctIndex < 0 ||
              q.correctIndex >= (q.options?.length ?? 0)
            ) {
              issues.push({
                code: `kquiz_invalid_correct_${i}`,
                message: `Question ${i + 1} has an out-of-range correct answer index.`,
                severity: "error",
              });
            }
          });
        }
      }
      break;
    }

    case "survey": {
      // Survey content is often complex JSON; require valid JSON at minimum
      if (content && content.trim() !== "") {
        requireJson();
      }
      break;
    }

    case "scenario": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
          issues.push({
            code: "scenario_no_steps",
            message: "Scenario stepper must have at least one step.",
            severity: "error",
          });
        }
      }
      break;
    }

    case "chat_flow": {
      requireJson();
      break;
    }

    case "path_selector": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!Array.isArray(parsed.options) || parsed.options.length < 2) {
          issues.push({
            code: "path_selector_insufficient_options",
            message: "Path selector needs at least 2 options.",
            severity: "error",
          });
        }
      }
      break;
    }

    case "image_carousel": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!Array.isArray(parsed.images) || parsed.images.length === 0) {
          issues.push({
            code: "carousel_no_images",
            message: "Image carousel has no images.",
            severity: "warning",
          });
        }
      }
      break;
    }

    case "before_after": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!parsed.before?.url && !parsed.after?.url) {
          issues.push({
            code: "before_after_missing_images",
            message: "Before/After slider is missing image URLs.",
            severity: "warning",
          });
        }
      }
      break;
    }

    case "pdf_download": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        if (!parsed.url || parsed.url.trim() === "") {
          issues.push({
            code: "pdf_url_missing",
            message: "PDF download slide has no URL.",
            severity: "error",
          });
        }
      }
      break;
    }

    case "workbook_link": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        const hasSections =
          (Array.isArray(parsed.sectionIds) && parsed.sectionIds.length > 0) ||
          parsed.sectionId != null;
        if (!hasSections) {
          issues.push({
            code: "workbook_link_no_section",
            message: "Workbook link has no section selected.",
            severity: "warning",
          });
        }
      }
      break;
    }

    case "workbook_session": {
      requireJson();
      break;
    }

    case "prayer_link": {
      const parsed = requireJson() as any;
      if (parsed !== undefined) {
        const valid = ["prayer_1", "prayer_2", "prayer_3"];
        if (!valid.includes(parsed.prayerId)) {
          issues.push({
            code: "prayer_link_invalid_id",
            message: `Prayer ID "${parsed.prayerId}" is not one of prayer_1, prayer_2, prayer_3.`,
            severity: "error",
          });
        }
      }
      break;
    }

    case "selection_reveal":
    case "bento_reveal":
    case "cross_grid":
    case "story_choice":
    case "scripture_practice":
    case "guided_prayer_process": {
      requireJson();
      break;
    }

    case "scene":
    case "captivity_builder": {
      // Self-contained; no content validation needed
      break;
    }

    default:
      break;
  }

  return issues;
}

/**
 * Validate all blocks in a lesson (an array of raw { type, content } objects).
 * Returns a flat array of issues annotated with the block index.
 */
export interface LessonValidationIssue extends BlockValidationIssue {
  blockIndex: number;
}

export function validateLesson(
  slides: ReadonlyArray<{ type: string; content: string }>,
): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];
  if (slides.length === 0) {
    issues.push({
      code: "lesson_empty",
      message: "This lesson has no slides.",
      severity: "warning",
      blockIndex: -1,
    });
    return issues;
  }
  for (let i = 0; i < slides.length; i++) {
    const blockIssues = validateBlockContent(slides[i].type, slides[i].content);
    for (const issue of blockIssues) {
      issues.push({ ...issue, blockIndex: i });
    }
  }
  return issues;
}

/**
 * Condensed summary string suitable for display before a save action.
 * Returns null if there are no issues.
 */
export function lessonValidationSummary(
  slides: ReadonlyArray<{ type: string; content: string }>,
): string | null {
  const issues = validateLesson(slides);
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const parts: string[] = [];
  if (errors > 0) parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
  if (warnings > 0) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  return parts.join(", ");
}
