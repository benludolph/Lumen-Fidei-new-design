import { useAuth } from "@/hooks/use-auth";
import { useDailyContent, useAllContent } from "@/hooks/use-content";
import { useUserAnswers, useCreateAnswer } from "@/hooks/use-answers";
import { useUserPrayerCompletions, useMarkPrayerComplete, useUnmarkPrayerComplete } from "@/hooks/use-prayer-completions";
import { useTrackRequirements, usePracticeResources } from "@/hooks/use-track-requirements";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, Circle, Sun, Moon, Check, ChevronDown, ChevronUp, BookOpen, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  
  // Calculate current day based on start date
  const currentDay = useMemo(() => {
    if (!user?.startDate) return 1;
    const start = startOfDay(parseISO(user.startDate as unknown as string));
    const now = startOfDay(new Date());
    const day = differenceInCalendarDays(now, start) + 1;
    return Math.max(1, Math.min(day, 30)); // Clamp between 1 and 30
  }, [user]);

  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  // Calculate week number (6 days per week)
  const currentWeek = useMemo(() => Math.ceil(selectedDay / 6), [selectedDay]);
  
  // Fetch lists
  const { data: contentList } = useAllContent();
  const { data: answers } = useUserAnswers(user?.id);
  const { data: prayerCompletions } = useUserPrayerCompletions();
  
  // Fetch track requirements and practice resources
  const { data: trackReqs } = useTrackRequirements(user?.track as "A" | "B" | "C" | null, currentWeek);
  const { data: practiceResources } = usePracticeResources();
  
  // Get content for selected day
  const { data: dayContent, isLoading } = useDailyContent(selectedDay);
  
  if (!user || user.role !== 'participant') return null; // Or redirect

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

  return (
    <Shell>
      <div className={cn(
        "flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8",
        "h-auto lg:h-[calc(100vh-6rem)]"
      )}>
        {/* Timeline - Collapsible on mobile */}
        {isMobile ? (
          <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between mb-4"
                data-testid="button-toggle-timeline"
              >
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold">Day {selectedDay}</span>
                  <span className="text-muted-foreground">of 30</span>
                </div>
                {timelineOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-4">
              <Card className="p-4">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const isLocked = day > currentDay;
                    const isCompleted = isDayCompleted(day);
                    const isActive = day === selectedDay;
                    
                    return (
                      <button
                        key={day}
                        disabled={isLocked}
                        onClick={() => {
                          setSelectedDay(day);
                          setTimelineOpen(false);
                        }}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all",
                          isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary",
                          isLocked && "opacity-40 cursor-not-allowed hover:bg-transparent"
                        )}
                      >
                        <span>{day}</span>
                        {!isLocked && isCompleted && (
                          <CheckCircle2 className={cn("w-3 h-3 mt-0.5", isActive ? "text-white" : "text-green-600")} />
                        )}
                      </button>
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
                const isLocked = day > currentDay;
                const isCompleted = isDayCompleted(day);
                const isActive = day === selectedDay;
                
                return (
                  <button
                    key={day}
                    disabled={isLocked}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all",
                      isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary",
                      isLocked && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                        isActive ? "bg-white/20" : "bg-muted"
                      )}>
                        {day}
                      </span>
                      <span className="font-medium">Day {day}</span>
                    </div>
                    {isLocked ? (
                      <Lock className="w-4 h-4 opacity-50" />
                    ) : isCompleted ? (
                      <CheckCircle2 className={cn("w-4 h-4", isActive ? "text-white" : "text-green-600")} />
                    ) : (
                      <Circle className="w-4 h-4 opacity-30" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={cn(
          "overflow-y-auto custom-scrollbar px-2",
          !isMobile && "col-span-6"
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
                      <Card className="bg-primary/5 border-primary/20">
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

        {/* Right Sidebar - Track Requirements (collapsible on mobile) */}
        {isMobile ? (
          <Collapsible open={requirementsOpen} onOpenChange={setRequirementsOpen} className="w-full mt-4">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                data-testid="button-toggle-requirements"
              >
                <span className="font-serif font-bold">Week {currentWeek} Practices</span>
                {requirementsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="bg-secondary/30 border-none mt-2">
                <CardContent className="text-sm space-y-4 pt-4">
                  <TrackRequirementsPanel 
                    trackReqs={trackReqs} 
                    practiceResources={practiceResources} 
                    track={user.track}
                    week={currentWeek}
                  />
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="col-span-3 border-l border-border pl-6 overflow-y-auto custom-scrollbar">
            <Card className="bg-secondary/30 border-none sticky top-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Track {user.track}</CardTitle>
                  <Badge variant="outline">Week {currentWeek}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <TrackRequirementsPanel 
                  trackReqs={trackReqs} 
                  practiceResources={practiceResources} 
                  track={user.track}
                  week={currentWeek}
                />
              </CardContent>
            </Card>
          </div>
        )}
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

interface TrackRequirementsPanelProps {
  trackReqs: any;
  practiceResources: any[] | undefined;
  track: string | null;
  week: number;
}

function TrackRequirementsPanel({ trackReqs, practiceResources, track, week }: TrackRequirementsPanelProps) {
  const [expandedPractice, setExpandedPractice] = useState<string | null>(null);
  
  const getPracticeResource = (practiceName: string) => {
    return practiceResources?.find(r => r.name === practiceName);
  };
  
  const togglePractice = (name: string) => {
    setExpandedPractice(expandedPractice === name ? null : name);
  };

  if (!trackReqs) {
    return (
      <p className="text-muted-foreground text-sm">
        Loading requirements for Week {week}...
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Morning Practices */}
      {trackReqs.morningPractices && trackReqs.morningPractices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-sm">Morning Practices</span>
          </div>
          <div className="space-y-2">
            {(trackReqs.morningPractices as string[]).map((practice) => {
              const resource = getPracticeResource(practice);
              const isExpanded = expandedPractice === practice;
              
              return (
                <div key={practice} className="rounded-md border border-border/50 overflow-hidden">
                  <button
                    onClick={() => resource && togglePractice(practice)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left text-sm",
                      resource && "cursor-pointer hover:bg-secondary/50"
                    )}
                    data-testid={`practice-${practice.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span>{practice}</span>
                    </div>
                    {resource && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    )}
                  </button>
                  {resource && isExpanded && (
                    <div className="p-3 bg-secondary/30 border-t border-border/50">
                      {resource.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{resource.duration}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap prose prose-sm max-w-none">
                        {resource.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Evening Practices */}
      {trackReqs.eveningPractices && trackReqs.eveningPractices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-sm">Evening Practices</span>
          </div>
          <div className="space-y-2">
            {(trackReqs.eveningPractices as string[]).map((practice) => {
              const resource = getPracticeResource(practice);
              const isExpanded = expandedPractice === practice;
              
              return (
                <div key={practice} className="rounded-md border border-border/50 overflow-hidden">
                  <button
                    onClick={() => resource && togglePractice(practice)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left text-sm",
                      resource && "cursor-pointer hover:bg-secondary/50"
                    )}
                    data-testid={`practice-${practice.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span>{practice}</span>
                    </div>
                    {resource && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    )}
                  </button>
                  {resource && isExpanded && (
                    <div className="p-3 bg-secondary/30 border-t border-border/50">
                      {resource.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{resource.duration}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap prose prose-sm max-w-none">
                        {resource.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Additional Requirements */}
      {trackReqs.additionalRequirements && trackReqs.additionalRequirements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-sm">Additional</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {(trackReqs.additionalRequirements as string[]).map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
