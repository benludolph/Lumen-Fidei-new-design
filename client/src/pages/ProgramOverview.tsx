import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserPrayerCompletions } from "@/hooks/use-prayer-completions";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft } from "lucide-react";

import week1Img from "@assets/Week_1_1779734761983.webp";
import week2Img from "@assets/Week_2_1779734761983.webp";
import week3Img from "@assets/Week_3_1779734761982.webp";
import week4Img from "@assets/Week_4_1779734761982.webp";
import week5Img from "@assets/Week_5_1779734761982.webp";
import workbookImg from "@assets/Workbook_1779734761981.webp";

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

type NavItem =
  | { kind: "week"; weekIndex: number; label: string }
  | { kind: "workbook"; label: string };

const NAV_ITEMS: NavItem[] = [
  { kind: "week", weekIndex: 0, label: "Week 1" },
  { kind: "week", weekIndex: 1, label: "Week 2" },
  { kind: "workbook", label: "Workbook" },
  { kind: "week", weekIndex: 2, label: "Week 3" },
  { kind: "week", weekIndex: 3, label: "Week 4" },
  { kind: "week", weekIndex: 4, label: "Week 5" },
];

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

  const weekRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null]);
  const workbookRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeNav, setActiveNav] = useState<string>("week-0");

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const allRefs: { key: string; el: HTMLDivElement | null }[] = [
      { key: "week-0", el: weekRefs.current[0] },
      { key: "week-1", el: weekRefs.current[1] },
      { key: "workbook", el: workbookRef.current },
      { key: "week-2", el: weekRefs.current[2] },
      { key: "week-3", el: weekRefs.current[3] },
      { key: "week-4", el: weekRefs.current[4] },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const found = allRefs.find((r) => r.el === entry.target);
            if (found) setActiveNav(found.key);
          }
        });
      },
      { root: container, threshold: 0.3 }
    );

    allRefs.forEach(({ el }) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (key: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let el: HTMLDivElement | null = null;
    if (key === "workbook") {
      el = workbookRef.current;
    } else {
      const idx = parseInt(key.replace("week-", ""), 10);
      el = weekRefs.current[idx];
    }
    if (el) {
      const top = el.offsetTop - 20;
      container.scrollTo({ top, behavior: "smooth" });
    }
  };

  const navKeyForItem = (item: NavItem) =>
    item.kind === "workbook" ? "workbook" : `week-${item.weekIndex}`;

  return (
    <DashboardLayout>
      <div
        ref={scrollContainerRef}
        style={{ position: "relative", height: "100%", overflowY: "auto", overflowX: "hidden", background: "var(--surface-ground)" }}
        data-testid="program-overview-scroll"
      >
        {/* Content column — centered, max 608px */}
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

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {WEEKS.map((week, idx) => {
              const complete = isWeekComplete(week.days);

              return (
                <div key={week.number}>
                  {/* Workbook card between Week 2 and Week 3 */}
                  {idx === 2 && (
                    <div
                      ref={workbookRef}
                      data-testid="workbook-callout"
                      style={{ marginBottom: "12px" }}
                    >
                      <WorkbookCard />
                    </div>
                  )}

                  {/* Week card — full-bleed image BG */}
                  <div
                    ref={(el) => { weekRefs.current[idx] = el; }}
                    data-testid={`week-section-${week.number}`}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
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

                    {/* Dark overlay — strong on bottom/left, fades top-right */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.25) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Extra bottom fade */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Card content */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        padding: "40px 36px",
                      }}
                    >
                      {/* Week label */}
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

                      {/* Week title */}
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

                      {/* Divider */}
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "329px",
                          height: "0.5px",
                          background: "rgba(255,255,255,0.12)",
                          marginBottom: "20px",
                        }}
                      />

                      {/* PURPOSE / AGENDA two-column */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0 24px",
                        }}
                      >
                        <div>
                          <p
                            className="type-caption-sm"
                            style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}
                          >
                            PURPOSE
                          </p>
                          <p
                            className="type-body-sm"
                            style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}
                          >
                            {week.purpose}
                          </p>
                        </div>
                        <div>
                          <p
                            className="type-caption-sm"
                            style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}
                          >
                            AGENDA
                          </p>
                          <p
                            className="type-body-sm"
                            style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}
                          >
                            {week.agenda}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom week nav */}
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
              const key = navKeyForItem(item);
              const isActive = activeNav === key;
              return (
                <button
                  key={key}
                  data-testid={`week-nav-tab-${key}`}
                  onClick={() => scrollToSection(key)}
                  title={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    padding: item.kind === "workbook" ? "6px 10px" : "6px 14px",
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
                  {item.kind === "workbook" ? (
                    <BookOpen size={14} />
                  ) : (
                    <span className="type-body-xs font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function WorkbookCard() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        minHeight: "340px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      data-testid="workbook-card"
    >
      {/* Full-bleed book cover image */}
      <img
        src={workbookImg}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          pointerEvents: "none",
        }}
      />

      {/* Overlay — dark gradient so text reads over the black book cover */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, padding: "40px 36px" }}>
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

        <p
          className="type-caption-sm"
          style={{ color: "rgba(255,255,255,0.38)", margin: "0 0 10px" }}
        >
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
