import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    refetchInterval: 30000,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="relative min-h-screen bg-[#0b0b0b] overflow-x-hidden">
      {/* Cathedral background image — full viewport */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/dashboard_bg_cathedral.png')" }}
      />

      {/* Side-fade overlay: collapses edges to black, keeps center clear */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
        }}
      />

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          height: "72px",
          paddingLeft: "clamp(16px, 6vw, 107px)",
          paddingRight: "clamp(16px, 6vw, 115px)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background:
            "linear-gradient(to bottom, rgba(11,11,11,0.8) 0%, rgba(11,11,11,0.76) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer select-none">
            <CandleIcon />
            <span
              className="text-white uppercase tracking-[0.08em] text-[13px] font-medium"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              Lumen Fidei
            </span>
          </div>
        </Link>

        {/* Nav links — Figma: Messages, Resources, Collection */}
        <div className="flex items-center gap-6 sm:gap-8">
          <NavLink href="/messages" active={location === "/messages"}>
            <span className="flex items-center gap-1">
              Messages
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-4 min-w-4 px-1 text-[10px]"
                  data-testid="badge-unread-messages"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </span>
          </NavLink>
          <span className="hidden sm:flex">
            <NavLink href="/resources" active={location === "/resources"}>
              Resources
            </NavLink>
          </span>
          <span className="hidden sm:flex">
            <NavLink href="/collections" active={location === "/collections"}>
              Collection
            </NavLink>
          </span>
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
        className={cn(
          "flex items-center transition-colors text-[13px] cursor-pointer",
          active
            ? "text-white"
            : "text-[rgba(255,255,255,0.45)] hover:text-white",
        )}
        style={{ fontFamily: "'Afacad', sans-serif" }}
      >
        {children}
      </span>
    </Link>
  );
}
