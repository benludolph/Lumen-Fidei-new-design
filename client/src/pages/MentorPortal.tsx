import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowRight, Users, Flame, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ActivitySummaryItem = {
  menteeId: number;
  lastAnswerDate: string | null;
  unreadCount: number;
  completedDays: number;
};

function useActivitySummary() {
  return useQuery<ActivitySummaryItem[]>({
    queryKey: ["/api/mentor/activity-summary"],
    staleTime: 60_000,
  });
}

function getDayLabel(completedDays: number): string {
  const currentDay = Math.min(completedDays + 1, 30);
  const week = Math.ceil(currentDay / 6);
  const dayInWeek = ((currentDay - 1) % 6) + 1;
  return `Week ${week} Day ${dayInWeek}`;
}

function formatLastActive(date: string | null): string {
  if (!date) return "No activity yet";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "No activity yet";
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Active today";
  if (diff === 1) return "Active yesterday";
  if (diff < 7) return `Active ${diff} days ago`;
  return `Active ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function MentorPortal() {
  const { user } = useAuth();
  const { data: allUsers } = useUsers("participant");
  const { data: activity } = useActivitySummary();
  const [_, setLocation] = useLocation();

  if (!user || (user.role !== "mentor" && user.role !== "admin")) return null;

  const myMentees = allUsers?.filter((u) => u.mentorId === user.id) || [];
  const activityMap = new Map((activity ?? []).map((a) => [a.menteeId, a]));

  return (
    <DashboardLayout>
      <div style={{ paddingTop: "56px", paddingBottom: "80px" }}>
        <PageContainer variant="content">

          <div style={{ marginBottom: "36px" }}>
            <h1
              style={{
                fontFamily: "'IvyOra Display', serif",
                fontSize: "clamp(1.9rem, 3.5vw, 2.5rem)",
                fontWeight: 500,
                color: "white",
                marginBottom: "6px",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              My Mentees
            </h1>
            <p
              style={{
                color: "var(--white-40)",
                fontSize: "0.875rem",
                fontFamily: "'Afacad', sans-serif",
              }}
            >
              {myMentees.length > 0
                ? `${myMentees.length} participant${myMentees.length !== 1 ? "s" : ""} assigned to you`
                : "No participants assigned yet"}
            </p>
          </div>

          {myMentees.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "100px 0",
                color: "var(--white-20)",
                fontFamily: "'Afacad', sans-serif",
                gap: "12px",
              }}
            >
              <Users size={36} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "0.9rem" }}>No mentees assigned yet.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {myMentees.map((mentee) => {
                const act = activityMap.get(mentee.id);
                return (
                  <MenteeCard
                    key={mentee.id}
                    name={mentee.name}
                    email={mentee.email}
                    track={mentee.track || "B"}
                    unreadCount={act?.unreadCount ?? 0}
                    completedDays={act?.completedDays ?? 0}
                    lastAnswerDate={act?.lastAnswerDate ?? null}
                    onMessage={() => setLocation(`/messages?user=${mentee.id}`)}
                    onViewProgress={() => setLocation(`/mentor/mentee/${mentee.id}`)}
                  />
                );
              })}
            </div>
          )}
        </PageContainer>
      </div>
    </DashboardLayout>
  );
}

function MenteeCard({
  name,
  email,
  track,
  unreadCount,
  completedDays,
  lastAnswerDate,
  onMessage,
  onViewProgress,
}: {
  name: string;
  email: string;
  track: string;
  unreadCount: number;
  completedDays: number;
  lastAnswerDate: string | null;
  onMessage: () => void;
  onViewProgress: () => void;
}) {
  const hasUnread = unreadCount > 0;
  const progressPercent = Math.min(Math.round((completedDays / 30) * 100), 100);
  const dayLabel = getDayLabel(completedDays);
  const lastActiveLabel = formatLastActive(lastAnswerDate);

  return (
    <div
      data-testid={`card-mentee-${email}`}
      className="day-card-hover relative overflow-hidden w-full flex flex-col"
      style={{
        background: "var(--surface-base)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "6px",
        cursor: "default",
        padding: "14px",
        gap: "27px",
      }}
    >
      {/* Background image */}
      <img
        src="/card-user-bg.webp"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", borderRadius: "6px" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)", pointerEvents: "none", borderRadius: "6px" }} />

      {/* Unread dot — absolute top-right */}
      {hasUnread && (
        <div
          data-testid={`badge-unread-${email}`}
          title={`${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`}
          style={{
            position: "absolute", top: "10px", right: "10px",
            minWidth: "18px", height: "18px", borderRadius: "999px",
            background: "#ef4444", border: "1.5px solid rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Afacad', sans-serif", fontSize: "0.6rem", fontWeight: 700,
            color: "white", padding: "0 4px", zIndex: 2,
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}

      {/* Track badge with flame icon */}
      <Badge
        variant="track"
        className="gap-1"
        style={{ position: "relative", zIndex: 1, alignSelf: "flex-start" }}
      >
        <Flame size={12} />
        Track {track}
      </Badge>

      {/* Main content block */}
      <div className="relative z-[1] flex flex-col" style={{ gap: "24px" }}>

        {/* Name */}
        <p
          style={{
            fontFamily: "'IvyOra Display', serif",
            fontSize: "18px",
            fontWeight: 500,
            color: "white",
            letterSpacing: "-0.14px",
            lineHeight: "22.5px",
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {name}
        </p>

        {/* Progress meter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "white",
                letterSpacing: "0.12px",
                lineHeight: "14px",
              }}
            >
              {dayLabel}
            </span>
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "white",
                letterSpacing: "0.12px",
                lineHeight: "14px",
              }}
            >
              {progressPercent}%
            </span>
          </div>
          {/* Meter bar */}
          <div style={{ position: "relative", height: "6px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                top: 0, bottom: 0, left: 0,
                width: `${progressPercent}%`,
                background: "white",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", width: "100%" }} />

        {/* Last active */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CalendarDays size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontWeight: 600,
              fontSize: "14.8px",
              color: "rgba(255,255,255,0.4)",
              lineHeight: "22px",
              whiteSpace: "nowrap",
            }}
          >
            {lastActiveLabel}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button
            data-testid={`button-message-${email}`}
            variant={hasUnread ? "glass-danger" : "glass"}
            size="sm"
            onClick={onMessage}
          >
            <MessageSquare size={13} />
            {hasUnread ? `${unreadCount} New` : "Message"}
          </Button>

          <Button
            data-testid={`button-view-progress-${email}`}
            variant="ghost-dim"
            size="sm"
            onClick={onViewProgress}
          >
            Progress <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
