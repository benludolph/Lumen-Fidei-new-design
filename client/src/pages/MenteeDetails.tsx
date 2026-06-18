import { useRoute, Link } from "wouter";
import { useUsers } from "@/hooks/use-users";
import { useUserAnswers } from "@/hooks/use-answers";
import { useUserPrayerCompletions } from "@/hooks/use-prayer-completions";
import { useCohortStartDate } from "@/hooks/use-cohort";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChevronLeft, Lock } from "lucide-react";
import { format } from "date-fns";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function calendarDaysToProgramDay(calendarDaysElapsed: number): number {
  const fullWeeks = Math.floor(calendarDaysElapsed / 7);
  const extraDays = Math.min(calendarDaysElapsed % 7, 6);
  const programDay = fullWeeks * 6 + extraDays + 1;
  return Math.min(programDay, 30);
}

function DayCompletionGrid({
  totalDays,
  currentDay,
  completedDays,
  answeredDays,
}: {
  totalDays: number;
  currentDay: number;
  completedDays: Set<number>;
  answeredDays: Set<number>;
}) {
  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: "0.5px solid var(--white-8)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "28px",
      }}
    >
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "var(--white-40)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "14px",
        }}
      >
        30-Day Progress
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const completed = completedDays.has(day);
          const answered = answeredDays.has(day);
          const locked = currentDay > 0 && day > currentDay;

          let bg = "rgba(255,255,255,0.05)";
          let border = "0.5px solid rgba(255,255,255,0.08)";
          let textColor = "var(--white-30)";
          let title = `Day ${day} — no activity`;

          if (locked) {
            bg = "rgba(255,255,255,0.02)";
            border = "0.5px solid rgba(255,255,255,0.04)";
            textColor = "var(--white-12)";
            title = `Day ${day} — not yet unlocked`;
          } else if (completed) {
            bg = "var(--brand)";
            border = "0.5px solid var(--brand)";
            textColor = "rgba(0,0,0,0.7)";
            title = `Day ${day} — completed`;
          } else if (answered) {
            bg = "rgba(255,255,255,0.15)";
            border = "0.5px solid rgba(255,255,255,0.25)";
            textColor = "rgba(255,255,255,0.6)";
            title = `Day ${day} — reflection submitted`;
          }

          return (
            <div
              key={day}
              title={title}
              data-testid={`day-circle-${day}`}
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: bg,
                border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontFamily: "'Afacad', sans-serif",
                color: textColor,
                fontWeight: 600,
                flexShrink: 0,
                opacity: locked ? 0.45 : 1,
              }}
            >
              {locked ? (
                <Lock size={9} style={{ opacity: 0.5 }} />
              ) : (
                day
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
        {[
          { bg: "var(--brand)", label: "Completed" },
          { bg: "rgba(255,255,255,0.15)", label: "Reflection submitted" },
          { bg: "rgba(255,255,255,0.05)", label: "No activity" },
          { bg: "rgba(255,255,255,0.02)", label: "Not yet unlocked", dim: true },
        ].map(({ bg, label, dim }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", opacity: dim ? 0.5 : 1 }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: bg, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", color: "var(--white-35)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MenteeDetails() {
  const [, params] = useRoute("/mentor/mentee/:id");
  const menteeId = Number(params?.id);

  const { data: users } = useUsers("participant");
  const mentee = users?.find((u) => u.id === menteeId);
  const { data: answers, isLoading } = useUserAnswers(menteeId);
  const { data: prayerCompletions } = useUserPrayerCompletions(menteeId);
  const { data: cohortData } = useCohortStartDate();

  const currentDay = (() => {
    if (!cohortData?.startDate) return 0;
    const start = new Date(cohortData.startDate);
    const today = new Date();
    const elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (elapsed < 0) return 0;
    return calendarDaysToProgramDay(elapsed);
  })();

  const completedDays = new Set<number>(
    (prayerCompletions ?? []).map((c) => c.dayNumber)
  );
  const answeredDays = new Set<number>(
    (answers ?? []).map((a) => a.dayNumber)
  );

  if (!mentee) {
    return (
      <DashboardLayout>
        <PageContainer variant="full">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid var(--white-15)",
                borderTopColor: "var(--white-60)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const sortedAnswers = [...(answers ?? [])].sort((a, b) => b.dayNumber - a.dayNumber);

  return (
    <DashboardLayout>
      <PageContainer variant="full">
        <div style={{ paddingTop: "40px", paddingBottom: "64px" }}>

          {/* Back link */}
          <Link href="/mentor">
            <button
              data-testid="button-back-to-portal"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                color: "var(--white-40)",
                cursor: "pointer",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.82rem",
                padding: "0 0 20px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--white-80)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--white-40)"; }}
            >
              <ChevronLeft size={14} />
              Back to Dashboard
            </button>
          </Link>

          {/* Mentee header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "var(--brand-subtle)",
                border: "1px solid var(--brand-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--brand)",
                flexShrink: 0,
              }}
            >
              {getInitials(mentee.name)}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {mentee.name}
              </h1>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", color: "var(--white-40)", margin: "3px 0 0" }}>
                {mentee.email} · Track {mentee.track ?? "B"}
              </p>
            </div>
          </div>

          {/* 30-day completion grid */}
          <DayCompletionGrid
            totalDays={30}
            currentDay={currentDay}
            completedDays={completedDays}
            answeredDays={answeredDays}
          />

          {/* Reflections section */}
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--white-40)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "14px",
            }}
          >
            Daily Reflections
          </p>

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "var(--white-30)", fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem" }}>
              Loading reflections…
            </div>
          ) : sortedAnswers.length === 0 ? (
            <div
              style={{
                background: "var(--surface-raised)",
                border: "0.5px solid var(--white-8)",
                borderRadius: "12px",
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--white-30)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.9rem",
              }}
            >
              No daily reflections submitted yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sortedAnswers.map((answer) => (
                <div
                  key={answer.id}
                  data-testid={`reflection-day-${answer.dayNumber}`}
                  style={{
                    background: "var(--surface-raised)",
                    border: "0.5px solid var(--white-8)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 18px",
                      borderBottom: "0.5px solid var(--white-6)",
                    }}
                  >
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 600, color: "white" }}>
                      Day {answer.dayNumber}
                    </span>
                    <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", color: "var(--white-30)" }}>
                      {answer.createdAt ? format(new Date(answer.createdAt), "MMM d, yyyy · h:mm a") : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "14px 18px",
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "0.9rem",
                      color: "var(--white-65)",
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {answer.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
