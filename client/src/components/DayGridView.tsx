import { useRef, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DayCard } from "./DayCard";
import { PeriodSelectionDialog } from "./PeriodSelectionDialog";
import { OverviewGuideModal } from "./OverviewGuideModal";
import type { ContentSummary } from "@/hooks/use-content-summaries";
import type { TrackAContent, TrackAModule, PrelimModuleWithStatus } from "@shared/schema";
import { CheckCircle2, Map as MapIcon, Scale, Lock, Loader, CircleCheck } from "lucide-react";

import trackAImg1 from "@assets/image_1771985019617.png";
import trackAImg2 from "@assets/image_1771985039759.png";
import trackAImg3 from "@assets/image_1771985088299.png";
import trackAImg4 from "@assets/image_1771985210712.png";
import trackAImg5 from "@assets/image_1771985228368.png";
import trackAImg6 from "@assets/image_1771985236426.png";

const FALLBACK_IMAGES = [trackAImg1, trackAImg2, trackAImg3, trackAImg4, trackAImg5, trackAImg6];

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

function getWeekTheme(weekNumber: number, isTrackA: boolean, trackBSummaries?: ContentSummary[], modules?: TrackAModule[]): string {
  if (isTrackA) {
    const mod = modules?.find(m => m.weekNumber === weekNumber);
    if (mod) return mod.subtitle || mod.title;
  } else if (trackBSummaries) {
    const day = trackBSummaries.find(c => c.weekNumber === weekNumber);
    if (day?.weekTitle) return day.weekTitle;
  }
  return `Week ${weekNumber}`;
}

function getDayTitle(day: number, isTrackA: boolean, trackASummaries?: TrackAContent[], trackBSummaries?: ContentSummary[]): string {
  if (isTrackA && trackASummaries) {
    return trackASummaries.find(c => c.dayNumber === day)?.centralTheme || "Daily Activity";
  }
  if (trackBSummaries) {
    return trackBSummaries.find(c => c.dayNumber === day)?.title || `Day ${day}`;
  }
  return `Day ${day}`;
}

function getTrackAImage(dayNumber: number, trackASummaries?: TrackAContent[]): string | undefined {
  const content = trackASummaries?.find(c => c.dayNumber === dayNumber);
  if (content?.imageUrl) return content.imageUrl;
  return FALLBACK_IMAGES[(dayNumber - 1) % FALLBACK_IMAGES.length];
}

function groupDaysByWeek(days: number[]): { week: number; days: number[] }[] {
  const result: { week: number; days: number[] }[] = [];
  for (let w = 1; w <= 5; w++) {
    const weekDays = days.filter(d => Math.ceil(d / 6) === w);
    if (weekDays.length > 0) result.push({ week: w, days: weekDays });
  }
  return result;
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", margin: "20px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
      <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "12px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
    </div>
  );
}

function TwoColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "296px 296px", gap: "16px", width: "608px", maxWidth: "100%" }}>
      {children}
    </div>
  );
}

function SundayBanner() {
  return (
    <div data-testid="banner-sunday" style={{ width: "100%", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", border: "0.487px solid rgba(255,255,255,0.07)", borderRadius: "5.842px", margin: "12px 0", fontFamily: "'Afacad', sans-serif", fontSize: "12px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
      ✦ Sunday — Rest &amp; Mass ✦
    </div>
  );
}

const PRELIM_ICONS = [MapIcon, Scale];

function PrelimCard({ module, isAccessible, onClick }: { module: PrelimModuleWithStatus; isAccessible: boolean; onClick: () => void }) {
  const { completed, position, title, subtitle, imageUrl } = module;
  const available = completed || isAccessible;
  const Icon = PRELIM_ICONS[(position - 1) % PRELIM_ICONS.length];

  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      data-testid={`card-prelim-${position}`}
      style={{ position: "relative", textAlign: "left", overflow: "hidden", width: "100%", background: "#0f1011", border: "0.487px solid rgba(255,255,255,0.05)", borderRadius: "5.842px", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "12.17px", paddingLeft: "12.17px", paddingRight: "12.17px", paddingBottom: "14.118px", minHeight: "126px", transition: "transform 0.15s ease, border-color 0.15s ease", opacity: available ? 1 : 0.4, cursor: available ? "pointer" : "not-allowed" }}
      onMouseEnter={(e) => { if (available) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; } }}
      onMouseLeave={(e) => { if (available) { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.05)"; } }}
    >
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)", pointerEvents: "none" }} />
        </>
      )}
      {/* State icon — top-left, Figma spec: square box with 5% fill */}
      <div style={{ position: "relative", zIndex: 1, width: "23.367px", height: "23.367px", borderRadius: "4px", background: !available ? "transparent" : completed ? "rgba(0,255,0,0.05)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {!available ? (
          <Lock style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.3)" }} />
        ) : completed ? (
          <CircleCheck style={{ width: "13px", height: "13px", color: "#00ff00", strokeWidth: 1.8 }} />
        ) : (
          <Loader style={{ width: "13px", height: "13px", color: "#ffffff", strokeWidth: 1.8 }} />
        )}
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif", fontSize: "16px", lineHeight: "15.5px", letterSpacing: "-0.14px", color: "white", fontWeight: 500, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{title}</p>
        {subtitle && (
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", lineHeight: "13px", letterSpacing: "0px", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>
        )}
      </div>
    </button>
  );
}



function StickyWeekBanner({ weekNumber, title, onGuideClick }: { weekNumber: number; title: string; onGuideClick: () => void }) {
  return (
    <div className="sticky z-20" style={{ top: "12px" }}>
      <div
        style={{
          background: "#191a1b",
          border: "0.5px solid rgba(255,255,255,0.05)",
          borderRadius: "8px",
          boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.25), 0px 4px 6px 0px rgba(0,0,0,0.12)",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: week label + title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "12px",
            fontWeight: 400,
            letterSpacing: "2.4px",
            color: "#d0d6e0",
            textTransform: "uppercase",
            lineHeight: "24px",
          }}>
            Week {weekNumber} of 5
          </p>
          <p style={{
            fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
            fontSize: "18px",
            fontWeight: 500,
            color: "white",
            lineHeight: "28px",
          }}>
            {title}
          </p>
        </div>

        {/* Right: Overview & Guide button */}
        <button
          data-testid="button-week-guide"
          onClick={onGuideClick}
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "10px",
            fontWeight: 400,
            color: "white",
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.06)",
            borderRadius: "4px",
            padding: "8px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Overview &amp; Guide
        </button>
      </div>
    </div>
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
  const [selectedDayForDialog, setSelectedDayForDialog] = useState(0);
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
            const w = Number(entry.target.getAttribute("data-week"));
            if (w) setActiveWeek(w);
          }
        }
      },
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    weekRefs.current.forEach(el => observer.observe(el));
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

  const activeWeekTheme = getWeekTheme(activeWeek, isTrackA, trackBSummaries, trackAModules);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingBottom: "64px", paddingTop: "12px", position: "relative" }} className="custom-scrollbar">
        <div style={{ maxWidth: "608px", margin: "0 auto" }}>

          <StickyWeekBanner weekNumber={activeWeek} title={activeWeekTheme} onGuideClick={() => setGuideModalOpen(true)} />

          <div style={{ paddingTop: "24px" }}>
            {prelimModulesData && prelimModulesData.length > 0 && (
              <>
                <SectionDivider label="Pre-Modules" />
                <TwoColGrid>
                  {prelimModulesData.map((mod) => {
                    const prevDone = mod.position === 1 || prelimModulesData.find(m => m.position === mod.position - 1)?.completed;
                    return (
                      <PrelimCard
                        key={mod.position}
                        module={mod}
                        isAccessible={!!prevDone && !mod.completed}
                        onClick={() => onPrelimSelect?.(mod.position)}
                      />
                    );
                  })}
                </TwoColGrid>
              </>
            )}

            {weekGroups.map(({ week, days }, groupIdx) => {
              const weekTheme = getWeekTheme(week, isTrackA, trackBSummaries, trackAModules);

              return (
                <div key={week} ref={(el) => setWeekRef(week, el)} data-week={week}>
                  {groupIdx > 0 && <SundayBanner />}

                  <SectionDivider label={`Week ${week}`} />

                  {groupIdx === 0 && isTrackA && (
                    <div style={{ gridColumn: "1 / -1", marginBottom: "16px" }}>
                      <DayCard
                        variant="full"
                        dayNumber={0}
                        title="Introduction — Goal of 30 Days"
                        subtitle="Begin your journey"
                        isCompleted={false}
                        isToday={false}
                        isLocked={!allPrelimsComplete}
                        backgroundImage={trackASummaries?.find(c => c.dayNumber === 0)?.imageUrl ?? undefined}
                        cohortStartDate={cohortStartDate}
                        onClick={() => onDaySelect(0)}
                      />
                    </div>
                  )}

                  <TwoColGrid>
                    {days.map((day) => {
                      const isLocked = day > currentDay || !allPrelimsComplete;
                      const isToday = day === currentDay && allPrelimsComplete;
                      const completed = isDayCompleted(day);
                      const title = getDayTitle(day, isTrackA, trackASummaries, trackBSummaries);
                      const subtitle = isTrackA ? trackASummaries?.find(c => c.dayNumber === day)?.subtitle ?? undefined : undefined;

                      let completedLate = false;
                      if (isTrackA && completed && cohortStartDate && prayerCompletions) {
                        const record = prayerCompletions.find(c => c.dayNumber === day && c.period === "morning");
                        if (record) {
                          const start = new Date(cohortStartDate + "T00:00:00");
                          const programDayIndex = day - 1;
                          const offset = Math.floor(programDayIndex / 6) * 7 + (programDayIndex % 6);
                          const expected = new Date(start);
                          expected.setDate(start.getDate() + offset);
                          const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                          if (fmt(new Date(record.completedAt as string)) > fmt(expected)) completedLate = true;
                        }
                      }

                      return (
                        <DayCard
                          key={day}
                          variant="half"
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
                  </TwoColGrid>
                </div>
              );
            })}
          </div>
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
          dayTitle={getDayTitle(selectedDayForDialog, isTrackA, trackASummaries, trackBSummaries)}
          morningCompleted={isPeriodCompleted(selectedDayForDialog, "morning")}
          eveningCompleted={isPeriodCompleted(selectedDayForDialog, "evening")}
          onSelect={handlePeriodSelect}
        />
      )}
    </div>
  );
}
