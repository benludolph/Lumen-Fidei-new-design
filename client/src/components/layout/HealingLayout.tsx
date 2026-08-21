import { Link, useLocation } from "wouter";
import { PageContainer } from "./PageContainer";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, KeyRound, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/LOGO_1773954119275.png";

interface HealingLayoutProps {
  children: React.ReactNode;
}

export function HealingLayout({ children }: HealingLayoutProps) {
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
      <div
        className="hidden sm:block fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/dashboard_bg_cathedral.png')" }}
      />
      <div
        className="hidden sm:block fixed inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
        }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: "72px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "linear-gradient(to bottom, var(--black-80) 0%, var(--black-70) 100%)",
          borderBottom: "1px solid var(--white-8)",
        }}
      >
        <PageContainer variant="full" className="flex items-center justify-between h-full">
          <Link href="/healing">
            <div className="flex items-center cursor-pointer select-none">
              <img src={logoImg} alt="Lumen Fidei" style={{ height: "16px", width: "auto", objectFit: "contain" }} />
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/healing" active={location === "/healing"}>Dashboard</NavLink>
            <NavLink href="/my-programs" active={location.startsWith("/my-programs")}>My Programs</NavLink>
            <NavLink href="/resources" active={location.startsWith("/resources")}>Resources</NavLink>
            <NavLink href="/healing/journal" active={location === "/healing/journal"}>Journal</NavLink>

            <div ref={profileRef} style={{ position: "relative", marginLeft: "8px" }}>
              <button
                data-testid="button-profile"
                onClick={() => setProfileOpen((v) => !v)}
                className="type-body-sm font-semibold"
                style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--brand-subtle)", border: "1px solid var(--brand-border)",
                  color: "var(--brand)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-subtle)"; }}
                aria-label="Profile menu"
              >
                {initials}
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    minWidth: "180px", background: "var(--surface-raised)",
                    border: "1px solid var(--white-8)", borderRadius: "8px",
                    overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100,
                  }}
                >
                  {user && (
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--white-6)" }}>
                      <p className="type-body-md font-medium" style={{ color: "white", margin: 0 }}>{user.name}</p>
                      <p className="type-body-xs" style={{ color: "var(--white-40)", margin: "2px 0 0" }}>{user.email}</p>
                    </div>
                  )}
                  <button
                    data-testid="button-change-password"
                    onClick={() => { setProfileOpen(false); setChangePasswordOpen(true); }}
                    className="type-body-md"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "none", border: "none", color: "var(--white-70)", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--white-5)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  >
                    <KeyRound size={14} />
                    Change Password
                  </button>
                  <button
                    data-testid="button-sign-out"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="type-body-md"
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "none", border: "none", color: "var(--white-70)", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--white-5)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  >
                    <LogOut size={14} />
                    {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          </div>

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

      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-[60] bg-black/60" onClick={closeDrawer} />
      )}

      <div
        className="sm:hidden fixed top-0 right-0 bottom-0 z-[70] flex flex-col"
        style={{
          width: "260px", background: "var(--surface-base)",
          borderLeft: "0.5px solid var(--white-8)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ height: "72px", padding: "0 20px", borderBottom: "0.5px solid var(--white-8)", flexShrink: 0 }}
        >
          <img src={logoImg} alt="Lumen Fidei" style={{ height: "14px", width: "auto", objectFit: "contain" }} />
          <button
            data-testid="button-close-drawer"
            className="text-[var(--white-60)] hover:text-white transition-colors"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col flex-1" style={{ padding: "12px 0" }}>
          <DrawerLink href="/healing" active={location === "/healing"} onClick={closeDrawer}>Dashboard</DrawerLink>
          <DrawerLink href="/my-programs" active={location.startsWith("/my-programs")} onClick={closeDrawer}>My Programs</DrawerLink>
          <DrawerLink href="/resources" active={location.startsWith("/resources")} onClick={closeDrawer}>Resources</DrawerLink>
          <DrawerLink href="/healing/journal" active={location === "/healing/journal"} onClick={closeDrawer}>Journal</DrawerLink>
        </nav>

        {user && (
          <div style={{ borderTop: "0.5px solid var(--white-8)", padding: "16px 20px" }}>
            <p className="type-body-md font-medium" style={{ color: "white", margin: "0 0 2px" }}>{user.name}</p>
            <p className="type-body-xs" style={{ color: "var(--white-40)", margin: "0 0 12px" }}>{user.email}</p>
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
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--white-50)", cursor: "pointer", padding: 0 }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {changePasswordOpen && (
        <ChangePasswordDialog
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => {
            setChangePasswordOpen(false);
            toast({ title: "Password changed", description: "Your new password is now active." });
          }}
        />
      )}

      <div className="z-10 overflow-y-auto" style={{ position: "fixed", top: "72px", left: 0, right: 0, bottom: 0 }}>
        {children}
      </div>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span
        className={cn("flex items-center cursor-pointer type-body-md", active ? "text-white" : "text-[var(--white-70)] hover:text-white")}
        style={{ height: "32px", padding: "0 12px", transition: "color 0.15s" }}
      >
        {children}
      </span>
    </Link>
  );
}

function DrawerLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span
        onClick={onClick}
        className={cn("flex items-center cursor-pointer transition-colors type-body-lg", active ? "text-white font-medium" : "text-[var(--white-60)] hover:text-white font-normal")}
        style={{ padding: "14px 20px", borderLeft: active ? "2px solid var(--brand)" : "2px solid transparent", transition: "color 0.15s, border-color 0.15s" }}
      >
        {children}
      </span>
    </Link>
  );
}

function ChangePasswordDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    setIsLoading(true);
    try {
      await apiRequest("PATCH", "/api/user/password", { currentPassword, newPassword });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--white-5)", border: "1px solid var(--white-8)",
    borderRadius: "6px", height: "36px", width: "100%",
    color: "white", padding: "0 36px 0 12px", outline: "none",
    boxSizing: "border-box", fontSize: "14px",
  };

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
          {[
            { id: "cp-c", label: "Current Password", val: currentPassword, show: showCurrent, setVal: setCurrentPassword, toggle: () => setShowCurrent(v => !v), placeholder: undefined },
            { id: "cp-n", label: "New Password", val: newPassword, show: showNew, setVal: setNewPassword, toggle: () => setShowNew(v => !v), placeholder: "Min 8 characters" as string | undefined },
            { id: "cp-cf", label: "Confirm New Password", val: confirmPassword, show: showConfirm, setVal: setConfirmPassword, toggle: () => setShowConfirm(v => !v), placeholder: undefined },
          ].map(({ id, label, val, show, setVal, toggle, placeholder }: { id: string; label: string; val: string; show: boolean; setVal: (v: string) => void; toggle: () => void; placeholder: string | undefined }) => (
            <div key={id} className="flex flex-col gap-2">
              <label className="type-body-md" style={{ color: "var(--white-70)" }}>{label}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder={placeholder}
                  className="type-body-md"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white-20)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--white-8)"; }}
                />
                <button
                  type="button"
                  onClick={toggle}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--white-40)", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          {error && (
            <p className="type-body-sm" style={{ color: "#ef4444", margin: 0, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: "6px" }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} className="type-body-md" style={{ flex: 1, height: "36px", background: "none", border: "1px solid var(--white-12)", borderRadius: "6px", color: "var(--white-60)", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} data-testid="button-save-password" className="type-body-md font-medium" style={{ flex: 1, height: "36px", background: "var(--white-10)", border: "1px solid var(--white-15)", borderRadius: "6px", color: "white", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1 }}>
              {isLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
