import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalModule } from "@shared/schema";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EntryCard({ dayNumber, centralTheme, content, createdAt }: {
  dayNumber: number;
  centralTheme: string;
  content: string;
  createdAt: string;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-secondary/20 p-4 sm:p-5 space-y-2"
      data-testid={`journal-entry-${dayNumber}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Day {dayNumber}
          </p>
          <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground leading-tight">
            {centralTheme}
          </h3>
        </div>
        <time
          className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-1"
          dateTime={createdAt}
        >
          {formatDate(createdAt)}
        </time>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

function ModuleSection({ mod, defaultOpen }: { mod: JournalModule; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl overflow-hidden" data-testid={`journal-module-${mod.weekNumber}`}>
      <button
        className={cn(
          "w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/30",
          open ? "bg-secondary/20" : "bg-background"
        )}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        data-testid={`button-journal-module-${mod.weekNumber}`}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Week {mod.weekNumber}
          </p>
          <h2 className="font-serif text-base sm:text-lg font-semibold text-foreground leading-tight">
            {mod.moduleTitle}
          </h2>
          {mod.moduleSubtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{mod.moduleSubtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {mod.entries.length} {mod.entries.length === 1 ? "entry" : "entries"}
          </span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {mod.entries.map(entry => (
            <EntryCard key={entry.dayNumber} {...entry} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Journal() {
  const { user } = useAuth();

  const { data: modules, isLoading } = useQuery<JournalModule[]>({
    queryKey: ["/api/journal"],
    enabled: !!user,
  });

  const hasEntries = modules && modules.some(m => m.entries.length > 0);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your written reflections from each lesson, organized by module.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-56" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !hasEntries && (
          <div
            className="flex flex-col items-center justify-center py-20 text-center gap-4"
            data-testid="journal-empty-state"
          >
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No journal entries yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your responses from Text Input slides will appear here, grouped by module.
              </p>
            </div>
          </div>
        )}

        {!isLoading && hasEntries && (
          <div className="space-y-3">
            {modules.map((mod) => (
              <ModuleSection
                key={mod.weekNumber}
                mod={mod}
                defaultOpen={mod.entries.length > 0}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
