import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function CandleIcon() {
  return (
    <svg width="13" height="20" viewBox="0 0 13 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6.5 0C6.5 0 9 3.5 9 6C9 7.7 8 8.8 6.5 9C5 8.8 4 7.7 4 6C4 3.5 6.5 0 6.5 0Z" fill="#F07830"/>
      <rect x="4" y="9" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.4)"/>
      <rect x="3.5" y="10" width="6" height="10" rx="1.5" fill="rgba(255,255,255,0.25)"/>
    </svg>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

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

        {/* Navbar inner row — responsive padding */}
        <div
          className="flex items-center justify-between h-full px-4 sm:px-[107px]"
        >
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center cursor-pointer select-none" style={{ gap: "8px" }}>
              <CandleIcon />
              <span
                className="text-white uppercase"
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                }}
              >
                Lumen Fidei
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center">
            <NavLink href="/messages" active={location === "/messages"}>Messages</NavLink>
            <NavLink href="/resources" active={location === "/resources"}>Resources</NavLink>
            <NavLink href="/collections" active={location === "/collections"}>Collection</NavLink>
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
          <div className="flex items-center" style={{ gap: "8px" }}>
            <CandleIcon />
            <span
              className="text-white uppercase"
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.08em",
              }}
            >
              Lumen Fidei
            </span>
          </div>
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
        <nav className="flex flex-col" style={{ padding: "12px 0" }}>
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
