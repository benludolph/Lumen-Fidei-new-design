import type { CurriculumDocument, Lesson } from "@shared/curriculum";
import type { TrackAContent } from "@shared/schema";
import type { SlideType } from "@/components/lesson/LessonSlide";

const FLOW_BLOCK_TYPES = new Set<SlideType>([
  "text",
  "multi_select",
  "single_select",
  "media",
  "text_input",
  "action",
  "mentor_message",
  "timer",
  "quiz",
  "knowledge_check",
  "survey",
  "scenario",
  "chat_flow",
  "path_selector",
  "cross_grid",
  "story_choice",
  "image_carousel",
  "before_after",
  "scripture_practice",
  "knowledge_quiz",
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

export function releaseLessonToFlowContent(
  document: CurriculumDocument,
  lesson: Lesson,
): TrackAContent {
  const slides = lesson.blocks.map((block) => {
    if (block.type !== "activity_ref") {
      return { type: block.type, content: block.content ?? "" };
    }

    const activity = document.activities.find(
      (candidate) => candidate.key === block.activityKey,
    );
    if (activity && FLOW_BLOCK_TYPES.has(activity.type as SlideType)) {
      return {
        type: activity.type,
        content: JSON.stringify(activity.config ?? {}),
      };
    }

    return {
      type: "text",
      content: "This activity is not available in the current lesson player.",
    };
  });

  return {
    id: -1,
    dayNumber: -1,
    weekNumber: 0,
    centralTheme: lesson.title,
    subtitle: lesson.subtitle ?? null,
    imageUrl: lesson.imageUrl ?? null,
    slides,
    completionMessage: lesson.completionMessage ?? null,
    openingPrayerText: lesson.openingPrayerText ?? null,
    openingPrayerAudio: lesson.openingPrayerAudio ?? null,
    closingPrayerText: lesson.closingPrayerText ?? null,
    closingPrayerAudio: lesson.closingPrayerAudio ?? null,
  };
}