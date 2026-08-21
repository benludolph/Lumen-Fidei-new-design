import type { CurriculumDocument, CurriculumModule, Lesson } from "@shared/curriculum";
import type { PrelimModule, TrackAContent, TrackAModule } from "@shared/schema";

function numberFromKey(key: string, prefix: string): number | null {
  const match = key.match(new RegExp(`^${prefix}-(\\d+)(?:-|$)`));
  return match ? Number(match[1]) : null;
}

function findTrackAModule(document: CurriculumDocument, lessonKey: string): CurriculumModule | undefined {
  return document.modules.find((module) =>
    module.lessons.some((lesson) => lesson.key === lessonKey),
  );
}

export function getTrackALessonByDay(
  document: CurriculumDocument,
  dayNumber: number,
): Lesson | undefined {
  const lessons = document.modules.flatMap((module) => module.lessons);
  if (dayNumber === 0) {
    return lessons.find((lesson) => numberFromKey(lesson.key, "day") === 0);
  }

  return lessons
    .filter((lesson) => {
      const day = numberFromKey(lesson.key, "day");
      return day !== null && day > 0;
    })
    .sort((left, right) =>
      (numberFromKey(left.key, "day") ?? 0) - (numberFromKey(right.key, "day") ?? 0),
    )[dayNumber - 1];
}

export function releaseToTrackAContent(document: CurriculumDocument): TrackAContent[] {
  const content: TrackAContent[] = [];
  for (const module of document.modules) {
    for (const lesson of module.lessons) {
      const dayNumber = numberFromKey(lesson.key, "day");
      if (dayNumber === null) continue;
      const weekNumber = numberFromKey(module.key, "week") ?? (dayNumber === 0 ? 0 : Math.ceil(dayNumber / 6));
      content.push({
          id: -(dayNumber + 1),
          dayNumber,
          weekNumber,
          centralTheme: lesson.title,
          subtitle: lesson.subtitle ?? null,
          slides: lesson.blocks.map((block) => ({
            type: block.type === "activity_ref" ? "text" : block.type,
            content: block.content ?? "",
          })),
          imageUrl: lesson.imageUrl ?? null,
          completionMessage: lesson.completionMessage ?? null,
          openingPrayerText: lesson.openingPrayerText ?? null,
          openingPrayerAudio: lesson.openingPrayerAudio ?? null,
          closingPrayerText: lesson.closingPrayerText ?? null,
          closingPrayerAudio: lesson.closingPrayerAudio ?? null,
      });
    }
  }
  return content.sort((left, right) => left.dayNumber - right.dayNumber);
}

export function releaseToTrackAModules(document: CurriculumDocument): TrackAModule[] {
  return document.modules
    .map((module, index) => {
      const weekNumber = numberFromKey(module.key, "week");
      if (weekNumber === null) return null;
      return {
        id: -(weekNumber + 1),
        weekNumber,
        title: module.title,
        subtitle: module.subtitle ?? "",
        imageUrl: module.imageUrl ?? null,
        sortOrder: module.sortOrder ?? index,
      } satisfies TrackAModule;
    })
    .filter((module): module is TrackAModule => module !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function releaseToPrelimModules(document: CurriculumDocument): PrelimModule[] {
  const module = document.modules.find((candidate) => candidate.key === "prelim");
  if (!module) return [];

  return module.lessons.map((lesson, index) => ({
    id: -(index + 1),
    position: index + 1,
    title: lesson.title,
    subtitle: lesson.subtitle ?? null,
    slides: lesson.blocks.map((block) => ({
      type: block.type === "activity_ref" ? "text" : block.type,
      content: block.content ?? "",
    })),
    imageUrl: lesson.imageUrl ?? null,
  }));
}

export function getTrackALessonKey(document: CurriculumDocument, dayNumber: number): string | null {
  return getTrackALessonByDay(document, dayNumber)?.key ?? null;
}

export function getTrackAWeekForLesson(document: CurriculumDocument, lessonKey: string): number | null {
  const module = findTrackAModule(document, lessonKey);
  return module ? numberFromKey(module.key, "week") : null;
}