import { useState } from "react";
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
import { Plus, Search, Users, BarChart3, CheckCircle2, Circle, Sun, Moon, Settings, Calendar, Key, Award, AlertTriangle, BookOpen, Save, ChevronLeft, ChevronRight, Trash2, Download, Eye, FileText, Filter, X, ChevronUp, ChevronDown, Edit2, GripVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  const [agreementText, setAgreementText] = useState("");
  
  const { data: day0Data, isLoading } = useQuery<{ introVideoUrl: string | null; agreementText: string | null }>({
    queryKey: ["/api/admin/day0-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/day0-settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Day 0 settings");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { introVideoUrl?: string; agreementText?: string }) => {
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
      agreementText: agreementText || day0Data?.agreementText || "",
    });
  };

  const currentVideoUrl = day0Data?.introVideoUrl || "";
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
  slides: TrackASlide[] | null;
};

const SLIDE_TYPES = ["text", "multi_select", "single_select", "media", "text_input", "action"] as const;

const SLIDE_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  multi_select: "Multi Select",
  single_select: "Single Select",
  media: "Media",
  text_input: "Text Input",
  action: "Action",
};

const SLIDE_TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  multi_select: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  single_select: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  media: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  text_input: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  action: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

function SlideTypeBadge({ type }: { type: string }) {
  const colorClass = SLIDE_TYPE_COLORS[type] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`} data-testid={`badge-slide-type-${type}`}>
      {SLIDE_TYPE_LABELS[type] || type}
    </span>
  );
}

function TrackAContentManagementView() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [centralTheme, setCentralTheme] = useState("");
  const [slides, setSlides] = useState<TrackASlide[]>([]);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [addSlideType, setAddSlideType] = useState<string>("text");

  const { data: allContent, isLoading } = useQuery<TrackAContentData[]>({
    queryKey: ['/api/track-a-content'],
    queryFn: async () => {
      const res = await fetch('/api/track-a-content', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Track A content");
      return res.json();
    },
  });

  const currentContent = allContent?.find(c => c.dayNumber === selectedDay);

  const loadContentIntoState = (content: TrackAContentData | undefined) => {
    if (content) {
      setCentralTheme(content.centralTheme || "");
      setSlides(content.slides ? [...content.slides] : []);
    } else {
      setCentralTheme("");
      setSlides([]);
    }
    setExpandedSlide(null);
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    setEditMode(false);
    const content = allContent?.find(c => c.dayNumber === day);
    loadContentIntoState(content);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", '/api/admin/track-a-content', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
      toast({ title: "Track A content saved successfully" });
      setEditMode(false);
    },
    onError: () => {
      toast({ title: "Failed to save Track A content", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      dayNumber: selectedDay,
      weekNumber: Math.ceil(selectedDay / 7),
      centralTheme: centralTheme || "Untitled",
      slides,
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading Track A content...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              <BookOpen className="w-5 h-5" />
              Track A Content Management
              <Badge variant="secondary" className="no-default-active-elevate">Slide-Based</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleDayChange(Math.max(1, selectedDay - 1))}
                disabled={selectedDay <= 1}
                data-testid="button-prev-day-a"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[80px] text-center" data-testid="text-current-day-a">Day {selectedDay}</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleDayChange(Math.min(30, selectedDay + 1))}
                disabled={selectedDay >= 30}
                data-testid="button-next-day-a"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:flex flex-wrap gap-1 mb-6">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const hasContent = allContent?.some(c => c.dayNumber === day);
              return (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : hasContent ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 text-xs"
                  onClick={() => handleDayChange(day)}
                  data-testid={`button-day-a-${day}`}
                >
                  {day}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div>
              <h3 className="font-serif text-xl" data-testid="text-day-label-a">
                Day {selectedDay} - {currentContent?.centralTheme || "No content"}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-week-label-a">
                Week {currentContent?.weekNumber || Math.ceil(selectedDay / 7)}
                {currentContent?.slides && currentContent.slides.length > 0 && (
                  <span className="ml-2">({currentContent.slides.length} slide{currentContent.slides.length !== 1 ? "s" : ""})</span>
                )}
              </p>
            </div>
            {!editMode ? (
              <Button onClick={startEdit} data-testid="button-edit-track-a">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Content
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit-a">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-track-a">
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {editMode ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Central Theme</label>
                <Input
                  value={centralTheme}
                  onChange={(e) => setCentralTheme(e.target.value)}
                  placeholder="e.g., What is Prayer? How to Pray"
                  data-testid="input-central-theme"
                />
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
                              <Select value={slide.type} onValueChange={(val) => updateSlide(index, "type", val)}>
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
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Content</label>
                              <Textarea
                                value={slide.content}
                                onChange={(e) => updateSlide(index, "content", e.target.value)}
                                placeholder="Enter slide content..."
                                rows={4}
                                data-testid={`textarea-slide-content-${index}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSlide(index, "up")}
                          disabled={index === 0}
                          data-testid={`button-slide-up-${index}`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSlide(index, "down")}
                          disabled={index === slides.length - 1}
                          data-testid={`button-slide-down-${index}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedSlide(isExpanded ? null : index)}
                          data-testid={`button-slide-toggle-${index}`}
                        >
                          {isExpanded ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlide(index)}
                          data-testid={`button-slide-delete-${index}`}
                        >
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
                        {slide.content || "(empty)"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentContent ? (
              <p className="text-muted-foreground text-center py-4" data-testid="text-no-slides">
                Theme set: "{currentContent.centralTheme}" - No slides yet
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

