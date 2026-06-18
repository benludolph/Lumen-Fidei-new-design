import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowRight, Users } from "lucide-react";

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
  const activityMap = new Map((activity ?? []).map((a) => [a.menteeId, a]));

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

          {/* Mentee grid */}
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
  onMessage,
  onViewProgress,
}: {
  name: string;
  email: string;
  track: string;
  unreadCount: number;
  onMessage: () => void;
  onViewProgress: () => void;
}) {
  const hasUnread = unreadCount > 0;

  return (
    <div
      data-testid={`card-mentee-${email}`}
      className="day-card-hover relative overflow-hidden w-full flex flex-col justify-between pt-3 px-3 pb-[14px] min-h-[126px]"
      style={{
        background: "var(--surface-base)",
        border: "0.5px solid var(--white-5)",
        borderRadius: "6px",
        cursor: "default",
      }}
    >
      {/* Background image — same pattern as DayCard */}
      <img
        src="/card-user-bg.webp"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(267.99deg, rgba(15,16,17,0) 63.9%, rgb(15,16,17) 93.353%)", pointerEvents: "none" }} />

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

      {/* Track badge — inline-flex so padding is visually equal top/bottom */}
      <span
        style={{
          position: "relative", zIndex: 1,
          display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
          background: "#0f3338", borderRadius: "999px",
          padding: "4px 9px",
          fontFamily: "'Afacad', sans-serif", fontSize: "10px", fontWeight: 600,
          color: "#02b8cc", letterSpacing: "1px", textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        Track {track}
      </span>

      {/* Bottom slot — name + action buttons, same position as text block in DayCard */}
      <div className="relative z-[1] flex flex-col gap-2">
        <p
          className="type-display-sm"
          style={{ letterSpacing: "-0.14px", color: "white", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {name}
        </p>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            data-testid={`button-message-${email}`}
            onClick={onMessage}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              height: "26px", padding: "0 10px",
              background: hasUnread ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${hasUnread ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "5px",
              boxShadow: "0px 0px 2px 0px black, 0px 1px 2.5px 0px rgba(0,0,0,0.53)",
              color: hasUnread ? "#f87171" : "white",
              fontFamily: "'Afacad', sans-serif", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", transition: "background 0.15s", whiteSpace: "nowrap" as const,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hasUnread ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hasUnread ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)"; }}
          >
            <MessageSquare size={11} />
            {hasUnread ? `${unreadCount} New` : "Message"}
          </button>

          <button
            data-testid={`button-view-progress-${email}`}
            onClick={onViewProgress}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              height: "26px", padding: "0 8px",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'Afacad', sans-serif", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" as const,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            Progress <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
