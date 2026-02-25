import { useRef, useEffect, useState, useCallback } from "react";
import { DayCard } from "./DayCard";
import { WeekSection } from "./WeekSection";
import { StickyWeekHeader } from "./StickyWeekHeader";
import { PeriodSelectionDialog } from "./PeriodSelectionDialog";
import type { ContentSummary } from "@/hooks/use-content-summaries";
import type { TrackAContent } from "@shared/schema";
import { useLocation } from "wouter";

import trackAImg1 from "@assets/image_1771985019617.png";
import trackAImg2 from "@assets/image_1771985039759.png";
import trackAImg3 from "@assets/image_1771985088299.png";
import trackAImg4 from "@assets/image_1771985210712.png";
import trackAImg5 from "@assets/image_1771985228368.png";
import trackAImg6 from "@assets/image_1771985236426.png";

const TRACK_A_IMAGES = [trackAImg1, trackAImg2, trackAImg3, trackAImg4, trackAImg5, trackAImg6];

function getTrackAImage(dayNumber: number): string {
  return TRACK_A_IMAGES[(dayNumber - 1) % TRACK_A_IMAGES.length];
}

interface DayGridViewProps {
  currentDay: number;
  isTrackA: boolean;
  trackASummaries?: TrackAContent[];
  trackBSummaries?: ContentSummary[];
  isDayCompleted: (day: number) => boolean;
  isPeriodCompleted: (day: number, period: "morning" | "evening") => boolean;
  onDaySelect: (day: number, period?: "morning" | "evening") => void;
}

function getWeekTheme(
  weekNumber: number,
  isTrackA: boolean,
  trackASummaries?: TrackAContent[],
  trackBSummaries?: ContentSummary[],
): string {
  if (isTrackA && trackASummaries) {
    const firstDay = trackASummaries.find(c => c.weekNumber === weekNumber);
    return firstDay?.centralTheme || `Week ${weekNumber}`;
  }
  if (trackBSummaries) {
    const firstDay = trackBSummaries.find(c => c.weekNumber === weekNumber);
    return firstDay?.weekTitle || `Week ${weekNumber}`;
  }
  return `Week ${weekNumber}`;
}

function getDayTitle(
  day: number,
  isTrackA: boolean,
  trackASummaries?: TrackAContent[],
  trackBSummaries?: ContentSummary[],
): string {
  if (isTrackA && trackASummaries) {
    const content = trackASummaries.find(c => c.dayNumber === day);
    return content?.centralTheme || "Daily Activity";
  }
  if (trackBSummaries) {
    const content = trackBSummaries.find(c => c.dayNumber === day);
    return content?.title || `Day ${day}`;
  }
  return `Day ${day}`;
}

function groupDaysByWeek(days: number[]): { week: number; days: number[] }[] {
  const weeks: { week: number; days: number[] }[] = [];
  for (let w = 1; w <= 5; w++) {
    const weekDays = days.filter(d => {
      const weekNum = Math.ceil(d / 7);
      return weekNum === w;
    });
    if (weekDays.length > 0) {
      weeks.push({ week: w, days: weekDays });
    }
  }
  return weeks;
}

export function DayGridView({
  currentDay,
  isTrackA,
  trackASummaries,
  trackBSummaries,
  isDayCompleted,
  isPeriodCompleted,
  onDaySelect,
}: DayGridViewProps) {
  const [_, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [activeWeek, setActiveWeek] = useState(() => Math.min(Math.ceil(currentDay / 7), 5) || 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayForDialog, setSelectedDayForDialog] = useState<number>(0);

  const allDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekGroups = groupDaysByWeek(allDays);

  const setWeekRef = useCallback((weekNum: number, el: HTMLDivElement | null) => {
    if (el) weekRefs.current.set(weekNum, el);
    else weekRefs.current.delete(weekNum);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const weekNum = Number(entry.target.getAttribute("data-week"));
            if (weekNum) setActiveWeek(weekNum);
          }
        }
      },
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    weekRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [weekGroups.length]);

  const handleCardClick = (day: number) => {
    if (isTrackA) {
      onDaySelect(day);
    } else {
      setSelectedDayForDialog(day);
      setDialogOpen(true);
    }
  };

  const handlePeriodSelect = (period: "morning" | "evening") => {
    setDialogOpen(false);
    onDaySelect(selectedDayForDialog, period);
  };

  const activeWeekTheme = getWeekTheme(activeWeek, isTrackA, trackASummaries, trackBSummaries);

  const dialogDayTitle = getDayTitle(selectedDayForDialog, isTrackA, trackASummaries, trackBSummaries);

  return (
    <div className="flex flex-col h-full">
      <StickyWeekHeader
        weekNumber={activeWeek}
        weekTheme={activeWeekTheme}
        onGuideClick={() => setLocation("/resources")}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto mt-4 pb-8 custom-scrollbar">
        <div className="max-w-[640px] mx-auto px-2 sm:px-4">
          {weekGroups.map(({ week, days }, groupIdx) => (
            <div key={week}>
              {groupIdx > 0 && (
                <WeekSection
                  weekNumber={week}
                  theme={getWeekTheme(week, isTrackA, trackASummaries, trackBSummaries)}
                />
              )}
              <div
                ref={(el) => setWeekRef(week, el)}
                data-week={week}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {days.map((day) => {
                  const isLocked = day > currentDay;
                  const isToday = day === currentDay;
                  const completed = isDayCompleted(day);
                  const isSunday = day % 7 === 0;
                  const title = getDayTitle(day, isTrackA, trackASummaries, trackBSummaries);

                  const prevDayTitle = day > 1
                    ? getDayTitle(day - 1, isTrackA, trackASummaries, trackBSummaries)
                    : undefined;
                  const subtitle = !isToday && day > 1 ? `Day ${day - 1}. ${prevDayTitle}` : undefined;

                  return (
                    <DayCard
                      key={day}
                      dayNumber={day}
                      title={title}
                      subtitle={subtitle}
                      isCompleted={completed}
                      isToday={isToday}
                      isLocked={isLocked}
                      isSunday={isSunday}
                      isTrackB={!isTrackA}
                      morningCompleted={isPeriodCompleted(day, "morning")}
                      eveningCompleted={isPeriodCompleted(day, "evening")}
                      backgroundImage={isTrackA ? getTrackAImage(day) : undefined}
                      onClick={() => handleCardClick(day)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isTrackA && (
        <PeriodSelectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          dayNumber={selectedDayForDialog}
          dayTitle={dialogDayTitle}
          morningCompleted={isPeriodCompleted(selectedDayForDialog, "morning")}
          eveningCompleted={isPeriodCompleted(selectedDayForDialog, "evening")}
          onSelect={handlePeriodSelect}
        />
      )}
    </div>
  );
}
