import { useRef, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { DayCard } from "./DayCard";
import { WeekSection } from "./WeekSection";
import { StickyWeekHeader } from "./StickyWeekHeader";
import { PeriodSelectionDialog } from "./PeriodSelectionDialog";
import { OverviewGuideModal } from "./OverviewGuideModal";
import type { ContentSummary } from "@/hooks/use-content-summaries";
import type { TrackAContent, TrackAModule, PrelimModuleWithStatus } from "@shared/schema";
import { Church, BookOpen, CheckCircle2, Lock, ChevronRight } from "lucide-react";

import trackAImg1 from "@assets/image_1771985019617.png";
import trackAImg2 from "@assets/image_1771985039759.png";
import trackAImg3 from "@assets/image_1771985088299.png";
import trackAImg4 from "@assets/image_1771985210712.png";
import trackAImg5 from "@assets/image_1771985228368.png";
import trackAImg6 from "@assets/image_1771985236426.png";

const TRACK_A_FALLBACK_IMAGES = [trackAImg1, trackAImg2, trackAImg3, trackAImg4, trackAImg5, trackAImg6];

function getTrackAImage(dayNumber: number, trackASummaries?: TrackAContent[]): string | undefined {
  if (!trackASummaries) return undefined;
  const content = trackASummaries.find(c => c.dayNumber === dayNumber);
  if (content?.imageUrl) return content.imageUrl;
  return TRACK_A_FALLBACK_IMAGES[(dayNumber - 1) % TRACK_A_FALLBACK_IMAGES.length];
}

interface PrayerCompletionRecord {
  dayNumber: number;
  period: string;
  completedAt: string;
}

interface DayGridViewProps {
  currentDay: number;
  isTrackA: boolean;
  trackASummaries?: TrackAContent[];
  trackBSummaries?: ContentSummary[];
  cohortStartDate?: string | null;
  prayerCompletions?: PrayerCompletionRecord[];
  isDayCompleted: (day: number) => boolean;
  isPeriodCompleted: (day: number, period: "morning" | "evening") => boolean;
  onDaySelect: (day: number, period?: "morning" | "evening") => void;
  prelimModulesData?: PrelimModuleWithStatus[];
  allPrelimsComplete?: boolean;
  onPrelimSelect?: (position: number) => void;
}

function getWeekTheme(
  weekNumber: number,
  isTrackA: boolean,
  trackASummaries?: TrackAContent[],
  trackBSummaries?: ContentSummary[],
  modules?: TrackAModule[],
): string {
  if (isTrackA) {
    const mod = modules?.find(m => m.weekNumber === weekNumber);
    if (mod) return mod.subtitle || mod.title;
    return `Week ${weekNumber}`;
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
    const weekDays = days.filter(d => Math.ceil(d / 6) === w);
    if (weekDays.length > 0) {
      weeks.push({ week: w, days: weekDays });
    }
  }
  return weeks;
}

function SundayBanner() {
  return (
    <div
      data-testid="banner-sunday"
      className="relative flex items-center gap-3 p-5 rounded-lg shadow-sm text-left w-full min-h-[72px] sm:col-span-2 overflow-hidden bg-gradient-to-r from-[#2d4a22]/90 to-[#5c6b32]/70 dark:from-[#2d4a22]/80 dark:to-[#5c6b32]/60 border border-[#8b7d3c]/30 my-3"
    >
      <div className="flex items-center gap-4 w-full justify-center">
        <Church className="w-6 h-6 text-[#d4c876]/80" />
        <p className="font-serif text-[#d4c876] text-base font-semibold tracking-wide">
          Sunday — Go to Mass
        </p>
        <Church className="w-6 h-6 text-[#d4c876]/80" />
      </div>
    </div>
  );
}

function PrelimCard({
  module,
  isAccessible,
  onClick,
}: {
  module: PrelimModuleWithStatus;
  isAccessible: boolean;
  onClick: () => void;
}) {
  const { completed, position, title, subtitle } = module;
  const state = completed ? "completed" : isAccessible ? "active" : "locked";

  return (
    <button
      onClick={isAccessible || completed ? onClick : undefined}
      disabled={!isAccessible && !completed}
      data-testid={`card-prelim-${position}`}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-lg shadow-sm text-left transition-all duration-200 overflow-hidden w-full min-h-[72px]",
        state === "completed" && "bg-gradient-to-r from-[#003725] to-[#004d33] cursor-pointer hover:shadow-md",
        state === "active" && "bg-gradient-to-r from-[#5c1f00] to-[#8c3010] cursor-pointer hover:shadow-md ring-2 ring-[#F07830]/50",
        state === "locked" && "opacity-40 cursor-not-allowed bg-zinc-900",
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 shrink-0">
        {state === "completed" ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
        ) : state === "active" ? (
          <span className="text-white font-bold text-sm">{position}</span>
        ) : (
          <Lock className="w-4 h-4 text-white/50" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="font-['Afacad',sans-serif] font-semibold text-white text-[15px] leading-5 truncate">
          {title}
        </p>
        {subtitle && (
          <p className="font-['Afacad',sans-serif] text-white/60 text-[12px] truncate">
            {subtitle}
          </p>
        )}
      </div>
      {(state === "active" || state === "completed") && (
        <ChevronRight className="w-4 h-4 text-white/60 shrink-0" />
      )}
    </button>
  );
}

function Day0Card({ isUnlocked, onClick, imageUrl }: { isUnlocked: boolean; onClick: () => void; imageUrl?: string | null }) {
  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      data-testid="card-day-0"
      className={cn(
        "relative flex items-center gap-3 p-5 rounded-lg shadow-sm text-left transition-all duration-200 overflow-hidden group w-full min-h-[100px] sm:col-span-2",
        !isUnlocked && "opacity-40 cursor-not-allowed bg-zinc-900",
        isUnlocked && "hover:shadow-md cursor-pointer bg-gradient-to-r from-[#003725] to-[#004d33]",
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
        />
      )}
      {imageUrl && (
        <div className="absolute inset-0 bg-black/40 rounded-lg" />
      )}
      <div className="relative z-10 flex items-center gap-4 w-full">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 shrink-0">
          <BookOpen className="w-5 h-5 text-white/80" />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p data-testid="text-day0-title" className="font-['Afacad',sans-serif] font-semibold text-white text-[16px] leading-7">
            Introduction — Goal of 30 Days
          </p>
          <p data-testid="text-day0-subtitle" className="font-['Afacad',sans-serif] text-white/60 text-[13px]">
            Begin your journey
          </p>
        </div>
      </div>
    </button>
  );
}

export function DayGridView({
  currentDay,
  isTrackA,
  trackASummaries,
  trackBSummaries,
  cohortStartDate,
  prayerCompletions,
  isDayCompleted,
  isPeriodCompleted,
  onDaySelect,
  prelimModulesData,
  allPrelimsComplete = false,
  onPrelimSelect,
}: DayGridViewProps) {
  const { data: trackAModules } = useQuery<TrackAModule[]>({
    queryKey: ["/api/track-a-modules"],
    enabled: isTrackA,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [activeWeek, setActiveWeek] = useState(() => Math.min(Math.ceil(currentDay / 6), 5) || 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayForDialog, setSelectedDayForDialog] = useState<number>(0);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

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

  const activeWeekTheme = getWeekTheme(activeWeek, isTrackA, trackASummaries, trackBSummaries, trackAModules);

  const dialogDayTitle = getDayTitle(selectedDayForDialog, isTrackA, trackASummaries, trackBSummaries);

  const day0Unlocked = allPrelimsComplete;

  return (
    <div className="flex flex-col h-full">
      <StickyWeekHeader
        weekNumber={activeWeek}
        weekTheme={activeWeekTheme}
        onGuideClick={() => setGuideModalOpen(true)}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto mt-4 pb-8 custom-scrollbar">
        <div className="max-w-[640px] mx-auto px-2 sm:px-4">
          {/* Before You Begin — 3 sequential prelim modules */}
          {prelimModulesData && prelimModulesData.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                Before You Begin
              </p>
              <div className="flex flex-col gap-2">
                {prelimModulesData.map((mod) => {
                  const prevDone = mod.position === 1 || prelimModulesData.find(m => m.position === mod.position - 1)?.completed;
                  const isAccessible = !!prevDone && !mod.completed;
                  return (
                    <PrelimCard
                      key={mod.position}
                      module={mod}
                      isAccessible={isAccessible}
                      onClick={() => onPrelimSelect?.(mod.position)}
                    />
                  );
                })}
              </div>
              <div className="mt-3 mb-1 border-t border-white/10" />
            </div>
          )}

          {isTrackA && (
            <div className="mb-3">
              <Day0Card
                isUnlocked={day0Unlocked}
                onClick={() => onDaySelect(0)}
                imageUrl={trackASummaries?.find(c => c.dayNumber === 0)?.imageUrl}
              />
            </div>
          )}

          {weekGroups.map(({ week, days }, groupIdx) => (
            <div key={week}>
              {groupIdx > 0 && (
                <>
                  <SundayBanner />
                  <WeekSection
                    weekNumber={week}
                    theme={getWeekTheme(week, isTrackA, trackASummaries, trackBSummaries, trackAModules)}
                  />
                </>
              )}
              <div
                ref={(el) => setWeekRef(week, el)}
                data-week={week}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {days.map((day) => {
                  const isLocked = day > currentDay || !allPrelimsComplete;
                  const isToday = day === currentDay && allPrelimsComplete;
                  const completed = isDayCompleted(day);
                  const title = getDayTitle(day, isTrackA, trackASummaries, trackBSummaries);

                  const trackADay = isTrackA ? trackASummaries?.find(c => c.dayNumber === day) : undefined;
                  const subtitle = trackADay?.subtitle || undefined;

                  let completedLate = false;
                  if (isTrackA && completed && cohortStartDate && prayerCompletions) {
                    const record = prayerCompletions.find(c => c.dayNumber === day && c.period === "morning");
                    if (record) {
                      const start = new Date(cohortStartDate + "T00:00:00");
                      const programDayIndex = day - 1;
                      const fullWeeks = Math.floor(programDayIndex / 6);
                      const remainder = programDayIndex % 6;
                      const calendarOffset = fullWeeks * 7 + remainder;
                      const expectedDate = new Date(start);
                      expectedDate.setDate(start.getDate() + calendarOffset);
                      const expectedStr = expectedDate.getFullYear() + "-" +
                        String(expectedDate.getMonth() + 1).padStart(2, "0") + "-" +
                        String(expectedDate.getDate()).padStart(2, "0");
                      const completed_d = new Date(record.completedAt);
                      const completedStr = completed_d.getFullYear() + "-" +
                        String(completed_d.getMonth() + 1).padStart(2, "0") + "-" +
                        String(completed_d.getDate()).padStart(2, "0");
                      if (completedStr > expectedStr) {
                        completedLate = true;
                      }
                    }
                  }

                  return (
                    <DayCard
                      key={day}
                      dayNumber={day}
                      title={title}
                      subtitle={subtitle}
                      isCompleted={completed}
                      isCompletedOutOfOrder={completedLate}
                      isToday={isToday}
                      isLocked={isLocked}
                      isTrackB={!isTrackA}
                      morningCompleted={isPeriodCompleted(day, "morning")}
                      eveningCompleted={isPeriodCompleted(day, "evening")}
                      backgroundImage={isTrackA ? getTrackAImage(day, trackASummaries) : undefined}
                      cohortStartDate={cohortStartDate}
                      onClick={() => handleCardClick(day)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <OverviewGuideModal
        open={guideModalOpen}
        onOpenChange={setGuideModalOpen}
        weekNumber={activeWeek}
        weekTheme={activeWeekTheme}
      />

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
