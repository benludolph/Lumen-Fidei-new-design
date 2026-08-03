import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserPrayerCompletions } from "@/hooks/use-prayer-completions";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Lock, Unlock, ArrowRight, RotateCcw } from "lucide-react";

import week1Img from "@assets/Week_1_1779734761983.webp";
import week2Img from "@assets/Week_2_1779734761983.webp";
import week3Img from "@assets/Week_3_1779734761982.webp";
import week4Img from "@assets/Week_4_1779734761982.webp";
import week5Img from "@assets/Week_5_1779734761982.webp";

const WEEKS = [
  {
    number: 1,
    title: "Image of God",
    days: [1, 2, 3, 4, 5, 6],
    image: week1Img,
    purpose:
      "Week 1 covers who God is and who you are. Most people come in with a distorted picture of God, and you can't trust or follow someone you've misread. Before the course asks you to look at sin and the enemy, it settles this foundation first.",
    agenda:
      "You'll cover prayer and worry, whether God is really there, the image of God you're carrying and where it came from, that you were made for a personal relationship with Him, and how His love doesn't change. The week ends by introducing the enemy and how he builds a foothold.",
  },
  {
    number: 2,
    title: "Sin: The Wound",
    days: [7, 8, 9, 10, 11, 12],
    image: week2Img,
    purpose:
      "Week 2 is where you look honestly at sin. Sin is real, it shapes your life, and the enemy uses it, especially occult involvement and other doorways, to gain power over you. This week names what's actually wrong so you can begin to deal with it.",
    agenda:
      "You'll cover the reality of sin and how it shapes your life, the enemy's power and the specific doorways that give him access (occult sins and others), what conversion and repentance actually mean, the wounds sin leaves, and how inner healing begins.",
  },
  {
    number: 3,
    title: "Healing & Forgiveness",
    days: [13, 14, 15, 16, 17, 18],
    image: week3Img,
    purpose:
      "Week 3 is about healing the wounds underneath the sin. Jesus has authority over what oppresses you, and a lot of what keeps people stuck is unforgiveness, toward themselves and others, and old agreements that were never closed. This week works through those.",
    agenda:
      "You'll cover Jesus as your healer, forgiving yourself, closing open doors like soul ties, vows, and word curses, taking your thoughts captive, forgiving others, and dealing with generational and family-line sin.",
  },
  {
    number: 4,
    title: "Deliverance & Renunciation",
    days: [19, 20, 21, 22, 23, 24],
    image: week4Img,
    purpose:
      "Week 4 is the deliverance work. You've identified the sin, the wounds, and the open doors. Now you renounce them out loud and claim the authority you have through Jesus. This is the part the whole workbook has been building toward.",
    agenda:
      "You'll cover Jesus as deliverer and king, the power of renunciation, the spiritual weapons available to you, praying a personal renunciation, praying a generational renunciation, and receiving salvation through Jesus Christ.",
  },
  {
    number: 5,
    title: "New Life",
    days: [25, 26, 27, 28, 29, 30],
    image: week5Img,
    purpose:
      "Week 5 is about living free after the deliverance work is done. The hard part is behind you, but old patterns return if nothing replaces them. This week sets up the Catholic life that keeps you close to God.",
    agenda:
      "You'll cover conversion as a daily turning back to God, life in the Holy Spirit, what grace is and why effort alone won't change you, the Eucharist and the Mass, saying your own yes to God, and a closing reflection on the thirty days.",
  },
];

const NAV_ITEMS = WEEKS.map((w, i) => ({ weekIndex: i, label: `Week ${w.number}` }));

type WeekState = "locked" | "unseen" | "seen" | "complete";
type UnlockPhase = "idle" | "shaking" | "opening" | "revealed" | "cta";

function getWeekState(
  weekIndex: number,
  currentDay: number,
  isComplete: boolean
): WeekState {
  if (isComplete) return "complete";
  const firstDay = WEEKS[weekIndex].days[0];
  if (currentDay < firstDay) return "locked";
  const seenKey = `lf_week_intro_seen_${WEEKS[weekIndex].number}`;
  if (!localStorage.getItem(seenKey)) return "unseen";
  return "seen";
}

export default function ProgramOverview() {
  const { data: user } = useQuery<{ role: string; track: string }>({
    queryKey: ["/api/user"],
  });
  const [, navigate] = useLocation();

  const dashboardHref = user?.role === "mentor" ? "/mentor" : "/dashboard";

  useEffect(() => {
    if (user && user.track !== "A" && user.role !== "superuser" && user.role !== "admin") {
      navigate(dashboardHref);
    }
  }, [user, navigate, dashboardHref]);

  const { data: prayerCompletions } = useUserPrayerCompletions();
  const { data: cohortData } = useQuery<{ startDate: string; currentDay: number }>({
    queryKey: ["/api/cohort/start-date"],
  });

  const currentDay = cohortData?.currentDay ?? 0;
  const isPrivileged = user?.role === "admin" || user?.role === "superuser";

  const isWeekComplete = useCallback(
    (days: number[]) => {
      if (!prayerCompletions) return false;
      return days.every((day) =>
        prayerCompletions.some((c) => c.dayNumber === day && c.period === "morning")
      );
    },
    [prayerCompletions]
  );

  const weekStates: WeekState[] = WEEKS.map((week, i) =>
    getWeekState(i, currentDay, isWeekComplete(week.days))
  );

  const weekStatesRef = useRef(weekStates);
  weekStatesRef.current = weekStates;

  const [phases, setPhases] = useState<UnlockPhase[]>(["idle", "idle", "idle", "idle", "idle"]);
  const triggeredRef = useRef<boolean[]>([false, false, false, false, false]);

  const triggerUnlock = useCallback((i: number) => {
    if (triggeredRef.current[i]) return;
    triggeredRef.current[i] = true;

    const setPhase = (phase: UnlockPhase) => {
      setPhases((prev) => {
        const next = [...prev] as UnlockPhase[];
        next[i] = phase;
        return next;
      });
    };

    setPhase("shaking");
    setTimeout(() => setPhase("opening"), 400);
    setTimeout(() => setPhase("revealed"), 700);
    setTimeout(() => {
      try {
        const audio = new Audio("/week-unlock.mp3");
        audio.play().catch(() => {});
      } catch {}
    }, 900);
    setTimeout(() => {
      setPhase("cta");
      localStorage.setItem(`lf_week_intro_seen_${WEEKS[i].number}`, "1");
    }, 1100);
  }, []);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [connectorFills, setConnectorFills] = useState<number[]>([0, 0, 0, 0]);
  const isInitialRender = useRef(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewH = container.clientHeight;
      const center = scrollTop + viewH * 0.45;

      const refs = itemRefs.current;
      const mids = refs.map((el) =>
        el ? el.offsetTop + el.offsetHeight / 2 : 0
      );

      let newActive = 0;
      for (let i = 0; i < mids.length; i++) {
        if (mids[i] <= center) newActive = i;
      }
      setActiveIndex(newActive);

      const fills: number[] = [];
      for (let i = 0; i < 4; i++) {
        const start = mids[i];
        const end = mids[i + 1] ?? start;
        const raw = end > start ? (center - start) / (end - start) : 0;
        fills.push(Math.max(0, Math.min(1, raw)));
      }
      setConnectorFills(fills);

      // Only trigger unlocks on real user scroll — not the initial layout call
      if (!isInitialRender.current) {
        for (let i = 0; i < WEEKS.length; i++) {
          const state = weekStatesRef.current[i];
          if (state === "unseen" && !triggeredRef.current[i]) {
            if (mids[i] <= center) {
              triggerUnlock(i);
            }
          }
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // sets stepper/fills on mount; unlock guard prevents auto-trigger
    isInitialRender.current = false;
    return () => container.removeEventListener("scroll", handleScroll);
  }, [triggerUnlock]);

  const scrollToWeek = (weekIndex: number) => {
    const container = scrollContainerRef.current;
    const el = itemRefs.current[weekIndex];
    if (!container || !el) return;
    container.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };

  const handleReplay = () => {
    for (let i = 1; i <= 5; i++) {
      localStorage.removeItem(`lf_week_intro_seen_${i}`);
    }
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div
        ref={scrollContainerRef}
        style={{
          position: "relative",
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          background: "var(--surface-ground)",
        }}
        data-testid="program-overview-scroll"
      >
        <div style={{ maxWidth: "608px", margin: "0 auto", padding: "0 16px 140px" }}>

          {/* Breadcrumb + replay */}
          <div
            style={{
              padding: "20px 0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Link href={dashboardHref}>
                <span
                  className="type-body-sm"
                  style={{
                    color: "var(--white-50)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  data-testid="breadcrumb-dashboard"
                >
                  <ChevronLeft size={12} />
                  Dashboard
                </span>
              </Link>
              <span className="type-body-sm" style={{ color: "var(--white-30)" }}>›</span>
              <span className="type-body-sm" style={{ color: "var(--white-70)" }}>Week Summary</span>
            </div>

            {isPrivileged && (
              <button
                onClick={handleReplay}
                data-testid="button-replay-unlock"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <RotateCcw size={10} />
                <span className="type-caption-sm">Replay</span>
              </button>
            )}
          </div>

          {/* Cards + connectors */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {WEEKS.map((week, i) => {
              const weekState = weekStates[i];
              const phase = phases[i];
              const isActive = activeIndex === i;

              const isRevealed = phase === "revealed" || phase === "cta";

              // Dim overlay: only for locked weeks and unseen weeks before the reveal fires
              const showDimOverlay =
                weekState === "locked" ||
                (weekState === "unseen" && !isRevealed);

              // Gradient overlays hidden: seen/complete always show full image;
              // unseen shows full image once revealed
              const overlaysHidden =
                weekState === "seen" ||
                weekState === "complete" ||
                isRevealed;

              // Border brightens for active seen/complete, or after an unseen unlock
              const borderColor =
                weekState === "locked"
                  ? "rgba(255,255,255,0.06)"
                  : weekState === "unseen" && !isRevealed
                  ? "rgba(255,255,255,0.06)"
                  : isActive || isRevealed
                  ? "rgba(255,255,255,0.65)"
                  : "rgba(255,255,255,0.06)";

              return (
                <div key={week.number}>
                  <div
                    ref={(el) => { itemRefs.current[i] = el; }}
                    data-testid={`week-section-${week.number}`}
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: `1px solid ${borderColor}`,
                      transition: "border-color 0.35s ease",
                    }}
                  >
                    <WeekCard
                      week={week}
                      weekState={weekState}
                      phase={phase}
                      overlaysHidden={overlaysHidden}
                      showDimOverlay={showDimOverlay}
                      dashboardHref={dashboardHref}
                    />
                  </div>

                  {/* Connector line */}
                  {i < WEEKS.length - 1 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "36px",
                      }}
                    >
                      <div
                        style={{
                          width: "1px",
                          height: "100%",
                          background: "rgba(255,255,255,0.1)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${(connectorFills[i] ?? 0) * 100}%`,
                            background: "rgba(255,255,255,0.7)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sources footnote */}
          <div style={{ textAlign: "center", paddingTop: "32px" }}>
            <Link href="/sources">
              <span
                className="type-caption-sm"
                style={{
                  color: "rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.25)"; }}
              >
                Sources &amp; Acknowledgments
              </span>
            </Link>
          </div>
        </div>

        {/* Sticky bottom nav */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            padding: "24px 16px 24px",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: "100px",
              padding: "5px 6px",
              pointerEvents: "auto",
            }}
            data-testid="week-nav-bar"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeIndex === item.weekIndex;
              return (
                <button
                  key={item.weekIndex}
                  data-testid={`week-nav-tab-week-${item.weekIndex}`}
                  onClick={() => scrollToWeek(item.weekIndex)}
                  title={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 14px",
                    borderRadius: "100px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s, color 0.2s",
                    background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                    color: isActive ? "white" : "rgba(255,255,255,0.45)",
                    outline: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span className="type-body-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Week Card ─────────────────────────────────────────────────────────────────

interface WeekCardProps {
  week: (typeof WEEKS)[number];
  weekState: WeekState;
  phase: UnlockPhase;
  overlaysHidden: boolean;
  showDimOverlay: boolean;
  dashboardHref: string;
}

function WeekCard({ week, weekState, phase, overlaysHidden, showDimOverlay, dashboardHref }: WeekCardProps) {
  const [, navigate] = useLocation();

  const isLocked = weekState === "locked";
  const isUnseen = weekState === "unseen";
  const isRevealed = phase === "revealed" || phase === "cta";
  const showLockIcon = (isLocked || isUnseen) && !isRevealed;
  const showCtaButton = phase === "cta";
  const complete = weekState === "complete";

  const captionText = showLockIcon
    ? `WEEK ${week.number} · LOCKED`
    : complete
    ? `WEEK ${week.number} COMPLETE`
    : `WEEK ${week.number}`;

  const captionColor = showLockIcon
    ? "rgba(255,255,255,0.3)"
    : complete
    ? "rgba(210,180,120,0.8)"
    : "rgba(255,255,255,0.45)";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "340px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Background image */}
      <img
        src={week.image}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          pointerEvents: "none",
        }}
      />

      {/* Dim overlay — locked / pre-reveal */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          pointerEvents: "none",
          opacity: showDimOverlay ? 1 : 0,
          transition: "opacity 0.35s ease",
          zIndex: 1,
        }}
      />

      {/* Diagonal gradient overlay — active/seen state */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.25) 100%)",
          pointerEvents: "none",
          opacity: overlaysHidden || showDimOverlay ? 0 : 1,
          transition: "opacity 0.35s ease",
          zIndex: 1,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)",
          pointerEvents: "none",
          opacity: overlaysHidden || showDimOverlay ? 0 : 1,
          transition: "opacity 0.35s ease",
          zIndex: 1,
        }}
      />

      {/* Lock / unlock icon */}
      {(isLocked || isUnseen) && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            zIndex: 10,
            opacity: showLockIcon ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        >
          <div
            className={phase === "shaking" ? "lf-lock-shake" : ""}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {phase === "opening" ? (
              <Unlock size={22} color="rgba(255,255,255,0.9)" />
            ) : (
              <Lock size={22} color="rgba(255,255,255,0.9)" />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, padding: "40px 36px" }}>
        <p
          className="type-caption-md"
          style={{ color: captionColor, margin: "0 0 10px" }}
          data-testid={`week-status-${week.number}`}
        >
          {captionText}
        </p>

        <h2
          className="font-serif"
          style={{
            color: "white",
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 500,
            margin: "0 0 20px",
            lineHeight: 1.1,
            maxWidth: "280px",
          }}
          data-testid={`week-title-${week.number}`}
        >
          {week.title}
        </h2>

        <div
          style={{
            width: "100%",
            maxWidth: "329px",
            height: "0.5px",
            background: "rgba(255,255,255,0.12)",
            marginBottom: "20px",
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <div>
            <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>
              PURPOSE
            </p>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>
              {week.purpose}
            </p>
          </div>
          <div>
            <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>
              AGENDA
            </p>
            <p className="type-body-sm" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>
              {week.agenda}
            </p>
          </div>
        </div>

        {/* Begin Week CTA */}
        <div
          style={{
            marginTop: "24px",
            opacity: showCtaButton ? 1 : 0,
            transform: showCtaButton ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: showCtaButton ? "auto" : "none",
          }}
        >
          <button
            data-testid={`button-begin-week-${week.number}`}
            onClick={() => navigate(dashboardHref)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px 20px",
              borderRadius: "8px",
              border: "0.5px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span className="type-caption-md">BEGIN WEEK {week.number}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
