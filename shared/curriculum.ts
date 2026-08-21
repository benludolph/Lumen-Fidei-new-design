/**
 * shared/curriculum.ts
 * Shared vocabulary and validation schemas for reusable curriculum documents.
 *
 * Hierarchy: Program → Release → Module → Lesson → Block
 *
 * Every module, lesson, block, and specialized activity reference has a stable,
 * non-empty key.  Validators enforce:
 *   - All keys non-empty and free of whitespace
 *   - No duplicate keys within a document
 *   - Block types must be in SUPPORTED_BLOCK_TYPES (unknown props preserved via passthrough)
 *   - Required config fields are validated per block type
 *   - Activity references must resolve to a key present in the activities map
 */

import { z } from "zod";

// ─── Supported block types ────────────────────────────────────────────────────

export const SUPPORTED_BLOCK_TYPES = [
  "text",
  "media",
  "action",
  "single_select",
  "multi_select",
  "text_input",
  "mentor_message",
  "timer",
  "knowledge_check",
  "knowledge_quiz",
  "quiz",
  "survey",
  "scenario",
  "chat_flow",
  "path_selector",
  "cross_grid",
  "story_choice",
  "image_carousel",
  "before_after",
  "scripture_practice",
  "scene",
  "captivity_builder",
  "confession_finder",
  "pdf_download",
  "guided_prayer_process",
  "workbook_link",
  "workbook_session",
  "prayer_link",
  "selection_reveal",
  "bento_reveal",
  "activity_ref",
] as const;

export type BlockType = (typeof SUPPORTED_BLOCK_TYPES)[number];

// ─── Stable key helper ───────────────────────────────────────────────────────

/** A non-empty string with no leading/trailing whitespace and no internal spaces. */
const stableKeySchema = z
  .string()
  .trim()
  .min(1, "Key must not be empty")
  .regex(/^\S+$/, "Key must not contain whitespace");

// ─── Block schemas ────────────────────────────────────────────────────────────

const jsonContentBlockTypes = new Set<BlockType>([
  "timer",
  "knowledge_check",
  "knowledge_quiz",
  "quiz",
  "survey",
  "scenario",
  "chat_flow",
  "path_selector",
  "cross_grid",
  "story_choice",
  "image_carousel",
  "before_after",
  "scripture_practice",
  "scene",
  "captivity_builder",
  "confession_finder",
  "pdf_download",
  "guided_prayer_process",
  "workbook_link",
  "workbook_session",
  "prayer_link",
  "selection_reveal",
  "bento_reveal",
]);

function containsUnsafeObjectKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsUnsafeObjectKey);
  return Object.entries(value).some(
    ([key, child]) =>
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor" ||
      containsUnsafeObjectKey(child),
  );
}

export const blockSchema = z
  .object({
    key: stableKeySchema,
    type: z.enum(SUPPORTED_BLOCK_TYPES),
    content: z.string().optional(),
    activityKey: stableKeySchema.optional(),
  })
  .passthrough()
  .superRefine((block, ctx) => {
    if (block.type === "activity_ref" && !block.activityKey) {
      ctx.addIssue({
        code: "custom",
        message: "activity_ref block requires activityKey",
        path: ["activityKey"],
      });
    }

    if ((block.type === "media" || block.type === "pdf_download") && !block.content?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: `${block.type} block requires content`,
        path: ["content"],
      });
    }

    if (block.content?.trim() && jsonContentBlockTypes.has(block.type)) {
      try {
        const parsed = JSON.parse(block.content);
        if (containsUnsafeObjectKey(parsed)) {
          ctx.addIssue({
            code: "custom",
            message: `${block.type} block contains an unsafe configuration key`,
            path: ["content"],
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message: `${block.type} block content must be valid JSON`,
          path: ["content"],
        });
      }
    }
  });

export type Block = z.infer<typeof blockSchema>;

// ─── Activity ─────────────────────────────────────────────────────────────────

export const activitySchema = z
  .object({
    key: stableKeySchema,
    type: z.string().min(1),
    config: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type Activity = z.infer<typeof activitySchema>;

// ─── Lesson ───────────────────────────────────────────────────────────────────

export const lessonSchema = z.object({
  key: stableKeySchema,
  title: z.string().min(1, "Lesson title required"),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  completionMessage: z.string().optional(),
  openingPrayerText: z.string().optional(),
  openingPrayerAudio: z.string().optional(),
  closingPrayerText: z.string().optional(),
  closingPrayerAudio: z.string().optional(),
  blocks: z.array(blockSchema).default([]),
});

export type Lesson = z.infer<typeof lessonSchema>;

// ─── Module ───────────────────────────────────────────────────────────────────

export const moduleSchema = z.object({
  key: stableKeySchema,
  title: z.string().min(1, "Module title required"),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().optional(),
  lessons: z.array(lessonSchema).default([]),
});

export type CurriculumModule = z.infer<typeof moduleSchema>;

// ─── Curriculum document (Release payload) ────────────────────────────────────

export const curriculumDocumentSchema = z
  .object({
    schemaVersion: z.literal(1).default(1),
    programKey: stableKeySchema,
    modules: z.array(moduleSchema).default([]),
    activities: z.array(activitySchema).optional().default([]),
  })
  .superRefine((doc, ctx) => {
    // ── Duplicate key checks ─────────────────────────────────────────────────

    // Module keys
    const modKeys = new Set<string>();
    const lessonKeys = new Set<string>();
    const blockKeys = new Set<string>();
    for (const mod of doc.modules) {
      if (modKeys.has(mod.key)) {
        ctx.addIssue({ code: "custom", message: `Duplicate module key: "${mod.key}"`, path: ["modules"] });
      }
      modKeys.add(mod.key);

      for (const lesson of mod.lessons) {
        if (lessonKeys.has(lesson.key)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate lesson key: "${lesson.key}"`,
            path: ["modules", "lessons"],
          });
        }
        lessonKeys.add(lesson.key);

        for (const block of lesson.blocks) {
          if (blockKeys.has(block.key)) {
            ctx.addIssue({
              code: "custom",
              message: `Duplicate block key: "${block.key}"`,
              path: ["modules", "lessons", "blocks"],
            });
          }
          blockKeys.add(block.key);
        }
      }
    }

    if (doc.programKey === "track-a") {
      const prelim = doc.modules.find((mod) => mod.key === "prelim");
      if (!prelim || prelim.lessons.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Track A requires at least one preliminary lesson",
          path: ["modules"],
        });
      }

      const dayNumbers = new Set<number>();
      for (const mod of doc.modules) {
        for (const lesson of mod.lessons) {
          const match = lesson.key.match(/^day-(\d+)(?:-|$)/);
          if (match) dayNumbers.add(Number(match[1]));
        }
      }
      for (let day = 0; day <= 30; day += 1) {
        if (!dayNumbers.has(day)) {
          ctx.addIssue({
            code: "custom",
            message: `Track A is missing Day ${day}`,
            path: ["modules"],
          });
        }
      }
    }

    // Activity keys
    const activityKeys = new Set<string>();
    for (const act of doc.activities ?? []) {
      if (activityKeys.has(act.key)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate activity key: "${act.key}"`,
          path: ["activities"],
        });
      }
      activityKeys.add(act.key);
    }

    // ── activity_ref resolution ──────────────────────────────────────────────
    for (const mod of doc.modules) {
      for (const lesson of mod.lessons) {
        for (const block of lesson.blocks) {
          if (block.type === "activity_ref") {
            const ref = (block as any).activityKey as string;
            if (!activityKeys.has(ref)) {
              ctx.addIssue({
                code: "custom",
                message: `activity_ref block key "${block.key}" references unknown activity "${ref}"`,
                path: ["modules", "lessons", "blocks"],
              });
            }
          }
        }
      }
    }
  });

export type CurriculumDocument = z.infer<typeof curriculumDocumentSchema>;

/**
 * Validate a raw object as a CurriculumDocument.
 * Returns { ok: true, doc } or { ok: false, errors }.
 */
export function validateCurriculumDocument(
  raw: unknown,
): { ok: true; doc: CurriculumDocument } | { ok: false; errors: z.ZodIssue[] } {
  const result = curriculumDocumentSchema.safeParse(raw);
  if (result.success) return { ok: true, doc: result.data };
  return { ok: false, errors: result.error.issues };
}

/**
 * Build a deterministic stable key from arbitrary text.
 * Lowercased, spaces and special chars replaced with hyphens, collapsed.
 */
export function buildStableKey(text: string, prefix?: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return prefix ? `${prefix}-${slug}` : slug;
}
