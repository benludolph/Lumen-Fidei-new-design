import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTrackADailyContent, useAllTrackAContent } from "@/hooks/use-track-a-content";
import { useUserAnswers } from "@/hooks/use-answers";
import { useUserPrayerCompletions, useMarkPrayerComplete } from "@/hooks/use-prayer-completions";
import { useCohortStartDate } from "@/hooks/use-cohort";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DayGridView } from "@/components/DayGridView";
import { LessonFlow } from "@/components/lesson/LessonFlow";
import { WeekTransitionCinematic } from "@/components/WeekTransitionCinematic";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { trackFetch as fetch, activityLocalStorage as localStorage } from "@/lib/track-context";
import { useToast } from "@/hooks/use-toast";
import type { TrackAModule, TrackAContent, PrelimModuleWithStatus, LessonWorkbookModuleWithStatus } from "@shared/schema";

const TRIGGER_DAY_TO_CATEGORY: Record<number, { name: string; slug: string }> = {
  7: { name: "Personal Sins", slug: "personal-sins" },
  9: { name: "Occult & Dark Powers", slug: "occult-dark-powers" },
  11: { name: "Generational Lines", slug: "generational-lines" },
  12: { name: "Inner Vows", slug: "inner-vows" },
  15: { name: "Wounds & Forgiveness", slug: "wounds-forgiveness" },
};

function LessonLoading() {
  return <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Skeleton className="h-40 w-full max-w-lg" />
    <Skeleton className="h-5 w-48" />
  </div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "detail" | "prelim" | "workbook">("grid");
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedPrelimPosition, setSelectedPrelimPosition] = useState(1);
  const [selectedWorkbookId, setSelectedWorkbookId] = useState(0);
  const [completedModule, setCompletedModule] = useState<{ type: "prelim" | "day"; id: number; behavior?: ScrollBehavior } | null>(null);
  const [showWeekCinematic, setShowWeekCinematic] = useState<{ fromWeek: number; toWeek: number } | null>(null);
  const [cinematicKey, setCinematicKey] = useState(0);
  const [pendingDaySelect, setPendingDaySelect] = useState<number | null>(null);
  const isCalendarTrack = user?.track === "A";
  const isPrivileged = user?.role === "admin" || user?.role === "superuser";

  useEffect(() => {
    if (viewMode !== "grid" || !completedModule) return;
    const testId = completedModule.type === "prelim" ? `card-prelim-${completedModule.id}` : `card-day-${completedModule.id}`;
    const frame = requestAnimationFrame(() => {
      document.querySelector(`[data-testid="${testId}"]`)?.scrollIntoView({
        behavior: completedModule.behavior ?? "smooth", block: "center",
      });
      setCompletedModule(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [viewMode, completedModule]);

  const prelimQuery = useQuery<PrelimModuleWithStatus[]>({
    queryKey: ["/api/prelim-modules"], enabled: !!user,
  });
  const prelimModulesData = prelimQuery.data;
  const allPrelimsComplete = isPrivileged || !!(prelimModulesData &&
    ((!isCalendarTrack && prelimModulesData.length === 0) ||
      (prelimModulesData.length > 0 && prelimModulesData.every(module => module.completed))));
  const { data: cohortData, isLoading: cohortLoading } = useCohortStartDate();
  const currentDay = isPrivileged ? 30 : (cohortData?.currentDay || 0);
  const { data: answers } = useUserAnswers(user?.id);
  const { data: prayerCompletions } = useUserPrayerCompletions();
  const markComplete = useMarkPrayerComplete();
  const lessonQuery = useTrackADailyContent(viewMode === "detail" ? selectedDay : -1);
  const contentQuery = useAllTrackAContent();
  const trackASummaries = contentQuery.data;
  const modulesQuery = useQuery<TrackAModule[]>({ queryKey: ["/api/track-a-modules"], enabled: !!user });
  const trackAModules = modulesQuery.data;
  const { data: prayerWrapData } = useQuery<{
    opening: { text: string; audioUrl: string | null } | null;
    closing: { text: string; audioUrl: string | null } | null;
  }>({
    queryKey: ["/api/track-a/prayers", selectedDay],
    queryFn: async () => {
      const response = await fetch(`/api/track-a/prayers/${selectedDay}`);
      if (!response.ok) return { opening: null, closing: null };
      return response.json();
    },
    enabled: !!user && viewMode === "detail",
    staleTime: 60_000,
  });

  const mutationError = (error: Error) => toast({
    title: "Could not save completion", description: error.message, variant: "destructive",
  });
  const completePrelimMutation = useMutation({
    mutationFn: (position: number) => apiRequest("POST", `/api/prelim-modules/${position}/complete`),
    onMutate: async (position: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/prelim-modules"] });
      const prev = queryClient.getQueryData<PrelimModuleWithStatus[]>(["/api/prelim-modules"]);
      queryClient.setQueryData<PrelimModuleWithStatus[]>(["/api/prelim-modules"], old =>
        old?.map(module => module.position === position ? { ...module, completed: true } : module));
      return { prev };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/prelim-modules"] }),
    onError: (error, _position, context) => {
      if (context?.prev !== undefined) queryClient.setQueryData(["/api/prelim-modules"], context.prev);
      mutationError(error);
    },
  });
  const { data: week4Ready } = useQuery<{ ready: boolean }>({
    queryKey: ["/api/workbook/week4-ready"], enabled: !!user && isCalendarTrack,
  });
  const { data: workbookUnlockStatus } = useQuery<{ unlockedCategories: number[]; exempt?: boolean }>({
    queryKey: ["/api/workbook/unlock-status"], enabled: !!user,
  });
  const workbookQuery = useQuery<LessonWorkbookModuleWithStatus>({
    queryKey: ["/api/workbook-modules", selectedWorkbookId],
    enabled: viewMode === "workbook" && selectedWorkbookId > 0,
  });
  const completeWorkbookMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/workbook-completions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/workbook-modules"] }),
    onError: mutationError,
  });

  if (!user || !["participant", "superuser"].includes(user.role)) return null;
  const isDayCompleted = (day: number) => prayerCompletions?.some(completion =>
    completion.dayNumber === day && completion.period === "morning") ?? false;
  const isPeriodCompleted = (day: number, period: "morning" | "evening") =>
    prayerCompletions?.some(completion => completion.dayNumber === day && completion.period === period) ?? false;

  const handleBackToGrid = (dayToScrollTo?: number) => {
    if (dayToScrollTo && dayToScrollTo > 0) setCompletedModule({ type: "day", id: dayToScrollTo, behavior: "smooth" });
    else if (selectedDay > 0) setCompletedModule({ type: "day", id: selectedDay, behavior: "instant" });
    setViewMode("grid");
    setSelectedDay(0);
  };
  const handleDaySelect = (day: number) => {
    const firstDays: Record<number, { fromWeek: number; toWeek: number }> = {
      1: { fromWeek: 0, toWeek: 1 }, 7: { fromWeek: 1, toWeek: 2 },
      13: { fromWeek: 2, toWeek: 3 }, 19: { fromWeek: 3, toWeek: 4 }, 25: { fromWeek: 4, toWeek: 5 },
    };
    const transition = isCalendarTrack ? firstDays[day] : undefined;
    if (transition && (isPrivileged || !localStorage.getItem(`lf_week_cinematic_seen_${transition.toWeek}`))) {
      setPendingDaySelect(day);
      setShowWeekCinematic(transition);
      return;
    }
    setSelectedDay(day);
    setViewMode("detail");
  };
  const handlePrelimExit = () => {
    setCompletedModule({ type: "prelim", id: selectedPrelimPosition, behavior: "instant" });
    setViewMode("grid");
  };
  const handleWorkbookExit = () => { setViewMode("grid"); setSelectedWorkbookId(0); };

  if (prelimQuery.isLoading || contentQuery.isLoading || modulesQuery.isLoading || (isCalendarTrack && cohortLoading)) {
    return <DashboardLayout><LessonLoading /></DashboardLayout>;
  }
  if (prelimQuery.isError || contentQuery.isError || modulesQuery.isError) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <AlertCircle className="w-10 h-10 text-muted-foreground" />
      <p className="text-muted-foreground">Your curriculum could not be loaded.</p>
      <Button variant="outline" onClick={() => { prelimQuery.refetch(); contentQuery.refetch(); modulesQuery.refetch(); }}>Try again</Button>
    </div></DashboardLayout>;
  }
  if (viewMode === "grid") {
    return <DashboardLayout>
      <div className="h-full"><DayGridView
        currentDay={currentDay}
        isCalendarTrack={isCalendarTrack}
        trackASummaries={trackASummaries}
        cohortStartDate={cohortData?.startDate}
        prayerCompletions={prayerCompletions}
        isDayCompleted={isDayCompleted}
        onDaySelect={handleDaySelect}
        prelimModulesData={prelimModulesData}
        allPrelimsComplete={allPrelimsComplete}
        onPrelimSelect={position => { setSelectedPrelimPosition(position); setViewMode("prelim"); }}
        onWorkbookSelect={id => { setSelectedWorkbookId(id); setViewMode("workbook"); }}
        week4Ready={workbookUnlockStatus?.exempt ? true : week4Ready?.ready}
      /></div>
      {showWeekCinematic && <WeekTransitionCinematic
        key={cinematicKey}
        fromWeek={showWeekCinematic.fromWeek}
        toWeek={showWeekCinematic.toWeek}
        isPrivileged={isPrivileged}
        onClose={() => {
          setShowWeekCinematic(null);
          if (pendingDaySelect !== null) {
            setSelectedDay(pendingDaySelect); setViewMode("detail"); setPendingDaySelect(null);
          }
        }}
        onReplay={() => {
          for (let week = 1; week <= 5; week++) localStorage.removeItem(`lf_week_cinematic_seen_${week}`);
          setCinematicKey(value => value + 1);
        }}
      />}
    </DashboardLayout>;
  }

  const emptyLesson = (title: string, onBack: () => void, retry?: () => void) =>
    <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
      <AlertCircle className="w-12 h-12 text-muted-foreground" />
      <p className="text-muted-foreground">{title}</p>
      {retry && <Button variant="outline" onClick={retry}>Try again</Button>}
      <Button variant="outline" onClick={onBack}>Back to Overview</Button>
    </div>;
  const makeContent = (id: number, title: string, slides: TrackAContent["slides"], subtitle: string | null = null,
    completionMessage: string | null = null): TrackAContent => ({
    id, trackId: user.track || "A", dayNumber: id, weekNumber: 0, centralTheme: title, subtitle, slides, imageUrl: null,
    completionMessage, openingPrayerText: null, openingPrayerAudio: null, closingPrayerText: null, closingPrayerAudio: null,
  });

  if (viewMode === "workbook") {
    const module = workbookQuery.data;
    return <DashboardLayout>{workbookQuery.isLoading ? <LessonLoading /> : module ? <LessonFlow
      key={`workbook-${user.track}-${module.id}`}
      content={makeContent(-(1000 + module.id), module.title, module.slides, null, module.completionMessage)}
      dayNumber={-(1000 + module.id)}
      onExit={handleWorkbookExit}
      onComplete={() => {
        completeWorkbookMutation.mutate(module.id);
        handleWorkbookExit();
      }}
      previewMode={user.role === "superuser"}
    /> : emptyLesson("Workbook could not be loaded.", handleWorkbookExit, () => workbookQuery.refetch())}</DashboardLayout>;
  }
  if (viewMode === "prelim") {
    const module = prelimModulesData?.find(item => item.position === selectedPrelimPosition);
    return <DashboardLayout>{module ? <LessonFlow
      key={`prelim-${user.track}-${selectedPrelimPosition}`}
      content={makeContent(-selectedPrelimPosition, module.title, module.slides, module.subtitle ?? null)}
      dayNumber={-selectedPrelimPosition}
      onExit={handlePrelimExit}
      onComplete={() => {
        setCompletedModule({ type: "prelim", id: selectedPrelimPosition });
        setViewMode("grid");
        completePrelimMutation.mutate(selectedPrelimPosition);
      }}
      previewMode={user.role === "superuser"}
    /> : emptyLesson("Module not found.", handlePrelimExit)}</DashboardLayout>;
  }

  const content = lessonQuery.data;
  const summary = isCalendarTrack ? trackASummaries?.filter(item => item.dayNumber > 0)[selectedDay - 1]
    : trackASummaries?.find(item => item.dayNumber === selectedDay);
  const module = trackAModules?.find(item => item.weekNumber === (summary?.weekNumber ?? Math.ceil(selectedDay / 6)));
  return <DashboardLayout>{lessonQuery.isLoading ? <LessonLoading /> : content ? <LessonFlow
    key={`lesson-${user.track}-${selectedDay}`}
    content={content}
    dayNumber={selectedDay}
    backgroundImage={summary?.imageUrl || module?.imageUrl || ""}
    existingAnswer={answers?.find(answer => answer.dayNumber === selectedDay)?.content}
    mentorId={user.mentorId}
    onExit={handleBackToGrid}
    onLessonFinished={() => {
      if (!isPeriodCompleted(selectedDay, "morning")) markComplete.mutate({ dayNumber: selectedDay, period: "morning" }, { onError: mutationError });
    }}
    onComplete={() => handleBackToGrid(selectedDay)}
    previewMode={user.role === "superuser"}
    openingPrayer={prayerWrapData?.opening ?? null}
    closingPrayer={prayerWrapData?.closing ?? null}
    canSkipPrayer={["admin", "superuser"].includes(user.role)}
    notebookUnlockCategory={isCalendarTrack ? TRIGGER_DAY_TO_CATEGORY[selectedDay] ?? null : null}
  /> : emptyLesson(lessonQuery.isError ? "Lesson could not be loaded." : "No content available for this lesson.",
    () => handleBackToGrid(), lessonQuery.isError ? () => lessonQuery.refetch() : undefined)}</DashboardLayout>;
}
