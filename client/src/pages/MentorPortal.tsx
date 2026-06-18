import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowRight, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TRACK_LABELS: Record<string, string> = {
  A: "Track A",
  B: "Track B",
  C: "Track C",
};

type ActivitySummaryItem = {
  menteeId: number;
  lastAnswerDate: string | null;
  unreadCount: number;
};

function useActivitySummary() {
  return useQuery<ActivitySummaryItem[]>({
    queryKey: ["/api/mentor/activity-summary"],
    staleTime: 60_000,
  });
}

export default function MentorPortal() {
  const { user } = useAuth();
  const { data: allUsers } = useUsers("participant");
  const { data: activity } = useActivitySummary();
  const [_, setLocation] = useLocation();

  if (!user || (user.role !== "mentor" && user.role !== "admin")) return null;

  const myMentees = allUsers?.filter((u) => u.mentorId === user.id) || [];

  const activityMap = new Map(
    (activity ?? []).map((a) => [a.menteeId, a])
  );

  return (
    <DashboardLayout>
      <div style={{ paddingTop: "56px", paddingBottom: "80px" }}>
        <PageContainer variant="content">

          {/* Page header */}
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

          {/* Mentee list */}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {myMentees.map((mentee) => {
                const act = activityMap.get(mentee.id);
                return (
                  <MenteeCard
                    key={mentee.id}
                    name={mentee.name}
                    email={mentee.email}
                    track={mentee.track || "B"}
                    lastAnswerDate={act?.lastAnswerDate ?? null}
                    unreadCount={act?.unreadCount ?? 0}
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
  lastAnswerDate,
  unreadCount,
  onMessage,
  onViewProgress,
}: {
  name: string;
  email: string;
  track: string;
  lastAnswerDate: string | null;
  unreadCount: number;
  onMessage: () => void;
  onViewProgress: () => void;
}) {
  const lastActiveText = lastAnswerDate
    ? `Active ${formatDistanceToNow(new Date(lastAnswerDate), { addSuffix: true })}`
    : "No activity yet";

  return (
    <div
      data-testid={`card-mentee-${email}`}
      style={{
        background: "var(--surface-raised)",
        border: "0.5px solid var(--white-8)",
        borderRadius: "12px",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--white-15)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--white-8)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--surface-raised)";
      }}
    >
      {/* Avatar with unread dot */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "var(--brand-subtle)",
            border: "1px solid var(--brand-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "var(--brand)",
            letterSpacing: "0.02em",
          }}
        >
          {getInitials(name)}
        </div>

        {unreadCount > 0 && (
          <div
            data-testid={`badge-unread-${email}`}
            title={`${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`}
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              minWidth: "16px",
              height: "16px",
              borderRadius: "999px",
              background: "#ef4444",
              border: "2px solid var(--surface-raised)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.55rem",
              fontWeight: 700,
              color: "white",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </div>

      {/* Name + email + last active */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "white",
            margin: 0,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <p
          data-testid={`text-email-${email}`}
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.78rem",
            color: "var(--white-45)",
            margin: "2px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {email}
        </p>
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.72rem",
            color: "var(--white-28)",
            margin: "1px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lastActiveText}
        </p>
      </div>

      {/* Track badge */}
      <div
        style={{
          padding: "2px 9px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.05)",
          border: "0.5px solid var(--white-10)",
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--white-45)",
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}
      >
        {TRACK_LABELS[track] ?? `Track ${track}`}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          data-testid={`button-message-${email}`}
          onClick={onMessage}
          style={{
            height: "34px",
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: unreadCount > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
            border: unreadCount > 0 ? "0.5px solid rgba(239,68,68,0.3)" : "0.5px solid var(--white-10)",
            borderRadius: "6px",
            color: unreadCount > 0 ? "#f87171" : "var(--white-55)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
            (e.currentTarget as HTMLButtonElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = unreadCount > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = unreadCount > 0 ? "#f87171" : "var(--white-55)";
          }}
        >
          <MessageSquare size={13} />
          {unreadCount > 0 ? `${unreadCount} New` : "Message"}
        </button>

        <button
          data-testid={`button-view-progress-${email}`}
          onClick={onViewProgress}
          style={{
            height: "34px",
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--brand-subtle)",
            border: "0.5px solid var(--brand-border)",
            borderRadius: "6px",
            color: "var(--brand)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-subtle)";
          }}
        >
          Progress
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
