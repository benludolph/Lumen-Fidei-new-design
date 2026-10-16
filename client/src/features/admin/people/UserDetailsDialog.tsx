import { useState } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Download, Eye, FileText, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

export type UserDetailsData = {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    track: string | null;
    mentorId: number | null;
    mentorName: string | null;
    startDate: string | null;
    currentDay: number;
    daysCompleted: number;
    totalDays: number;
    totalPossibleDays: number;
    graduationEligible: boolean;
  };
  answers: Array<{
    id: number;
    dayNumber: number;
    content: string;
    createdAt: string;
    questions: string[] | null;
  }>;
  prayerCompletions: Array<{
    dayNumber: number;
    period: string;
    completedAt: string;
  }>;
};

export function UserDetailsDialog({ userId, userName }: { userId: number; userName: string }) {
  const [open, setOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data, isLoading } = useQuery<UserDetailsData>({
    queryKey: ["/api/admin/users", userId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/details`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user details");
      return res.json();
    },
    enabled: open,
  });
  
  const filteredAnswers = data?.answers.filter(a => {
    const matchesDay = dayFilter === "all" || a.dayNumber === Number(dayFilter);
    const matchesSearch = !searchTerm || 
      a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.questions?.some(q => q.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDay && matchesSearch;
  }) || [];
  
  const exportCSV = () => {
    if (!data) return;
    
    const escapeCSV = (str: string) => {
      let escaped = str;
      // Protect against CSV formula injection
      if (/^[=+\-@\t\r]/.test(escaped)) {
        escaped = "'" + escaped;
      }
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped.replace(/"/g, '""')}"`;
      }
      return escaped;
    };
    
    const headers = ["Day", "Question", "Answer", "Submitted At"];
    const rows = filteredAnswers.map(a => [
      a.dayNumber.toString(),
      escapeCSV(a.questions?.join(" | ") || "N/A"),
      escapeCSV(a.content),
      format(new Date(a.createdAt), "yyyy-MM-dd HH:mm"),
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${userName.replace(/\s+/g, "_")}_answers.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View details" data-testid={`button-view-details-${userId}`}>
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            User Details: {userName}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading user details...</div>
        ) : data ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{data.user.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <p className="font-medium capitalize">{data.user.role}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Track:</span>
                    <p className="font-medium">{data.user.track || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mentor:</span>
                    <p className="font-medium">{data.user.mentorName || "Unassigned"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <p className="font-medium">
                      {data.user.startDate ? format(new Date(data.user.startDate), "MMM d, yyyy") : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Day:</span>
                    <p className="font-medium text-lg">{data.user.currentDay} / 30</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days Completed:</span>
                    <p className="font-medium text-lg">{data.user.daysCompleted}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completion Rate:</span>
                    <p className="font-medium text-lg">
                      {data.user.totalPossibleDays > 0 
                        ? Math.round((data.user.daysCompleted / data.user.totalPossibleDays) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Graduation Status:</span>
                    <Badge variant={data.user.graduationEligible ? "default" : "secondary"}>
                      {data.user.graduationEligible ? "Eligible" : "In Progress"}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress toward graduation ({Math.ceil(data.user.totalDays * 0.8)} days)</span>
                    <span className="text-sm font-medium">{data.user.daysCompleted} / {Math.ceil(data.user.totalDays * 0.8)}</span>
                  </div>
                  <Progress value={Math.min((data.user.daysCompleted / Math.max(1, Math.ceil(data.user.totalDays * 0.8))) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">Daily Answers ({filteredAnswers.length})</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select value={dayFilter} onValueChange={setDayFilter}>
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Days</SelectItem>
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                            <SelectItem key={d} value={d.toString()}>Day {d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Search answers..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 w-[160px]"
                        data-testid="input-search-answers"
                      />
                      {searchTerm && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-answers">
                      <Download className="w-4 h-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAnswers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No answers found</p>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {filteredAnswers.map(answer => (
                      <div key={answer.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Day {answer.dayNumber}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(answer.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        {answer.questions && answer.questions.length > 0 && (
                          <div className="text-xs text-muted-foreground mb-2 bg-secondary/30 p-2 rounded">
                            <strong>Question:</strong> {answer.questions.join(" | ")}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{answer.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
