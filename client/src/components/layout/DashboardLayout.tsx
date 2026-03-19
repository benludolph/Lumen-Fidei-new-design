import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/messages", label: "Messages" },
    { href: "/resources", label: "Resources" },
    { href: "/collections", label: "Collection" },
  ];

  return (
    <div className="relative min-h-screen bg-[#0b0b0b] overflow-x-hidden">

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: "72px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "linear-gradient(to bottom, rgba(11,11,11,0.8) 0%, rgba(11,11,11,0.76) 100%)",
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

        {/* Navbar inner row — 16px padding on mobile, Figma padding on desktop */}
        <div className="flex items-center justify-between h-full px-4 md:pl-[107px] md:pr-[115px]">
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
          <div className="hidden md:flex items-center">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} active={location === href}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Hamburger button — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ top: "72px", background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className="fixed left-0 right-0 z-40 md:hidden"
            style={{
              top: "72px",
              background: "#0f1011",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex flex-col py-2">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span
                    className={cn(
                      "flex items-center px-5 py-3 cursor-pointer transition-colors",
                      location === href
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    )}
                    style={{ fontFamily: "'Afacad', sans-serif", fontSize: "16px" }}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${label.toLowerCase()}`}
                  >
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

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
