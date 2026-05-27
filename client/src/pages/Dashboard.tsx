import { useAuth } from "@/hooks/use-auth";
import { useDailyContent } from "@/hooks/use-content";
import { useTrackADailyContent, useAllTrackAContent } from "@/hooks/use-track-a-content";
import { useContentSummaries } from "@/hooks/use-content-summaries";
import { useUserAnswers, useCreateAnswer } from "@/hooks/use-answers";
import { useUserPrayerCompletions, useMarkPrayerComplete, useUnmarkPrayerComplete } from "@/hooks/use-prayer-completions";
import { useCohortStartDate } from "@/hooks/use-cohort";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HtmlContent } from "@/components/ui/html-content";
import DOMPurify from "dompurify";
import { CheckCircle2, Sun, Moon, Check, AlertCircle, BookOpen, Minus, Plus, MessageSquare, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DayGridView } from "@/components/DayGridView";
import { LessonFlow } from "@/components/lesson/LessonFlow";
import { WeekTransitionCinematic } from "@/components/WeekTransitionCinematic";
import { apiRequest, queryClient } from "@/lib/queryClient";

import type { TrackAModule, TrackAContent, PrelimModuleWithStatus, LessonWorkbookModuleWithStatus } from "@shared/schema";

function getTrackAAtPosition(position: number, summaries?: TrackAContent[]): TrackAContent | undefined {
  if (!summaries) return undefined;
  const programDays = summaries.filter(c => c.dayNumber > 0);
  return programDays[position - 1];
}

function getTrackAImage(dayNumber: number, trackASummaries?: TrackAContent[], modules?: TrackAModule[]): string {
  const dayContent = getTrackAAtPosition(dayNumber, trackASummaries);
  if (dayContent?.imageUrl) return dayContent.imageUrl;
  const weekNumber = Math.ceil(dayNumber / 6);
  const module = modules?.find(m => m.weekNumber === weekNumber);
  if (module?.imageUrl) return module.imageUrl;
  return "";
}

const PRAYER_TEXTS = {
  "Prayer Against Retaliation": `Lord Jesus Christ, in Your love and mercy, pour Thy Precious Blood over me so that no demon or disembodied spirit may retaliate against me. Mary, surround me with thy mantle, blocking any retaliating spirits from having any authority over me. St. Michael, surround me with thy shield, so that no evil spirit may take revenge on me. Queen of Heaven and St. Michael, send down the legions of angels under your command to fight off any spirits that would seek to harm me. All you saints of heaven, impede any retaliating spirit from influencing me. Lord, Thou art the Just Judge, the Avenger of the Wicked, the Advocate of the Just, we beg in Thy mercy, that all we ask of Mary, the angels and the saints of heaven be also granted to all our loved ones, those who pray for us and their loved ones, that for Thy Glory's sake, we may enjoy Thy perfect protection. Amen.`,
  "Miracle Prayer": `Lord Jesus, I come before Thee, just as I am, I am sorry for my sins, I repent of my sins, please forgive me. In Thy Name, I forgive all others for what they have done against me. I renounce Satan, the evil spirits and all their works. I give Thee my entire self, Lord Jesus, I accept Thee as my Lord God and Savior. Heal me, change me, strengthen me in body, soul, and spirit. Come Lord Jesus, cover me with Thy Precious Blood, and fill me with Thy Holy Spirit, I love Thee Lord Jesus, I praise Thee Lord Jesus, I thank Thee Jesus, I shall follow Thee every day of my life. Mary, my Mother, Queen of Peace, all the Angels and Saints, please help me. Amen.`,
};

const EXAMINATION_OF_CONSCIENCE = `The Examen is a simple daily practice of reviewing your day with God. It typically takes 10-15 minutes.

1. **Give Thanks**
Begin by thanking God for the gifts of the day—your life, your relationships, moments of grace.

2. **Ask for Light**
Pray for the grace to see your day as God sees it—to recognize where God was present and where you may have missed His presence.

3. **Review the Day**
Walk through your day from beginning to end. Notice the moments of consolation (peace, joy, love) and desolation (anxiety, fear, anger). Where did you feel closest to God? Where did you feel distant?

4. **Face Your Shortcomings**
With honesty and without harsh self-judgment, acknowledge where you fell short. Where did you fail to love? Where did you resist God's grace?

5. **Look Forward**
Resolve to do better tomorrow. Ask God for the specific grace you need. End with the Our Father.`;

function ContentWithMedia({ text }: { text: string }) {
  if (!text) return null;
  
  const isHtml = text.includes('<') && text.includes('>');
  const parts = text.split(/(\[VIDEO:[a-zA-Z0-9_-]+\])/g);
  
  return (
    <div className="space-y-4">
      {parts.map((part, idx) => {
        const videoMatch = part.match(/\[VIDEO:([a-zA-Z0-9_-]+)\]/);
        if (videoMatch) {
          const videoId = videoMatch[1];
          return (
            <div key={idx} className="aspect-video rounded-lg overflow-hidden shadow-lg my-4">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          );
        }
        if (part.trim()) {
          if (isHtml) {
            const sanitizedHtml = DOMPurify.sanitize(part, {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'],
              ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
            });
            return (
              <div 
                key={idx} 
                className="prose-content leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            );
          }
          const paragraphs = part.split(/\n\n+/);
          return paragraphs.map((para, pIdx) => (
            <p key={`${idx}-${pIdx}`} className="whitespace-pre-wrap leading-relaxed">{para.trim()}</p>
          ));
        }
        return null;
      })}
    </div>
  );
}

const FONT_SIZES = {
  small: { label: "A", class: "text-sm", size: 14 },
  medium: { label: "A", class: "text-base", size: 16 },
  large: { label: "A", class: "text-lg", size: 18 },
  xlarge: { label: "A", class: "text-xl", size: 20 },
};

type FontSizeKey = keyof typeof FONT_SIZES;

const TRIGGER_DAY_TO_CATEGORY: Record<number, { name: string; slug: string }> = {
  7:  { name: "Personal Sins",       slug: "personal-sins" },
  9:  { name: "Occult & Dark Powers", slug: "occult-dark-powers" },
  11: { name: "Generational Lines",  slug: "generational-lines" },
  12: { name: "Inner Vows",          slug: "inner-vows" },
  15: { name: "Wounds & Forgiveness", slug: "wounds-forgiveness" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [prayerModalOpen, setPrayerModalOpen] = useState<string | null>(null);
  const [examenModalOpen, setExamenModalOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<"grid" | "detail" | "prelim" | "workbook">("grid");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "evening">("morning");
  const [selectedPrelimPosition, setSelectedPrelimPosition] = useState<number>(1);
  const [selectedWorkbookId, setSelectedWorkbookId] = useState<number>(0);
  const [completedModule, setCompletedModule] = useState<{ type: "prelim" | "day"; id: number; behavior?: ScrollBehavior } | null>(null);
  const [showWeekCinematic, setShowWeekCinematic] = useState<{ fromWeek: number; toWeek: number } | null>(null);
  const [cinematicKey, setCinematicKey] = useState(0);
  
  const [fontSize, setFontSize] = useState<FontSizeKey>(() => {
    const saved = localStorage.getItem('lumenFidei_fontSize');
    return (saved as FontSizeKey) || 'medium';
  });
  
  useEffect(() => {
    localStorage.setItem('lumenFidei_fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (viewMode !== "grid" || !completedModule) return;
    const testId = completedModule.type === "prelim"
      ? `card-prelim-${completedModule.id}`
      : `card-day-${completedModule.id}`;
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: completedModule.behavior ?? "smooth", block: "center" });
    }
    setCompletedModule(null);
  }, [viewMode, completedModule]);
  
  const decreaseFontSize = () => {
    const sizes: FontSizeKey[] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };
  
  const increaseFontSize = () => {
    const sizes: FontSizeKey[] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };
  
  const { data: prelimModulesData, isLoading: prelimLoading } = useQuery<PrelimModuleWithStatus[]>({
    queryKey: ["/api/prelim-modules"],
    enabled: !!user && (user.role === 'participant' || user.role === 'superuser'),
  });
  const allPrelimsComplete = !!(prelimModulesData?.length && prelimModulesData.every(m => m.completed));

  const { data: cohortData, isLoading: cohortLoading } = useCohortStartDate();
  const currentDay = cohortData?.currentDay || 0;
  
  const isTrackA = user?.track === 'A';
  
  const isPrivileged = user?.role === "admin" || user?.role === "superuser";

  const { data: answers } = useUserAnswers(user?.id);
  const { data: prayerCompletions } = useUserPrayerCompletions();
  const markComplete = useMarkPrayerComplete();
  
  const { data: dayContent, isLoading: isLoadingB } = useDailyContent(
    !isTrackA && viewMode === "detail" && selectedDay > 0 ? selectedDay : -1
  );
  const { data: trackADayContent, isLoading: isLoadingA } = useTrackADailyContent(
    isTrackA && viewMode === "detail" ? selectedDay : -1
  );

  const { data: prayerWrapData } = useQuery<{ opening: { text: string; audioUrl: string | null } | null; closing: { text: string; audioUrl: string | null } | null }>({
    queryKey: ["/api/track-a/prayers", selectedDay],
    queryFn: async () => {
      const res = await fetch(`/api/track-a/prayers/${selectedDay}`, { credentials: "include" });
      if (!res.ok) return { opening: null, closing: null };
      return res.json();
    },
    enabled: !!isTrackA && viewMode === "detail" && selectedDay >= 0,
    staleTime: 60_000,
  });
  
  const { data: trackASummaries } = useAllTrackAContent();
  const { data: trackBSummaries } = useContentSummaries();
  const { data: trackAModules } = useQuery<TrackAModule[]>({
    queryKey: ["/api/track-a-modules"],
    enabled: !!isTrackA,
  });
  
  const completePrelimMutation = useMutation({
    mutationFn: (position: number) =>
      apiRequest("POST", `/api/prelim-modules/${position}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prelim-modules"] });
    },
  });

  const { data: workbookModules } = useQuery<LessonWorkbookModuleWithStatus[]>({
    queryKey: ["/api/workbook-modules"],
    enabled: !!isTrackA,
  });

  const { data: week4Ready } = useQuery<{ ready: boolean }>({
    queryKey: ["/api/workbook/week4-ready"],
    enabled: !!isTrackA,
  });

  const { data: openWorkbookModule } = useQuery<LessonWorkbookModuleWithStatus>({
    queryKey: ["/api/workbook-modules", selectedWorkbookId],
    enabled: viewMode === "workbook" && selectedWorkbookId > 0,
  });

  const completeWorkbookMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/workbook-completions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workbook-modules"] });
    },
  });
  
  const isLoading = isTrackA ? isLoadingA : isLoadingB;
  
  useEffect(() => {
    if (user && user.track === 'C') {
      setLocation('/healing');
    }
  }, [user, setLocation]);

  if (!user || (user.role !== 'participant' && user.role !== 'superuser')) return null;
  if (user.track === 'C') return null;
  
  // Show a spinner while we load prelim status for the first time
  if (prelimLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-8 h-8 border-4 border-[var(--white-30)] border-t-[var(--white-80)] rounded-full animate-spin mb-4" />
          <p className="type-body-md text-[var(--white-50)]">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isDayCompleted = (day: number) => {
    if (isTrackA) {
      return prayerCompletions?.some(c => c.dayNumber === day && c.period === "morning") ?? false;
    }
    const morningDone = prayerCompletions?.some(c => c.dayNumber === day && c.period === "morning");
    const eveningDone = prayerCompletions?.some(c => c.dayNumber === day && c.period === "evening");
    return !!(morningDone && eveningDone);
  };
  
  const isPeriodCompleted = (day: number, period: "morning" | "evening") => {
    return prayerCompletions?.some(c => c.dayNumber === day && c.period === period) ?? false;
  };

  if (cohortLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-8 h-8 border-4 border-[var(--white-30)] border-t-[var(--white-80)] rounded-full animate-spin mb-4" />
          <p className="type-body-md text-[var(--white-50)]">Loading program...</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCinematicReplay = () => {
    for (let i = 1; i <= 5; i++) {
      localStorage.removeItem(`lf_week_cinematic_seen_${i}`);
    }
    setCinematicKey((k) => k + 1);
  };

  const handleDaySelect = (day: number, period?: "morning" | "evening") => {
    setSelectedDay(day);
    setSelectedPeriod(period || "morning");
    setViewMode("detail");
    // Show week transition cinematic when the user opens the first day of a new week
    const WEEK_FIRST_DAYS: Record<number, { fromWeek: number; toWeek: number }> = {
      7:  { fromWeek: 1, toWeek: 2 },
      13: { fromWeek: 2, toWeek: 3 },
      19: { fromWeek: 3, toWeek: 4 },
      25: { fromWeek: 4, toWeek: 5 },
    };
    const weekTransition = WEEK_FIRST_DAYS[day];
    if (weekTransition) {
      if (isPrivileged || !localStorage.getItem(`lf_week_cinematic_seen_${weekTransition.toWeek}`)) {
        setShowWeekCinematic(weekTransition);
      }
    }
  };

  const handleBackToGrid = (dayToScrollTo?: number) => {
    if (dayToScrollTo && dayToScrollTo > 0) {
      setCompletedModule({ type: "day", id: dayToScrollTo, behavior: "smooth" });
    } else if (selectedDay > 0) {
      setCompletedModule({ type: "day", id: selectedDay, behavior: "instant" });
    }
    setViewMode("grid");
    setSelectedDay(0);
  };

  const handlePrelimSelect = (position: number) => {
    setSelectedPrelimPosition(position);
    setViewMode("prelim");
  };

  const handlePrelimComplete = (position: number) => {
    setCompletedModule({ type: "prelim", id: position });
    setViewMode("grid");
    completePrelimMutation.mutate(position);
  };

  const handlePrelimExit = () => {
    setCompletedModule({ type: "prelim", id: selectedPrelimPosition, behavior: "instant" });
    setViewMode("grid");
  };

  const handleWorkbookSelect = (workbookModuleId: number) => {
    setSelectedWorkbookId(workbookModuleId);
    setViewMode("workbook");
  };

  const handleWorkbookExit = () => {
    setViewMode("grid");
    setSelectedWorkbookId(0);
  };

  const handleWorkbookComplete = (workbookModuleId: number) => {
    completeWorkbookMutation.mutate(workbookModuleId);
    setViewMode("grid");
    setSelectedWorkbookId(0);
  };

  if (viewMode === "grid") {
    return (
      <DashboardLayout>
        <Dialog open={prayerModalOpen !== null} onOpenChange={() => setPrayerModalOpen(null)}>
          <DialogContent className="w-[95vw] max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="type-display-sm font-serif">{prayerModalOpen}</DialogTitle>
            </DialogHeader>
            <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {prayerModalOpen && PRAYER_TEXTS[prayerModalOpen as keyof typeof PRAYER_TEXTS]}
            </div>
          </DialogContent>
        </Dialog>
        <div className="h-full">
          <DayGridView
            currentDay={currentDay}
            isTrackA={isTrackA}
            trackASummaries={trackASummaries}
            trackBSummaries={trackBSummaries}
            cohortStartDate={cohortData?.startDate}
            prayerCompletions={prayerCompletions}
            isDayCompleted={isDayCompleted}
            isPeriodCompleted={isPeriodCompleted}
            onDaySelect={handleDaySelect}
            prelimModulesData={prelimModulesData}
            allPrelimsComplete={allPrelimsComplete}
            onPrelimSelect={handlePrelimSelect}
            onWorkbookSelect={handleWorkbookSelect}
            week4Ready={week4Ready?.ready}
          />
        </div>
        {showWeekCinematic && (
          <WeekTransitionCinematic
            key={cinematicKey}
            fromWeek={showWeekCinematic.fromWeek}
            toWeek={showWeekCinematic.toWeek}
            isPrivileged={isPrivileged}
            onClose={() => setShowWeekCinematic(null)}
            onReplay={handleCinematicReplay}
          />
        )}
      </DashboardLayout>
    );
  }

  if (viewMode === "workbook" && selectedWorkbookId > 0) {
    if (!openWorkbookModule) {
      return (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <p className="text-muted-foreground">Loading workbook…</p>
            <Button variant="outline" onClick={handleWorkbookExit}>Back</Button>
          </div>
        </DashboardLayout>
      );
    }
    const fakeWorkbookContent: TrackAContent = {
      id: -(1000 + openWorkbookModule.id),
      dayNumber: -(1000 + openWorkbookModule.id),
      weekNumber: 0,
      centralTheme: openWorkbookModule.title,
      subtitle: null,
      slides: (openWorkbookModule.slides ?? []) as { type: string; content: string }[],
      imageUrl: null,
      completionMessage: openWorkbookModule.completionMessage ?? null,
      openingPrayerText: null,
      openingPrayerAudio: null,
      closingPrayerText: null,
      closingPrayerAudio: null,
    };
    return (
      <DashboardLayout>
        <LessonFlow
          key={`workbook-${openWorkbookModule.id}`}
          content={fakeWorkbookContent}
          dayNumber={-(1000 + openWorkbookModule.id)}
          onExit={handleWorkbookExit}
          onComplete={() => handleWorkbookComplete(openWorkbookModule.id)}
          previewMode={user?.role === 'superuser'}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {viewMode === "prelim" ? (() => {
        const prelimMod = prelimModulesData?.find(m => m.position === selectedPrelimPosition);
        if (!prelimMod) return (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <p className="text-muted-foreground">Module not found.</p>
            <Button variant="outline" onClick={handlePrelimExit}>Back</Button>
          </div>
        );
        const fakePrelimContent: TrackAContent = {
          id: -selectedPrelimPosition,
          dayNumber: -selectedPrelimPosition,
          weekNumber: 0,
          centralTheme: prelimMod.title,
          subtitle: prelimMod.subtitle ?? null,
          slides: (prelimMod.slides ?? []) as { type: string; content: string }[],
          imageUrl: null,
          completionMessage: null,
          openingPrayerText: null,
          openingPrayerAudio: null,
          closingPrayerText: null,
          closingPrayerAudio: null,
        };
        return (
          <LessonFlow
            key={`prelim-${selectedPrelimPosition}`}
            content={fakePrelimContent}
            dayNumber={-selectedPrelimPosition}
            onExit={handlePrelimExit}
            onComplete={() => handlePrelimComplete(selectedPrelimPosition)}
            previewMode={user?.role === 'superuser'}
          />
        );
      })() : isTrackA && viewMode === "detail" ? (
        isLoadingA ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading lesson...</p>
          </div>
        ) : trackADayContent ? (
          <LessonFlow
            content={trackADayContent}
            dayNumber={selectedDay}
            backgroundImage={getTrackAImage(selectedDay, trackASummaries, trackAModules)}
            existingAnswer={answers?.find(a => a.dayNumber === selectedDay)?.content}
            mentorId={user?.mentorId}
            onExit={handleBackToGrid}
            onComplete={() => {
              const capturedDay = selectedDay;
              if (!isPeriodCompleted(capturedDay, "morning")) {
                markComplete.mutate({ dayNumber: capturedDay, period: "morning" });
              }
              handleBackToGrid(selectedDay);
            }}
            previewMode={user?.role === 'superuser'}
            openingPrayer={prayerWrapData?.opening ?? null}
            closingPrayer={prayerWrapData?.closing ?? null}
            canSkipPrayer={['admin', 'superuser'].includes(user?.role ?? '')}
            notebookUnlockCategory={isTrackA ? (TRIGGER_DAY_TO_CATEGORY[selectedDay] ?? null) : null}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">No content available for this day.</p>
            <Button variant="outline" onClick={handleBackToGrid}>Back to Overview</Button>
          </div>
        )
      ) : (
        <div className="flex flex-col h-auto lg:h-[calc(100vh-6rem)]">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBackToGrid(selectedDay)}
              className="gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back-to-overview"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Overview
            </Button>
          </div>

          <div className="overflow-y-auto custom-scrollbar px-1 sm:px-2 flex-1">
            {isLoading ? (
              <ContentSkeleton />
            ) : dayContent ? (
              <div className="space-y-4 sm:space-y-8 pb-10 max-w-3xl mx-auto">
                <div className="text-center space-y-2 mb-4 sm:mb-8">
                  <Badge variant="outline" className="mb-2">Day {selectedDay}</Badge>
                  <h1 className="type-display-lg sm:type-display-xl font-serif font-bold text-primary">
                    {dayContent.isReflectionDay ? "Weekly Reflection" : "Daily Devotion"}
                  </h1>
                </div>

                {dayContent.isReflectionDay ? (
                  <ReflectionView content={dayContent} existingAnswer={answers?.find(a => a.dayNumber === selectedDay)} />
                ) : (
                  <Tabs defaultValue={selectedPeriod} className="w-full">
                    <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="morning" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> Morning
                        </TabsTrigger>
                        <TabsTrigger value="evening" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Moon className="w-3 h-3 sm:w-4 sm:h-4" /> Evening
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={decreaseFontSize}
                          disabled={fontSize === 'small'}
                          data-testid="button-font-decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-medium w-6 text-center">A</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={increaseFontSize}
                          disabled={fontSize === 'xlarge'}
                          data-testid="button-font-increase"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <TabsContent value="morning" className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                          <CardTitle className="font-serif text-base sm:text-lg">Morning Prayers</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">Tap to open and pray</p>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 sm:gap-3 h-auto py-3 text-sm sm:text-base"
                            onClick={() => setPrayerModalOpen("Prayer Against Retaliation")}
                            data-testid="button-prayer-retaliation"
                          >
                            <BookOpen className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-left">Prayer Against Retaliation</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 sm:gap-3 h-auto py-3 text-sm sm:text-base"
                            onClick={() => setPrayerModalOpen("Miracle Prayer")}
                            data-testid="button-prayer-miracle"
                          >
                            <BookOpen className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-left">Miracle Prayer</span>
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                          <CardTitle className="font-serif text-base sm:text-lg">Scripture</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">{dayContent.morningScriptureRef}</p>
                        </CardHeader>
                        <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed italic p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
                          <HtmlContent content={`"${dayContent.morningScriptureText}"`} />
                        </CardContent>
                      </Card>
                      
                      {dayContent.morningMeditation && dayContent.morningMeditation.trim() && (
                        <Card>
                          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                            <CardTitle className="font-serif text-base sm:text-lg">Meditation</CardTitle>
                          </CardHeader>
                          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
                            <HtmlContent content={dayContent.morningMeditation} className="whitespace-pre-wrap" />
                          </CardContent>
                        </Card>
                      )}
                      
                      {dayContent.morningPrayer && (
                        <Card className="bg-secondary/30">
                          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                            <CardTitle className="font-serif text-base sm:text-lg">Closing Prayer</CardTitle>
                          </CardHeader>
                          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed italic p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
                            <HtmlContent content={dayContent.morningPrayer} className="whitespace-pre-wrap" />
                          </CardContent>
                        </Card>
                      )}
                      
                      <MarkCompleteButton 
                        day={selectedDay}
                        period="morning"
                        isCompleted={isPeriodCompleted(selectedDay, "morning")}
                      />
                    </TabsContent>
                    
                    <TabsContent value="evening" className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                      {dayContent.eveningCatechism && dayContent.eveningCatechism.trim() && (
                        <Card>
                          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                            <CardTitle className="font-serif text-base sm:text-lg">
                              {dayContent.eveningCatechismRef ? 'Catechism' : 'Evening Reading'}
                            </CardTitle>
                            {dayContent.eveningCatechismRef && (
                              <p className="text-xs sm:text-sm text-muted-foreground">{dayContent.eveningCatechismRef}</p>
                            )}
                          </CardHeader>
                          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
                            <ContentWithMedia text={dayContent.eveningCatechism || ''} />
                          </CardContent>
                        </Card>
                      )}
                      
                      {dayContent.eveningSummary && (
                        <Card className="bg-secondary/50">
                          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                            <CardTitle className="font-serif text-base sm:text-lg">Summary of Key Concepts</CardTitle>
                          </CardHeader>
                          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
                            <HtmlContent content={dayContent.eveningSummary} className="whitespace-pre-wrap" />
                          </CardContent>
                        </Card>
                      )}
                      
                      {dayContent.isMentorDay && dayContent.eveningQuestions && dayContent.eveningQuestions.length > 0 && (
                        <Card className="border-primary bg-primary/5">
                          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                            <CardTitle className="font-serif text-base sm:text-lg flex items-center gap-2">
                              <MessageSquare className="w-5 h-5" />
                              Message Your Mentor
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
                            <p className={cn("text-muted-foreground leading-relaxed", FONT_SIZES[fontSize].class)}>
                              {(dayContent.eveningQuestions as string[])[0]}
                            </p>
                            {user?.mentorId ? (
                              <Button 
                                onClick={() => setLocation(`/messages?mentorId=${user.mentorId}`)}
                                className="w-full sm:w-auto gap-2"
                                data-testid="button-message-mentor"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Message Mentor
                              </Button>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No mentor assigned yet. Contact your program administrator.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {!dayContent.isMentorDay && dayContent.eveningQuestions && dayContent.eveningQuestions.length > 0 && (
                        <Card className="border-primary/20">
                          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                            <CardTitle className="font-serif text-base sm:text-lg">Questions to Consider</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-6 pt-0">
                            <ol className={cn("list-decimal pl-4 space-y-2 sm:space-y-3 text-muted-foreground", FONT_SIZES[fontSize].class)}>
                              {(dayContent.eveningQuestions as string[]).map((q, idx) => (
                                <li key={idx} className="leading-relaxed">{q}</li>
                              ))}
                            </ol>
                          </CardContent>
                        </Card>
                      )}
                      
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-3 sm:p-4">
                          <Button
                            variant="outline"
                            className="w-full justify-between gap-2"
                            onClick={() => setExamenModalOpen(true)}
                            data-testid="button-examen"
                          >
                            <span className="font-serif">Daily Examen (10-15 minutes)</span>
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>

                      <Dialog open={examenModalOpen} onOpenChange={setExamenModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="type-display-sm font-serif">Examination of Conscience</DialogTitle>
                            <p className="text-sm text-muted-foreground">Daily Examen (10-15 minutes)</p>
                          </DialogHeader>
                          <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {EXAMINATION_OF_CONSCIENCE}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {dayContent.assignment && dayContent.assignment.trim() && (
                        <AssignmentSection 
                          day={selectedDay} 
                          prompt={dayContent.assignment}
                          existingAnswer={answers?.find(a => a.dayNumber === selectedDay)}
                          isShortReflection={false}
                        />
                      )}
                      
                      <MarkCompleteButton 
                        day={selectedDay}
                        period="evening"
                        isCompleted={isPeriodCompleted(selectedDay, "evening")}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Content for this day is not yet available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function MarkCompleteButton({ day, period, isCompleted, label, completedLabel }: { day: number, period: "morning" | "evening", isCompleted: boolean, label?: string, completedLabel?: string }) {
  const markComplete = useMarkPrayerComplete();
  const unmarkComplete = useUnmarkPrayerComplete();
  
  const handleClick = () => {
    if (isCompleted) {
      unmarkComplete.mutate({ dayNumber: day, period });
    } else {
      markComplete.mutate({ dayNumber: day, period });
    }
  };
  
  const isPending = markComplete.isPending || unmarkComplete.isPending;
  
  return (
    <div className="flex justify-center pt-4">
      <Button
        data-testid={`button-complete-${period}`}
        onClick={handleClick}
        disabled={isPending}
        variant={isCompleted ? "outline" : "default"}
        size="lg"
        className={cn(
          "gap-2 transition-all",
          isCompleted && "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
        )}
      >
        {isPending ? (
          "Saving..."
        ) : isCompleted ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            {completedLabel || (period === "morning" ? "Morning Prayer Complete" : "Evening Prayer Complete")}
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            {label || `Mark ${period === "morning" ? "Morning" : "Evening"} Prayer Complete`}
          </>
        )}
      </Button>
    </div>
  );
}

function AssignmentSection({ day, prompt, existingAnswer, isShortReflection = false }: { day: number, prompt: string, existingAnswer?: any, isShortReflection?: boolean }) {
  const { mutate, isPending } = useCreateAnswer();
  const [content, setContent] = useState(existingAnswer?.content || "");
  const [isEditing, setIsEditing] = useState(!existingAnswer);

  const handleSubmit = () => {
    mutate({ dayNumber: day, content }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="font-serif text-base sm:text-lg">
          {isShortReflection ? "Short Reflection" : "Daily Response"}
        </CardTitle>
        {isShortReflection && (
          <p className="text-xs sm:text-sm text-muted-foreground">1-3 sentences</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
        <p className="italic text-muted-foreground text-sm sm:text-base">{prompt}</p>
        
        {isEditing ? (
          <div className="space-y-3 sm:space-y-4">
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reflection here..."
              className="min-h-[120px] sm:min-h-[150px] bg-white text-sm sm:text-base"
              data-testid="input-reflection"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              {existingAnswer && (
                <Button variant="ghost" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">Cancel</Button>
              )}
              <Button onClick={handleSubmit} disabled={isPending || !content.trim()} className="w-full sm:w-auto" data-testid="button-save-reflection">
                {isPending ? "Saving..." : "Save Reflection"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
             <div className="bg-white p-3 sm:p-4 rounded-md border border-border text-sm whitespace-pre-wrap">
               {content}
             </div>
             <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full sm:w-auto" data-testid="button-edit-reflection">Edit Response</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReflectionView({ content, existingAnswer }: { content: any; existingAnswer?: any }) {
  const weekNumber = content.weekNumber || Math.ceil(content.dayNumber / 6);
  
  const reflectionPrompt = content.eveningQuestions?.[0] || 
    "Reflect on this week's journey. Consider your struggles, consolations, and resolutions for next week.";
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/20 border-none">
        <CardHeader className="pb-2 p-3 sm:p-6">
          <CardTitle className="font-serif text-center text-base sm:text-lg">Week {weekNumber} Review</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 p-3 sm:p-6 pt-0">
          <p className="text-muted-foreground italic text-sm sm:text-base">
            "Take time today to look back on the week. Where did you see God's hand?"
          </p>
        </CardContent>
      </Card>
      
      {content.morningScriptureRef && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="font-serif text-base sm:text-lg">Scripture</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">{content.morningScriptureRef}</p>
          </CardHeader>
          <CardContent className="prose max-w-none text-muted-foreground leading-relaxed italic text-sm sm:text-base p-3 sm:p-6 pt-0">
            <HtmlContent content={`"${content.morningScriptureText}"`} />
          </CardContent>
        </Card>
      )}
      
      {content.morningMeditation && content.morningMeditation.trim() && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="font-serif text-base sm:text-lg">Meditation</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none text-muted-foreground leading-relaxed text-sm sm:text-base p-3 sm:p-6 pt-0">
            <HtmlContent content={content.morningMeditation} className="whitespace-pre-wrap" />
          </CardContent>
        </Card>
      )}
      
      {content.eveningCatechism && content.eveningCatechism.trim() && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="font-serif text-base sm:text-lg">
              {content.eveningCatechismRef ? 'Reading' : 'Evening Content'}
            </CardTitle>
            {content.eveningCatechismRef && (
              <p className="text-xs sm:text-sm text-muted-foreground">{content.eveningCatechismRef}</p>
            )}
          </CardHeader>
          <CardContent className="prose max-w-none text-muted-foreground leading-relaxed text-sm sm:text-base p-3 sm:p-6 pt-0">
            <ContentWithMedia text={content.eveningCatechism} />
          </CardContent>
        </Card>
      )}
      
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="font-serif text-base sm:text-lg">Weekly Synthesis Reflection</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Take your time with these prompts</p>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <ol className="list-decimal pl-4 space-y-3 text-primary/80 italic">
            {(content.eveningQuestions as string[] || [reflectionPrompt]).map((q: string, idx: number) => (
              <li key={idx} className="leading-relaxed text-sm sm:text-base">{q}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
      
      <AssignmentSection 
        day={content.dayNumber} 
        prompt="Address the prompts above in your reflection."
        existingAnswer={existingAnswer}
      />
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Skeleton className="h-4 w-20 mx-auto" />
        <Skeleton className="h-10 w-64 mx-auto" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  );
}
