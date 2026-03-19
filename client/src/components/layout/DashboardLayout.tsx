import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImg from "@assets/LOGO_1773954119275.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery<{ name: string; email: string; role: string }>({
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
    <div className="relative min-h-screen bg-[#0b0b0b] overflow-x-hidden">
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
            "linear-gradient(to bottom, rgba(11,11,11,0.8) 0%, rgba(11,11,11,0.76) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
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
            background: "linear-gradient(to bottom, #08090a, transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Navbar inner row */}
        <div className="flex items-center justify-between h-full px-4 sm:px-[107px]">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center cursor-pointer select-none">
              <img
                src={logoImg}
                alt="Lumen Fidei"
                style={{ height: "32px", width: "auto", objectFit: "contain" }}
              />
            </div>
          </Link>

          {/* Desktop nav links + profile */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/dashboard" active={location === "/dashboard"}>Dashboard</NavLink>
            <NavLink href="/messages" active={location === "/messages"}>Messages</NavLink>
            <NavLink href="/resources" active={location === "/resources"}>Resources</NavLink>
            <NavLink href="/collections" active={location === "/collections"}>Collection</NavLink>

            {/* Profile / sign-out button */}
            <div ref={profileRef} style={{ position: "relative", marginLeft: "8px" }}>
              <button
                data-testid="button-profile"
                onClick={() => setProfileOpen((v) => !v)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(240,120,48,0.15)",
                  border: "1px solid rgba(240,120,48,0.3)",
                  color: "#F07830",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(240,120,48,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(240,120,48,0.15)"; }}
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
                    background: "#141516",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    zIndex: 100,
                  }}
                >
                  {user && (
                    <div style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", fontWeight: 500, color: "white", margin: 0 }}>{user.name}</p>
                      <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{user.email}</p>
                    </div>
                  )}
                  <button
                    data-testid="button-sign-out"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "color 0.15s, background 0.15s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLButtonElement).style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
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
            className="sm:hidden flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{ width: "40px", height: "40px" }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
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
          background: "#0f1011",
          borderLeft: "0.5px solid rgba(255,255,255,0.08)",
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
            borderBottom: "0.5px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <img
            src={logoImg}
            alt="Lumen Fidei"
            style={{ height: "28px", width: "auto", objectFit: "contain" }}
          />
          <button
            data-testid="button-close-drawer"
            className="text-white/60 hover:text-white transition-colors"
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
          <DrawerLink href="/collections" active={location === "/collections"} onClick={closeDrawer}>
            Collection
          </DrawerLink>
        </nav>

        {/* Drawer sign-out */}
        {user && (
          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", padding: "16px 20px" }}>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", fontWeight: 500, color: "white", margin: "0 0 2px" }}>{user.name}</p>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "0 0 12px" }}>{user.email}</p>
            <button
              data-testid="button-sign-out-mobile"
              onClick={() => { closeDrawer(); logoutMutation.mutate(); }}
              disabled={logoutMutation.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "13px",
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

      {/* Page content */}
      <div className="relative z-10 pt-[72px] min-h-screen">
        {children}
      </div>
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
        className={cn("flex items-center cursor-pointer", active ? "text-white" : "text-white/70 hover:text-white")}
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "14px",
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
          "flex items-center cursor-pointer transition-colors",
          active ? "text-white" : "text-white/60 hover:text-white"
        )}
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "16px",
          fontWeight: active ? 500 : 400,
          padding: "14px 20px",
          borderLeft: active ? "2px solid #F07830" : "2px solid transparent",
          transition: "color 0.15s, border-color 0.15s",
        }}
      >
        {children}
      </span>
    </Link>
  );
}
