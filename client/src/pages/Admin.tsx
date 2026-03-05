import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Users, BarChart3, CheckCircle2, Circle, Sun, Moon, Settings, Calendar, Key, Award, AlertTriangle, BookOpen, Save, ChevronLeft, ChevronRight, Trash2, Download, Eye, FileText, Filter, X, ChevronUp, ChevronDown, Edit2, GripVertical, Upload, Image as ImageIcon, ArrowLeft, Layers, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ALL_SAINTS } from "@/components/lesson/LessonCompletionScreen";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useAuth();
  const { data: users, isLoading } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");

  if (!user || user.role !== 'admin') return null;

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Shell>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Administration</h1>
          <p className="text-muted-foreground">Manage users and monitor progress</p>
        </div>
        <CreateUserDialog />
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2" data-testid="tab-progress">
            <BarChart3 className="w-4 h-4" /> Progress
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2" data-testid="tab-content">
            <BookOpen className="w-4 h-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2" data-testid="tab-messages">
            <MessageSquare className="w-4 h-4" /> Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-users"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredUsers?.map((u) => (
                    <UserRow key={u.id} user={u} allUsers={users || []} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <ProgressView />
        </TabsContent>

        <TabsContent value="settings">
          <CohortSettingsView />
        </TabsContent>

        <TabsContent value="content">
          <ContentManagementView />
          <div className="mt-8">
            <TrackAContentManagementView />
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <MessageManagementView />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function UserRow({ user, allUsers }: { user: any, allUsers: any[] }) {
  const { mutate: updateUser } = useUpdateUser();
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  // Include both mentors and admins as possible mentors for participants
  const mentors = allUsers.filter(u => u.role === 'mentor' || u.role === 'admin');

  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${user.id}/reset-password`, { newPassword: password });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setResetOpen(false);
      setNewPassword("");
    },
    onError: () => {
      toast({ title: "Failed to reset password", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/users/${user.id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully", description: "All related data has been removed." });
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const handleAssignMentor = (mentorId: string) => {
     updateUser({ id: user.id, mentorId: Number(mentorId) });
  };
  
  const handleAssignTrack = (track: string) => {
    updateUser({ id: user.id, track: track as "A" | "B" | "C" });
  };

  const handleResetPassword = () => {
    if (newPassword.length >= 6) {
      resetPasswordMutation.mutate(newPassword);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div>{user.name}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell>
        <span className="capitalize">{user.role}</span>
      </TableCell>
      <TableCell>
        {user.role === 'participant' ? (
           <Select defaultValue={user.track} onValueChange={handleAssignTrack}>
             <SelectTrigger className="w-[80px] h-8">
               <SelectValue placeholder="-" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="A">A</SelectItem>
               <SelectItem value="B">B</SelectItem>
               <SelectItem value="C">C</SelectItem>
             </SelectContent>
           </Select>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {user.role === 'participant' ? (
           <Select defaultValue={user.mentorId?.toString()} onValueChange={handleAssignMentor}>
             <SelectTrigger className="w-[140px] h-8">
               <SelectValue placeholder="Unassigned" />
             </SelectTrigger>
             <SelectContent>
               {mentors.map(m => (
                 <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {user.startDate ? format(new Date(user.startDate), "MMM d, yyyy") : "-"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <UserDetailsDialog userId={user.id} userName={user.name} />
          
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Reset password" data-testid={`button-reset-password-${user.id}`}>
                <Key className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password for {user.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter a new password for this user. They will need to use this password to log in.
                </p>
                <Input 
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
                <Button 
                  onClick={handleResetPassword} 
                  disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-reset"
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {user.role !== 'admin' && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete user" data-testid={`button-delete-user-${user.id}`}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete {user.name}?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete this user and all their data including:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>All reflection answers</li>
                    <li>All prayer completion records</li>
                    <li>All chat messages</li>
                  </ul>
                  <p className="text-sm font-medium text-destructive">
                    This action cannot be undone. The user will be able to re-register with the same email.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteOpen(false)}
                      className="flex-1"
                      data-testid="button-cancel-delete"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => deleteUserMutation.mutate()}
                      disabled={deleteUserMutation.isPending}
                      className="flex-1"
                      data-testid="button-confirm-delete"
                    >
                      {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

type UserDetailsData = {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    track: string | null;
    mentorId: number | null;
    mentorName: string | null;
    startDate: string | null;
    agreementSignedAt: string | null;
    currentDay: number;
    daysCompleted: number;
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

function UserDetailsDialog({ userId, userName }: { userId: number; userName: string }) {
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
                  <div>
                    <span className="text-muted-foreground">Agreement Signed:</span>
                    <p className="font-medium">
                      {data.user.agreementSignedAt ? format(new Date(data.user.agreementSignedAt), "MMM d, yyyy") : "No"}
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
                    <span className="text-sm text-muted-foreground">Progress toward graduation (24 days)</span>
                    <span className="text-sm font-medium">{data.user.daysCompleted} / 24</span>
                  </div>
                  <Progress value={Math.min((data.user.daysCompleted / 24) * 100, 100)} className="h-2" />
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

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCreateUser();
  const form = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      role: "participant",
      track: "A",
      password: "password123", // Default password for simplicity
    }
  });

  const onSubmit = async (data: any) => {
    // Ensure startDate is set for participants
    const payload = {
      ...data,
      startDate: new Date(), // Start today by default
    };
    await mutateAsync(payload);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register("name")} placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input {...form.register("email")} placeholder="email@example.com" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select onValueChange={v => form.setValue("role", v as any)} defaultValue="participant">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Track</label>
              <Select onValueChange={v => form.setValue("track", v as any)} defaultValue="A">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium">Initial Password</label>
             <Input {...form.register("password")} />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProgressData = {
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  track: string | null;
  mentorName: string | null;
  startDate: string | null;
  currentDay: number;
  daysCompleted: number;
  morningToday: boolean;
  eveningToday: boolean;
};

function ProgressView() {
  const GRADUATION_THRESHOLD = 0.8; // 80% completion required to pass

  const { data: progressData, isLoading } = useQuery<ProgressData[]>({
    queryKey: [api.admin.progress.path],
    queryFn: async () => {
      const res = await fetch(api.admin.progress.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading progress data...</CardContent>
      </Card>
    );
  }

  const cohortCurrentDay = progressData?.[0]?.currentDay || 0;
  const cohortComplete = cohortCurrentDay >= 30;
  
  const totalParticipants = progressData?.length || 0;
  const graduatingCount = progressData?.filter(p => (p.daysCompleted / 30) >= GRADUATION_THRESHOLD).length || 0;
  const atRiskCount = progressData?.filter(p => {
    const completionRate = p.daysCompleted / Math.max(p.currentDay, 1);
    return completionRate < GRADUATION_THRESHOLD && p.currentDay > 5;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{graduatingCount}</p>
                <p className="text-sm text-muted-foreground">On Track to Graduate (80%+)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{atRiskCount}</p>
                <p className="text-sm text-muted-foreground">At Risk (below 80%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Participant Progress</CardTitle>
            {cohortComplete && (
              <Badge variant="default" className="bg-green-600">Cohort Complete - Day 30</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No participants yet
                  </TableCell>
                </TableRow>
              ) : progressData?.map((p) => {
                const completionPercent = Math.round((p.daysCompleted / 30) * 100);
                const isGraduating = completionPercent >= 80;
                const currentRate = p.daysCompleted / Math.max(p.currentDay, 1);
                const isAtRisk = currentRate < GRADUATION_THRESHOLD && p.currentDay > 5;

                return (
                  <TableRow key={p.userId} data-testid={`row-progress-${p.userId}`}>
                    <TableCell>
                      <div className="font-medium">{p.userName}</div>
                      <div className="text-xs text-muted-foreground">{p.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.track || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.mentorName || <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">{p.currentDay}</span>
                      <span className="text-muted-foreground">/30</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={completionPercent} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">{completionPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cohortComplete ? (
                        isGraduating ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <Award className="w-3 h-3" /> Passed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            Incomplete
                          </Badge>
                        )
                      ) : isAtRisk ? (
                        <Badge variant="secondary" className="text-amber-600 gap-1">
                          <AlertTriangle className="w-3 h-3" /> At Risk
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-green-600">
                          On Track
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.track === 'A' ? (
                        <div className="flex items-center gap-1" title="Daily Activity">
                          {p.morningToday ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/30" />
                          )}
                          <span className="text-xs text-muted-foreground">Done</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" title="Morning Prayer">
                            <Sun className="w-4 h-4 text-amber-500" />
                            {p.morningToday ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex items-center gap-1" title="Evening Prayer">
                            <Moon className="w-4 h-4 text-indigo-400" />
                            {p.eveningToday ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground/30" />
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CohortSettingsView() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [newCohortDate, setNewCohortDate] = useState("");
  const [clearCompletions, setClearCompletions] = useState(true);
  const [showNewCohortDialog, setShowNewCohortDialog] = useState(false);
  
  const { data: cohortData, isLoading } = useQuery<{ startDate: string | null }>({
    queryKey: [api.admin.cohortSettings.get.path],
    queryFn: async () => {
      const res = await fetch(api.admin.cohortSettings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cohort settings");
      return res.json();
    },
  });

  const { data: progressData } = useQuery<ProgressData[]>({
    queryKey: [api.admin.progress.path],
    queryFn: async () => {
      const res = await fetch(api.admin.progress.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newStartDate: string) => {
      const res = await apiRequest("POST", api.admin.cohortSettings.update.path, { startDate: newStartDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.cohortSettings.get.path] });
      toast({ title: "Cohort start date updated" });
    },
    onError: () => {
      toast({ title: "Failed to update start date", variant: "destructive" });
    },
  });

  const startNewCohortMutation = useMutation({
    mutationFn: async (data: { startDate: string; clearCompletions: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/cohort/start-new", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.admin.cohortSettings.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.progress.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-completions"] });
      toast({ 
        title: "New cohort started", 
        description: data.clearCompletions ? `Cleared ${data.completionsCleared} prayer completions` : undefined
      });
      setShowNewCohortDialog(false);
      setNewCohortDate("");
    },
    onError: () => {
      toast({ title: "Failed to start new cohort", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (startDate) {
      updateMutation.mutate(startDate);
    }
  };

  const handleStartNewCohort = () => {
    if (newCohortDate) {
      startNewCohortMutation.mutate({ startDate: newCohortDate, clearCompletions });
    }
  };

  const currentStartDate = cohortData?.startDate 
    ? format(new Date(cohortData.startDate), "yyyy-MM-dd")
    : "";

  const cohortCurrentDay = progressData?.[0]?.currentDay || 0;
  const cohortComplete = cohortCurrentDay >= 30;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Current Cohort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <>
                {currentStartDate ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(cohortData!.startDate!), "MMMM d, yyyy")}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Current Day</p>
                      <p className="font-medium">{cohortCurrentDay}/30</p>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {cohortComplete ? (
                          <Badge variant="default" className="bg-green-600">Completed</Badge>
                        ) : cohortCurrentDay === 0 ? (
                          <Badge variant="secondary">Not Started</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-blue-600">In Progress</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-md text-center">
                    <p className="text-muted-foreground">No cohort start date set</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cohort Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Adjust Start Date</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Change the program start date. This will recalculate the current day for all participants.
              </p>
            </div>
            
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1 max-w-xs">
                <Input 
                  type="date" 
                  value={startDate || currentStartDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-cohort-start-date"
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending || !startDate}
                data-testid="button-save-cohort-date"
              >
                {updateMutation.isPending ? "Saving..." : "Update Start Date"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="font-medium mb-2">Start New Cohort</h3>
              <p className="text-sm text-muted-foreground">
                End the current cohort and start a fresh one. This will set a new start date and optionally 
                clear all prayer completion records.
              </p>
            </div>
            
            <Dialog open={showNewCohortDialog} onOpenChange={setShowNewCohortDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-start-new-cohort">
                  Start New Cohort
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Cohort</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      This will start a new 30-day program for all participants. Current progress data 
                      can optionally be cleared.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Cohort Start Date</label>
                    <Input 
                      type="date" 
                      value={newCohortDate}
                      onChange={(e) => setNewCohortDate(e.target.value)}
                      data-testid="input-new-cohort-date"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="clearCompletions"
                      checked={clearCompletions}
                      onChange={(e) => setClearCompletions(e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-clear-completions"
                    />
                    <label htmlFor="clearCompletions" className="text-sm">
                      Clear all prayer completion records (recommended for fresh start)
                    </label>
                  </div>
                  
                  <Button 
                    onClick={handleStartNewCohort}
                    disabled={!newCohortDate || startNewCohortMutation.isPending}
                    className="w-full"
                    data-testid="button-confirm-new-cohort"
                  >
                    {startNewCohortMutation.isPending ? "Starting..." : "Start New Cohort"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Day0SettingsCard />

      <DataExportCard />
    </div>
  );
}

function DataExportCard() {
  const { toast } = useToast();

  const handleExport = async (type: 'users' | 'answers' | 'progress') => {
    try {
      const response = await fetch(`/api/admin/export/${type}`, { credentials: "include" });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Export downloaded successfully" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="w-5 h-5" />
          Data Backup & Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download CSV exports of your data for backup purposes. We recommend exporting weekly.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleExport('users')}
            data-testid="button-export-users"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('answers')}
            data-testid="button-export-answers"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Answers
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('progress')}
            data-testid="button-export-progress"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Day0SettingsCard() {
  const { toast } = useToast();
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [introContent, setIntroContent] = useState("");
  const [agreementText, setAgreementText] = useState("");
  
  const { data: day0Data, isLoading } = useQuery<{ introVideoUrl: string | null; introContent: string | null; agreementText: string | null }>({
    queryKey: ["/api/admin/day0-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/day0-settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Day 0 settings");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { introVideoUrl?: string; introContent?: string; agreementText?: string }) => {
      const res = await apiRequest("POST", "/api/admin/day0-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/day0-settings"] });
      toast({ title: "Day 0 settings updated" });
    },
    onError: () => {
      toast({ title: "Failed to update Day 0 settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      introVideoUrl: introVideoUrl || day0Data?.introVideoUrl || "",
      introContent: introContent || day0Data?.introContent || "",
      agreementText: agreementText || day0Data?.agreementText || "",
    });
  };

  const currentVideoUrl = day0Data?.introVideoUrl || "";
  const currentIntroContent = day0Data?.introContent || "";
  const currentAgreementText = day0Data?.agreementText || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Day 0 Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Introduction Video</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  YouTube video URL for the program introduction video shown on Day 0.
                </p>
                <Input 
                  type="url" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={introVideoUrl || currentVideoUrl}
                  onChange={(e) => setIntroVideoUrl(e.target.value)}
                  data-testid="input-day0-video-url"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Introduction Content</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Introductory text shown to participants on Day 0 before the agreement. Use this for program goals, overview, or orientation content.
                </p>
                <Textarea 
                  placeholder="Enter introduction content (e.g., Goal of 30 Days, what to expect...)"
                  value={introContent || currentIntroContent}
                  onChange={(e) => setIntroContent(e.target.value)}
                  rows={6}
                  className="resize-none"
                  data-testid="textarea-day0-intro-content"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Participant Agreement</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The commitment agreement text that participants must accept before starting the program.
                </p>
                <Textarea 
                  placeholder="Enter the participant agreement text..."
                  value={agreementText || currentAgreementText}
                  onChange={(e) => setAgreementText(e.target.value)}
                  rows={8}
                  className="resize-none"
                  data-testid="textarea-day0-agreement"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              data-testid="button-save-day0-settings"
            >
              {updateMutation.isPending ? "Saving..." : "Save Day 0 Settings"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type DailyContentType = {
  id: number;
  dayNumber: number;
  weekNumber: number;
  weekTitle: string;
  isReflectionDay: boolean;
  morningScriptureRef: string;
  morningScriptureText: string;
  morningMeditation: string;
  morningPrayer: string | null;
  eveningCatechismRef: string | null;
  eveningCatechism: string;
  eveningSummary: string | null;
  eveningQuestions: string[] | null;
  assignment: string | null;
};

function ContentManagementView() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState(1);
  const [editMode, setEditMode] = useState(false);
  
  const { data: allContent, isLoading } = useQuery<DailyContentType[]>({
    queryKey: [api.content.list.path],
    queryFn: async () => {
      const res = await fetch(api.content.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const currentContent = allContent?.find(c => c.dayNumber === selectedDay);

  const [formData, setFormData] = useState({
    weekTheme: "",
    morningScriptureRef: "",
    morningScriptureText: "",
    morningMeditation: "",
    morningPrayer: "",
    eveningCatechismRef: "",
    eveningCatechism: "",
    eveningSummary: "",
    eveningQuestions: "",
    assignment: "",
  });

  const updateFormFromContent = (content: DailyContentType | undefined) => {
    if (content) {
      setFormData({
        weekTheme: content.weekTitle || "",
        morningScriptureRef: content.morningScriptureRef || "",
        morningScriptureText: content.morningScriptureText || "",
        morningMeditation: content.morningMeditation || "",
        morningPrayer: content.morningPrayer || "",
        eveningCatechismRef: content.eveningCatechismRef || "",
        eveningCatechism: content.eveningCatechism || "",
        eveningSummary: content.eveningSummary || "",
        eveningQuestions: content.eveningQuestions?.join("\n") || "",
        assignment: content.assignment || "",
      });
    } else {
      setFormData({
        weekTheme: "",
        morningScriptureRef: "",
        morningScriptureText: "",
        morningMeditation: "",
        morningPrayer: "",
        eveningCatechismRef: "",
        eveningCatechism: "",
        eveningSummary: "",
        eveningQuestions: "",
        assignment: "",
      });
    }
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    setEditMode(false);
    const content = allContent?.find(c => c.dayNumber === day);
    updateFormFromContent(content);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createContent.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
      toast({ title: "Content saved successfully" });
      setEditMode(false);
    },
    onError: () => {
      toast({ title: "Failed to save content", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const weekNumber = currentContent?.weekNumber || Math.ceil(selectedDay / 6);
    const isReflectionDay = currentContent?.isReflectionDay ?? (selectedDay % 6 === 0);
    
    saveMutation.mutate({
      dayNumber: selectedDay,
      weekNumber,
      weekTitle: formData.weekTheme || weekThemes[weekNumber - 1] || "Week " + weekNumber,
      isReflectionDay,
      morningScriptureRef: formData.morningScriptureRef || "",
      morningScriptureText: formData.morningScriptureText || "",
      morningMeditation: formData.morningMeditation || "",
      morningPrayer: formData.morningPrayer || null,
      eveningCatechismRef: formData.eveningCatechismRef || null,
      eveningCatechism: formData.eveningCatechism || "",
      eveningSummary: formData.eveningSummary || null,
      eveningQuestions: formData.eveningQuestions.trim() 
        ? formData.eveningQuestions.split("\n").filter(q => q.trim())
        : null,
      assignment: formData.assignment.trim() || null,
    });
  };

  const startEdit = () => {
    updateFormFromContent(currentContent);
    setEditMode(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading content...</CardContent>
      </Card>
    );
  }

  const weeks = [1, 2, 3, 4, 5];
  const weekThemes = [
    "God's Loving Plan for Humanity",
    "Turning Away From Sin",
    "Jesus Christ The Messiah",
    "Grace, Our Defense Against Evil",
    "Scripture: The Truth of God's Word"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Daily Content Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleDayChange(Math.max(1, selectedDay - 1))}
                disabled={selectedDay <= 1}
                data-testid="button-prev-day"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[80px] text-center">Day {selectedDay}</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleDayChange(Math.min(30, selectedDay + 1))}
                disabled={selectedDay >= 30}
                data-testid="button-next-day"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile: Dropdown selector */}
          <div className="md:hidden mb-6">
            <Select value={String(selectedDay)} onValueChange={(val) => handleDayChange(Number(val))}>
              <SelectTrigger className="w-full" data-testid="select-day-mobile">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map(week => (
                  <SelectGroup key={week}>
                    <SelectLabel>Week {week}</SelectLabel>
                    {[1, 2, 3, 4, 5, 6].map(dayInWeek => {
                      const day = (week - 1) * 6 + dayInWeek;
                      const hasContent = allContent?.some(c => c.dayNumber === day);
                      const isReflection = dayInWeek === 6;
                      return (
                        <SelectItem key={day} value={String(day)} data-testid={`select-day-${day}`}>
                          Day {day} {isReflection ? "(Reflection)" : ""} {hasContent ? "" : "(No content)"}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop: Grid selector */}
          <div className="hidden md:grid grid-cols-5 gap-2 mb-6">
            {weeks.map(week => (
              <div key={week} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground text-center">Week {week}</p>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map(dayInWeek => {
                    const day = (week - 1) * 6 + dayInWeek;
                    const hasContent = allContent?.some(c => c.dayNumber === day);
                    const isReflection = dayInWeek === 6;
                    return (
                      <Button
                        key={day}
                        variant={selectedDay === day ? "default" : hasContent ? "secondary" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${isReflection ? "ring-1 ring-primary/30" : ""}`}
                        onClick={() => handleDayChange(day)}
                        data-testid={`button-day-${day}`}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl" data-testid="text-day-label">Day {selectedDay} - Week {Math.ceil(selectedDay / 6)}</h3>
              <p className="text-sm text-muted-foreground">
                <span data-testid="text-week-theme">{weekThemes[Math.ceil(selectedDay / 6) - 1]}</span>
                {currentContent?.isReflectionDay && (
                  <Badge variant="outline" className="ml-2" data-testid="badge-reflection-day">Reflection Day</Badge>
                )}
              </p>
            </div>
            {!editMode ? (
              <Button onClick={startEdit} data-testid="button-edit-content">
                Edit Content
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-content">
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {editMode ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Day Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Week Theme (optional)</label>
                <Input
                  value={formData.weekTheme}
                  onChange={(e) => setFormData(prev => ({ ...prev, weekTheme: e.target.value }))}
                  placeholder="e.g., God's Loving Plan for Humanity"
                  data-testid="input-week-theme"
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Morning Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scripture Reference</label>
                  <Input
                    value={formData.morningScriptureRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, morningScriptureRef: e.target.value }))}
                    placeholder="e.g., John 3:16-17"
                    data-testid="input-scripture-ref"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scripture Text</label>
                  <RichTextEditor
                    value={formData.morningScriptureText}
                    onChange={(value) => setFormData(prev => ({ ...prev, morningScriptureText: value }))}
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meditation</label>
                  <RichTextEditor
                    value={formData.morningMeditation}
                    onChange={(value) => setFormData(prev => ({ ...prev, morningMeditation: value }))}
                    className="min-h-[180px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Morning Prayer (optional)</label>
                  <RichTextEditor
                    value={formData.morningPrayer}
                    onChange={(value) => setFormData(prev => ({ ...prev, morningPrayer: value }))}
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evening Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catechism Reference</label>
                  <Input
                    value={formData.eveningCatechismRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, eveningCatechismRef: e.target.value }))}
                    placeholder="e.g., CCC 232-237"
                    data-testid="input-catechism-ref"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catechism / Activity Content</label>
                  <RichTextEditor
                    value={formData.eveningCatechism}
                    onChange={(value) => setFormData(prev => ({ ...prev, eveningCatechism: value }))}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use [VIDEO:youtubeId] format to embed YouTube videos
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Evening Summary (optional)</label>
                  <RichTextEditor
                    value={formData.eveningSummary}
                    onChange={(value) => setFormData(prev => ({ ...prev, eveningSummary: value }))}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignment (optional - leave blank for no assignment)</label>
                  <Textarea
                    value={formData.assignment}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignment: e.target.value }))}
                    placeholder="Enter assignment text (e.g., 'Message your mentor about...' or 'Reflect on today's readings...'). Leave blank for no assignment."
                    rows={3}
                    data-testid="input-assignment"
                  />
                  <p className="text-xs text-muted-foreground">If blank, no assignment section will be shown to participants for this day.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reflection Questions (optional - one per line, for reflection days)</label>
                  <Textarea
                    value={formData.eveningQuestions}
                    onChange={(e) => setFormData(prev => ({ ...prev, eveningQuestions: e.target.value }))}
                    placeholder="Enter reflection questions, one per line (only used on reflection days)..."
                    rows={4}
                    data-testid="input-questions"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Morning Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="content-morning">
              {currentContent?.morningScriptureRef ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scripture Reference</p>
                    <p className="font-serif" data-testid="text-scripture-ref">{currentContent.morningScriptureRef}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scripture Text</p>
                    <p className="italic text-muted-foreground whitespace-pre-wrap" data-testid="text-scripture-text">
                      "{currentContent.morningScriptureText}"
                    </p>
                  </div>
                  {currentContent.morningMeditation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Meditation</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-meditation">
                        {currentContent.morningMeditation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-morning-content">No morning content for this day</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evening Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="content-evening">
              {currentContent?.eveningCatechism || currentContent?.eveningQuestions?.length || currentContent?.assignment ? (
                <>
                  {currentContent.eveningCatechismRef && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reference</p>
                      <p className="font-serif" data-testid="text-catechism-ref">{currentContent.eveningCatechismRef}</p>
                    </div>
                  )}
                  {currentContent.eveningCatechism && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Content</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-y-auto" data-testid="text-catechism">
                        {currentContent.eveningCatechism}
                      </p>
                    </div>
                  )}
                  {currentContent.assignment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assignment</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-assignment">
                        {currentContent.assignment}
                      </p>
                    </div>
                  )}
                  {currentContent.eveningQuestions && currentContent.eveningQuestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reflection Questions</p>
                      <ul className="list-disc list-inside space-y-1 text-sm" data-testid="text-questions">
                        {currentContent.eveningQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-evening-content">No evening content for this day</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

type TrackASlide = { type: string; content: string };

type TrackAContentData = {
  id: number;
  dayNumber: number;
  weekNumber: number;
  centralTheme: string;
  subtitle: string | null;
  slides: TrackASlide[] | null;
  imageUrl: string | null;
  completionMessage: string | null;
  saintId: string | null;
};

const SLIDE_TYPES = ["text", "multi_select", "single_select", "media", "text_input", "action", "mentor_message", "timer", "knowledge_check", "quiz"] as const;

const SLIDE_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  multi_select: "Multi Select",
  single_select: "Single Select",
  media: "Media",
  text_input: "Text Input",
  action: "Action",
  mentor_message: "Mentor Message",
  timer: "Timer",
  knowledge_check: "Knowledge Check",
  quiz: "Quiz",
};

const SLIDE_TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  multi_select: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  single_select: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  media: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  text_input: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  action: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  mentor_message: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  timer: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  knowledge_check: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  quiz: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
};

function SlideTypeBadge({ type }: { type: string }) {
  const colorClass = SLIDE_TYPE_COLORS[type] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`} data-testid={`badge-slide-type-${type}`}>
      {SLIDE_TYPE_LABELS[type] || type}
    </span>
  );
}

interface QuizEditorData {
  questions: { question: string; options: string[] }[];
  results: Record<string, { title: string; description: string }>;
}

function MediaSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: { url: string; text: string };
  try {
    const parsed = JSON.parse(content || "{}");
    if (parsed && typeof parsed.url === "string") {
      data = { url: parsed.url, text: parsed.text || "" };
    } else {
      data = { url: content || "", text: "" };
    }
  } catch {
    data = { url: content || "", text: "" };
  }

  const updateData = (next: typeof data) => {
    if (!next.text) {
      onChange(next.url);
    } else {
      onChange(JSON.stringify(next));
    }
  };

  const mediaUrl = data.url;
  const isImage = mediaUrl && (mediaUrl.startsWith("/api/images/") || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(mediaUrl));

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Video URL or Image</label>
        <input
          type="text"
          value={data.url}
          onChange={(e) => updateData({ ...data, url: e.target.value })}
          placeholder="Paste YouTube URL or upload an image below"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-media-url-${index}`}
        />
      </div>
      <ModuleImageUpload
        currentUrl={isImage ? mediaUrl : null}
        onUploaded={(url) => updateData({ ...data, url })}
      />
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Caption / Text (optional)</label>
        <RichTextEditor
          value={data.text}
          onChange={(val) => updateData({ ...data, text: val })}
        />
      </div>
    </div>
  );
}

function KnowledgeCheckEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: { question: string; options: string[]; correctIndex: number; explanation: string };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      question: parsed.question || "",
      options: Array.isArray(parsed.options) ? parsed.options : ["", ""],
      correctIndex: typeof parsed.correctIndex === "number" ? parsed.correctIndex : 0,
      explanation: parsed.explanation || "",
    };
  } catch {
    data = { question: "", options: ["", ""], correctIndex: 0, explanation: "" };
  }

  const update = (next: typeof data) => {
    onChange(JSON.stringify(next));
  };

  const updateOption = (idx: number, value: string) => {
    const opts = [...data.options];
    opts[idx] = value;
    update({ ...data, options: opts });
  };

  const addOption = () => {
    if (data.options.length >= 6) return;
    update({ ...data, options: [...data.options, ""] });
  };

  const removeOption = (idx: number) => {
    if (data.options.length <= 2) return;
    const opts = data.options.filter((_, i) => i !== idx);
    let ci = data.correctIndex;
    if (idx === ci) ci = 0;
    else if (idx < ci) ci = ci - 1;
    update({ ...data, options: opts, correctIndex: ci });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Question</label>
        <input
          type="text"
          value={data.question}
          onChange={(e) => update({ ...data, question: e.target.value })}
          placeholder="Enter the question..."
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-kc-question-${index}`}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Options (select the correct one)</label>
        {data.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => update({ ...data, correctIndex: idx })}
              className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                data.correctIndex === idx
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
              title={data.correctIndex === idx ? "Correct answer" : "Mark as correct"}
              data-testid={`kc-correct-radio-${index}-${idx}`}
            >
              {data.correctIndex === idx && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-kc-option-${index}-${idx}`}
            />
            {data.options.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => removeOption(idx)}
                data-testid={`button-kc-remove-option-${index}-${idx}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {data.options.length < 6 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            data-testid={`button-kc-add-option-${index}`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Option
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Explanation (shown after answering)</label>
        <RichTextEditor
          value={data.explanation}
          onChange={(val) => update({ ...data, explanation: val })}
        />
      </div>
    </div>
  );
}

function TimerSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: { duration: number; text: string };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      duration: typeof parsed.duration === "number" ? parsed.duration : 60,
      text: typeof parsed.text === "string" ? parsed.text : "",
    };
  } catch {
    data = { duration: 60, text: content || "" };
  }

  const update = (field: "duration" | "text", value: number | string) => {
    const next = { ...data, [field]: value };
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Duration (seconds)</label>
        <input
          type="number"
          min={5}
          max={3600}
          value={data.duration}
          onChange={(e) => update("duration", Math.max(5, parseInt(e.target.value) || 60))}
          className="w-32 px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-timer-duration-${index}`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Content (displayed during timer)</label>
        <RichTextEditor
          value={data.text}
          onChange={(val) => update("text", val)}
        />
      </div>
    </div>
  );
}

function QuizSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: QuizEditorData;
  try {
    data = JSON.parse(content || "{}");
    if (!data.questions) data.questions = [{ question: "", options: ["", "", "", ""] }];
    if (!data.results) data.results = { A: { title: "", description: "" }, B: { title: "", description: "" }, C: { title: "", description: "" }, D: { title: "", description: "" } };
  } catch {
    data = {
      questions: [{ question: "", options: ["", "", "", ""] }],
      results: { A: { title: "", description: "" }, B: { title: "", description: "" }, C: { title: "", description: "" }, D: { title: "", description: "" } },
    };
  }

  const update = (d: QuizEditorData) => onChange(JSON.stringify(d, null, 2));

  const updateQuestion = (qIdx: number, field: "question", value: string) => {
    const next = { ...data, questions: data.questions.map((q, i) => i === qIdx ? { ...q, [field]: value } : q) };
    update(next);
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const next = {
      ...data,
      questions: data.questions.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => j === optIdx ? value : o) } : q
      ),
    };
    update(next);
  };

  const addQuestion = () => {
    update({ ...data, questions: [...data.questions, { question: "", options: ["", "", "", ""] }] });
  };

  const removeQuestion = (qIdx: number) => {
    if (data.questions.length <= 1) return;
    update({ ...data, questions: data.questions.filter((_, i) => i !== qIdx) });
  };

  const updateResult = (letter: string, field: "title" | "description", value: string) => {
    update({
      ...data,
      results: { ...data.results, [letter]: { ...data.results[letter], [field]: value } },
    });
  };

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="space-y-4" data-testid={`quiz-editor-${index}`}>
      <div className="space-y-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</label>
        {data.questions.map((q, qIdx) => (
          <div key={qIdx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Question {qIdx + 1}</span>
              {data.questions.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIdx)} className="h-6 px-2 text-xs text-destructive" data-testid={`button-remove-question-${qIdx}`}>
                  Remove
                </Button>
              )}
            </div>
            <Input
              value={q.question}
              onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
              placeholder="Enter question text..."
              data-testid={`input-question-${qIdx}`}
            />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{letters[optIdx]}</span>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    placeholder={`Option ${letters[optIdx]}`}
                    className="text-sm"
                    data-testid={`input-option-${qIdx}-${optIdx}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addQuestion} data-testid="button-add-question">
          <Plus className="w-3 h-3 mr-1" />
          Add Question
        </Button>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results (by dominant letter)</label>
        {letters.map((letter) => (
          <div key={letter} className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground">Result {letter}</span>
            <Input
              value={data.results[letter]?.title || ""}
              onChange={(e) => updateResult(letter, "title", e.target.value)}
              placeholder={`Result ${letter} title...`}
              data-testid={`input-result-title-${letter}`}
            />
            <Textarea
              value={data.results[letter]?.description || ""}
              onChange={(e) => updateResult(letter, "description", e.target.value)}
              placeholder={`Result ${letter} description...`}
              rows={2}
              data-testid={`input-result-desc-${letter}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type TrackAModuleData = {
  id: number;
  weekNumber: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
};

function ModuleImageUpload({ currentUrl, onUploaded }: { currentUrl: string | null; onUploaded: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onUploaded(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      console.error("Image upload error:", msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploaded]);

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
          <img src={currentUrl} alt="Module" className="w-full h-full object-cover" data-testid="img-module-preview" />
        </div>
      ) : (
        <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center" data-testid="placeholder-module-image">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} data-testid="input-module-image" />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full" data-testid="button-upload-module-image">
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? "Uploading..." : currentUrl ? "Change Image" : "Upload Image"}
      </Button>
    </div>
  );
}

function TrackAContentManagementView() {
  const { toast } = useToast();
  const [view, setView] = useState<"modules" | "days" | "slides">("modules");
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [centralTheme, setCentralTheme] = useState("");
  const [slides, setSlides] = useState<TrackASlide[]>([]);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [addSlideType, setAddSlideType] = useState<string>("text");
  const [dayImageUrl, setDayImageUrl] = useState<string | null>(null);
  const [daySubtitle, setDaySubtitle] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [selectedSaintId, setSelectedSaintId] = useState<string>("");
  const [editingModule, setEditingModule] = useState<TrackAModuleData | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubtitle, setModuleSubtitle] = useState("");
  const [moduleImageUrl, setModuleImageUrl] = useState<string | null>(null);

  const { data: modules, isLoading: modulesLoading } = useQuery<TrackAModuleData[]>({
    queryKey: ['/api/track-a-modules'],
    queryFn: async () => {
      const res = await fetch('/api/track-a-modules', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch modules");
      return res.json();
    },
  });

  const { data: allContent, isLoading: contentLoading } = useQuery<TrackAContentData[]>({
    queryKey: ['/api/track-a-content'],
    queryFn: async () => {
      const res = await fetch('/api/track-a-content', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Track A content");
      return res.json();
    },
  });

  const moduleSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", '/api/admin/track-a-modules', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-modules'] });
      toast({ title: "Module saved" });
      setEditingModule(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to save module", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", '/api/admin/track-a-content', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
      toast({ title: "Lesson saved" });
      setEditMode(false);
    },
    onError: (error: any) => {
      console.error("Track A save error:", error);
      toast({ title: "Failed to save", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const currentContent = allContent?.find(c => c.dayNumber === selectedDay);

  const loadContentIntoState = (content: TrackAContentData | undefined) => {
    if (content) {
      setCentralTheme(content.centralTheme || "");
      setSlides(content.slides ? [...content.slides] : []);
      setDayImageUrl(content.imageUrl || null);
      setDaySubtitle(content.subtitle || "");
      setCompletionMessage(content.completionMessage || "");
      setSelectedSaintId(content.saintId || "");
    } else {
      setCentralTheme("");
      setSlides([]);
      setDayImageUrl(null);
      setDaySubtitle("");
      setCompletionMessage("");
      setSelectedSaintId("");
    }
    setExpandedSlide(null);
  };

  const openModule = (weekNumber: number) => {
    setSelectedModule(weekNumber);
    setView("days");
    setEditMode(false);
  };

  const openDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setView("slides");
    setEditMode(false);
    const content = allContent?.find(c => c.dayNumber === dayNumber);
    loadContentIntoState(content);
  };

  const goBackToModules = () => {
    setView("modules");
    setSelectedModule(null);
    setEditMode(false);
  };

  const goBackToDays = () => {
    setView("days");
    setEditMode(false);
  };

  const startEditModule = (mod: TrackAModuleData) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleSubtitle(mod.subtitle);
    setModuleImageUrl(mod.imageUrl);
  };

  const saveModule = () => {
    if (!editingModule) return;
    moduleSaveMutation.mutate({
      weekNumber: editingModule.weekNumber,
      title: moduleTitle || "Untitled",
      subtitle: moduleSubtitle || "",
      imageUrl: moduleImageUrl,
    });
  };

  const handleSave = () => {
    saveMutation.mutate({
      dayNumber: selectedDay,
      weekNumber: Math.ceil(selectedDay / 6),
      centralTheme: centralTheme || "Untitled",
      subtitle: daySubtitle || null,
      slides,
      imageUrl: dayImageUrl,
      completionMessage: completionMessage || null,
      saintId: (selectedSaintId && selectedSaintId !== "__none__") ? selectedSaintId : null,
    });
  };

  const startEdit = () => {
    loadContentIntoState(currentContent);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setExpandedSlide(null);
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { type: addSlideType, content: "" }]);
    setExpandedSlide(slides.length);
  };

  const removeSlide = (index: number) => {
    setSlides(prev => prev.filter((_, i) => i !== index));
    if (expandedSlide === index) setExpandedSlide(null);
    else if (expandedSlide !== null && expandedSlide > index) setExpandedSlide(expandedSlide - 1);
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
    if (expandedSlide === index) setExpandedSlide(newIndex);
    else if (expandedSlide === newIndex) setExpandedSlide(index);
  };

  const updateSlide = (index: number, field: "type" | "content", value: string) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const getDaysForWeek = (weekNumber: number) => {
    const start = (weekNumber - 1) * 6 + 1;
    const end = Math.min(weekNumber * 6, 30);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (modulesLoading || contentLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading Track A content...</CardContent>
      </Card>
    );
  }

  // === MODULE LIST VIEW ===
  if (view === "modules") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Track A Modules
              <Badge variant="secondary" className="no-default-active-elevate">{modules?.length || 0} modules</Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow mb-4"
          onClick={() => openDay(0)}
          data-testid="card-day-0-intro"
        >
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium" data-testid="text-day0-admin-title">
                  Introduction — Goal of 30 Days
                </h4>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const d0 = allContent?.find(c => c.dayNumber === 0);
                    const count = d0?.slides?.length || 0;
                    return count > 0 ? `${count} slide${count !== 1 ? "s" : ""}` : "Empty";
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const d0 = allContent?.find(c => c.dayNumber === 0);
                  return d0?.slides && d0.slides.length > 0
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40" />;
                })()}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(modules || []).map(mod => {
            const days = getDaysForWeek(mod.weekNumber);
            const dayContents = days.map(d => allContent?.find(c => c.dayNumber === d));
            const filledCount = dayContents.filter(c => c && c.slides && c.slides.length > 0).length;

            return (
              <Card key={mod.weekNumber} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-module-${mod.weekNumber}`}>
                <div onClick={() => openModule(mod.weekNumber)}>
                  {mod.imageUrl ? (
                    <div className="h-36 bg-muted overflow-hidden">
                      <img src={mod.imageUrl} alt={mod.title} className="w-full h-full object-cover" data-testid={`img-module-${mod.weekNumber}`} />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 flex items-center justify-center">
                      <Layers className="w-10 h-10 text-emerald-400/50" />
                    </div>
                  )}
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1" data-testid={`text-module-week-${mod.weekNumber}`}>Week {mod.weekNumber}</p>
                        <h3 className="font-semibold text-base truncate" data-testid={`text-module-title-${mod.weekNumber}`}>{mod.title}</h3>
                        <p className="text-sm text-muted-foreground truncate" data-testid={`text-module-subtitle-${mod.weekNumber}`}>{mod.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{days.length} lessons · {filledCount} with content</span>
                    </div>
                  </CardContent>
                </div>
                <div className="px-4 pb-3">
                  <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); startEditModule(mod); }} data-testid={`button-edit-module-${mod.weekNumber}`}>
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit Module
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {editingModule && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Edit Module — Week {editingModule.weekNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Title</label>
                    <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="e.g., Foundations" data-testid="input-module-title" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Subtitle</label>
                    <Input value={moduleSubtitle} onChange={(e) => setModuleSubtitle(e.target.value)} placeholder="e.g., Who God Is & How We Relate to Him" data-testid="input-module-subtitle" />
                  </div>
                </div>
                <ModuleImageUpload currentUrl={moduleImageUrl} onUploaded={setModuleImageUrl} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingModule(null)} data-testid="button-cancel-module">Cancel</Button>
                <Button onClick={saveModule} disabled={moduleSaveMutation.isPending} data-testid="button-save-module">
                  <Save className="w-4 h-4 mr-2" />
                  {moduleSaveMutation.isPending ? "Saving..." : "Save Module"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // === DAY LIST VIEW ===
  if (view === "days" && selectedModule) {
    const currentModule = modules?.find(m => m.weekNumber === selectedModule);
    const days = getDaysForWeek(selectedModule);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={goBackToModules} data-testid="button-back-to-modules">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg" data-testid="text-module-heading">
                  Week {selectedModule}: {currentModule?.title || ""}
                </CardTitle>
                <p className="text-sm text-muted-foreground" data-testid="text-module-sub">{currentModule?.subtitle || ""}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-2">
          {days.map(dayNumber => {
            const dayContent = allContent?.find(c => c.dayNumber === dayNumber);
            const slideCount = dayContent?.slides?.length || 0;

            return (
              <Card
                key={dayNumber}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openDay(dayNumber)}
                data-testid={`card-day-${dayNumber}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {dayContent?.imageUrl ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={dayContent.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{dayNumber}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" data-testid={`text-day-theme-${dayNumber}`}>
                        Day {dayNumber}. {dayContent?.centralTheme || "No content yet"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {slideCount > 0 ? `${slideCount} slide${slideCount !== 1 ? "s" : ""}` : "Empty"}
                        {dayContent?.imageUrl ? " · Has image" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {slideCount > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/40" />
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // === SLIDE EDITOR VIEW ===
  const currentModule = selectedDay > 0 ? modules?.find(m => m.weekNumber === Math.ceil(selectedDay / 6)) : null;
  const isDay0 = selectedDay === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={isDay0 ? goBackToModules : goBackToDays} data-testid="button-back-to-days">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <button className="hover:underline" onClick={goBackToModules} data-testid="link-modules-breadcrumb">Modules</button>
                <ChevronRight className="w-3 h-3" />
                {isDay0 ? (
                  <span>Introduction</span>
                ) : (
                  <>
                    <button className="hover:underline" onClick={goBackToDays} data-testid="link-days-breadcrumb">Week {currentModule?.weekNumber}: {currentModule?.title}</button>
                    <ChevronRight className="w-3 h-3" />
                    <span>Day {selectedDay}</span>
                  </>
                )}
              </div>
              <CardTitle className="text-lg" data-testid="text-day-label-a">
                {isDay0 ? "Introduction — Goal of 30 Days" : `Day ${selectedDay} — ${currentContent?.centralTheme || "No content"}`}
              </CardTitle>
            </div>
            {!editMode ? (
              <Button onClick={startEdit} data-testid="button-edit-track-a">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit-a">Cancel</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-track-a">
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {editMode ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Central Theme</label>
                  <Input
                    value={centralTheme}
                    onChange={(e) => setCentralTheme(e.target.value)}
                    placeholder="e.g., What is Prayer? How to Pray"
                    data-testid="input-central-theme"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day Image</label>
                  <div className="flex items-center gap-4">
                    {dayImageUrl ? (
                      <div className="relative w-24 h-16 rounded overflow-hidden border">
                        <img src={dayImageUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDayImageUrl(null)}
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                          data-testid="button-remove-day-image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-16 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <ModuleImageUpload currentUrl={dayImageUrl} onUploaded={setDayImageUrl} />
                  </div>
                  <p className="text-xs text-muted-foreground">This image appears as the background on the participant's day card.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day Card Subtitle</label>
                  <Input
                    value={daySubtitle}
                    onChange={(e) => setDaySubtitle(e.target.value)}
                    placeholder="e.g., The call to follow"
                    data-testid="input-day-subtitle"
                  />
                  <p className="text-xs text-muted-foreground">Secondary text shown below the title on the participant's day card. Leave blank to hide.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Completion Message</label>
                  <Input
                    value={completionMessage}
                    onChange={(e) => setCompletionMessage(e.target.value)}
                    placeholder="e.g., Well done, faithful servant."
                    data-testid="input-completion-message"
                  />
                  <p className="text-xs text-muted-foreground">Custom message shown on the success screen when the lesson is finished. Leave blank for default.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saint Card</label>
                  <Select value={selectedSaintId} onValueChange={setSelectedSaintId}>
                    <SelectTrigger data-testid="select-saint-card">
                      <SelectValue placeholder="Auto-assign based on day number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Auto-assign based on day number</SelectItem>
                      {ALL_SAINTS.map((saint) => (
                        <SelectItem key={saint.id} value={saint.id} data-testid={`option-saint-${saint.id}`}>
                          {saint.saint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose which saint card is revealed when the participant completes this lesson. Leave as auto-assign for default rotation.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {slides.map((slide, index) => {
              const isExpanded = expandedSlide === index;
              return (
                <Card key={index} data-testid={`card-slide-${index}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground" data-testid={`text-slide-number-${index}`}>{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <SlideTypeBadge type={slide.type} />
                          {!isExpanded && (
                            <span className="text-sm text-muted-foreground truncate" data-testid={`text-slide-preview-${index}`}>
                              {slide.content ? (slide.content.length > 100 ? slide.content.substring(0, 100) + "..." : slide.content) : "(empty)"}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="space-y-3 mt-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Slide Type</label>
                              <Select value={slide.type} onValueChange={(val) => {
                                updateSlide(index, "type", val);
                                if (val === "quiz" && !slide.content) {
                                  updateSlide(index, "content", JSON.stringify({
                                    questions: [{ question: "", options: ["", "", "", ""] }],
                                    results: { A: { title: "", description: "" }, B: { title: "", description: "" }, C: { title: "", description: "" }, D: { title: "", description: "" } }
                                  }, null, 2));
                                }
                                if (val === "timer") {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", JSON.stringify({ duration: 60, text: "" }));
                                  }
                                }
                                if (val === "knowledge_check") {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", JSON.stringify({ question: "", options: ["", ""], correctIndex: 0, explanation: "" }));
                                  }
                                }
                              }}>
                                <SelectTrigger data-testid={`select-slide-type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SLIDE_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {slide.type === "quiz" ? (
                              <QuizSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "media" ? (
                              <MediaSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            
                            ) : slide.type === "timer" ? (
                              <TimerSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "knowledge_check" ? (
                              <KnowledgeCheckEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Content</label>
                                <RichTextEditor
                                  value={slide.content}
                                  onChange={(val) => updateSlide(index, "content", val)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => moveSlide(index, "up")} disabled={index === 0} data-testid={`button-slide-up-${index}`}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveSlide(index, "down")} disabled={index === slides.length - 1} data-testid={`button-slide-down-${index}`}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setExpandedSlide(isExpanded ? null : index)} data-testid={`button-slide-toggle-${index}`}>
                          {isExpanded ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeSlide(index)} data-testid={`button-slide-delete-${index}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={addSlideType} onValueChange={setAddSlideType}>
                  <SelectTrigger className="w-[180px]" data-testid="select-add-slide-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLIDE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSlide} data-testid="button-add-slide">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-6" data-testid="content-track-a-view">
            {currentContent && currentContent.slides && currentContent.slides.length > 0 ? (
              <div className="space-y-3">
                {currentContent.slides.map((slide, index) => (
                  <div key={index} className="flex items-start gap-3 py-3 border-b last:border-b-0" data-testid={`view-slide-${index}`}>
                    <span className="text-xs font-medium text-muted-foreground mt-1 min-w-[20px] text-right">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1">
                        <SlideTypeBadge type={slide.type} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid={`text-slide-content-view-${index}`}>
                        {slide.type === "quiz" ? (() => {
                          try {
                            const d = JSON.parse(slide.content);
                            return `${d.questions?.length || 0} question${d.questions?.length !== 1 ? "s" : ""} — ${d.questions?.map((q: any, i: number) => `Q${i+1}: ${q.question || "(empty)"}`).join(", ")}`;
                          } catch { return slide.content || "(empty)"; }
                        })() : slide.type === "knowledge_check" ? (() => {
                          try {
                            const d = JSON.parse(slide.content);
                            return `Q: ${d.question || "(empty)"} — ${d.options?.length || 0} options`;
                          } catch { return slide.content || "(empty)"; }
                        })() : slide.type === "timer" ? (() => {
                          try {
                            const d = JSON.parse(slide.content);
                            return `${d.duration || 60}s timer`;
                          } catch { return slide.content || "(empty)"; }
                        })() : (slide.content || "(empty)")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentContent ? (
              <p className="text-muted-foreground text-center py-4" data-testid="text-no-slides">
                Theme set: "{currentContent.centralTheme}" — No slides yet
              </p>
            ) : (
              <p className="text-muted-foreground text-center py-8" data-testid="text-no-track-a-content">No Track A content for this day</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type MessageData = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
};

function MessageManagementView() {
  const { data: allUsers, isLoading: usersLoading } = useUsers();
  const [user1Id, setUser1Id] = useState<string>("");
  const [user2Id, setUser2Id] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const canFetch = !!user1Id && !!user2Id && user1Id !== user2Id;

  const { data: conversationMessages, isLoading: messagesLoading, refetch } = useQuery<MessageData[]>({
    queryKey: ["/api/admin/messages", user1Id, user2Id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/messages/${user1Id}/${user2Id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: canFetch,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/messages/${user1Id}/${user2Id}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Messages deleted", description: `Removed ${data.count} messages` });
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages", user1Id, user2Id] });
    },
    onError: () => {
      toast({ title: "Failed to delete messages", variant: "destructive" });
    },
  });

  const getUserName = (id: number) => {
    return allUsers?.find(u => u.id === id)?.name || `User #${id}`;
  };

  const mentors = allUsers?.filter(u => u.role === "mentor" || u.role === "admin") || [];
  const participants = allUsers?.filter(u => u.role === "participant") || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversation Viewer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select two users to view and manage their conversation thread.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User 1 (Mentor / Admin)</label>
              <Select value={user1Id} onValueChange={setUser1Id}>
                <SelectTrigger data-testid="select-message-user1">
                  <SelectValue placeholder="Select mentor or admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Mentors & Admins</SelectLabel>
                    {mentors.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()} data-testid={`option-user1-${u.id}`}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User 2 (Participant)</label>
              <Select value={user2Id} onValueChange={setUser2Id}>
                <SelectTrigger data-testid="select-message-user2">
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Participants</SelectLabel>
                    {participants.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()} data-testid={`option-user2-${u.id}`}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {canFetch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg">
                Conversation: {getUserName(Number(user1Id))} & {getUserName(Number(user2Id))}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid="badge-message-count">
                  {conversationMessages?.length || 0} messages
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={messagesLoading}
                  data-testid="button-refresh-messages"
                >
                  Refresh
                </Button>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!conversationMessages?.length}
                      data-testid="button-delete-all-messages"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete All
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete All Messages?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This will permanently delete all {conversationMessages?.length || 0} messages between{" "}
                        <strong>{getUserName(Number(user1Id))}</strong> and{" "}
                        <strong>{getUserName(Number(user2Id))}</strong>.
                      </p>
                      <p className="text-sm font-medium text-destructive">
                        This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDeleteDialogOpen(false)}
                          className="flex-1"
                          data-testid="button-cancel-delete-messages"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                          className="flex-1"
                          data-testid="button-confirm-delete-messages"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete All Messages"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading messages...</p>
            ) : !conversationMessages?.length ? (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-messages">
                No messages between these users
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" data-testid="message-list">
                {conversationMessages.map((msg) => {
                  const isSender1 = msg.senderId === Number(user1Id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSender1 ? "justify-start" : "justify-end"}`}
                      data-testid={`message-item-${msg.id}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-md p-3 ${
                          isSender1
                            ? "bg-muted"
                            : "bg-primary/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {getUserName(msg.senderId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </span>
                          {!msg.isRead && (
                            <Badge variant="secondary" className="text-xs">Unread</Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
