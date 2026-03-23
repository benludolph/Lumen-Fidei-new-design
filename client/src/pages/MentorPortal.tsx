import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function MentorPortal() {
  const { user } = useAuth();
  const { data: allUsers } = useUsers("participant");
  const [_, setLocation] = useLocation();

  if (!user || (user.role !== 'mentor' && user.role !== 'admin')) return null;

  // Filter for mentees assigned to this mentor
  // In a real app, the API would filter this efficiently. 
  // Here we filter client side based on the full list for simplicity
  const myMentees = allUsers?.filter(u => u.mentorId === user.id) || [];

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="type-display-lg font-serif font-bold text-primary mb-2">Mentorship Portal</h1>
        <p className="text-muted-foreground">Oversee your mentees' spiritual progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myMentees.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
             <p>No mentees assigned yet.</p>
          </div>
        ) : (
          myMentees.map((mentee) => (
            <Card key={mentee.id} className="hover:shadow-lg transition-all duration-300 group border-primary/10">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12 border-2 border-secondary">
                  <AvatarFallback className="bg-primary/5 text-primary text-lg">
                    {mentee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="truncate">{mentee.name}</CardTitle>
                  <CardDescription className="truncate">{mentee.email}</CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono">Track {mentee.track}</Badge>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mt-4 gap-2">
                  <Button 
                    className="flex-1 gap-2" 
                    variant="outline"
                    onClick={() => setLocation(`/messages?user=${mentee.id}`)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Button>
                  <Button 
                    className="flex-1 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => setLocation(`/mentor/mentee/${mentee.id}`)}
                  >
                    View Progress
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Shell>
  );
}
