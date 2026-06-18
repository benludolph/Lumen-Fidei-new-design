import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLocation } from "wouter";
import { MessageSquare, ArrowRight, Users } from "lucide-react";

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

export default function MentorPortal() {
  const { user } = useAuth();
  const { data: allUsers } = useUsers("participant");
  const [_, setLocation] = useLocation();

  if (!user || (user.role !== "mentor" && user.role !== "admin")) return null;

  const myMentees = allUsers?.filter((u) => u.mentorId === user.id) || [];

  return (
    <DashboardLayout>
      <PageContainer variant="full">
        <div style={{ paddingTop: "48px", paddingBottom: "64px" }}>

          {/* Page header */}
          <div style={{ marginBottom: "36px" }}>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 600,
                color: "white",
                marginBottom: "6px",
                lineHeight: 1.15,
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
                gap: "16px",
              }}
            >
              {myMentees.map((mentee) => (
                <MenteeCard
                  key={mentee.id}
                  name={mentee.name}
                  email={mentee.email}
                  track={mentee.track || "B"}
                  onMessage={() => setLocation(`/messages?user=${mentee.id}`)}
                  onViewProgress={() => setLocation(`/mentor/mentee/${mentee.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

function MenteeCard({
  name,
  email,
  track,
  onMessage,
  onViewProgress,
}: {
  name: string;
  email: string;
  track: string;
  onMessage: () => void;
  onViewProgress: () => void;
}) {
  return (
    <div
      data-testid={`card-mentee-${email}`}
      style={{
        background: "var(--surface-raised)",
        border: "0.5px solid var(--white-8)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "border-color 0.15s, background 0.15s",
        cursor: "default",
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
      {/* Top row: avatar + info + track badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Avatar */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "var(--brand-subtle)",
            border: "1px solid var(--brand-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--brand)",
            letterSpacing: "0.02em",
          }}
        >
          {getInitials(name)}
        </div>

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "white",
              margin: 0,
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </p>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              color: "var(--white-40)",
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </p>
        </div>

        {/* Track badge */}
        <div
          style={{
            padding: "2px 8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid var(--white-12)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--white-50)",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {TRACK_LABELS[track] ?? `Track ${track}`}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          data-testid={`button-message-${email}`}
          onClick={onMessage}
          style={{
            flex: 1,
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid var(--white-10)",
            borderRadius: "6px",
            color: "var(--white-60)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
            (e.currentTarget as HTMLButtonElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--white-60)";
          }}
        >
          <MessageSquare size={13} />
          Message
        </button>

        <button
          data-testid={`button-view-progress-${email}`}
          onClick={onViewProgress}
          style={{
            flex: 1,
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-subtle)";
          }}
        >
          View Progress
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
