import { useRef, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { DayCard } from "./DayCard";
import { PeriodSelectionDialog } from "./PeriodSelectionDialog";
import { OverviewGuideModal } from "./OverviewGuideModal";
import type { ContentSummary } from "@/hooks/use-content-summaries";
import type { TrackAContent, TrackAModule, PrelimModuleWithStatus } from "@shared/schema";
import { CheckCircle2, Lock, Map as MapIcon, Scale, Layers, BookOpen } from "lucide-react";

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
  completedAt: string | Date;
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

/** Centered divider: ─── LABEL ─── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 w-full my-4">
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.12)]" />
      <span
        className="text-[rgba(255,255,255,0.35)] uppercase tracking-[0.14em] text-[10px] shrink-0"
        style={{ fontFamily: "'Afacad', sans-serif" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.12)]" />
    </div>
  );
}

/** Week/section header card — shows "WEEK N" + theme title */
function WeekHeaderCard({
  weekNumber,
  theme,
}: {
  weekNumber: number;
  theme: string;
}) {
  return (
    <div
      className="w-full flex flex-col items-center justify-center mb-4"
      style={{
        height: "88px",
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.07)",
        borderRadius: "5.842px",
      }}
    >
      <p
        className="uppercase tracking-[0.13em] text-[rgba(255,255,255,0.35)] text-[10px] mb-1"
        style={{ fontFamily: "'Afacad', sans-serif" }}
      >
        Week {weekNumber}
      </p>
      <p
        className="text-white text-center px-6 leading-tight"
        style={{
          fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
          fontSize: "20px",
          fontWeight: 500,
          maxWidth: "420px",
        }}
      >
        {theme}
      </p>
    </div>
  );
}

/** Sunday rest banner */
function SundayBanner() {
  return (
    <div
      data-testid="banner-sunday"
      className="w-full flex items-center justify-center gap-3 my-3"
      style={{
        height: "44px",
        background: "rgba(255,255,255,0.03)",
        border: "0.487px solid rgba(255,255,255,0.07)",
        borderRadius: "5.842px",
      }}
    >
      <span
        className="text-[rgba(255,255,255,0.4)] text-[12px] tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Afacad', sans-serif" }}
      >
        ✦ Sunday — Rest &amp; Mass ✦
      </span>
    </div>
  );
}

const PRELIM_ICONS = [MapIcon, Scale, Layers];

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
  const Icon = PRELIM_ICONS[(position - 1) % PRELIM_ICONS.length];
  const isClickable = state === "active" || state === "completed";

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      data-testid={`card-prelim-${position}`}
      className={cn(
        "relative text-left transition-all duration-200 overflow-hidden group w-full",
        !isClickable ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-110",
      )}
      style={{
        height: "126px",
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
      }}
    >
      {/* State icon */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "12.17px", top: "12.17px", width: "23.367px", height: "23.367px" }}
      >
        {state === "completed" ? (
          <div
            className="flex items-center justify-center rounded-full bg-[#22c55e]"
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        ) : state === "active" ? (
          <div
            className="flex items-center justify-center rounded-full bg-[rgba(240,120,48,0.15)]"
            style={{ width: "23.367px", height: "23.367px" }}
          >
            <Icon className="w-3 h-3 text-[#F07830]" />
          </div>
        ) : (
          <div
            className="rounded-full border border-[rgba(255,255,255,0.12)]"
            style={{ width: "23.367px", height: "23.367px" }}
          />
        )}
      </div>

      {/* Text block */}
      <div
        className="absolute"
        style={{ left: "12.17px", top: "77.094px", maxWidth: "175.25px" }}
      >
        <p
          className="text-white text-[13px] leading-[16px] font-medium truncate"
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-[rgba(255,255,255,0.45)] text-[11px] leading-[14px] truncate mt-[3px]"
            style={{ fontFamily: "'Afacad', sans-serif" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Locked icon top-right */}
      {state === "locked" && (
        <div className="absolute top-3 right-3">
          <Lock className="w-3 h-3 text-white/20" />
        </div>
      )}
    </button>
  );
}

/** Day 0 / Introduction full-width card */
function Day0Card({
  isUnlocked,
  onClick,
  imageUrl,
}: {
  isUnlocked: boolean;
  onClick: () => void;
  imageUrl?: string | null;
}) {
  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      data-testid="card-day-0"
      className={cn(
        "relative text-left transition-all duration-200 overflow-hidden w-full",
        !isUnlocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-110",
      )}
      style={{
        height: "126px",
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
      }}
    >
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute object-cover pointer-events-none"
            style={{ left: "224px", top: "-58px", width: "463px", height: "auto", minHeight: "242px" }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(267.99deg, rgba(15,16,17,0) 30%, rgb(15,16,17) 65%)",
            }}
          />
        </>
      )}

      {/* Icon */}
      <div
        className="absolute flex items-center justify-center rounded-full bg-[rgba(240,120,48,0.15)]"
        style={{ left: "12.17px", top: "12.17px", width: "23.367px", height: "23.367px" }}
      >
        <BookOpen className="w-3 h-3 text-[#F07830]" />
      </div>

      {/* Text */}
      <div
        className="absolute"
        style={{ left: "12.17px", top: "77.094px", maxWidth: "340px" }}
      >
        <p
          data-testid="text-day0-title"
          className="text-white text-[13px] leading-[16px] font-medium"
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          Introduction — Goal of 30 Days
        </p>
        <p
          data-testid="text-day0-subtitle"
          className="text-[rgba(255,255,255,0.45)] text-[11px] leading-[14px] mt-[3px]"
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          Begin your journey
        </p>
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayForDialog, setSelectedDayForDialog] = useState<number>(0);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);

  const allDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekGroups = groupDaysByWeek(allDays);

  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map());
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
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 },
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

  const dialogDayTitle = getDayTitle(selectedDayForDialog, isTrackA, trackASummaries, trackBSummaries);
  const day0Unlocked = allPrelimsComplete;

  const activeWeekTheme = getWeekTheme(activeWeek, isTrackA, trackASummaries, trackBSummaries, trackAModules);

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-16 custom-scrollbar">
        {/* 608px centered content column */}
        <div className="mx-auto px-4" style={{ maxWidth: "608px" }}>

          {/* Before You Begin — pre-modules */}
          {prelimModulesData && prelimModulesData.length > 0 && (
            <div className="mt-8">
              <SectionDivider label="Before You Begin" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prelimModulesData.map((mod) => {
                  const prevDone =
                    mod.position === 1 ||
                    prelimModulesData.find((m) => m.position === mod.position - 1)?.completed;
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
            </div>
          )}

          {/* Lock-reason banners */}
          {!allPrelimsComplete && (
            <div
              className="mt-3 px-3 py-2.5 rounded-lg flex items-start gap-2"
              style={{
                background: "rgba(240,120,48,0.08)",
                border: "0.487px solid rgba(240,120,48,0.25)",
                borderRadius: "5.842px",
              }}
              data-testid="banner-prelims-incomplete"
            >
              <Lock className="w-3.5 h-3.5 text-[#F07830] mt-0.5 shrink-0" />
              <p
                className="text-[rgba(255,255,255,0.5)] text-[12px] leading-relaxed"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                <span className="text-[#F07830] font-medium">Complete the intro modules above</span>{" "}
                to unlock the 30-day program. Each must be done in order.
              </p>
            </div>
          )}

          {allPrelimsComplete && currentDay === 0 && (
            <div
              className="mt-3 px-3 py-2.5 rounded-lg flex items-start gap-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.487px solid rgba(255,255,255,0.1)",
                borderRadius: "5.842px",
              }}
              data-testid="banner-cohort-not-started"
            >
              <p
                className="text-[rgba(255,255,255,0.45)] text-[12px] leading-relaxed"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                <span className="text-white font-medium">Your cohort hasn't started yet.</span>{" "}
                Begin with the Introduction while you wait.
              </p>
            </div>
          )}

          {/* Weeks */}
          {weekGroups.map(({ week, days }, groupIdx) => {
            const weekTheme = getWeekTheme(week, isTrackA, trackASummaries, trackBSummaries, trackAModules);

            return (
              <div key={week} ref={(el) => setWeekRef(week, el)} data-week={week}>
                {/* Divider between weeks */}
                {groupIdx > 0 && <SundayBanner />}

                {/* Section header or divider */}
                {groupIdx === 0 ? (
                  <div className="mt-8">
                    <div
                      className="w-full flex flex-col items-center justify-center mb-4"
                      style={{
                        height: "88px",
                        background: "#0f1011",
                        border: "0.487px solid rgba(255,255,255,0.07)",
                        borderRadius: "5.842px",
                      }}
                    >
                      <p
                        className="uppercase tracking-[0.13em] text-[rgba(255,255,255,0.35)] text-[10px] mb-1"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        Initial 30 Days
                      </p>
                      <p
                        className="text-white text-center px-6 leading-tight"
                        style={{
                          fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                          fontSize: "20px",
                          fontWeight: 500,
                          maxWidth: "420px",
                        }}
                      >
                        {weekTheme}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <WeekHeaderCard weekNumber={week} theme={weekTheme} />
                  </div>
                )}

                {/* Day 0 full-width card — only in Week 1 for Track A */}
                {groupIdx === 0 && isTrackA && (
                  <div className="mb-4">
                    <Day0Card
                      isUnlocked={day0Unlocked}
                      onClick={() => onDaySelect(0)}
                      imageUrl={trackASummaries?.find((c) => c.dayNumber === 0)?.imageUrl}
                    />
                  </div>
                )}

                {/* Day cards — 2-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {days.map((day) => {
                    const isLocked = day > currentDay || !allPrelimsComplete;
                    const isToday = day === currentDay && allPrelimsComplete;
                    const completed = isDayCompleted(day);
                    const title = getDayTitle(day, isTrackA, trackASummaries, trackBSummaries);
                    const trackADay = isTrackA ? trackASummaries?.find((c) => c.dayNumber === day) : undefined;
                    const subtitle = trackADay?.subtitle || undefined;

                    let completedLate = false;
                    if (isTrackA && completed && cohortStartDate && prayerCompletions) {
                      const record = prayerCompletions.find(
                        (c) => c.dayNumber === day && c.period === "morning",
                      );
                      if (record) {
                        const start = new Date(cohortStartDate + "T00:00:00");
                        const programDayIndex = day - 1;
                        const fullWeeks = Math.floor(programDayIndex / 6);
                        const remainder = programDayIndex % 6;
                        const calendarOffset = fullWeeks * 7 + remainder;
                        const expectedDate = new Date(start);
                        expectedDate.setDate(start.getDate() + calendarOffset);
                        const fmt = (d: Date) =>
                          d.getFullYear() + "-" +
                          String(d.getMonth() + 1).padStart(2, "0") + "-" +
                          String(d.getDate()).padStart(2, "0");
                        if (fmt(new Date(record.completedAt)) > fmt(expectedDate)) completedLate = true;
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
            );
          })}
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
