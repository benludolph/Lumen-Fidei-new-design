import { useMemo } from "react";
import { Link, Redirect, useLocation, useRoute } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { LessonFlow } from "@/components/lesson/LessonFlow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyProgramEnrollments } from "@/hooks/use-program-enrollments";
import { releaseLessonToFlowContent } from "@/lib/program-content";
import { queryClient } from "@/lib/queryClient";
import { programsApi } from "@shared/routes";
import type { CurriculumDocument } from "@shared/curriculum";

export default function ProgramLesson() {
  const [, navigate] = useLocation();
  const [, params] = useRoute(
    "/my-programs/:programKey/lessons/:lessonKey",
  );
  const { data, isLoading, error } = useMyProgramEnrollments();
  const programKey = params?.programKey
    ? decodeURIComponent(params.programKey)
    : "";
  const lessonKey = params?.lessonKey
    ? decodeURIComponent(params.lessonKey)
    : "";

  const selected = useMemo(() => {
    const item = data?.find((candidate) => candidate.program.key === programKey);
    if (!item) return null;
    const curriculum = item.release.curriculum as CurriculumDocument;
    const module = curriculum.modules.find((candidate) =>
      candidate.lessons.some((lesson) => lesson.key === lessonKey),
    );
    const lesson = module?.lessons.find(
      (candidate) => candidate.key === lessonKey,
    );
    if (!module || !lesson) return null;
    return { item, curriculum, module, lesson };
  }, [data, lessonKey, programKey]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="relative z-10 min-h-screen pt-28">
          <PageContainer variant="content">
            <Skeleton className="h-96 rounded-3xl bg-white/10" />
          </PageContainer>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !selected) {
    return (
      <DashboardLayout>
        <main className="relative z-10 min-h-screen pt-28">
          <PageContainer variant="content">
            <div className="rounded-3xl border border-white/10 bg-black/45 p-7 text-white backdrop-blur-md">
              <AlertCircle className="mb-4 text-[var(--brand-light)]" />
              <h1 className="font-serif text-3xl">
                This lesson isn&apos;t available
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/60">
                It may not belong to your assigned release, or your enrollment
                is no longer active.
              </p>
              <Link href="/my-programs">
                <button className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold hover:bg-white/15">
                  <ArrowLeft size={16} /> Back to My Programs
                </button>
              </Link>
            </div>
          </PageContainer>
        </main>
      </DashboardLayout>
    );
  }

  if (selected.item.program.key === "track-a") {
    return <Redirect to="/dashboard" />;
  }

  const content = releaseLessonToFlowContent(
    selected.curriculum,
    selected.lesson,
  );
  const contextKey = `${selected.item.program.key}-${selected.lesson.key}`;
  const backToPrograms = () => navigate("/my-programs");
  const refreshProgress = () => {
    queryClient.invalidateQueries({
      queryKey: [programsApi.listMyEnrollments.path],
    });
  };

  return (
    <LessonFlow
      key={`${selected.item.enrollment.id}-${selected.lesson.key}`}
      content={content}
      dayNumber={-1}
      backgroundImage={selected.lesson.imageUrl || selected.module.imageUrl}
      openingPrayer={
        selected.lesson.openingPrayerText ||
        selected.lesson.openingPrayerAudio
          ? {
              text: selected.lesson.openingPrayerText ?? "",
              audioUrl: selected.lesson.openingPrayerAudio,
            }
          : null
      }
      closingPrayer={
        selected.lesson.closingPrayerText ||
        selected.lesson.closingPrayerAudio
          ? {
              text: selected.lesson.closingPrayerText ?? "",
              audioUrl: selected.lesson.closingPrayerAudio,
            }
          : null
      }
      releaseProgress={{
        enrollmentId: selected.item.enrollment.id,
        lessonKey: selected.lesson.key,
      }}
      lessonContextKey={contextKey}
      canSkipPrayer
      onExit={backToPrograms}
      onComplete={backToPrograms}
      onLessonFinished={refreshProgress}
    />
  );
}