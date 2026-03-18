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
import { Church, BookOpen, Lock, Info, Check } from "lucide-react";

import trackAImg1 from "@assets/image_1771985019617.png";
import trackAImg2 from "@assets/image_1771985039759.png";
import trackAImg3 from "@assets/image_1771985088299.png";
import trackAImg4 from "@assets/image_1771985210712.png";
import trackAImg5 from "@assets/image_1771985228368.png";
import trackAImg6 from "@assets/image_1771985236426.png";
import goldFrameImg from "@assets/gold_frame_prelim.avif";

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

function SundayBanner() {
  return (
    <div
      data-testid="banner-sunday"
      className="relative flex items-center gap-3 p-5 rounded-lg text-left w-full min-h-[72px] sm:col-span-2 overflow-hidden my-3"
      style={{
        background: "linear-gradient(90deg, rgba(45,74,34,0.5) 0%, rgba(92,107,50,0.35) 100%)",
        border: "1px solid rgba(139,125,60,0.2)",
      }}
    >
      <div className="flex items-center gap-4 w-full justify-center">
        <Church className="w-6 h-6" style={{ color: "rgba(212,200,118,0.7)" }} />
        <p
          style={{
            fontFamily: "'IT Cathdra Demo', sans-serif",
            fontSize: "16px",
            color: "rgba(212,200,118,0.9)",
          }}
        >
          Sunday — Go to Mass
        </p>
        <Church className="w-6 h-6" style={{ color: "rgba(212,200,118,0.7)" }} />
      </div>
    </div>
  );
}

function DarkSectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center" style={{ gap: "16px", padding: "16px 0" }}>
      <div
        className="flex-1 h-px rounded-full"
        style={{ background: "rgba(180,188,208,0.1)" }}
      />
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontWeight: 400,
          fontSize: "12px",
          color: "#d0d6e0",
          letterSpacing: "2.4px",
          lineHeight: "24px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </p>
      <div
        className="flex-1 h-px rounded-full"
        style={{ background: "rgba(180,188,208,0.1)" }}
      />
    </div>
  );
}

function GoldFramePrelimCard({
  module,
  isAccessible,
  onClick,
}: {
  module: PrelimModuleWithStatus;
  isAccessible: boolean;
  onClick: () => void;
}) {
  const { completed, position, title } = module;
  const state = completed ? "completed" : isAccessible ? "active" : "locked";
  const isClickable = state === "active" || state === "completed";

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      data-testid={`card-prelim-${position}`}
      className="relative w-full"
      style={{
        aspectRatio: "178 / 154",
        overflow: "clip",
        borderRadius: "4px",
        opacity: state === "locked" ? 0.5 : 1,
        cursor: isClickable ? "pointer" : "not-allowed",
        transition: "opacity 0.2s",
      }}
    >
      <img
        src={goldFrameImg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", pointerEvents: "none" }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-end"
        style={{ padding: "12px 10px 14px" }}
      >
        {state === "completed" && (
          <div
            className="absolute top-2 right-2 flex items-center justify-center rounded-full"
            style={{
              width: "22px",
              height: "22px",
              background: "rgba(0,0,0,0.6)",
              border: "0.5px solid rgba(255,255,255,0.15)",
            }}
          >
            <Check className="w-3 h-3 text-emerald-400" />
          </div>
        )}
        {state === "locked" && (
          <div
            className="absolute top-2 right-2 flex items-center justify-center rounded-full"
            style={{
              width: "22px",
              height: "22px",
              background: "rgba(0,0,0,0.6)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <Lock className="w-3 h-3 text-white/40" />
          </div>
        )}

        <p
          className="text-center w-full"
          style={{
            fontFamily: "'IT Cathdra Demo', sans-serif",
            fontSize: "15px",
            color: "#ffffff",
            lineHeight: "1.3",
            letterSpacing: "-0.14px",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </p>
      </div>
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
        "relative flex flex-col justify-between text-left w-full transition-opacity duration-200 sm:col-span-2",
        !isUnlocked && "opacity-40 cursor-not-allowed",
        isUnlocked && "cursor-pointer hover:opacity-90",
      )}
      style={{
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
        padding: "12.17px 12.17px 14.118px 12.17px",
        minHeight: "100px",
        overflow: "clip",
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-60px",
            top: "-40px",
            width: "380px",
            height: "180px",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      )}
      {imageUrl && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, #0f1011 30%, rgba(15,16,17,0.6) 55%, rgba(15,16,17,0) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-10 flex items-center gap-2">
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "5px",
            background: "rgba(0,0,0,0.72)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <BookOpen className="w-3.5 h-3.5 text-white/60" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-0 min-w-0" style={{ maxWidth: "60%" }}>
        <p
          className="text-white"
          data-testid="text-day0-title"
          style={{
            fontFamily: "'IT Cathdra Demo', sans-serif",
            fontSize: "18px",
            lineHeight: "28px",
          }}
        >
          Introduction to Lumen Fidei
        </p>
        <p
          className="text-[#d0d6e0]"
          data-testid="text-day0-subtitle"
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            letterSpacing: "2.4px",
            lineHeight: "24px",
          }}
        >
          DAY 0
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
  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prelimSectionRef = useRef<HTMLDivElement>(null);

  const [activeWeek, setActiveWeek] = useState(() => Math.min(Math.ceil(currentDay / 6), 5) || 1);
  const [inPrelimSection, setInPrelimSection] = useState(() => !!(prelimModulesData && prelimModulesData.length > 0));

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

  useEffect(() => {
    const container = scrollRef.current;
    const target = prelimSectionRef.current;
    if (!container || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInPrelimSection(entry.isIntersecting),
      { root: container, rootMargin: "0px 0px -40% 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

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
    <div className="flex flex-col h-full" style={{ background: "#0f1011" }}>
      <div className="px-2 sm:px-4 pt-2">
        <StickyWeekHeader
          weekNumber={activeWeek}
          weekTheme={activeWeekTheme}
          onGuideClick={() => setGuideModalOpen(true)}
          inPrelimSection={inPrelimSection}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-8 custom-scrollbar" style={{ marginTop: "12px" }}>
        <div className="max-w-[640px] mx-auto px-2 sm:px-4">

          {prelimModulesData && prelimModulesData.length > 0 && (
            <div ref={prelimSectionRef}>
              <DarkSectionDivider label="PRE-MODULES" />
              <div
                className="grid gap-[18px]"
                style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
              >
                {prelimModulesData.map((mod) => {
                  const prevDone =
                    mod.position === 1 ||
                    prelimModulesData.find(m => m.position === mod.position - 1)?.completed;
                  const isAccessible = !!prevDone && !mod.completed;
                  return (
                    <GoldFramePrelimCard
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

          {!allPrelimsComplete && (
            <div
              className="mt-4 mb-2 flex items-start gap-2 rounded-lg px-3 py-2.5"
              style={{
                background: "rgba(180,140,40,0.08)",
                border: "1px solid rgba(180,140,40,0.2)",
              }}
              data-testid="banner-prelims-incomplete"
            >
              <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "rgba(212,180,80,0.7)" }} />
              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "12px",
                  color: "#d0d6e0",
                  lineHeight: "20px",
                }}
              >
                <span style={{ fontWeight: 600, color: "#d4b850" }}>Complete the intro modules above</span> to unlock the program. Each module must be done in order.
              </p>
            </div>
          )}

          {allPrelimsComplete && currentDay === 0 && (
            <div
              className="mt-4 mb-2 flex items-start gap-2 rounded-lg px-3 py-2.5"
              style={{
                background: "rgba(40,80,160,0.08)",
                border: "1px solid rgba(40,80,160,0.2)",
              }}
              data-testid="banner-cohort-not-started"
            >
              <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "rgba(100,140,220,0.7)" }} />
              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "12px",
                  color: "#d0d6e0",
                  lineHeight: "20px",
                }}
              >
                <span style={{ fontWeight: 600, color: "#8aabde" }}>Your cohort hasn't started yet.</span> Begin with the Introduction below while you wait.
              </p>
            </div>
          )}

          {isTrackA && (
            <div className="mb-2">
              <DarkSectionDivider label="INTRODUCTION" />
              <Day0Card
                isUnlocked={day0Unlocked}
                onClick={() => onDaySelect(0)}
                imageUrl={trackASummaries?.find(c => c.dayNumber === 0)?.imageUrl}
              />
            </div>
          )}

          {weekGroups.map(({ week, days }, groupIdx) => (
            <div key={week}>
              {groupIdx === 0 ? (
                <DarkSectionDivider label={`WEEK ${week} — ${getWeekTheme(week, isTrackA, trackASummaries, trackBSummaries, trackAModules).toUpperCase()}`} />
              ) : (
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
