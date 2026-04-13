import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
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
      data-testid={`journal-entry-${dayNumber}`}
      style={{
        background: "var(--white-5)",
        border: "1px solid var(--white-8)",
        borderRadius: "8px",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          <p className="type-body-sm" style={{ color: "var(--white-40)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Day {dayNumber}
          </p>
          <h3 className="type-caption-lg" style={{ color: "white", margin: 0, lineHeight: 1.3 }}>
            {centralTheme}
          </h3>
        </div>
        <time className="type-body-sm" style={{ color: "var(--white-35)", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "2px" }}>
          {formatDate(createdAt)}
        </time>
      </div>
      <p className="type-body-md" style={{ color: "var(--white-60)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {content}
      </p>
    </div>
  );
}

function ModuleSection({ mod, defaultOpen }: { mod: JournalModule; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      data-testid={`journal-module-${mod.weekNumber}`}
      style={{
        border: "1px solid var(--white-8)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <button
        className={cn("w-full text-left transition-colors")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "16px 20px",
          background: open ? "var(--white-5)" : "transparent",
          cursor: "pointer",
          border: "none",
          outline: "none",
        }}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        data-testid={`button-journal-module-${mod.weekNumber}`}
      >
        <div style={{ minWidth: 0 }}>
          <p className="type-body-sm" style={{ color: "var(--white-40)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>
            Week {mod.weekNumber}
          </p>
          <h2 className="type-caption-lg" style={{ color: "white", margin: 0, lineHeight: 1.3 }}>
            {mod.moduleTitle}
          </h2>
          {mod.moduleSubtitle && (
            <p className="type-body-sm" style={{ color: "var(--white-40)", margin: "3px 0 0" }}>{mod.moduleSubtitle}</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <span className="type-body-sm" style={{
            background: "var(--white-8)",
            color: "var(--white-50)",
            borderRadius: "20px",
            padding: "2px 10px",
          }}>
            {mod.entries.length} {mod.entries.length === 1 ? "entry" : "entries"}
          </span>
          {open
            ? <ChevronDown className="w-4 h-4" style={{ color: "var(--white-40)" }} />
            : <ChevronRight className="w-4 h-4" style={{ color: "var(--white-40)" }} />
          }
        </div>
      </button>

      {open && (
        <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {mod.entries.map(entry => (
            <EntryCard key={`${entry.dayNumber}-${entry.createdAt}`} {...entry} />
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
      <PageContainer variant="narrow" className="pt-[80px] pb-20 min-h-[calc(100vh-72px)]">
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

          <h1 className="type-display-xl text-center" style={{ color: "white", margin: 0 }}>
            Journal
          </h1>

          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{ border: "1px solid var(--white-8)", borderRadius: "10px", padding: "20px" }}
                >
                  <div style={{ height: "12px", width: "80px", background: "var(--white-8)", borderRadius: "4px", marginBottom: "8px" }} />
                  <div style={{ height: "18px", width: "200px", background: "var(--white-8)", borderRadius: "4px" }} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !hasEntries && (
            <div
              data-testid="journal-empty-state"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center", gap: "16px" }}
            >
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "var(--white-5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BookOpen className="w-7 h-7" style={{ color: "var(--white-40)" }} />
              </div>
              <div>
                <p className="type-caption-lg" style={{ color: "white", margin: "0 0 4px" }}>No journal entries yet</p>
                <p className="type-body-md" style={{ color: "var(--white-50)", margin: 0 }}>
                  Your responses from lessons will appear here, grouped by module.
                </p>
              </div>
            </div>
          )}

          {!isLoading && hasEntries && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
      </PageContainer>
    </DashboardLayout>
  );
}
