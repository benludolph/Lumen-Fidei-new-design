import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    refetchInterval: 30000,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="relative min-h-screen bg-[#0b0b0b] overflow-hidden">
      {/* Cathedral background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/dashboard_bg_cathedral.png')" }}
      />

      {/* Gradient overlay — collapses edges to black, keeps center clear */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
        }}
      />

      {/* Top fade to black */}
      <div
        className="absolute inset-x-0 top-0 h-[200px] pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-[120px] pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 lg:px-[107px]"
        style={{
          height: "72px",
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
            <Flame className="w-[18px] h-[18px] text-[#F07830]" strokeWidth={1.5} />
            <span
              className="text-white uppercase tracking-[0.08em] text-[13px] font-medium"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              Lumen Fidei
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
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
          {(user?.role === "mentor" || user?.role === "admin") && (
            <span className="hidden sm:flex">
              <NavLink href="/mentor" active={location === "/mentor"}>
                Mentorship
              </NavLink>
            </span>
          )}
          {user?.role === "admin" && (
            <span className="hidden sm:flex">
              <NavLink href="/admin" active={location === "/admin"}>
                Admin
              </NavLink>
            </span>
          )}
          <button
            onClick={() => logout()}
            className="text-[rgba(255,255,255,0.45)] hover:text-white transition-colors text-[13px] hidden sm:block"
            style={{ fontFamily: "'Afacad', sans-serif" }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Page content — scrollable, full height */}
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
            : "text-[rgba(255,255,255,0.45)] hover:text-white"
        )}
        style={{ fontFamily: "'Afacad', sans-serif" }}
      >
        {children}
      </span>
    </Link>
  );
}
