import { useAuth } from "@/hooks/use-auth";
import { useDailyContent, useAllContent } from "@/hooks/use-content";
import { useUserAnswers, useCreateAnswer } from "@/hooks/use-answers";
import { useUserPrayerCompletions, useMarkPrayerComplete, useUnmarkPrayerComplete } from "@/hooks/use-prayer-completions";
import { useCohortStartDate } from "@/hooks/use-cohort";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, CheckCircle2, Circle, Sun, Moon, Check, ChevronDown, ChevronUp, AlertCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [prayerModalOpen, setPrayerModalOpen] = useState<string | null>(null);
  
  // Get cohort-based current day
  const { data: cohortData, isLoading: cohortLoading } = useCohortStartDate();
  const currentDay = cohortData?.currentDay || 0;
  
  // Selected day is always the current day (users can only access current day)
  const selectedDay = currentDay;
  
  // Fetch lists
  const { data: contentList } = useAllContent();
  const { data: answers } = useUserAnswers(user?.id);
  const { data: prayerCompletions } = useUserPrayerCompletions();
  
  // Get content for selected day
  const { data: dayContent, isLoading } = useDailyContent(selectedDay);
  
  if (!user || user.role !== 'participant') return null;

  // Function to check if day is completed (both morning and evening prayers done)
  const isDayCompleted = (day: number) => {
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
      {/* Prayer Modals */}
      <Dialog open={prayerModalOpen !== null} onOpenChange={() => setPrayerModalOpen(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{prayerModalOpen}</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
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
                        {isToday && isCompleted && (
                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-white" />
                        )}
                        {isPast && isCompleted && (
                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-600" />
                        )}
                        {isMissed && (
                          <AlertCircle className="w-3 h-3 mt-0.5 text-destructive" />
                        )}
                        {isFuture && (
                          <Lock className="w-3 h-3 mt-0.5 opacity-50" />
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
                    ) : isPast ? (
                      isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">Missed</span>
                        </div>
                      )
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 opacity-30" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area - Expanded to full width */}
        <div className={cn(
          "overflow-y-auto custom-scrollbar px-2",
          !isMobile && "col-span-9"
        )}>
          {isLoading ? (
             <ContentSkeleton />
          ) : dayContent ? (
            <div className="space-y-8 pb-10">
              <div className="text-center space-y-2 mb-8">
                <Badge variant="outline" className="mb-2">Day {selectedDay}</Badge>
                <h1 className="font-serif text-4xl font-bold text-primary">
                  {dayContent.isReflectionDay ? "Weekly Reflection" : "Daily Devotion"}
                </h1>
              </div>

              {dayContent.isReflectionDay ? (
                <ReflectionView content={dayContent} />
              ) : (
                <Tabs defaultValue="morning" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="morning" className="gap-2">
                      <Sun className="w-4 h-4" /> Morning Prayer
                    </TabsTrigger>
                    <TabsTrigger value="evening" className="gap-2">
                      <Moon className="w-4 h-4" /> Evening Review
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="morning" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Morning Prayers - click to open modal */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-lg">Morning Prayers</CardTitle>
                        <p className="text-sm text-muted-foreground">Click each prayer to open and pray</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-auto py-3"
                          onClick={() => setPrayerModalOpen("Prayer Against Retaliation")}
                          data-testid="button-prayer-retaliation"
                        >
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span>Prayer Against Retaliation</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-auto py-3"
                          onClick={() => setPrayerModalOpen("Miracle Prayer")}
                          data-testid="button-prayer-miracle"
                        >
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span>Miracle Prayer</span>
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif">Scripture</CardTitle>
                        <p className="text-sm text-muted-foreground">{dayContent.morningScriptureRef}</p>
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed italic">
                        "{dayContent.morningScriptureText}"
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif">Meditation</CardTitle>
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {dayContent.morningMeditation}
                      </CardContent>
                    </Card>
                    
                    {dayContent.morningPrayer && (
                      <Card className="bg-secondary/30">
                        <CardHeader>
                          <CardTitle className="font-serif">Closing Prayer</CardTitle>
                        </CardHeader>
                        <CardContent className="prose max-w-none text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
                          {dayContent.morningPrayer}
                        </CardContent>
                      </Card>
                    )}
                    
                    <MarkCompleteButton 
                      day={selectedDay}
                      period="morning"
                      isCompleted={isPeriodCompleted(selectedDay, "morning")}
                    />
                  </TabsContent>
                  
                  <TabsContent value="evening" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif">Catechism</CardTitle>
                        {dayContent.eveningCatechismRef && (
                          <p className="text-sm text-muted-foreground">{dayContent.eveningCatechismRef}</p>
                        )}
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {dayContent.eveningCatechism}
                      </CardContent>
                    </Card>
                    
                    {dayContent.eveningSummary && (
                      <Card className="bg-secondary/50">
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">Summary of Key Concepts</CardTitle>
                        </CardHeader>
                        <CardContent className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {dayContent.eveningSummary}
                        </CardContent>
                      </Card>
                    )}
                    
                    {dayContent.eveningQuestions && dayContent.eveningQuestions.length > 0 && (
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle className="font-serif">Questions to Consider</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="list-decimal pl-4 space-y-3 text-muted-foreground">
                            {(dayContent.eveningQuestions as string[]).map((q, idx) => (
                              <li key={idx} className="leading-relaxed">{q}</li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Examination of Conscience */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="font-serif">Examination of Conscience</CardTitle>
                        <p className="text-sm text-muted-foreground">Daily Examen (10-15 minutes)</p>
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {EXAMINATION_OF_CONSCIENCE}
                      </CardContent>
                    </Card>
                    
                    <AssignmentSection 
                      day={selectedDay} 
                      prompt="Reflect on today's readings and answer the questions above in your own words."
                      existingAnswer={answers?.find(a => a.dayNumber === selectedDay)}
                    />
                    
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

function MarkCompleteButton({ day, period, isCompleted }: { day: number, period: "morning" | "evening", isCompleted: boolean }) {
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
            {period === "morning" ? "Morning Prayer Complete" : "Evening Prayer Complete"}
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Mark {period === "morning" ? "Morning" : "Evening"} Prayer Complete
          </>
        )}
      </Button>
    </div>
  );
}

function AssignmentSection({ day, prompt, existingAnswer }: { day: number, prompt: string, existingAnswer?: any }) {
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
      <CardHeader>
        <CardTitle className="font-serif">Daily Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="italic text-muted-foreground">{prompt}</p>
        
        {isEditing ? (
          <div className="space-y-4">
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reflection here..."
              className="min-h-[150px] bg-white"
            />
            <div className="flex justify-end gap-2">
              {existingAnswer && (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              )}
              <Button onClick={handleSubmit} disabled={isPending || !content.trim()}>
                {isPending ? "Saving..." : "Save Reflection"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="bg-white p-4 rounded-md border border-border text-sm whitespace-pre-wrap">
               {content}
             </div>
             <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Response</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReflectionView({ content }: { content: any }) {
  // Simpler view for reflection days, just reading + big text area
  // Re-using AssignmentSection logic but wrapping it differently would be ideal
  // For brevity, just rendering AssignmentSection with "Reflection" styling
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/20 border-none">
        <CardContent className="pt-6 text-center italic text-lg text-primary/80">
          "Take time today to look back on the week. Where did you see God's hand?"
        </CardContent>
      </Card>
      
      <AssignmentSection 
        day={content.dayNumber} 
        prompt="Write your weekly reflection below. Consider your struggles, consolations, and resolutions for next week."
        existingAnswer={undefined} // We'd need to fetch this from parent properly in a real app
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
