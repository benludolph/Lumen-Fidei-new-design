import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Check,
  Layers3,
  Library,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyProgramEnrollments,
  type MyProgramEnrollment,
} from "@/hooks/use-program-enrollments";
import type { CurriculumDocument } from "@shared/curriculum";

function ProgramCard({
  item,
}: {
  item: MyProgramEnrollment;
}) {
  const curriculum = item.release.curriculum as CurriculumDocument;
  const lessons = curriculum.modules.flatMap((module) => module.lessons);
  const completedKeys = new Set(
    item.progress.filter((row) => row.completed).map((row) => row.lessonKey),
  );
  const completedCount = lessons.filter((lesson) =>
    completedKeys.has(lesson.key),
  ).length;
  const percentage = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;
  const isTrackA = item.program.key === "track-a";

  return (
    <article
      className="overflow-hidden rounded-3xl border border-white/10 bg-black/45 shadow-2xl backdrop-blur-md"
      data-testid={`program-card-${item.program.key}`}
    >
      <div className="border-b border-white/10 px-5 py-6 sm:px-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-light)]">
            Your release
          </span>
          <span className="text-xs text-white/50">
            {item.release.label || `Release ${item.release.releaseNumber}`}
          </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[var(--brand-light)] sm:flex">
            <Library size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl text-white sm:text-3xl">
              {item.program.name}
            </h2>
            {item.program.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                {item.program.description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-white/55">
            <span>
              {completedCount} of {lessons.length} lessons complete
            </span>
            <span>{percentage}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--brand-light)] transition-[width]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {isTrackA ? (
        <div className="px-5 py-5 sm:px-7">
          <p className="mb-4 text-sm text-white/60">
            Track A continues in your familiar daily dashboard.
          </p>
          <Link href="/dashboard">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand-default)] px-5 text-sm font-semibold text-white transition hover:brightness-110">
              Continue Track A <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {curriculum.modules.map((module, moduleIndex) => (
            <section key={module.key} className="px-5 py-6 sm:px-7">
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
                  {moduleIndex + 1}
                </div>
                <div>
                  <h3 className="font-serif text-xl text-white">{module.title}</h3>
                  {module.subtitle && (
                    <p className="mt-1 text-sm text-white/50">
                      {module.subtitle}
                    </p>
                  )}
                </div>
              </div>
              {module.lessons.length ? (
                <div className="space-y-2">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const completed = completedKeys.has(lesson.key);
                    return (
                      <Link
                        key={lesson.key}
                        href={`/my-programs/${encodeURIComponent(item.program.key)}/lessons/${encodeURIComponent(lesson.key)}`}
                      >
                        <div
                          className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
                          data-testid={`program-lesson-${lesson.key}`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              completed
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-white/10 text-white/60"
                            }`}
                          >
                            {completed ? (
                              <Check size={16} />
                            ) : (
                              <span className="text-xs">{lessonIndex + 1}</span>
                            )}
                          </div>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-white">
                              {lesson.title}
                            </span>
                            {lesson.subtitle && (
                              <span className="mt-0.5 block truncate text-xs text-white/45">
                                {lesson.subtitle}
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            size={17}
                            className="text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white/70"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/45">
                  Lessons will appear here when they are added to this release.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

export default function MyPrograms() {
  const { data, isLoading, error } = useMyProgramEnrollments();

  return (
    <DashboardLayout>
      <main className="relative z-10 min-h-screen pb-16 pt-28">
        <PageContainer variant="wide">
          <header className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-[var(--brand-light)]">
              <Layers3 size={17} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Learning library
              </span>
            </div>
            <h1 className="font-serif text-4xl text-white sm:text-5xl">
              My Programs
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Open the exact release assigned to you. Your progress stays with
              that release even when newer versions are published.
            </p>
          </header>

          {isLoading && (
            <div className="space-y-5">
              <Skeleton className="h-72 rounded-3xl bg-white/10" />
              <Skeleton className="h-56 rounded-3xl bg-white/10" />
            </div>
          )}

          {error && (
            <div className="rounded-3xl border border-red-300/20 bg-red-950/30 p-6 text-red-100">
              We couldn&apos;t load your programs. Please refresh and try again.
            </div>
          )}

          {data && data.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-black/40 px-6 py-14 text-center backdrop-blur-md">
              <BookOpen className="mx-auto mb-4 text-white/35" size={34} />
              <h2 className="font-serif text-2xl text-white">
                No programs assigned yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
                When an administrator assigns a program, it will appear here
                with the release selected for you.
              </p>
            </div>
          )}

          {data && data.length > 0 && (
            <div className="space-y-6">
              {data.map((item) => (
                <ProgramCard key={item.enrollment.id} item={item} />
              ))}
            </div>
          )}
        </PageContainer>
      </main>
    </DashboardLayout>
  );
}