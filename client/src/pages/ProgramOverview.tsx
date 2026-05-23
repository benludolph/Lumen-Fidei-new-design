import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserPrayerCompletions } from "@/hooks/use-prayer-completions";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

import week1Img from "@assets/Week_1_1779507603384.webp";
import week2Img from "@assets/Week_2_1779507603384.webp";
import week3Img from "@assets/Week_3_1779507603384.webp";
import week4Img from "@assets/Week_4_1779507603383.webp";
import week5Img from "@assets/Week_5_1779507603383.webp";
import workbookImg from "@assets/Workbook_1779507603382.webp";

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
    title: "See The Wound",
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

export default function ProgramOverview() {
  const { data: user } = useQuery<{ role: string; track: string }>({
    queryKey: ["/api/user"],
  });
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && user.track !== "A" && user.role !== "superuser") {
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

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeWeek, setActiveWeek] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveWeek(idx);
          }
        });
      },
      {
        root: container,
        threshold: 0.4,
      }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToWeek = (idx: number) => {
    const el = sectionRefs.current[idx];
    const container = scrollContainerRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
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
          scrollSnapType: "none",
        }}
        data-testid="program-overview-scroll"
      >
        {/* Breadcrumb */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            padding: "12px 24px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", pointerEvents: "auto" }}>
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

        {/* Week sections */}
        {WEEKS.map((week, idx) => {
          const complete = isWeekComplete(week.days);
          return (
            <div key={week.number}>
              {/* Workbook callout between Week 2 and Week 3 */}
              {idx === 2 && <WorkbookCallout />}

              <div
                ref={(el) => { sectionRefs.current[idx] = el; }}
                data-testid={`week-section-${week.number}`}
                style={{
                  position: "relative",
                  minHeight: "100vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  paddingBottom: "100px",
                }}
              >
                {/* Background image */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${week.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                {/* Dark overlay gradient */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.88) 100%)",
                  }}
                />

                {/* Content */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "0 clamp(24px, 8vw, 120px) 0",
                    maxWidth: "860px",
                    width: "100%",
                  }}
                >
                  {/* Week status indicator */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}
                    data-testid={`week-status-${week.number}`}
                  >
                    {complete ? (
                      <CheckCircle2
                        size={22}
                        style={{ color: "var(--brand, #a78b5c)", flexShrink: 0 }}
                        data-testid={`icon-complete-${week.number}`}
                      />
                    ) : (
                      <CircleDashed
                        size={22}
                        style={{ color: "var(--white-40)", flexShrink: 0 }}
                        data-testid={`icon-incomplete-${week.number}`}
                      />
                    )}
                    <span
                      className="type-body-xs font-semibold"
                      style={{
                        color: complete ? "var(--brand, #a78b5c)" : "var(--white-50)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      WEEK {week.number}{complete ? " COMPLETE" : ""}
                    </span>
                  </div>

                  {/* Week title */}
                  <h2
                    className="font-serif"
                    style={{
                      color: "white",
                      fontSize: "clamp(28px, 4.5vw, 52px)",
                      fontWeight: 700,
                      margin: "0 0 32px",
                      lineHeight: 1.1,
                    }}
                    data-testid={`week-title-${week.number}`}
                  >
                    {week.title}
                  </h2>

                  {/* Two-column copy */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "32px 48px",
                    }}
                  >
                    <div>
                      <p
                        className="type-body-xs font-semibold"
                        style={{
                          color: "var(--white-40)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Purpose
                      </p>
                      <p
                        className="type-body-md"
                        style={{ color: "var(--white-80)", lineHeight: 1.65, margin: 0 }}
                      >
                        {week.purpose}
                      </p>
                    </div>
                    <div>
                      <p
                        className="type-body-xs font-semibold"
                        style={{
                          color: "var(--white-40)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Agenda
                      </p>
                      <p
                        className="type-body-md"
                        style={{ color: "var(--white-80)", lineHeight: 1.65, margin: 0 }}
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

        {/* Bottom padding so last section isn't hidden by nav bar */}
        <div style={{ height: "80px" }} />

        {/* Sticky bottom week nav */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            padding: "12px 16px 16px",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "100px",
              padding: "6px 8px",
              pointerEvents: "auto",
            }}
            data-testid="week-nav-bar"
          >
            {WEEKS.map((week, idx) => (
              <button
                key={week.number}
                data-testid={`week-nav-tab-${week.number}`}
                onClick={() => scrollToWeek(idx)}
                className="type-body-sm font-medium"
                style={{
                  padding: "6px 16px",
                  borderRadius: "100px",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                  background:
                    activeWeek === idx
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                  color: activeWeek === idx ? "white" : "var(--white-50)",
                  outline: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (activeWeek !== idx)
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--white-80)";
                }}
                onMouseLeave={(e) => {
                  if (activeWeek !== idx)
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--white-50)";
                }}
              >
                Week {week.number}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function WorkbookCallout() {
  return (
    <div
      data-testid="workbook-callout"
      style={{
        position: "relative",
        background: "var(--surface-base, #0d0d0d)",
        padding: "clamp(48px, 8vw, 96px) clamp(24px, 8vw, 120px)",
        display: "flex",
        gap: "clamp(32px, 5vw, 72px)",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* Workbook image */}
      <div style={{ flexShrink: 0 }}>
        <img
          src={workbookImg}
          alt="The Deliverance Workbook"
          style={{
            width: "clamp(120px, 18vw, 200px)",
            height: "auto",
            borderRadius: "6px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}
          data-testid="workbook-image"
        />
      </div>

      {/* Workbook copy */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <h3
          className="font-serif"
          style={{
            color: "white",
            fontSize: "clamp(20px, 3vw, 32px)",
            fontWeight: 700,
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}
        >
          The Deliverance Workbook
        </h3>
        <p
          className="type-body-md"
          style={{ color: "var(--white-70)", lineHeight: 1.7, margin: "0 0 28px" }}
        >
          This is your deliverance workbook. It has sections where you'll write down unrepented sins,
          organized by category. The first step in deliverance is repentance, so the workbook is
          where you'll organize your past so you can bring it to confession later. This week, you'll
          only fill in the first section.
        </p>

        <p
          className="type-body-xs font-semibold"
          style={{
            color: "var(--white-40)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          Why is this important?
        </p>
        <p
          className="type-body-md"
          style={{ color: "var(--white-60)", lineHeight: 1.7, margin: 0 }}
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
