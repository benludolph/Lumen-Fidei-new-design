import type { ReactNode } from "react";
import { Link } from "wouter";
import { ShieldCheck, Sparkles } from "lucide-react";

export function ProgramFrame({
  children,
  eyebrow = "Program workspace",
}: { children: ReactNode; eyebrow?: string }) {
  return (
    <main className="min-h-[100dvh] bg-[hsl(42_32%_96%)] text-[hsl(182_24%_18%)]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:px-12">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/admin/program" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(174_31%_29%)] text-[hsl(43_45%_92%)]">
              <Sparkles size={17} />
            </span>
            <span>
              <span className="block font-serif text-xl">Lumen Fidei</span>
              <span className="text-[10px] uppercase tracking-[.24em] text-muted-foreground">{eyebrow}</span>
            </span>
          </Link>
          <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ShieldCheck size={15} /> single-admin workspace
          </span>
        </header>
        {children}
      </div>
    </main>
  );
}

export function Notice({ text, error = false }: { text?: string; error?: boolean }) {
  if (!text) return null;
  return (
    <div role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-300 bg-red-50 text-red-800" : "border-[hsl(174_28%_72%)] bg-[hsl(174_35%_92%)] text-[hsl(174_31%_25%)]"}`}>
      {text}
    </div>
  );
}