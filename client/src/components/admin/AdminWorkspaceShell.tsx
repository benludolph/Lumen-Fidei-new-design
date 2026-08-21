import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminWorkspaceShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

type AdminDestination = {
  href: string;
  label: string;
  detail: string;
  icon: typeof LayoutDashboard;
  testId: string;
};

const destinations: AdminDestination[] = [
  {
    href: "/admin",
    label: "Home",
    detail: "Overview",
    icon: LayoutDashboard,
    testId: "admin-nav-home",
  },
  {
    href: "/admin/people",
    label: "People",
    detail: "Participants & mentors",
    icon: UsersRound,
    testId: "admin-nav-people",
  },
  {
    href: "/admin/program",
    label: "Program",
    detail: "Curriculum & lessons",
    icon: BookOpen,
    testId: "admin-nav-program",
  },
  {
    href: "/admin/cohort",
    label: "Cohort",
    detail: "Timing & settings",
    icon: CalendarDays,
    testId: "admin-nav-cohort",
  },
  {
    href: "/admin/operations",
    label: "Operations",
    detail: "Progress & upkeep",
    icon: Activity,
    testId: "admin-nav-operations",
  },
];

function isDestinationActive(location: string, href: string) {
  return href === "/admin"
    ? location === href
    : location === href || location.startsWith(`${href}/`);
}

function WorkspaceNavigation({ location }: { location: string }) {
  return (
    <nav
      aria-label="Admin workspace"
      className="relative -mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max gap-1 rounded-xl border border-border/70 bg-muted/35 p-1.5">
        {destinations.map(({ href, label, detail, icon: Icon, testId }) => {
          const active = isDestinationActive(location, href);

          return (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-14 min-w-[8.25rem] items-center gap-3 rounded-lg px-3.5 py-2.5 outline-none transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/70 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="type-body-md font-semibold leading-tight">{label}</span>
                <span className="type-body-xs mt-0.5 whitespace-nowrap text-muted-foreground">
                  {detail}
                </span>
              </span>
              {active && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminWorkspaceShell({
  title,
  description,
  actions,
  children,
}: AdminWorkspaceShellProps) {
  const [location] = useLocation();

  return (
    <section className="relative min-h-[calc(100dvh-5rem)] pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative space-y-6">
        <header className="border-b border-border/70 pb-5">
          <div className="mb-5 flex items-center gap-2 text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="type-caption-sm">Lumen Fidei</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <span className="type-caption-sm text-foreground/70">Admin workspace</span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <CircleUserRound className="h-4 w-4" strokeWidth={1.8} />
                <span className="type-caption-sm">Stewardship console</span>
              </div>
              <h1 className="type-display-lg text-foreground">{title}</h1>
              <p className="type-body-lg mt-2 max-w-xl text-muted-foreground">{description}</p>
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </header>

        <WorkspaceNavigation location={location} />

        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">{children}</div>
      </div>
    </section>
  );
}

export default AdminWorkspaceShell;