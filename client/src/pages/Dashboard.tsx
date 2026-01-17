import { useAuth } from "@/hooks/use-auth";
import { useDailyContent, useAllContent } from "@/hooks/use-content";
import { useUserAnswers, useCreateAnswer } from "@/hooks/use-answers";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, Circle, Sun, Moon } from "lucide-react";
import { useState, useMemo } from "react";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Calculate current day based on start date
  const currentDay = useMemo(() => {
    if (!user?.startDate) return 1;
    const start = startOfDay(parseISO(user.startDate as unknown as string));
    const now = startOfDay(new Date());
    const day = differenceInCalendarDays(now, start) + 1;
    return Math.max(1, Math.min(day, 30)); // Clamp between 1 and 30
  }, [user]);

  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  // Fetch lists
  const { data: contentList } = useAllContent();
  const { data: answers } = useUserAnswers(user?.id);
  
  // Get content for selected day
  const { data: dayContent, isLoading } = useDailyContent(selectedDay);
  
  if (!user || user.role !== 'participant') return null; // Or redirect

  // Function to check if day is completed
  const isDayCompleted = (day: number) => {
    return answers?.some(a => a.dayNumber === day) ?? false;
  };

  return (
    <Shell>
      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-6rem)]">
        {/* Left Sidebar - Timeline */}
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

        {/* Main Content Area */}
        <div className="col-span-6 overflow-y-auto custom-scrollbar px-2">
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
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed">
                        {dayContent.morningScripture}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif">Meditation</CardTitle>
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed">
                        {dayContent.morningMeditation}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="evening" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                     <Card>
                      <CardHeader>
                        <CardTitle className="font-serif">Catechism</CardTitle>
                      </CardHeader>
                      <CardContent className="prose max-w-none text-muted-foreground leading-relaxed">
                        {dayContent.eveningCatechism}
                      </CardContent>
                    </Card>
                    
                    <AssignmentSection 
                      day={selectedDay} 
                      prompt={dayContent.eveningAssignment} 
                      existingAnswer={answers?.find(a => a.dayNumber === selectedDay)}
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

        {/* Right Sidebar - Track Requirements */}
        <div className="col-span-3 border-l border-border pl-6">
          <Card className="bg-secondary/30 border-none sticky top-0">
            <CardHeader>
              <CardTitle className="text-lg">Track {user.track}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <p className="text-muted-foreground">
                Welcome to the {user.track} track. Here are your requirements for this week:
              </p>
              <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                {user.track === 'A' && (
                  <>
                    <li>Complete daily morning prayers (15 min)</li>
                    <li>Evening reflection (10 min)</li>
                    <li>1 Hour Holy Hour weekly</li>
                  </>
                )}
                {user.track === 'B' && (
                  <>
                    <li>Complete daily prayers (30 min)</li>
                    <li>Evening Examen</li>
                    <li>Bi-weekly fasting</li>
                  </>
                )}
                {user.track === 'C' && (
                  <>
                    <li>Strict schedule adherence</li>
                    <li>Cold showers</li>
                    <li>No unnecessary internet</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
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
