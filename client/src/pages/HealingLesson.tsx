import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HealingLessonFlow } from "@/components/lesson/HealingLessonFlow";
import type { TrackAContent, HealingContent, HealingCompletion, HealingModule } from "@shared/schema";

export default function HealingLesson() {
  const params = useParams<{ n: string }>();
  const moduleNumber = Number(params.n);
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: modules, isLoading: modulesLoading } = useQuery<HealingModule[]>({
    queryKey: ["/api/healing/modules"],
    enabled: !!user,
  });

  const { data: content, isLoading: contentLoading } = useQuery<HealingContent>({
    queryKey: ["/api/healing/content", moduleNumber],
    queryFn: () =>
      fetch(`/api/healing/content/${moduleNumber}`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
    enabled: !!user && !isNaN(moduleNumber) && moduleNumber >= 1,
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<HealingCompletion[]>({
    queryKey: ["/api/healing/completions"],
    enabled: !!user,
  });

  const { data: answers } = useQuery<{ id: number; userId: number; moduleNumber: number; content: string; createdAt: string }[]>({
    queryKey: ["/api/healing/answers"],
    enabled: !!user,
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/healing/completions", { moduleNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healing/completions"] });
    },
  });

  if (isNaN(moduleNumber) || moduleNumber < 1) {
    setLocation("/healing");
    return null;
  }

  if (!user) return null;

  // Enforce sequential unlock using sortOrder position once both queries are loaded
  if (!completionsLoading && !modulesLoading && completions !== undefined && modules !== undefined) {
    const sortedModules = [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIdx = sortedModules.findIndex((m) => m.moduleNumber === moduleNumber);
    // Module doesn't exist in the list
    if (currentIdx === -1) {
      setLocation("/healing");
      return null;
    }
    if (currentIdx > 0) {
      const prevModule = sortedModules[currentIdx - 1];
      const completedSet = new Set(completions.map((c) => c.moduleNumber));
      if (!completedSet.has(prevModule.moduleNumber)) {
        setLocation("/healing");
        return null;
      }
    }
  }

  if (contentLoading || completionsLoading || modulesLoading || !content) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--surface-ground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--white-40)" }}>Loading…</p>
      </div>
    );
  }

  // Adapt HealingContent → TrackAContent shape for HealingLessonFlow
  const fakeHealingContent: TrackAContent = {
    id: 10000 + moduleNumber,
    dayNumber: moduleNumber,
    weekNumber: Math.ceil(moduleNumber / 4),
    centralTheme: content.title,
    subtitle: content.subtitle ?? null,
    slides: (content.slides ?? []) as { type: string; content: string }[],
    imageUrl: null,
    completionMessage: content.completionMessage ?? null,
    openingPrayerText: null,
    openingPrayerAudio: null,
    closingPrayerText: null,
    closingPrayerAudio: null,
  };

  const existingAnswer = answers?.find((a) => a.moduleNumber === moduleNumber)?.content;
  const completedSet = new Set(completions?.map((c) => c.moduleNumber) ?? []);

  const handleExit = () => setLocation("/healing");

  const handleComplete = () => {
    if (!completedSet.has(moduleNumber)) {
      completeMutation.mutate();
    }
    setLocation("/healing");
  };

  return (
    <HealingLessonFlow
      key={`healing-${moduleNumber}`}
      content={fakeHealingContent}
      moduleNumber={moduleNumber}
      existingAnswer={existingAnswer}
      onExit={handleExit}
      onComplete={handleComplete}
    />
  );
}
