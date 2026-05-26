import { Link, useLocation } from "wouter";
import { PageContainer } from "./PageContainer";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, KeyRound, Eye, EyeOff, User, BookOpen, Lock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCohortStartDate } from "@/hooks/use-cohort";
import logoImg from "@assets/LOGO_1773954119275.png";
import type { WorkbookSummary } from "@shared/schema";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: user } = useQuery<{ name: string; email: string; role: string; track?: string }>({
    queryKey: ["/api/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--surface-ground)" }}>
      {/* Cathedral background — desktop only */}
      <div
        className="hidden sm:block fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/dashboard_bg_cathedral.png')" }}
      />

      {/* Side-fade overlay — desktop only */}
      <div
        className="hidden sm:block fixed inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
        }}
      />

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: "72px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background:
            "linear-gradient(to bottom, var(--black-80) 0%, var(--black-70) 100%)",
          borderBottom: "1px solid var(--white-8)",
        }}
      >
        {/* Top gradient strip */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "0.5px",
            background: "linear-gradient(to bottom, var(--surface-ground), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Navbar inner row */}
        <PageContainer variant="full" className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center cursor-pointer select-none">
              <img
                src={logoImg}
                alt="Lumen Fidei"
                style={{ height: "16px", width: "auto", objectFit: "contain" }}
              />
            </div>
          </Link>

          {/* Desktop nav links + profile */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/dashboard" active={location === "/dashboard"}>Dashboard</NavLink>
            <NavLink href="/messages" active={location === "/messages"}>Messages</NavLink>
            <NavLink href="/resources" active={location === "/resources"}>Resources</NavLink>
            {/* Collection hidden — not yet released */}
            {(user?.role === 'participant' || user?.role === 'superuser') && (
              <NavLink href="/journal" active={location === "/journal"}>Journal</NavLink>
            )}

            {/* Profile / sign-out button */}
            <div ref={profileRef} style={{ position: "relative", marginLeft: "8px" }}>
              <button
                data-testid="button-profile"
                onClick={() => setProfileOpen((v) => !v)}
                className="type-body-sm font-semibold"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--brand-subtle)",
                  border: "1px solid var(--brand-border)",
                  color: "var(--brand)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-subtle)"; }}
                aria-label="Profile menu"
              >
                {initials}
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: "180px",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--white-8)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    zIndex: 100,
                  }}
                >
                  {user && (
                    <div style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--white-6)",
                    }}>
                      <p className="type-body-md font-medium" style={{ color: "white", margin: 0 }}>{user.name}</p>
                      <p className="type-body-xs" style={{ color: "var(--white-40)", margin: "2px 0 0" }}>{user.email}</p>
                    </div>
                  )}
                  <Link href="/profile">
                    <button
                      data-testid="button-profile-page"
                      onClick={() => setProfileOpen(false)}
                      className="type-body-md"
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "none", border: "none", color: "var(--white-70)", cursor: "pointer", transition: "color 0.15s, background 0.15s", textAlign: "left" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--white-5)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "var(--white-70)"; }}
                    >
                      <User size={14} />
                      Profile
                    </button>
                  </Link>
                  <button
                    data-testid="button-change-password"
                    onClick={() => { setProfileOpen(false); setChangePasswordOpen(true); }}
                    className="type-body-md"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "none", border: "none", color: "var(--white-70)", cursor: "pointer", transition: "color 0.15s, background 0.15s", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--white-5)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "var(--white-70)"; }}
                  >
                    <KeyRound size={14} />
                    Change Password
                  </button>
                  <button
                    data-testid="button-sign-out"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="type-body-md"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      color: "var(--white-70)",
                      cursor: "pointer",
                      transition: "color 0.15s, background 0.15s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--white-5)";
                      (e.currentTarget as HTMLButtonElement).style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--white-70)";
                    }}
                  >
                    <LogOut size={14} />
                    {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            data-testid="button-hamburger-menu"
            className="sm:hidden flex items-center justify-center text-[var(--white-80)] hover:text-white transition-colors"
            style={{ width: "40px", height: "40px" }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </PageContainer>
      </nav>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[60] bg-black/60"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile right-side drawer */}
      <div
        className="sm:hidden fixed top-0 right-0 bottom-0 z-[70] flex flex-col"
        style={{
          width: "260px",
          background: "var(--surface-base)",
          borderLeft: "0.5px solid var(--white-8)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between"
          style={{
            height: "72px",
            padding: "0 20px",
            borderBottom: "0.5px solid var(--white-8)",
            flexShrink: 0,
          }}
        >
          <img
            src={logoImg}
            alt="Lumen Fidei"
            style={{ height: "14px", width: "auto", objectFit: "contain" }}
          />
          <button
            data-testid="button-close-drawer"
            className="text-[var(--white-60)] hover:text-white transition-colors"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex flex-col flex-1" style={{ padding: "12px 0" }}>
          <DrawerLink href="/dashboard" active={location === "/dashboard"} onClick={closeDrawer}>
            Dashboard
          </DrawerLink>
          <DrawerLink href="/messages" active={location === "/messages"} onClick={closeDrawer}>
            Messages
          </DrawerLink>
          <DrawerLink href="/resources" active={location === "/resources"} onClick={closeDrawer}>
            Resources
          </DrawerLink>
          {/* Collection hidden — not yet released */}
          {(user?.role === 'participant' || user?.role === 'superuser') && (
            <DrawerLink href="/journal" active={location === "/journal"} onClick={closeDrawer}>
              Journal
            </DrawerLink>
          )}
        </nav>

        {/* Drawer sign-out */}
        {user && (
          <div style={{ borderTop: "0.5px solid var(--white-8)", padding: "16px 20px" }}>
            <p className="type-body-md font-medium" style={{ color: "white", margin: "0 0 2px" }}>{user.name}</p>
            <p className="type-body-xs" style={{ color: "var(--white-40)", margin: "0 0 12px" }}>{user.email}</p>
            <Link href="/profile">
              <button
                data-testid="button-profile-page-mobile"
                onClick={closeDrawer}
                className="type-body-md"
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--white-50)", cursor: "pointer", padding: "0 0 10px" }}
              >
                <User size={14} />
                Profile
              </button>
            </Link>
            <button
              data-testid="button-change-password-mobile"
              onClick={() => { closeDrawer(); setChangePasswordOpen(true); }}
              className="type-body-md"
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--white-50)", cursor: "pointer", padding: "0 0 10px" }}
            >
              <KeyRound size={14} />
              Change Password
            </button>
            <button
              data-testid="button-sign-out-mobile"
              onClick={() => { closeDrawer(); logoutMutation.mutate(); }}
              disabled={logoutMutation.isPending}
              className="type-body-md"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                color: "var(--white-50)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <ChangePasswordDialog
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => {
            setChangePasswordOpen(false);
            toast({ title: "Password changed", description: "Your new password is now active." });
          }}
        />
      )}

      {/* Page content */}
      <div className="z-10 overflow-y-auto" style={{ position: "fixed", top: "72px", left: 0, right: 0, bottom: 0 }}>
        {children}
      </div>

      {/* Workbook sticky FAB — participants only */}
      {(user?.role === "participant" || user?.role === "superuser") && (
        <WorkbookFAB />
      )}
    </div>
  );
}

const WORKBOOK_SPOTLIGHT_SLUGS = [
  "personal-sins",
  "occult-dark-powers",
  "generational-lines",
  "inner-vows",
  "wounds-forgiveness",
];

const WORKBOOK_SLUG_TO_NAME: Record<string, string> = {
  "personal-sins": "Personal Sins",
  "occult-dark-powers": "Occult & Dark Powers",
  "generational-lines": "Generational Lines",
  "inner-vows": "Inner Vows",
  "wounds-forgiveness": "Wounds & Forgiveness",
};

function WorkbookFAB() {
  const [, navigate] = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const { data: cohortData } = useCohortStartDate();
  const { data: summary = {} } = useQuery<WorkbookSummary>({
    queryKey: ["/api/workbook/summary"],
  });

  const { data: unlockStatus } = useQuery<{ unlockedCategories: number[] }>({
    queryKey: ["/api/workbook/unlock-status"],
  });

  const currentDay = cohortData?.currentDay ?? 0;
  const unlockedCategories = unlockStatus?.unlockedCategories ?? [];
  const isLocked = unlockedCategories.length === 0 && currentDay < 8;

  const sectionsWithContent = Object.values(summary).filter(
    (s) => s && (s.attested || s.count > 0)
  ).length;

  const [spotlightSlug, setSpotlightSlug] = useState<string | null>(() => {
    for (const slug of WORKBOOK_SPOTLIGHT_SLUGS) {
      if (localStorage.getItem(`lf_workbook_spotlight_seen_${slug}`) === "pending") {
        return slug;
      }
    }
    return null;
  });

  useEffect(() => {
    if (spotlightSlug) {
      localStorage.setItem(`lf_workbook_spotlight_seen_${spotlightSlug}`, "seen");
      const timer = setTimeout(() => setSpotlightSlug(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [spotlightSlug]);

  function handleClick() {
    setSpotlightSlug(null);
    navigate("/workbook");
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px",
      }}
    >
      {/* Spotlight backdrop */}
      {spotlightSlug && (
        <div
          data-testid="workbook-spotlight-backdrop"
          onClick={handleClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "rgba(0,0,0,0.65)",
            cursor: "pointer",
          }}
        />
      )}

      {/* Spotlight tooltip */}
      {spotlightSlug && (
        <div
          data-testid="workbook-spotlight-tooltip"
          style={{
            position: "relative",
            zIndex: 101,
            background: "var(--surface-raised)",
            border: "0.5px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "10px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              margin: "0 0 2px",
            }}
          >
            Notebook Unlocked
          </p>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.45)",
              margin: 0,
            }}
          >
            {WORKBOOK_SLUG_TO_NAME[spotlightSlug]} is now open
          </p>
        </div>
      )}

      {/* Hover tooltip (only when no spotlight) */}
      {showTooltip && !spotlightSlug && (
        <div
          style={{
            background: "var(--surface-raised)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: isLocked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            {isLocked ? "Available after Week 2" : "The Deliverance Workbook"}
          </p>
          {!isLocked && sectionsWithContent > 0 && (
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.35)",
                margin: "2px 0 0",
              }}
            >
              {sectionsWithContent} section{sectionsWithContent !== 1 ? "s" : ""} filled
            </p>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        type="button"
        data-testid="button-workbook-fab"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Open Deliverance Workbook"
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: spotlightSlug
            ? "rgba(255,255,255,0.18)"
            : isLocked
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.1)",
          border: `0.5px solid ${isLocked && !spotlightSlug ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.25)"}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 101,
          boxShadow: spotlightSlug
            ? "0 0 0 6px rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.5)"
            : isLocked
            ? "none"
            : "0 4px 16px rgba(0,0,0,0.4)",
          transition: "background 0.15s, box-shadow 0.15s",
          animation: spotlightSlug ? "fabPulse 1.4s ease-in-out infinite" : undefined,
        }}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {isLocked ? (
          <Lock style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.25)" }} />
        ) : (
          <BookOpen style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.75)" }} />
        )}

        {/* Badge */}
        {!isLocked && sectionsWithContent > 0 && (
          <div
            data-testid="badge-workbook-sections"
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid var(--surface-ground)",
            }}
          >
            <span
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#0a0a0a",
                lineHeight: 1,
              }}
            >
              {sectionsWithContent > 9 ? "9+" : sectionsWithContent}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <span
        className={cn("flex items-center cursor-pointer type-body-md", active ? "text-white" : "text-[var(--white-70)] hover:text-white")}
        style={{
          height: "32px",
          padding: "0 12px",
          transition: "color 0.15s",
        }}
      >
        {children}
      </span>
    </Link>
  );
}

function DrawerLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <span
        data-testid={`drawer-link-${String(children).toLowerCase()}`}
        onClick={onClick}
        className={cn(
          "flex items-center cursor-pointer transition-colors type-body-lg",
          active ? "text-white font-medium" : "text-[var(--white-60)] hover:text-white font-normal"
        )}
        style={{
          padding: "14px 20px",
          borderLeft: active ? "2px solid var(--brand)" : "2px solid transparent",
          transition: "color 0.15s, border-color 0.15s",
        }}
      >
        {children}
      </span>
    </Link>
  );
}

function ChangePasswordDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("PATCH", "/api/user/password", { currentPassword, newPassword });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--white-5)",
    border: "1px solid var(--white-8)",
    borderRadius: "6px",
    height: "36px",
    width: "100%",
    color: "white",
    padding: "0 36px 0 12px",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "14px",
  };

  const PasswordInput = ({
    id, value, show, onChange, onToggle, placeholder, testId,
  }: {
    id: string; value: string; show: boolean;
    onChange: (v: string) => void; onToggle: () => void;
    placeholder?: string; testId: string;
  }) => (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="type-body-md"
        style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white-20)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--white-8)"; }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--white-40)", cursor: "pointer", padding: 0, display: "flex" }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: "var(--surface-raised)", border: "1px solid var(--white-8)", borderRadius: "12px", padding: "28px 28px 24px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <p className="type-caption-lg" style={{ color: "white", margin: 0 }}>Change Password</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--white-40)", cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="cp-current" className="type-body-md" style={{ color: "var(--white-70)" }}>Current Password</label>
            <PasswordInput id="cp-current" value={currentPassword} show={showCurrent} onChange={setCurrentPassword} onToggle={() => setShowCurrent(v => !v)} testId="input-current-password" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="cp-new" className="type-body-md" style={{ color: "var(--white-70)" }}>New Password</label>
            <PasswordInput id="cp-new" value={newPassword} show={showNew} onChange={setNewPassword} onToggle={() => setShowNew(v => !v)} placeholder="Minimum 8 characters" testId="input-new-password-dialog" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="cp-confirm" className="type-body-md" style={{ color: "var(--white-70)" }}>Confirm New Password</label>
            <PasswordInput id="cp-confirm" value={confirmPassword} show={showConfirm} onChange={setConfirmPassword} onToggle={() => setShowConfirm(v => !v)} testId="input-confirm-password-dialog" />
          </div>

          {error && (
            <p className="type-body-sm" style={{ color: "#ef4444", margin: 0, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: "6px" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              className="type-body-md"
              style={{ flex: 1, height: "36px", background: "none", border: "1px solid var(--white-12)", borderRadius: "6px", color: "var(--white-60)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              data-testid="button-save-password"
              className="type-body-md font-medium"
              style={{ flex: 1, height: "36px", background: "var(--white-10)", border: "1px solid var(--white-15)", borderRadius: "6px", color: "white", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1 }}
            >
              {isLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
