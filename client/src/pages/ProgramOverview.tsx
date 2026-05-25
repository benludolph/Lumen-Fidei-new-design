import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserPrayerCompletions } from "@/hooks/use-prayer-completions";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

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

// 5 week nav tabs only — workbook removed
const NAV_ITEMS = WEEKS.map((w, i) => ({ weekIndex: i, label: `Week ${w.number}` }));

export default function ProgramOverview() {
  const { data: user } = useQuery<{ role: string; track: string }>({
    queryKey: ["/api/user"],
  });
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && user.track !== "A" && user.role !== "superuser" && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const { data: prayerCompletions } = useUserPrayerCompletions();

  const isWeekComplete = useCallback(
    (days: number[]) => {
      if (!prayerCompletions) return false;
      return days.every((day) =>
        prayerCompletions.some((c) => c.dayNumber === day && c.period === "morning")
      );
    },
    [prayerCompletions]
  );

  // 5 item refs (one per week, in order)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [connectorFills, setConnectorFills] = useState<number[]>([0, 0, 0, 0]); // 4 connectors

  // Workbook accordion — expands below Week 2
  const [workbookOpen, setWorkbookOpen] = useState(false);

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
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToWeek = (weekIndex: number) => {
    const container = scrollContainerRef.current;
    const el = itemRefs.current[weekIndex];
    if (!container || !el) return;
    container.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };

  return (
    <DashboardLayout>
      <div
        ref={scrollContainerRef}
        style={{ position: "relative", height: "100%", overflowY: "auto", overflowX: "hidden", background: "var(--surface-ground)" }}
        data-testid="program-overview-scroll"
      >
        <div style={{ maxWidth: "608px", margin: "0 auto", padding: "0 16px 140px" }}>

          {/* Breadcrumb */}
          <div style={{ padding: "20px 0 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Link href="/dashboard">
                <span
                  className="type-body-sm"
                  style={{ color: "var(--white-50)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  data-testid="breadcrumb-dashboard"
                >
                  <ChevronLeft size={12} />
                  Dashboard
                </span>
              </Link>
              <span className="type-body-sm" style={{ color: "var(--white-30)" }}>›</span>
              <span className="type-body-sm" style={{ color: "var(--white-70)" }}>Week Summary</span>
            </div>
          </div>

          {/* Cards + connectors */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {WEEKS.map((week, i) => {
              const isActive = activeIndex === i;
              const complete = isWeekComplete(week.days);
              const isWeek2 = i === 1; // Week 2 has the expandable workbook

              return (
                <div key={week.number}>
                  {/* Week card */}
                  <div
                    ref={(el) => { itemRefs.current[i] = el; }}
                    data-testid={`week-section-${week.number}`}
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: isActive
                        ? "1px solid rgba(255,255,255,0.65)"
                        : "1px solid rgba(255,255,255,0.06)",
                      transition: "border-color 0.35s ease",
                    }}
                  >
                    <WeekCard
                      week={week}
                      complete={complete}
                      active={isActive}
                      showExpandButton={isWeek2}
                      workbookOpen={isWeek2 ? workbookOpen : false}
                      onToggleWorkbook={isWeek2 ? () => setWorkbookOpen((v) => !v) : undefined}
                    />
                  </div>

                  {/* Workbook accordion — only after Week 2 */}
                  {isWeek2 && (
                    <div
                      style={{
                        overflow: "hidden",
                        maxHeight: workbookOpen ? "700px" : "0px",
                        transition: "max-height 0.45s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    >
                      <div style={{ paddingTop: "12px" }}>
                        <div
                          style={{
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                          data-testid="workbook-callout"
                        >
                          <WorkbookCard />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connector line (not after last card) */}
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
        </div>

        {/* Sticky bottom nav — 5 week tabs */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            padding: "24px 16px 24px",
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
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

// ─── Week card ────────────────────────────────────────────────────────────────

interface WeekCardProps {
  week: (typeof WEEKS)[number];
  complete: boolean;
  active: boolean;
  showExpandButton?: boolean;
  workbookOpen?: boolean;
  onToggleWorkbook?: () => void;
}

function WeekCard({ week, complete, active, showExpandButton, workbookOpen, onToggleWorkbook }: WeekCardProps) {
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
      {/* Full-bleed background image */}
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

      {/* Overlays — fade out when card is active */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.25) 100%)",
          pointerEvents: "none",
          opacity: active ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)",
          pointerEvents: "none",
          opacity: active ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, padding: "40px 36px" }}>
        <p
          className="type-caption-md"
          style={{
            color: complete ? "rgba(210,180,120,0.8)" : "rgba(255,255,255,0.45)",
            margin: "0 0 10px",
          }}
          data-testid={`week-status-${week.number}`}
        >
          WEEK {week.number}{complete ? " COMPLETE" : ""}
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

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", flex: 1 }}>
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

          {/* Expand button for Week 2 */}
          {showExpandButton && onToggleWorkbook && (
            <button
              onClick={onToggleWorkbook}
              data-testid="button-toggle-workbook"
              title={workbookOpen ? "Hide Deliverance Workbook" : "Show Deliverance Workbook"}
              style={{
                flexShrink: 0,
                marginTop: "2px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <ChevronRight
                size={15}
                style={{
                  transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
                  transform: workbookOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Workbook card ────────────────────────────────────────────────────────────

function WorkbookCard() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "340px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "linear-gradient(to right, #191A1B, #131314)",
      }}
      data-testid="workbook-card"
    >
      <div style={{ position: "relative", zIndex: 2, padding: "40px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <BookOpen size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>
            WEEK 2 RESOURCE
          </p>
        </div>

        <h2
          className="font-serif"
          style={{
            color: "white",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 500,
            margin: "0 0 16px",
            lineHeight: 1.15,
            maxWidth: "260px",
          }}
        >
          The Deliverance Workbook
        </h2>

        <p
          className="type-body-sm"
          style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 24px", maxWidth: "480px" }}
        >
          This is your deliverance workbook. It has sections where you'll write down unrepented sins,
          organized by category. The first step in deliverance is repentance, so the workbook is
          where you'll organize your past so you can bring it to confession later. This week, you'll
          fill in the first section.
        </p>

        <p className="type-caption-sm" style={{ color: "rgba(255,255,255,0.38)", margin: "0 0 10px" }}>
          WHY IS THIS IMPORTANT?
        </p>
        <p
          className="type-body-sm"
          style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0, maxWidth: "480px" }}
        >
          Over the program you'll fill it in by category: unrepented sins, occult involvement and
          other doorways, people you need to forgive, soul ties, vows, word curses, and generational
          patterns. By the end you'll use what you've written to pray through your renunciations and
          to make your confession. Add to it anytime — it's yours to keep working through.
        </p>
      </div>
    </div>
  );
}
