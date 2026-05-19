import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChevronRight } from "lucide-react";
import PrayerRender from "@/components/workbook/PrayerRender";
import type { UserProfile } from "@shared/schema";

const PROMPT_SESSION_KEY = "daily_prayer_profile_prompt_seen";

function isProfileEmpty(p: UserProfile | null | undefined): boolean {
  if (!p) return true;
  return (
    p.familyMembers.length === 0 &&
    p.spouseName.trim() === "" &&
    p.childrenNames.length === 0 &&
    p.chronicIssues.length === 0 &&
    p.chronicIdentityLabels.length === 0
  );
}

function Breadcrumb() {
  return (
    <div
      style={{
        position: "sticky",
        top: "72px",
        zIndex: 40,
        height: "60px",
        display: "flex",
        alignItems: "center",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "var(--black-35)",
        borderBottom: "1px solid var(--white-8)",
        boxShadow: "0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)",
      }}
    >
      <PageContainer variant="full" className="flex items-center gap-2">
        <Link href="/resources">
          <span
            data-testid="breadcrumb-resources"
            className="type-body-lg"
            style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Resources
          </span>
        </Link>
        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>
        <span
          data-testid="breadcrumb-current"
          className="type-body-lg"
          style={{ color: "var(--white-60)", whiteSpace: "nowrap" }}
        >
          Daily Renewal
        </span>
      </PageContainer>
    </div>
  );
}

function ProfilePrompt({ onSetup, onSkip }: { onSetup: () => void; onSkip: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "420px",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "380px",
          padding: "36px 32px",
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "1.4rem",
          }}
        >
          🕊
        </div>

        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.35rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.3,
            marginBottom: "12px",
          }}
        >
          Set up your profile so the Daily Prayer can include your family
        </h2>

        <p
          style={{
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.55,
            marginBottom: "28px",
            fontFamily: "'Afacad', sans-serif",
          }}
        >
          Your spouse's name, children, and family members can be woven into your daily prayer intentions. It only takes a moment.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            data-testid="button-profile-setup-now"
            onClick={onSetup}
            style={{
              width: "100%",
              padding: "11px 20px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.1)",
              border: "0.5px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.9)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            Set up now
          </button>
          <button
            type="button"
            data-testid="button-profile-skip"
            onClick={onSkip}
            style={{
              width: "100%",
              padding: "11px 20px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyRenewalResource() {
  const [, navigate] = useLocation();
  const [promptDismissed, setPromptDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(PROMPT_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user-profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const shouldShowPrompt =
    !promptDismissed && !profileLoading && isProfileEmpty(profile);

  function handleSetup() {
    try { sessionStorage.setItem(PROMPT_SESSION_KEY, "1"); } catch {}
    navigate("/profile");
  }

  function handleSkip() {
    try { sessionStorage.setItem(PROMPT_SESSION_KEY, "1"); } catch {}
    setPromptDismissed(true);
  }

  return (
    <DashboardLayout>
      <Breadcrumb />
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "685px",
        }}
      >
        {profileLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div
              style={{
                width: "22px",
                height: "22px",
                border: "2px solid rgba(255,255,255,0.1)",
                borderTopColor: "rgba(255,255,255,0.4)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : shouldShowPrompt ? (
          <ProfilePrompt onSetup={handleSetup} onSkip={handleSkip} />
        ) : (
          <PrayerRender
            prayerId="prayer_3"
            onDone={() => navigate("/resources")}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
