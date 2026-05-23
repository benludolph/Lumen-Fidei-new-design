import { useRef, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { PageContainer } from "@/components/layout/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { DayCard } from "./DayCard";
import { PeriodSelectionDialog } from "./PeriodSelectionDialog";
import { OverviewGuideModal } from "./OverviewGuideModal";
import type { ContentSummary } from "@/hooks/use-content-summaries";
import type { TrackAContent, TrackAModule, PrelimModuleWithStatus, LessonWorkbookModuleWithStatus } from "@shared/schema";
import { CheckCircle2, Map as MapIcon, Scale, Lock, Loader, CircleCheck, Info, X, Download, BookOpen } from "lucide-react";

import certLockedImg from "@assets/Certificate_Locked_1773979233798.png";
import certHoverImg from "@assets/Certificate_Hover_1773979233797.png";
import certBgNormal from "@assets/Certification_normal_1774299706134.webp";
import certBgHover from "@assets/Certification_hover_1774299706134.webp";
import introVideoThumb from "@assets/IntroVideo_1774228694683.webp";
import bookCoverImg from "@assets/BookDeliverance_1779563461903.png";

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
  onWorkbookSelect?: (workbookModuleId: number) => void;
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

// Returns the Track A content at program position N (1-30).
// The all-content API returns items sorted by (week, day_number) — day 0 is special.
function getTrackAAtPosition(position: number, summaries?: TrackAContent[]): TrackAContent | undefined {
  if (!summaries) return undefined;
  const programDays = summaries.filter(c => c.dayNumber > 0);
  return programDays[position - 1];
}

function getDayTitle(day: number, isTrackA: boolean, trackASummaries?: TrackAContent[], trackBSummaries?: ContentSummary[]): string {
  if (isTrackA && trackASummaries) {
    return getTrackAAtPosition(day, trackASummaries)?.centralTheme || "Daily Activity";
  }
  if (trackBSummaries) {
    return trackBSummaries.find(c => c.dayNumber === day)?.title || `Day ${day}`;
  }
  return `Day ${day}`;
}

function getTrackAImage(dayNumber: number, trackASummaries?: TrackAContent[]): string | undefined {
  const content = getTrackAAtPosition(dayNumber, trackASummaries);
  return content?.imageUrl ?? undefined;
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
    <div className="flex items-center gap-3 w-full my-5">
      <div className="flex-1 h-px bg-[var(--white-15)]" />
      <span className="type-caption-sm shrink-0" style={{ color: "var(--white-35)" }}>
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--white-15)]" />
    </div>
  );
}

function TwoColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {children}
    </div>
  );
}

function ThreeColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {children}
    </div>
  );
}

function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleClose = () => {
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = "";
      iframeRef.current.src = src;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--black-85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "860px",
          background: "var(--surface-base)",
          border: "1px solid var(--white-5)",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Close video"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--black-60)",
            border: "1px solid var(--white-15)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
        <div style={{ position: "relative", paddingTop: "56.25%", width: "100%" }}>
          <iframe
            ref={iframeRef}
            src="https://player.vimeo.com/video/1176422917?badge=0&autopause=0&player_id=0&app_id=58479"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="Intro Video"
          />
        </div>
      </div>
    </div>
  );
}

function SundayBanner() {
  return (
    <div
      data-testid="banner-sunday"
      className="type-caption-md w-full h-11 flex items-center justify-center my-3"
      style={{ background: "var(--white-3)", border: "0.5px solid var(--white-7)", borderRadius: "6px", color: "var(--white-40)" }}
    >
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
      className={`day-card-hover relative text-left overflow-hidden w-full flex flex-col justify-between pt-3 px-3 pb-[14px] min-h-[126px] ${available ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
      style={{ background: "var(--surface-base)", border: "0.5px solid var(--white-5)", borderRadius: "6px" }}
    >
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)", pointerEvents: "none" }} />
        </>
      )}
      {/* State icon — top-left, Figma spec: square box with 5% fill */}
      <div style={{ position: "relative", zIndex: 1, width: "24px", height: "24px", borderRadius: "4px", background: !available ? "transparent" : completed ? "rgba(0,255,0,0.05)" : "var(--white-5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {!available ? (
          <Lock style={{ width: "10px", height: "10px", color: "var(--white-30)" }} />
        ) : completed ? (
          <CircleCheck style={{ width: "13px", height: "13px", color: "#00ff00", strokeWidth: 1.8 }} />
        ) : (
          <Loader style={{ width: "13px", height: "13px", color: "#ffffff", strokeWidth: 1.8 }} />
        )}
      </div>
      <div className="relative z-[1] flex flex-col gap-2">
        <p className="type-display-sm" style={{ letterSpacing: "-0.14px", color: "white", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{title}</p>
        {subtitle && (
          <p className="type-body-xs" style={{ color: "var(--white-45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>
        )}
      </div>
    </button>
  );
}



function WorkbookCard({ module, onClick }: { module: LessonWorkbookModuleWithStatus; onClick: () => void }) {
  const { completed, unlocked } = module;
  const available = unlocked || completed;

  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      data-testid={`card-workbook-${module.id}`}
      title={available ? module.title : "Complete this day's morning prayer to unlock"}
      style={{
        flexShrink: 0,
        width: "89px",
        minHeight: "126px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "10px 8px 10px 8px",
        background: "var(--surface-base)",
        border: "0.5px solid var(--white-5)",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: available ? "pointer" : "not-allowed",
        opacity: available ? 1 : 0.45,
        textAlign: "left",
      }}
      className="day-card-hover"
    >
      {/* Stacked pages effect — two pseudo-offset layers behind */}
      <div aria-hidden="true" style={{ position: "absolute", bottom: "-3px", left: "4px", right: "-3px", height: "calc(100% - 6px)", background: "var(--white-4)", border: "0.5px solid var(--white-5)", borderRadius: "5px", zIndex: 0 }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: "-6px", left: "7px", right: "-6px", height: "calc(100% - 10px)", background: "var(--white-2)", border: "0.5px solid var(--white-3)", borderRadius: "5px", zIndex: 0 }} />

      {/* Book cover image — fills entire card */}
      <img
        src={bookCoverImg}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Dark gradient overlay for readability */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,16,17,0.25) 0%, rgba(15,16,17,0.72) 100%)", zIndex: 2, pointerEvents: "none" }} />

      {/* State icon — top-left */}
      <div style={{ position: "relative", zIndex: 3, width: "20px", height: "20px", borderRadius: "4px", background: !available ? "transparent" : completed ? "rgba(0,255,0,0.05)" : "var(--white-5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {!available ? (
          <Lock style={{ width: "9px", height: "9px", color: "var(--white-30)" }} />
        ) : completed ? (
          <CircleCheck style={{ width: "11px", height: "11px", color: "#00ff00", strokeWidth: 1.8 }} />
        ) : (
          <BookOpen style={{ width: "11px", height: "11px", color: "#ffffff", strokeWidth: 1.8 }} />
        )}
      </div>

    </button>
  );
}

function StickyWeekBanner({ weekNumber, title, onGuideClick, inPrelimSection }: { weekNumber: number; title: string; onGuideClick: () => void; inPrelimSection?: boolean }) {
  return (
    <div className="sticky z-20" style={{ top: "12px" }}>
      <div
        className="p-4 flex items-center justify-between"
        style={{
          background: "var(--surface-float)",
          border: "0.5px solid var(--white-5)",
          borderRadius: "8px",
          boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.25), 0px 4px 6px 0px rgba(0,0,0,0.12)",
        }}
      >
        {/* Left: week label + title */}
        <div className="flex flex-col gap-1">
          <p className="type-caption-md" style={{ color: "#d0d6e0" }}>
            {inPrelimSection ? "Getting Started" : `Week ${weekNumber} of 5`}
          </p>
          <p className="type-display-sm" style={{ color: "white" }}>
            {inPrelimSection ? "Foundation & Formation" : title}
          </p>
        </div>

        {/* Right: Overview & Guide button */}
        {!inPrelimSection && (
          <button
            data-testid="button-week-guide"
            onClick={onGuideClick}
            className="type-body-xs"
            style={{
              color: "white",
              background: "var(--white-3)",
              border: "0.5px solid var(--white-6)",
              borderRadius: "4px",
              padding: "8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Overview &amp; Guide
          </button>
        )}
      </div>
    </div>
  );
}

function CertificateModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      data-testid="certificate-modal-backdrop"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        background: "var(--black-80)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="certificate-modal"
        style={{
          position: "relative",
          background: "var(--surface-raised)",
          border: "0.5px solid var(--white-8)",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "100%",
          padding: "36px 32px 28px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          data-testid="button-close-certificate-modal"
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer", color: "var(--white-40)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "4px",
          }}
        >
          <X size={15} />
        </button>

        {/* Heading */}
        <h2
          className="type-display-lg"
          style={{ color: "white", margin: "0 0 10px", paddingRight: "24px" }}
        >
          Your Certificate of Completion
        </h2>

        {/* Bold subtitle */}
        <p
          className="type-body-md font-semibold"
          style={{ color: "var(--white-80)", margin: "0 0 14px" }}
        >
          This certificate is unlocked after completing all 30 days of the formation program.
        </p>

        {/* Description */}
        <p
          className="type-body-md"
          style={{ color: "var(--white-45)", margin: "0 0 28px" }}
        >
          This marks the completion of your journey through the program — a sign of your commitment to prayer, truth, and healing. Once unlocked, you'll be able to view and download your certificate.
        </p>

        {/* I understand button — right aligned */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            data-testid="button-certificate-understand"
            className="type-body-md font-medium"
            style={{
              color: "white",
              background: "var(--white-8)",
              border: "0.5px solid var(--white-12)",
              borderRadius: "6px",
              padding: "9px 22px",
              cursor: "pointer",
            }}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}

interface CertificateCardProps {
  prayerCompletions?: { dayNumber: number }[];
}

function CertificateCard({ prayerCompletions }: CertificateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuth();

  const completedDayNumbers = new Set(prayerCompletions?.map((c) => c.dayNumber) ?? []);
  const isUnlocked = Array.from({ length: 30 }, (_, i) => i + 1).every((d) =>
    completedDayNumbers.has(d)
  );

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleDownload = async () => {
    if (!isUnlocked || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user?.name ?? "Participant" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate certificate");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (user?.name ?? "participant").replace(/[^a-zA-Z0-9 ]/g, "").trim();
      a.download = `certificate-${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry by clicking again
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {showModal && <CertificateModal onClose={() => setShowModal(false)} />}

      {/* Divider */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          margin: "28px 0 20px",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--white-15)" }} />
        <span
          className="type-caption-sm"
          style={{ color: "var(--white-35)", flexShrink: 0 }}
        >
          Certificate
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--white-15)" }} />
      </div>

      {/* Card — backgrounds crossfade on hover */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={isUnlocked ? handleDownload : undefined}
        data-testid="certificate-card"
        style={{
          position: "relative",
          height: "126px",
          border: "0.5px solid var(--white-5)",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: "12px",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingBottom: "14px",
          cursor: isUnlocked ? (isDownloading ? "wait" : "pointer") : "default",
          marginBottom: "8px",
          opacity: isDownloading ? 0.75 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {/* Normal (grayscale) background — always visible */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${certBgNormal})`,
            backgroundSize: "cover",
            backgroundPosition: "right center",
          }}
        />
        {/* Hover (color) background — fades in on hover */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${certBgHover})`,
            backgroundSize: "cover",
            backgroundPosition: "right center",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 500ms ease",
          }}
        />
        {/* Top row: lock icon (left) + info icon (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 3 }}>
          {/* Lock / download icon box */}
          <div
            style={{
              width: "24px", height: "24px",
              borderRadius: "4px",
              background: isUnlocked ? "var(--white-6)" : "var(--white-5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isDownloading
              ? <Loader className="animate-spin" style={{ width: "10px", height: "10px", color: "var(--white-60)" }} />
              : isUnlocked
                ? <Download style={{ width: "10px", height: "10px", color: "var(--white-60)" }} />
                : <Lock style={{ width: "10px", height: "10px", color: "var(--white-45)" }} />
            }
          </div>

          {/* Info icon button */}
          <button
            onClick={handleInfoClick}
            data-testid="button-certificate-info"
            style={{
              width: "24px", height: "24px",
              borderRadius: "50%",
              background: "var(--white-4)",
              border: "0.5px solid var(--white-8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "var(--white-35)",
              flexShrink: 0,
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--white-10)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--white-65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--white-4)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--white-35)";
            }}
          >
            <Info size={11} />
          </button>
        </div>

        {/* Bottom row: title + subtitle */}
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", gap: "4px" }}>
          <p
            className="type-display-md"
            style={{ color: "white", margin: 0, letterSpacing: "-0.14px" }}
          >
            Certificate of Completion
          </p>
          <p
            className="type-body-xs"
            style={{ color: "var(--white-45)", margin: 0 }}
          >
            {isUnlocked
              ? "You did it! Download the pdf and present to ministry to schedule your prayer session."
              : "Complete all 30 daily lessons to unlock your certificate."}
          </p>
        </div>
      </div>
    </>
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
  onWorkbookSelect,
}: DayGridViewProps) {
  const [, navigate] = useLocation();
  const { data: trackAModules } = useQuery<TrackAModule[]>({
    queryKey: ["/api/track-a-modules"],
    enabled: isTrackA,
  });

  const { data: workbookModules } = useQuery<LessonWorkbookModuleWithStatus[]>({
    queryKey: ["/api/workbook-modules"],
    enabled: isTrackA,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const prelimSectionRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayForDialog, setSelectedDayForDialog] = useState(0);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const hasPrelims = !!(prelimModulesData && prelimModulesData.length > 0);
  const [inPrelimSection, setInPrelimSection] = useState(hasPrelims);

  const allDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const baseWeekGroups = groupDaysByWeek(allDays);
  const weekGroups = isTrackA && trackAModules && trackAModules.length > 0
    ? [...baseWeekGroups].sort((a, b) => {
        const modA = trackAModules.find(m => m.weekNumber === a.week);
        const modB = trackAModules.find(m => m.weekNumber === b.week);
        const orderA = modA?.sortOrder ?? a.week;
        const orderB = modB?.sortOrder ?? b.week;
        return orderA - orderB;
      })
    : baseWeekGroups;

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

  useEffect(() => {
    const container = scrollRef.current;
    const prelimEl = prelimSectionRef.current;
    if (!container || !prelimEl || !hasPrelims) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInPrelimSection(entry.isIntersecting);
        }
      },
      { root: container, rootMargin: "0px 0px -50% 0px", threshold: 0 },
    );
    observer.observe(prelimEl);
    return () => observer.disconnect();
  }, [hasPrelims]);

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
        <PageContainer variant="narrow">

          <StickyWeekBanner weekNumber={activeWeek} title={activeWeekTheme} onGuideClick={() => isTrackA ? navigate('/program-overview') : setGuideModalOpen(true)} inPrelimSection={inPrelimSection} />

          <div style={{ paddingTop: "24px" }}>
            {prelimModulesData && prelimModulesData.length > 0 && (
              <div ref={prelimSectionRef}>
                <VideoModal open={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
                <SectionDivider label="Pre-Modules" />
                <ThreeColGrid>
                  {prelimModulesData.map((mod) => {
                    const prevDone = mod.position === 1 || prelimModulesData.find(m => m.position === mod.position - 1)?.completed;
                    const isFirst = mod.position === 1;
                    const moduleWithThumb = isFirst
                      ? { ...mod, imageUrl: mod.imageUrl ?? introVideoThumb }
                      : mod;
                    return (
                      <PrelimCard
                        key={mod.position}
                        module={moduleWithThumb}
                        isAccessible={!!prevDone && !mod.completed}
                        onClick={() => {
                          if (isFirst) {
                            setVideoModalOpen(true);
                            if (!mod.completed) {
                              apiRequest("POST", `/api/prelim-modules/1/complete`)
                                .then(() => queryClient.invalidateQueries({ queryKey: ["/api/prelim-modules"] }))
                                .catch(() => {});
                            }
                          } else {
                            onPrelimSelect?.(mod.position);
                          }
                        }}
                      />
                    );
                  })}
                </ThreeColGrid>
              </div>
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
                        title={trackASummaries?.find(c => c.dayNumber === 0)?.centralTheme ?? "Introduction"}
                        subtitle={trackASummaries?.find(c => c.dayNumber === 0)?.subtitle ?? undefined}
                        isCompleted={isDayCompleted(0)}
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
                      const subtitle = isTrackA ? getTrackAAtPosition(day, trackASummaries)?.subtitle ?? undefined : undefined;
                      const workbookMod = isTrackA ? workbookModules?.find(m => m.dayNumber === day) : undefined;

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

                      const dayCard = (
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

                      if (workbookMod) {
                        return (
                          <div key={day} style={{ display: "flex", alignItems: "stretch", gap: "6px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>{dayCard}</div>
                            <span style={{ display: "flex", alignItems: "center", color: "var(--white-25)", fontSize: "14px", flexShrink: 0, lineHeight: 1 }}>+</span>
                            <WorkbookCard
                              module={workbookMod}
                              onClick={() => onWorkbookSelect?.(workbookMod.id)}
                            />
                          </div>
                        );
                      }

                      return dayCard;
                    })}
                  </TwoColGrid>
                </div>
              );
            })}

            <CertificateCard prayerCompletions={prayerCompletions} />
          </div>
        </PageContainer>
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
