import { useAuth } from "@/hooks/use-auth";
import { useDailyContent, useAllContent } from "@/hooks/use-content";
import { useTrackADailyContent } from "@/hooks/use-track-a-content";
import { useUserAnswers, useCreateAnswer } from "@/hooks/use-answers";
import { useUserPrayerCompletions, useMarkPrayerComplete, useUnmarkPrayerComplete } from "@/hooks/use-prayer-completions";
import { useCohortStartDate } from "@/hooks/use-cohort";
import type { TrackAContent } from "@shared/schema";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HtmlContent } from "@/components/ui/html-content";
import DOMPurify from "dompurify";
import { Lock, CheckCircle2, Circle, Sun, Moon, Check, ChevronDown, ChevronUp, AlertCircle, BookOpen, Minus, Plus, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

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
                src={`https://www.youtube.com/embed/${videoId}`}
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

// Font size options
const FONT_SIZES = {
  small: { label: "A", class: "text-sm", size: 14 },
  medium: { label: "A", class: "text-base", size: 16 },
  large: { label: "A", class: "text-lg", size: 18 },
  xlarge: { label: "A", class: "text-xl", size: 20 },
};

type FontSizeKey = keyof typeof FONT_SIZES;

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [_, setLocation] = useLocation();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [prayerModalOpen, setPrayerModalOpen] = useState<string | null>(null);
  const [examenModalOpen, setExamenModalOpen] = useState(false);
  
  // Font size state with localStorage persistence
  const [fontSize, setFontSize] = useState<FontSizeKey>(() => {
    const saved = localStorage.getItem('lumenFidei_fontSize');
    return (saved as FontSizeKey) || 'medium';
  });
  
  // Save font size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lumenFidei_fontSize', fontSize);
  }, [fontSize]);
  
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
  
  // Check Day 0 agreement status
  const { data: day0Data, isLoading: day0Loading, isError: day0Error } = useQuery<{ agreementSigned: boolean }>({
    queryKey: ["/api/day0"],
    enabled: !!user && user.role === 'participant',
    retry: 2,
  });
  
  // Redirect to Day 0 if agreement not signed
  useEffect(() => {
    if (!day0Loading && day0Data && !day0Data.agreementSigned) {
      setLocation("/day0");
    }
  }, [day0Data, day0Loading, setLocation]);
  
  // Get cohort-based current day
  const { data: cohortData, isLoading: cohortLoading } = useCohortStartDate();
  const currentDay = cohortData?.currentDay || 0;
  
  // Selected day is always the current day (users can only access current day)
  const selectedDay = currentDay;
  
  const isTrackA = user?.track === 'A';
  
  // Fetch lists
  const { data: contentList } = useAllContent();
  const { data: answers } = useUserAnswers(user?.id);
  const { data: prayerCompletions } = useUserPrayerCompletions();
  
  // Get content for selected day (Track B)
  const { data: dayContent, isLoading: isLoadingB } = useDailyContent(isTrackA ? 0 : selectedDay);
  // Get Track A content for selected day
  const { data: trackADayContent, isLoading: isLoadingA } = useTrackADailyContent(isTrackA ? selectedDay : 0);
  
  const isLoading = isTrackA ? isLoadingA : isLoadingB;
  
  if (!user || user.role !== 'participant') return null;
  
  // Show loading while checking agreement
  if (day0Loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Shell>
    );
  }
  
  // Show error state if Day 0 check fails
  if (day0Error) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-medium mb-2">Unable to Load</h2>
          <p className="text-muted-foreground">Please refresh the page or try again later.</p>
        </div>
      </Shell>
    );
  }
  
  // Don't render dashboard if agreement not signed (redirect will happen)
  if (!day0Data?.agreementSigned) {
    return null;
  }

  // Function to check if day is completed
  const isDayCompleted = (day: number) => {
    if (isTrackA) {
      return prayerCompletions?.some(c => c.dayNumber === day && c.period === "morning") ?? false;
    }
    const morningDone = prayerCompletions?.some(c => c.dayNumber === day && c.period === "morning");
    const eveningDone = prayerCompletions?.some(c => c.dayNumber === day && c.period === "evening");
    return morningDone && eveningDone;
  };
  
  // Check individual period completion
  const isPeriodCompleted = (day: number, period: "morning" | "evening") => {
    return prayerCompletions?.some(c => c.dayNumber === day && c.period === period) ?? false;
  };

  // Show loading state while fetching cohort data
  if (cohortLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading program...</p>
        </div>
      </Shell>
    );
  }

  // Program hasn't started yet (only show if data loaded and currentDay is 0)
  if (!cohortLoading && currentDay === 0) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Program Not Yet Started</h2>
          <p className="text-muted-foreground max-w-md">
            The 30-day program has not begun yet. Please check back when the program starts.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Prayer Modals - Full screen on mobile */}
      <Dialog open={prayerModalOpen !== null} onOpenChange={() => setPrayerModalOpen(null)}>
        <DialogContent className="w-[95vw] max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg sm:text-xl">{prayerModalOpen}</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
            {prayerModalOpen && PRAYER_TEXTS[prayerModalOpen as keyof typeof PRAYER_TEXTS]}
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn(
        "flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8",
        "h-auto lg:h-[calc(100vh-6rem)]"
      )}>
        {/* Timeline - Collapsible on mobile, shows current day and progress */}
        {isMobile ? (
          <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between mb-4"
                data-testid="button-toggle-timeline"
              >
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold">Day {currentDay}</span>
                  <span className="text-muted-foreground">of 30</span>
                </div>
                {timelineOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-4">
              <Card className="p-4">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const isFuture = day > currentDay;
                    const isPast = day < currentDay;
                    const isToday = day === currentDay;
                    const isCompleted = isDayCompleted(day);
                    const isMissed = isPast && !isCompleted;
                    
                    return (
                      <div
                        key={day}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all",
                          isToday ? "bg-primary text-primary-foreground shadow-md" : "",
                          (isFuture || isPast) && "opacity-50 cursor-not-allowed",
                          isMissed && "bg-destructive/10"
                        )}
                      >
                        <span>{day}</span>
                        {isFuture ? (
                          <Lock className="w-3 h-3 mt-0.5 opacity-50" />
                        ) : isTrackA ? (
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full mt-0.5",
                            isDayCompleted(day)
                              ? isToday ? "bg-white" : "bg-green-600"
                              : isToday ? "bg-white/30" : "bg-muted-foreground/30"
                          )} title="Daily Activity" />
                        ) : (
                          <div className="flex gap-0.5 mt-0.5">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isPeriodCompleted(day, "morning") 
                                ? isToday ? "bg-white" : "bg-green-600"
                                : isToday ? "bg-white/30" : "bg-muted-foreground/30"
                            )} title="Morning" />
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isPeriodCompleted(day, "evening") 
                                ? isToday ? "bg-white" : "bg-green-600"
                                : isToday ? "bg-white/30" : "bg-muted-foreground/30"
                            )} title="Evening" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="col-span-3 border-r border-border pr-6 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold">Your Journey</h2>
              <p className="text-sm text-muted-foreground">Day {currentDay} of 30</p>
            </div>
            
            <div className="space-y-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const isFuture = day > currentDay;
                const isPast = day < currentDay;
                const isToday = day === currentDay;
                const isCompleted = isDayCompleted(day);
                const isMissed = isPast && !isCompleted;
                
                return (
                  <div
                    key={day}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all",
                      isToday ? "bg-primary text-primary-foreground shadow-md" : "",
                      (isFuture || isPast) && "opacity-50 cursor-not-allowed",
                      isMissed && "bg-destructive/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                        isToday ? "bg-white/20" : "bg-muted"
                      )}>
                        {day}
                      </span>
                      <span className="font-medium">Day {day}</span>
                    </div>
                    {isFuture ? (
                      <Lock className="w-4 h-4 opacity-50" />
                    ) : isTrackA ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn(
                            "w-3.5 h-3.5 rounded-full flex items-center justify-center",
                            isDayCompleted(day)
                              ? isToday ? "bg-white" : "bg-green-600"
                              : isToday ? "bg-white/30" : "bg-muted"
                          )}
                          title="Daily Activity"
                        >
                          {isDayCompleted(day) && <Check className={cn("w-2.5 h-2.5", isToday ? "text-primary" : "text-white")} />}
                        </div>
                        {isMissed && (
                          <span className="text-xs text-destructive">Missed</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div 
                            className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center",
                              isPeriodCompleted(day, "morning")
                                ? isToday ? "bg-white" : "bg-green-600"
                                : isToday ? "bg-white/30" : "bg-muted"
                            )}
                            title="Morning"
                          >
                            <Sun className={cn("w-2 h-2", isPeriodCompleted(day, "morning") ? (isToday ? "text-primary" : "text-white") : "text-muted-foreground")} />
                          </div>
                          <div 
                            className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center",
                              isPeriodCompleted(day, "evening")
                                ? isToday ? "bg-white" : "bg-green-600"
                                : isToday ? "bg-white/30" : "bg-muted"
                            )}
                            title="Evening"
                          >
                            <Moon className={cn("w-2 h-2", isPeriodCompleted(day, "evening") ? (isToday ? "text-primary" : "text-white") : "text-muted-foreground")} />
                          </div>
                        </div>
                        {isMissed && (
                          <span className="text-xs text-destructive">Missed</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area - Expanded to full width, mobile-optimized */}
        <div className={cn(
          "overflow-y-auto custom-scrollbar px-1 sm:px-2",
          !isMobile && "col-span-9"
        )}>
          {isLoading ? (
             <ContentSkeleton />
          ) : isTrackA && trackADayContent ? (
            <TrackADayView 
              content={trackADayContent} 
              day={selectedDay}
              isCompleted={isPeriodCompleted(selectedDay, "morning")}
              existingAnswer={answers?.find(a => a.dayNumber === selectedDay)}
              fontSize={fontSize}
              decreaseFontSize={decreaseFontSize}
              increaseFontSize={increaseFontSize}
            />
          ) : dayContent ? (
            <div className="space-y-4 sm:space-y-8 pb-10">
              <div className="text-center space-y-2 mb-4 sm:mb-8">
                <Badge variant="outline" className="mb-2">Day {selectedDay}</Badge>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-primary">
                  {dayContent.isReflectionDay ? "Weekly Reflection" : "Daily Devotion"}
                </h1>
              </div>

              {dayContent.isReflectionDay ? (
                <ReflectionView content={dayContent} existingAnswer={answers?.find(a => a.dayNumber === selectedDay)} />
              ) : (
                <Tabs defaultValue="morning" className="w-full">
                  <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="morning" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> Morning
                      </TabsTrigger>
                      <TabsTrigger value="evening" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Moon className="w-3 h-3 sm:w-4 sm:h-4" /> Evening
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Font Size Control */}
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
                    {/* Morning Prayers - click to open modal */}
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
                    
                    {/* Mentor Day - Message Mentor prompt */}
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

                    {/* Regular Questions to Consider (non-mentor days) */}
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
                    
                    {/* Daily Examen Modal Button */}
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

                    {/* Daily Examen Modal */}
                    <Dialog open={examenModalOpen} onOpenChange={setExamenModalOpen}>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-xl">Examination of Conscience</DialogTitle>
                          <p className="text-sm text-muted-foreground">Daily Examen (10-15 minutes)</p>
                        </DialogHeader>
                        <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {EXAMINATION_OF_CONSCIENCE}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Assignment Section - show when assignment is set */}
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
    </Shell>
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function TrackAMediaContent({ text }: { text: string }) {
  if (!text) return null;
  
  const youtubeId = extractYouTubeId(text);
  if (youtubeId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }
  
  if (text.startsWith("http")) {
    return (
      <a href={text} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
        {text}
      </a>
    );
  }
  
  return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
}

function TrackADayView({ 
  content, 
  day, 
  isCompleted,
  existingAnswer,
  fontSize,
  decreaseFontSize,
  increaseFontSize,
}: { 
  content: TrackAContent;
  day: number;
  isCompleted: boolean;
  existingAnswer?: any;
  fontSize: FontSizeKey;
  decreaseFontSize: () => void;
  increaseFontSize: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-8 pb-10">
      <div className="text-center space-y-2 mb-4 sm:mb-8">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="mb-2">Day {day}</Badge>
          <Badge variant="secondary" className="mb-2">Track A</Badge>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-primary" data-testid="text-central-theme">
          {content.centralTheme}
        </h1>
        {content.mainConcepts && (
          <p className="text-muted-foreground text-sm sm:text-base" data-testid="text-main-concepts">
            {content.mainConcepts}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={decreaseFontSize}
            disabled={fontSize === 'small'}
            data-testid="button-font-decrease-a"
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
            data-testid="button-font-increase-a"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {content.dailyScripture && (
        <Card data-testid="card-scripture">
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="font-serif text-base sm:text-lg">Scripture</CardTitle>
          </CardHeader>
          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed italic p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
            <p className="whitespace-pre-wrap">{content.dailyScripture}</p>
          </CardContent>
        </Card>
      )}

      {content.catechism && (
        <Card data-testid="card-catechism">
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="font-serif text-base sm:text-lg">Catechism</CardTitle>
          </CardHeader>
          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
            <TrackAMediaContent text={content.catechism} />
          </CardContent>
        </Card>
      )}

      {content.reflectionCommentary && (
        <Card data-testid="card-reflection">
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="font-serif text-base sm:text-lg">Reflection</CardTitle>
          </CardHeader>
          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
            <TrackAMediaContent text={content.reflectionCommentary} />
          </CardContent>
        </Card>
      )}

      {content.prayers && (
        <Card className="bg-primary/5 border-primary/20" data-testid="card-prayers">
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="font-serif text-base sm:text-lg">Prayer</CardTitle>
          </CardHeader>
          <CardContent className={cn("prose max-w-none text-muted-foreground leading-relaxed p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
            <TrackAMediaContent text={content.prayers} />
          </CardContent>
        </Card>
      )}

      {content.videoResource && (
        <Card data-testid="card-video">
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="font-serif text-base sm:text-lg">Resource</CardTitle>
          </CardHeader>
          <CardContent className={cn("p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
            <TrackAMediaContent text={content.videoResource} />
          </CardContent>
        </Card>
      )}

      {content.songTitle && (
        <Card className="bg-secondary/30" data-testid="card-song">
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="font-serif text-base sm:text-lg">Song</CardTitle>
          </CardHeader>
          <CardContent className={cn("prose max-w-none text-muted-foreground p-3 sm:p-6 pt-0", FONT_SIZES[fontSize].class)}>
            <TrackAMediaContent text={content.songTitle} />
          </CardContent>
        </Card>
      )}

      {content.journalAssignment && (
        <AssignmentSection 
          day={day} 
          prompt={content.journalAssignment}
          existingAnswer={existingAnswer}
        />
      )}

      <MarkCompleteButton 
        day={day}
        period="morning"
        isCompleted={isCompleted}
        label="Mark Today Complete"
        completedLabel="Today Complete"
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
