import { useRef, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DayCard } from "./DayCard";
import { PeriodSelectionDialog } from "./PeriodSelectionDialog";
import { OverviewGuideModal } from "./OverviewGuideModal";
import type { ContentSummary } from "@/hooks/use-content-summaries";
import type { TrackAContent, TrackAModule, PrelimModuleWithStatus } from "@shared/schema";
import { CheckCircle2, Map as MapIcon, Scale, Layers, BookOpen } from "lucide-react";

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
    if (weekDays.length > 0) weeks.push({ week: w, days: weekDays });
  }
  return weeks;
}

/** Horizontal divider: [line] [text] [line] — Figma exact */
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", margin: "20px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
      <span style={{ flexShrink: 0, fontFamily: "'Afacad', sans-serif", fontSize: "12px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
    </div>
  );
}

/** 608px × 88px section header card — Afacad eyebrow + Ivy Ora Display 28px title */
function SectionHeaderCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{
      width: "100%",
      height: "88px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1011",
      border: "0.487px solid rgba(255,255,255,0.07)",
      borderRadius: "5.842px",
      marginBottom: "16px",
    }}>
      <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", letterSpacing: "0.13em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "4px" }}>
        {eyebrow}
      </p>
      <p style={{ fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: 500, color: "white", textAlign: "center", padding: "0 24px", lineHeight: 1.2 }}>
        {title}
      </p>
    </div>
  );
}

/** Sunday rest banner — between week groups */
function SundayBanner() {
  return (
    <div data-testid="banner-sunday" style={{
      width: "100%",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.03)",
      border: "0.487px solid rgba(255,255,255,0.07)",
      borderRadius: "5.842px",
      margin: "12px 0",
      fontFamily: "'Afacad', sans-serif",
      fontSize: "12px",
      letterSpacing: "0.1em",
      color: "rgba(255,255,255,0.4)",
      textTransform: "uppercase",
    }}>
      ✦ Sunday — Rest &amp; Mass ✦
    </div>
  );
}

/** Fixed 296px × 296px two-column grid */
function TwoColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "296px 296px", gap: "16px", width: "608px", maxWidth: "100%" }}>
      {children}
    </div>
  );
}

/** Reusable card shell — matches Figma card spec exactly */
function CardShell({
  isClickable = true,
  onClick,
  testId,
  children,
}: {
  isClickable?: boolean;
  onClick?: () => void;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      data-testid={testId}
      style={{
        position: "relative",
        textAlign: "left",
        overflow: "hidden",
        width: "100%",
        height: "126px",
        background: "#0f1011",
        border: "0.487px solid rgba(255,255,255,0.05)",
        borderRadius: "5.842px",
        paddingTop: "12.17px",
        paddingBottom: "14.118px",
        paddingLeft: "12.17px",
        paddingRight: "12.17px",
        transition: "transform 0.15s ease, border-color 0.15s ease",
        cursor: isClickable ? "pointer" : "not-allowed",
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = "translateY(-2px)";
          el.style.borderColor = "rgba(255,255,255,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = "";
          el.style.borderColor = "rgba(255,255,255,0.05)";
        }
      }}
    >
      {children}
    </button>
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
    <CardShell isClickable={isClickable} onClick={onClick} testId={`card-prelim-${position}`}>
      {/* State icon — absolute positioned per Figma (overrides padding) */}
      <div style={{ position: "absolute", left: "12.17px", top: "12.17px", width: "23.367px", height: "23.367px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {state === "completed" ? (
          <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 style={{ width: "12px", height: "12px", color: "white" }} />
          </div>
        ) : state === "active" ? (
          <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", background: "rgba(240,120,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon style={{ width: "11px", height: "11px", color: "#F07830" }} />
          </div>
        ) : (
          <div style={{ width: "23.367px", height: "23.367px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)" }} />
        )}
      </div>

      {/* Text block — absolute positioned per Figma */}
      <div style={{ position: "absolute", left: "12.17px", top: "77.094px", width: "175.25px" }}>
        <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", lineHeight: "16px", color: "white", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", lineHeight: "11px", marginTop: "23.788px", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </p>
        )}
      </div>
    </CardShell>
  );
}

/** Day 0 / Introduction — full-width card */
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
    <CardShell isClickable={isUnlocked} onClick={onClick} testId="card-day-0">
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" style={{ position: "absolute", left: "224px", top: "-58px", width: "463px", height: "auto", minHeight: "242px", objectFit: "cover", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)", pointerEvents: "none" }} />
        </>
      )}

      <div style={{ position: "absolute", left: "12.17px", top: "12.17px", width: "23.367px", height: "23.367px", borderRadius: "50%", background: "rgba(240,120,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BookOpen style={{ width: "11px", height: "11px", color: "#F07830" }} />
      </div>

      <div style={{ position: "absolute", left: "12.17px", top: "77.094px", width: "340px" }}>
        <p data-testid="text-day0-title" style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", lineHeight: "16px", color: "white", fontWeight: 500 }}>
          Introduction — Goal of 30 Days
        </p>
        <p data-testid="text-day0-subtitle" style={{ fontFamily: "'Afacad', sans-serif", fontSize: "10px", lineHeight: "11px", marginTop: "23.788px", color: "rgba(255,255,255,0.45)" }}>
          Begin your journey
        </p>
      </div>
    </CardShell>
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
  const activeWeekTheme = getWeekTheme(activeWeek, isTrackA, trackASummaries, trackBSummaries, trackAModules);
  const week1Theme = getWeekTheme(1, isTrackA, trackASummaries, trackBSummaries, trackAModules);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingBottom: "64px" }} className="custom-scrollbar">
        {/* 608px centered column */}
        <div style={{ maxWidth: "608px", margin: "0 auto", padding: "32px 16px" }}>

          {/* ── Top section header: "INITIAL 30 DAYS" + Week 1 title ── */}
          <SectionHeaderCard
            eyebrow="Initial 30 Days"
            title={week1Theme}
          />

          {/* ── PRE-MODULES divider + grid ── */}
          {prelimModulesData && prelimModulesData.length > 0 && (
            <>
              <SectionDivider label="Pre-Modules" />
              <TwoColGrid>
                {prelimModulesData.map((mod) => {
                  const prevDone =
                    mod.position === 1 ||
                    prelimModulesData.find((m) => m.position === mod.position - 1)?.completed;
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

          {/* ── WEEK sections: divider + full-width intro + 2-col day cards ── */}
          {weekGroups.map(({ week, days }, groupIdx) => {
            const weekTheme = getWeekTheme(week, isTrackA, trackASummaries, trackBSummaries, trackAModules);

            return (
              <div key={week} ref={(el) => setWeekRef(week, el)} data-week={week}>

                {/* Sunday banner between weeks */}
                {groupIdx > 0 && <SundayBanner />}

                {/* Per-week divider (skip for week 1 — covered by top header) */}
                {groupIdx > 0 && (
                  <>
                    <SectionDivider label={`Week ${week}`} />
                    {/* Per-week section header card */}
                    <SectionHeaderCard eyebrow={`Week ${week}`} title={weekTheme} />
                  </>
                )}

                {/* Full-width intro card — Track A week 1 = Day 0 */}
                {groupIdx === 0 && isTrackA && (
                  <div style={{ marginBottom: "16px" }}>
                    <Day0Card
                      isUnlocked={allPrelimsComplete}
                      onClick={() => onDaySelect(0)}
                      imageUrl={trackASummaries?.find((c) => c.dayNumber === 0)?.imageUrl}
                    />
                  </div>
                )}

                {/* 2-col day card grid */}
                <TwoColGrid>
                  {days.map((day) => {
                    const isLocked = day > currentDay || !allPrelimsComplete;
                    const isToday = day === currentDay && allPrelimsComplete;
                    const completed = isDayCompleted(day);
                    const title = getDayTitle(day, isTrackA, trackASummaries, trackBSummaries);
                    const trackADay = isTrackA ? trackASummaries?.find((c) => c.dayNumber === day) : undefined;
                    const subtitle = trackADay?.subtitle ?? undefined;

                    let completedLate = false;
                    if (isTrackA && completed && cohortStartDate && prayerCompletions) {
                      const record = prayerCompletions.find(c => c.dayNumber === day && c.period === "morning");
                      if (record) {
                        const start = new Date(cohortStartDate + "T00:00:00");
                        const programDayIndex = day - 1;
                        const fullWeeks = Math.floor(programDayIndex / 6);
                        const remainder = programDayIndex % 6;
                        const expectedDate = new Date(start);
                        expectedDate.setDate(start.getDate() + fullWeeks * 7 + remainder);
                        const fmt = (d: Date) =>
                          d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
                        if (fmt(new Date(record.completedAt)) > fmt(expectedDate)) completedLate = true;
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
