import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

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

  return (
    <div className="relative min-h-screen bg-[#0b0b0b] overflow-x-hidden">
      {/* Cathedral background — fixed full viewport */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/dashboard_bg_cathedral.png')" }}
      />

      {/* Side-fade overlay: collapses edges to black, keeps 608px center visible */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
        }}
      />

      {/* Navbar — Figma exact */}
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
        {/* Top gradient strip — 0.5px height from #08090a to transparent */}
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
        <div
          className="flex items-center justify-between h-full"
          style={{
            paddingLeft: "107px",
            paddingRight: "115px",
          }}
        >
          {/* Logo: candle SVG + "LUMEN FIDEI" text, gap 8px */}
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

          {/* Nav links: Messages, Resources, Collection — white, 14px */}
          <div className="flex items-center">
            <NavLink href="/messages" active={location === "/messages"}>Messages</NavLink>
            <NavLink href="/resources" active={location === "/resources"}>Resources</NavLink>
            <NavLink href="/collections" active={location === "/collections"}>Collection</NavLink>
          </div>
        </div>
      </nav>

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
