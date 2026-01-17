import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { api, buildUrl } from "@shared/routes";
import { useUserAnswers } from "@/hooks/use-answers";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function MenteeDetails() {
  const [match, params] = useRoute("/mentor/mentee/:id");
  const menteeId = Number(params?.id);
  
  // Need a specific hook to get one user, or filter from list
  // Using list for simplicity as we have it cached
  const { data: users } = useQuery({ 
     queryKey: [api.users.list.path, "participant"],
     // Ensure we have data even if we came directly here
     queryFn: async () => {
       const res = await fetch(api.users.list.path + "?role=participant");
       return api.users.list.responses[200].parse(await res.json());
     }
  });
  
  const mentee = users?.find(u => u.id === menteeId);
  const { data: answers, isLoading } = useUserAnswers(menteeId);

  if (!mentee) return <Shell>Loading...</Shell>;

  return (
    <Shell>
      <div className="mb-6">
        <Link href="/mentor">
            <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-primary gap-2">
              <ChevronLeft className="w-4 h-4" /> Back to Portal
            </Button>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-primary">{mentee.name}'s Journey</h1>
        <p className="text-muted-foreground">Viewing progress for Track {mentee.track}</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div>Loading answers...</div>
        ) : answers?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No daily reflections submitted yet.
            </CardContent>
          </Card>
        ) : (
          answers?.sort((a, b) => b.dayNumber - a.dayNumber).map((answer) => (
            <Card key={answer.id}>
              <CardHeader className="bg-secondary/20 pb-3">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-lg font-serif">Day {answer.dayNumber}</CardTitle>
                   <span className="text-xs text-muted-foreground">
                     {answer.createdAt ? format(new Date(answer.createdAt), "PPP p") : ""}
                   </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {answer.content}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Shell>
  );
}
