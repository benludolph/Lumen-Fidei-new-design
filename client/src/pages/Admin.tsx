import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
import { Plus, Minus, Search, Users, BarChart3, CheckCircle2, Circle, Sun, Moon, Settings, Calendar, Key, Award, AlertTriangle, BookOpen, Save, ChevronLeft, ChevronRight, Trash2, Download, Eye, FileText, Filter, X, ChevronUp, ChevronDown, Edit2, GripVertical, Upload, Image as ImageIcon, ArrowLeft, Layers, MessageSquare, Volume2, Lock, Video, Play, Copy, ClipboardPaste, ArrowLeftRight, Hash, Heart } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, type HealingModule, type HealingContent } from "@shared/schema";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type ContentBackup, type SafeUser } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
      <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 pb-16 min-h-screen">
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">Administration</h1>
            <p className="text-muted-foreground">Manage users and monitor progress</p>
          </div>
          <CreateUserDialog />
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-y-1">
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="w-4 h-4" /> People
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2" data-testid="tab-progress">
              <BarChart3 className="w-4 h-4" /> Progress
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2" data-testid="tab-content">
              <BookOpen className="w-4 h-4" /> Content
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2" data-testid="tab-messages">
              <MessageSquare className="w-4 h-4" /> Messages
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-2" data-testid="tab-surveys">
              <BarChart3 className="w-4 h-4" /> Surveys
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="testimonies" className="gap-2" data-testid="tab-testimonies">
              <Video className="w-4 h-4" /> Testimonies
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
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
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

          <TabsContent value="content">
            <ContentTabView />
          </TabsContent>

          <TabsContent value="messages">
            <MessageManagementView />
          </TabsContent>

          <TabsContent value="surveys">
            <SurveyResultsView />
          </TabsContent>

          <TabsContent value="settings">
            <CohortSettingsView />
          </TabsContent>

          <TabsContent value="testimonies">
            <TestimoniesAdminView />
          </TabsContent>

        </Tabs>
      </div>
    </Shell>
  );
}

function ContentTabView() {
  const [track, setTrack] = useState<"a" | "b" | "c">("a");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 rounded-lg w-fit bg-muted border">
        <button
          onClick={() => setTrack("a")}
          data-testid="button-track-a-tab"
          className={`px-5 py-1.5 rounded text-sm font-medium transition-colors ${track === "a" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Track A
        </button>
        <button
          onClick={() => setTrack("b")}
          data-testid="button-track-b-tab"
          className={`px-5 py-1.5 rounded text-sm font-medium transition-colors ${track === "b" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Track B
        </button>
        <button
          onClick={() => setTrack("c")}
          data-testid="button-track-c-tab"
          className={`px-5 py-1.5 rounded text-sm font-medium transition-colors ${track === "c" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Healing
        </button>
      </div>

      {track === "a" ? <TrackAContentManagementView /> : track === "b" ? <ContentManagementView /> : <HealingAdminView />}
    </div>
  );
}

function UserRow({ user, allUsers }: { user: any, allUsers: any[] }) {
  const { mutate: updateUser } = useUpdateUser();
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleMentorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/admin/mentor/${user.id}/upload-photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      toast({ title: "Photo updated", description: `Profile photo updated for ${user.name}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };
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
           <Select defaultValue={user.track ?? ""} onValueChange={handleAssignTrack}>
             <SelectTrigger className="w-[110px] h-8">
               <SelectValue placeholder="-" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="A">A</SelectItem>
               <SelectItem value="B">B</SelectItem>
               <SelectItem value="C">C – Healing</SelectItem>
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

          {(user.role === 'mentor' || user.role === 'admin') && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="Upload profile photo"
                data-testid={`button-upload-mentor-photo-${user.id}`}
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <Upload className="w-4 h-4 animate-pulse" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleMentorPhotoUpload}
                data-testid={`input-mentor-photo-${user.id}`}
              />
            </>
          )}
          
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
                  <SelectItem value="superuser">Superuser</SelectItem>
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

      <DataExportCard />

      <BackupRestoreCard />

      <MigrateTimerCard />
    </div>
  );
}

function BackupRestoreCard() {
  const { toast } = useToast();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; content: ContentBackup } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/admin/backup', { credentials: 'include' });
      if (!response.ok) throw new Error('Backup failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `lumen-fidei-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Backup downloaded', description: 'Lesson content exported successfully.' });
    } catch {
      toast({ title: 'Backup failed', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed: unknown = JSON.parse(ev.target?.result as string);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('version' in parsed) ||
          !('data' in parsed) ||
          (parsed as { version: unknown }).version !== 1
        ) {
          toast({ title: 'Invalid backup file', description: 'This file does not appear to be a valid Lumen Fidei backup.', variant: 'destructive' });
          return;
        }
        setPendingFile({ name: file.name, content: parsed as ContentBackup });
        setShowRestoreDialog(true);
      } catch {
        toast({ title: 'Invalid file', description: 'Could not read the selected file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const restoreMutation = useMutation({
    mutationFn: async (backup: ContentBackup) => {
      const res = await apiRequest('POST', '/api/admin/restore', backup);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Restore failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: 'Restore complete', description: 'All lesson content has been restored from the backup.' });
      setShowRestoreDialog(false);
      setPendingFile(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Restore failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleConfirmRestore = () => {
    if (pendingFile) {
      restoreMutation.mutate(pendingFile.content);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="w-5 h-5" />
            Lesson Content Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all lesson content (modules, slides, resources, overlays, and settings) to a single JSON file. Use it to restore your content if something goes wrong, or to migrate content to another instance.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Uploaded images are not included in the backup and must be re-uploaded separately if needed.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              data-testid="button-backup-download"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Preparing...' : 'Download Backup'}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-backup-restore"
            >
              <Upload className="w-4 h-4 mr-2" />
              Restore from Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-backup-file"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Restore replaces all lesson content. User accounts and participation data are not affected.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Restore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                This will replace all current lesson content with the content from:
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 font-mono break-all">
                {pendingFile?.name}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This action will overwrite all prelim modules, track content, daily content, practice resources, and module overlays. Uploaded images are not affected. This cannot be undone. User accounts and progress data will not be affected.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowRestoreDialog(false); setPendingFile(null); }}
                className="flex-1"
                disabled={restoreMutation.isPending}
                data-testid="button-cancel-restore"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRestore}
                disabled={restoreMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-restore"
              >
                {restoreMutation.isPending ? 'Restoring...' : 'Yes, Restore Content'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MigrateTimerCard() {
  const { toast } = useToast();
  const [result, setResult] = useState<{ totalConverted: number; log: string[] } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleMigrate = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setIsRunning(true);
    try {
      const res = await fetch('/api/admin/migrate-timer-to-scripture-practice', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Migration failed');
      setResult(data);
      toast({
        title: `Migration complete`,
        description: `Converted ${data.totalConverted} timer slide(s) to Scripture Practice.`,
      });
    } catch (err: unknown) {
      toast({ title: 'Migration failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsRunning(false);
      setConfirmed(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Convert Timer Slides → Scripture Practice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Automatically converts all existing <strong>Timer</strong> slides in every day and module into the new <strong>Scripture Practice</strong> slide type. Your scripture text, audio files, and timer durations are preserved as Tab 1. The scripture text is automatically split into tappable chunks for Tab 2. Tab 3 uses standard reflection defaults.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          <span className="font-medium">⚠ This modifies your database.</span>
          <span>Take a backup first. This cannot be undone automatically.</span>
        </div>
        {result && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200 space-y-1">
            <p className="font-medium">Converted {result.totalConverted} slide(s)</p>
            {result.log.map((line, i) => <p key={i} className="text-xs opacity-80">{line}</p>)}
          </div>
        )}
        <Button
          variant={confirmed ? 'destructive' : 'outline'}
          onClick={handleMigrate}
          disabled={isRunning}
          data-testid="button-migrate-timer-to-scripture-practice"
        >
          {isRunning ? 'Running migration...' : confirmed ? 'Confirm — run migration now' : 'Run Timer → Scripture Practice Migration'}
        </Button>
        {confirmed && !isRunning && (
          <p className="text-xs text-muted-foreground">Click again to confirm. Make sure you have a backup.</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ModuleOverlayRow {
  contextKey: string;
  enabled: boolean;
  imageUrl: string;
  text: string;
  subtext: string;
  label: string;
}

function ModuleOverlayEditor({
  overlay,
  onSaved,
  onRemove,
}: {
  overlay: ModuleOverlayRow;
  onSaved: () => void;
  onRemove?: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [enabled, setEnabled] = useState(overlay.enabled);
  const [label, setLabel] = useState(overlay.label || "");
  const [imageUrl, setImageUrl] = useState(overlay.imageUrl || "");
  const [text, setText] = useState(overlay.text || "Reflection Unlocked");
  const [subtext, setSubtext] = useState(overlay.subtext || "");

  useEffect(() => {
    setEnabled(overlay.enabled);
    setLabel(overlay.label || "");
    setImageUrl(overlay.imageUrl || "");
    setText(overlay.text || "Reflection Unlocked");
    setSubtext(overlay.subtext || "");
  }, [overlay.contextKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/module-overlays/${encodeURIComponent(overlay.contextKey)}`, {
        enabled, imageUrl, text, subtext, label,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/module-overlays"] });
      toast({ title: "Overlay saved" });
      onSaved();
    },
    onError: () => {
      toast({ title: "Failed to save overlay", variant: "destructive" });
    },
  });

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
      setImageUrl(url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [toast]);

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show overlay on completion</p>
          <p className="text-xs text-muted-foreground">Context key: <code className="bg-muted px-1 rounded">{overlay.contextKey}</code></p>
        </div>
        <button
          onClick={() => setEnabled(v => !v)}
          data-testid={`toggle-overlay-enabled-${overlay.contextKey}`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none ${enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Label */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Display label (admin only)</label>
        <Input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Day 1 – Healing Reflection"
          className="text-sm"
          data-testid={`input-overlay-label-${overlay.contextKey}`}
        />
      </div>

      {/* Image */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Circular image (106px)</label>
        <div className="flex items-center gap-3">
          {imageUrl && (
            <img src={imageUrl} alt="" className="w-12 h-12 object-cover rounded-full border" />
          )}
          <div className="flex-1 flex gap-2">
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://... or /api/images/..."
              className="flex-1 text-sm"
              data-testid={`input-overlay-image-${overlay.contextKey}`}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              data-testid={`button-overlay-upload-${overlay.contextKey}`}>
              {uploading ? "Uploading..." : <><Upload className="w-3 h-3 mr-1" />Upload</>}
            </Button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Headline */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Headline</label>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="He Was There"
          data-testid={`input-overlay-text-${overlay.contextKey}`}
        />
        <p className="text-xs text-muted-foreground">Large display text shown below "REFLECTION UNLOCKED".</p>
      </div>

      {/* Subtext */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Subtext</label>
        <Textarea
          value={subtext}
          onChange={e => setSubtext(e.target.value)}
          placeholder="Invite Jesus into the moment — and see it as He does."
          rows={2}
          data-testid={`textarea-overlay-subtext-${overlay.contextKey}`}
        />
        <p className="text-xs text-muted-foreground">Shown below the cross divider.</p>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          data-testid={`button-overlay-save-${overlay.contextKey}`}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ModuleOverlaySettingsCard() {
  const { toast } = useToast();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newContextKey, setNewContextKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const { data: overlays = [], isLoading, refetch } = useQuery<ModuleOverlayRow[]>({
    queryKey: ["/api/admin/module-overlays"],
  });

  const handleAddNew = async () => {
    const key = newContextKey.trim();
    if (!key) return;
    try {
      await apiRequest("POST", `/api/admin/module-overlays/${encodeURIComponent(key)}`, {
        enabled: false, imageUrl: "", text: "Reflection Unlocked", subtext: "", label: newLabel.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/module-overlays"] });
      setExpandedKey(key);
      setAddingNew(false);
      setNewContextKey("");
      setNewLabel("");
      toast({ title: "Module overlay created" });
    } catch {
      toast({ title: "Failed to create overlay", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Reflection Overlays (per module)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure a completion overlay for any chat-flow module. Each overlay can be toggled on/off independently. The overlay is off by default and will only appear for that specific module's chat flow.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : overlays.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No overlays configured yet. Add one below.</p>
        ) : (
          <div className="space-y-2">
            {overlays.map(overlay => (
              <div key={overlay.contextKey} className="border rounded-lg overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => setExpandedKey(expandedKey === overlay.contextKey ? null : overlay.contextKey)}
                  data-testid={`button-overlay-expand-${overlay.contextKey}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${overlay.enabled ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                    <div>
                      <p className="text-sm font-medium">{overlay.label || overlay.contextKey}</p>
                      {overlay.label && (
                        <p className="text-xs text-muted-foreground">{overlay.contextKey}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={overlay.enabled ? "default" : "outline"} className="text-xs">
                      {overlay.enabled ? "On" : "Off"}
                    </Badge>
                    {expandedKey === overlay.contextKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded editor */}
                {expandedKey === overlay.contextKey && (
                  <div className="px-4 pb-4">
                    <ModuleOverlayEditor
                      overlay={overlay}
                      onSaved={() => refetch()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        {addingNew ? (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
            <p className="text-sm font-medium">New module overlay</p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Context key — must match the chat flow's context key exactly</label>
              <Input
                value={newContextKey}
                onChange={e => setNewContextKey(e.target.value)}
                placeholder="e.g. chat-flow-1 or prelim-module-2"
                className="text-sm"
                data-testid="input-new-overlay-context-key"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Display label (optional, for your reference)</label>
              <Input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Day 1 Morning Reflection"
                className="text-sm"
                data-testid="input-new-overlay-label"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNew} disabled={!newContextKey.trim()} data-testid="button-add-overlay-confirm">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingNew(false); setNewContextKey(""); setNewLabel(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAddingNew(true)} data-testid="button-add-overlay">
            <Plus className="w-4 h-4 mr-2" />
            Add Module Overlay
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CompletionUnlockSection({ contextKey }: { contextKey: string }) {
  const { data: overlay, refetch } = useQuery<ModuleOverlayRow>({
    queryKey: ["/api/admin/module-overlays", contextKey],
    queryFn: async () => {
      const res = await fetch(`/api/admin/module-overlays/${encodeURIComponent(contextKey)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm">Completion Unlock</CardTitle>
          {overlay && (
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-normal ${overlay.enabled ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
              {overlay.enabled ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Configure the unlock overlay shown when this lesson is completed.</p>
      </CardHeader>
      <CardContent className="pt-0">
        {overlay ? (
          <ModuleOverlayEditor overlay={overlay} onSaved={() => refetch()} />
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>
        )}
      </CardContent>
    </Card>
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
};

const SLIDE_TYPES = ["text", "scripture_practice", "media", "action", "timer", "multi_select", "single_select", "text_input", "mentor_message", "knowledge_check", "knowledge_quiz", "quiz", "survey", "scenario", "chat_flow", "path_selector", "cross_grid", "story_choice", "image_carousel", "before_after", "scene", "captivity_builder", "confession_finder", "pdf_download", "guided_prayer_process"] as const;

const PRELIM_SLIDE_TYPES = SLIDE_TYPES;

const TRACK_A_EXCLUDED = new Set(["action", "knowledge_check", "scenario"]);
const TRACK_A_SLIDE_TYPES = SLIDE_TYPES.filter(t => !TRACK_A_EXCLUDED.has(t));

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
  knowledge_quiz: "Knowledge Quiz",
  quiz: "Quiz",
  survey: "Survey",
  scenario: "Scenario Stepper",
  chat_flow: "Chat Flow",
  path_selector: "Path Selector",
  cross_grid: "Cross Grid Puzzle",
  story_choice: "Story Choice",
  image_carousel: "Image Carousel",
  before_after: "Before / After Slider",
  scripture_practice: "Scripture Practice",
  scene: "Interactive Scene",
  captivity_builder: "Breaking Lies",
  confession_finder: "Confession Finder",
  pdf_download: "PDF Download",
  guided_prayer_process: "Guided Prayer",
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
  knowledge_quiz: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  quiz: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  survey: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
  scenario: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  chat_flow: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  path_selector: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  cross_grid: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  story_choice: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  image_carousel: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  before_after: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  scripture_practice: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  scene: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  captivity_builder: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200",
  confession_finder: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  pdf_download: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  guided_prayer_process: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

// ============================================================
// Guided Prayer Process — Forgiving Yourself default template
// ============================================================

const GUIDED_PRAYER_DEFAULT = JSON.stringify({
  title: "Forgiving Yourself",
  steps: [
    { id: "step_1", kind: "instruction", heading: "An Invitation", body: "Before we begin, take a slow breath. This is not about condemnation. It is about freedom.\n\nWe are going to walk through the wounds you have caused — not to rehearse them in shame, but to hand them over." },
    { id: "step_2", kind: "input", heading: "Name the Harm", prompt: "Think of the specific thing you did — or failed to do — that you have not been able to forgive yourself for. Write it here, simply and plainly.", placeholder: "e.g. I lied to someone I loved...", variable_name: "the_harm" },
    { id: "step_3", kind: "list_input", heading: "Who Was Affected?", prompt: "Who were the people hurt by what you did? Add them one at a time.", variable_name: "those_affected", add_button_label: "Add a person", placeholder: "e.g. My daughter", optional: false },
    { id: "step_4", kind: "list_input", heading: "The Wounds You Caused", prompt: "What were the effects — the real damages — that your action caused in their lives? Add each one.", variable_name: "the_wounds", add_button_label: "Add an effect", placeholder: "e.g. She lost her trust in me", optional: true },
    { id: "step_5", kind: "instruction", heading: "Before We Go Further", body: "What you did is real. The damage is real. And Jesus saw all of it — and still came to earth and died so it could be forgiven.\n\nHe is not surprised. He is not disgusted. He is waiting." },
    { id: "step_6", kind: "input", heading: "The Root", prompt: "Why did you do it? Not an excuse — just a plain account. What was driving you?", placeholder: "e.g. I was afraid. I was selfish. I didn't think it would matter.", variable_name: "the_root" },
    { id: "step_7", kind: "list_input", heading: "Inner Vows Made", prompt: "After what happened, did you make any inner vows — things you swore to yourself? For example: I will never let myself feel again. Or: I don't deserve good things.", variable_name: "inner_vows", add_button_label: "Add a vow", placeholder: "e.g. I told myself I would never forgive myself.", optional: true },
    { id: "step_8", kind: "instruction", heading: "Almost There", body: "You have named the harm, the wounded, the damage, and the root. That is a courageous act.\n\nNow we will pray — slowly — using your own words." },
    { id: "step_9", kind: "prayer", heading: "The Confession Prayer", instruction_above: "Read this prayer aloud, slowly, as your own.", prayer_text: "Lord Jesus, I confess to you that I {{the_harm}}.\n\nI hurt {{those_affected}}. The wounds I caused include {{the_wounds}}.\n\nI did this because {{the_root}}.\n\nI am truly sorry. I ask you to forgive me, and I receive your forgiveness now." },
    { id: "step_10", kind: "prayer", heading: "Breaking the Inner Vows", instruction_above: "If you named any inner vows, pray this now.", prayer_text: "Lord, I renounce the vow I made: {{inner_vows}}.\n\nI break its power over my life in the name of Jesus. I declare that I am free to receive mercy.", show_only_if: "inner_vows.length > 0" },
    { id: "step_11", kind: "choice", heading: "One More Step", prompt: "Have you made restitution — or taken any concrete step to repair what you broke?", variable_name: "restitution_status", options: [ { label: "Yes, I have done what I could.", next_step: "step_13" }, { label: "No — I haven't yet.", next_step: "step_12" }, { label: "It's not possible in my situation.", next_step: "step_13" } ] },
    { id: "step_12", kind: "reflection", heading: "Making It Right", prompt: "What is one concrete step you could take — however small — to begin repairing the harm?", variable_name: "restitution_plan", placeholder: "e.g. I will call her and apologize. I will return what I took." },
    { id: "step_13", kind: "prayer", heading: "Receiving the Grace", instruction_above: "Pray this final prayer slowly — and mean it.", prayer_text: "Jesus, I have placed this before you: {{the_harm}}.\n\nI have confessed it. I have grieved it. And I now choose to receive your forgiveness — not because I deserve it, but because you paid for it.\n\nI forgive myself, in your name. I will not carry this anymore." }
  ]
}, null, 2);

// ============================================================
// Guided Prayer — Closing Occult Doorways template (multi_select)
// ============================================================

const GUIDED_PRAYER_OCCULT_DEFAULT = JSON.stringify({
  title: "Closing Occult Doorways",
  steps: [
    {
      id: "intro",
      kind: "instruction",
      heading: "Closing Occult Doorways",
      body: "In this prayer, you will identify occult practices you have been involved in — even out of curiosity — and renounce them before God.\n\nYou do not need to have gone deep. Any door opened is a door that can be closed."
    },
    {
      id: "divination",
      kind: "multi_select",
      heading: "Fortune-telling and divination",
      prompt: "Check any that apply to you — things you have participated in, even briefly or out of curiosity.",
      variable_name: "divination_practices",
      optional: true,
      options: [
        "Horoscopes or astrology",
        "Tarot cards or oracle cards",
        "Psychic readings",
        "Ouija boards",
        "Crystal balls or scrying",
        "Palmistry or hand-reading",
        "Numerology",
        "Dream catchers (used spiritually)",
        "Pendulum divination",
        "Visiting a fortune-teller"
      ]
    },
    {
      id: "occult_arts",
      kind: "multi_select",
      heading: "Occult arts and practices",
      prompt: "Check any that apply.",
      variable_name: "occult_practices",
      optional: true,
      options: [
        "Wicca or witchcraft",
        "Spells or spell-casting",
        "Seances or spirit contact",
        "New Age healing practices",
        "Energy healing or Reiki",
        "Chakra work",
        "Crystals used for spiritual power",
        "Visualization or guided imagery (occult)",
        "Consulting mediums or channelers",
        "Satanism or occult initiations"
      ]
    },
    {
      id: "bridge",
      kind: "instruction",
      heading: "Before We Pray",
      body: "Jesus came to set captives free. Every door you have named can be closed — permanently — in His name.\n\nPray the next prayer slowly and aloud."
    },
    {
      id: "renunciation",
      kind: "prayer",
      heading: "Prayer of Renunciation",
      instruction_above: "Read this prayer aloud with faith and sincerity.",
      prayer_text: "Lord Jesus, I come before You and renounce every involvement in the occult.\nI renounce {{divination_practices}}.\nI renounce {{occult_practices}}.\nI close every door I have opened to the enemy through these practices, knowingly or unknowingly.\nI break every agreement and cancel every claim the enemy has made against me through them.\nI receive Your forgiveness and cleansing now. Amen."
    }
  ]
}, null, 2);

// ============================================================
// Chat Flow — Origin of the Weight default template
// ============================================================

const ORIGIN_OF_THE_WEIGHT_TEMPLATE = JSON.stringify({
  steps: [
    {
      id: "step_1",
      messages: ["Let's begin with something simple.", "Can you name what you are currently carrying — the weight, the wound, or the struggle that brought you here?"],
      inputType: "single_select",
      variableName: "wound_type",
      required: true,
      options: [
        { label: "A wound from the past", value: "past_wound" },
        { label: "A persistent sin or addiction", value: "sin_addiction" },
        { label: "Fear, anxiety, or dread", value: "anxiety" },
        { label: "Shame or unworthiness", value: "shame" },
        { label: "Anger or resentment", value: "anger" },
        { label: "Grief or loss", value: "grief" },
        { label: "Confusion about my identity", value: "identity" },
        { label: "Something else", value: "other" },
      ],
    },
    {
      id: "step_2",
      messages: ["I hear you.", "How long have you been carrying this?"],
      inputType: "single_select",
      variableName: "duration",
      required: true,
      options: [
        { label: "Less than a year", value: "recent" },
        { label: "A few years", value: "few_years" },
        { label: "Most of my life", value: "most_of_life" },
        { label: "I'm not sure", value: "unsure" },
      ],
    },
    {
      id: "step_3",
      messages: ["That's a long time to carry something alone.", "Do you have a sense of where this weight first entered your life?"],
      inputType: "single_select",
      variableName: "origin_moment",
      required: false,
      options: [
        { label: "Childhood or family of origin", value: "childhood" },
        { label: "A specific traumatic event", value: "trauma" },
        { label: "A relationship", value: "relationship" },
        { label: "My own choices over time", value: "own_choices" },
        { label: "I don't know", value: "unknown" },
      ],
    },
    {
      id: "step_4",
      messages: ["Thank you for sharing that.", "When this weight is heaviest, what lie do you find yourself believing about yourself?"],
      inputType: "text_input",
      variableName: "core_lie",
      required: false,
    },
    {
      id: "step_5",
      messages: ["That lie has likely shaped many of your decisions.", "Has anyone in your life spoken that lie to you — or modeled it?"],
      inputType: "single_select",
      variableName: "lie_source",
      required: false,
      options: [
        { label: "A parent or caregiver", value: "parent" },
        { label: "A sibling or peer", value: "peer" },
        { label: "A religious figure", value: "religious" },
        { label: "A partner or spouse", value: "partner" },
        { label: "No one — I constructed it myself", value: "self" },
        { label: "I'm not sure", value: "unsure" },
      ],
    },
    {
      id: "step_6",
      messages: ["You didn't choose to believe that lie. It was placed in you.", "How does carrying this weight affect your relationship with God?"],
      inputType: "single_select",
      variableName: "god_relationship",
      required: false,
      options: [
        { label: "I feel distant or abandoned", value: "distant" },
        { label: "I feel unworthy to approach Him", value: "unworthy" },
        { label: "I'm angry at Him", value: "angry" },
        { label: "I struggle to trust Him", value: "distrust" },
        { label: "It hasn't affected my faith much", value: "unaffected" },
      ],
    },
    {
      id: "step_7",
      messages: ["That makes complete sense.", "What would it mean for you if this weight were truly lifted?"],
      inputType: "text_input",
      variableName: "freedom_vision",
      required: false,
    },
    {
      id: "step_8",
      messages: ["Hold that vision. That is what God desires for you.", "What is one small step you feel called to take this week — even if it feels difficult?"],
      inputType: "text_input",
      variableName: "next_step",
      required: false,
    },
    {
      id: "step_9",
      messages: ["You are not alone in this.", "Before we close, is there anything else you want to bring before the Lord today?"],
      inputType: "text_input",
      variableName: "closing_intention",
      required: false,
    },
    {
      id: "step_10",
      messages: ["Thank you for your honesty and courage.", "The Lord sees everything you have just shared. He is not surprised, and He is not discouraged. He is with you."],
      inputType: "message_only",
    },
  ],
  optionSets: {},
  summaryTemplate: "I am carrying {{wound_type}} that has been with me for {{duration}}. It began in {{origin_moment}}. The lie I believe is: \"{{core_lie}}\". One step I commit to this week: {{next_step}}.",
}, null, 2);

// ============================================================
// Chat Flow Slide Editor
// ============================================================

interface ChatFlowOptionEditor {
  label: string;
  value: string;
}

interface ChatFlowBranchEditor {
  variableName: string;
  operator: "equals" | "not_equals" | "contains";
  value: string;
  targetStepId: string;
}

interface ChatFlowOptionSetMapEntry {
  sourceValue: string;
  setName: string;
}

interface ChatFlowOptionSetEntry {
  name: string;
  options: ChatFlowOptionEditor[];
}

interface ChatFlowStepEditor {
  id: string;
  messages: string[];
  inputType: "single_select" | "multi_select" | "text_input" | "message_only" | "";
  options: ChatFlowOptionEditor[];
  optionSetVar: string;
  optionSetMap: ChatFlowOptionSetMapEntry[];
  variableName: string;
  required: boolean;
  branches: ChatFlowBranchEditor[];
}

interface ChatFlowEditorData {
  steps: ChatFlowStepEditor[];
  optionSets: ChatFlowOptionSetEntry[];
  summaryTemplate: string;
  showJson: boolean;
}

function parseChatFlowEditorData(content: string): Omit<ChatFlowEditorData, "showJson"> {
  try {
    const p = JSON.parse(content || "{}");
    const steps: ChatFlowStepEditor[] = (Array.isArray(p.steps) ? p.steps : []).map((s: any) => {
      let optionSetMap: ChatFlowOptionSetMapEntry[] = [];
      if (s.optionSetMap && typeof s.optionSetMap === "object") {
        optionSetMap = Object.entries(s.optionSetMap).map(([sourceValue, setName]) => ({
          sourceValue,
          setName: String(setName),
        }));
      }
      return {
        id: s.id || `step_${Date.now()}_${Math.random()}`,
        messages: Array.isArray(s.messages) ? s.messages : [s.messages || ""],
        inputType: s.inputType || "",
        options: Array.isArray(s.options) ? s.options : [],
        optionSetVar: s.optionSetVar || "",
        optionSetMap,
        variableName: s.variableName || "",
        required: s.required !== false,
        branches: Array.isArray(s.branches) ? s.branches : [],
      };
    });
    const rawOptionSets = p.optionSets && typeof p.optionSets === "object" ? p.optionSets : {};
    const optionSets: ChatFlowOptionSetEntry[] = Object.entries(rawOptionSets).map(([name, opts]: [string, any]) => ({
      name,
      options: Array.isArray(opts) ? opts : [],
    }));
    return {
      steps,
      optionSets,
      summaryTemplate: p.summaryTemplate || "",
    };
  } catch {
    return { steps: [], optionSets: [], summaryTemplate: "" };
  }
}

function serializeChatFlowEditorData(data: Omit<ChatFlowEditorData, "showJson">): string {
  const steps = data.steps.map(s => {
    const step: any = {
      id: s.id,
      messages: s.messages.filter(m => m.trim()),
      inputType: s.inputType || undefined,
    };
    if (s.inputType === "single_select" || s.inputType === "multi_select") {
      step.options = s.options.filter(o => o.label || o.value);
    }
    if (s.optionSetVar && s.optionSetMap.length > 0) {
      step.optionSetVar = s.optionSetVar;
      step.optionSetMap = Object.fromEntries(
        s.optionSetMap.filter(e => e.sourceValue && e.setName).map(e => [e.sourceValue, e.setName])
      );
    }
    if (s.variableName) step.variableName = s.variableName;
    if (s.inputType && s.inputType !== "message_only") step.required = s.required;
    if (s.branches.length > 0) step.branches = s.branches.filter(b => b.targetStepId);
    return step;
  });
  const optionSets: Record<string, ChatFlowOptionEditor[]> = {};
  for (const set of data.optionSets) {
    if (set.name.trim()) {
      optionSets[set.name.trim()] = set.options.filter(o => o.label || o.value);
    }
  }
  return JSON.stringify({ steps, optionSets, summaryTemplate: data.summaryTemplate }, null, 2);
}

function newChatFlowStep(): ChatFlowStepEditor {
  return {
    id: `step_${Date.now()}`,
    messages: [""],
    inputType: "message_only",
    options: [],
    optionSetVar: "",
    optionSetMap: [],
    variableName: "",
    required: false,
    branches: [],
  };
}

const INPUT_TYPE_LABELS: Record<string, string> = {
  "": "No input (message only)",
  message_only: "Message only (Continue button)",
  single_select: "Single Select",
  multi_select: "Multi Select",
  text_input: "Text Input",
};

// ── Simplified JSON → internal editor format converter ──────────────────────
function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || label;
}

function importSimplifiedStep(s: any, i: number): ChatFlowStepEditor {
  const id = s.id || `step_${i + 1}`;
  const messages: string[] = Array.isArray(s.messages) ? s.messages.map(String) : [String(s.message || "")];
  const inp = "input" in s ? s.input : null; // simplified uses `input`

  let inputType: ChatFlowStepEditor["inputType"] = undefined;
  let options: ChatFlowOptionEditor[] = [];
  let variableName = "";
  let required = false;

  if (inp) {
    const rawType: string = (inp.type || "").toLowerCase();
    if (rawType === "text" || rawType === "text_input") {
      inputType = "text_input";
    } else if (rawType === "single_select" || rawType === "single_select_with_other") {
      inputType = "single_select";
      options = (Array.isArray(inp.options) ? inp.options : []).map((o: any) => {
        if (typeof o === "string") return { label: o, value: labelToSlug(o) };
        return { label: String(o.label ?? o.value ?? ""), value: String(o.value ?? labelToSlug(o.label ?? "")) };
      });
      if (rawType === "single_select_with_other" && !options.find(o => o.value === "other")) {
        options.push({ label: "Other", value: "other" });
      }
    } else if (rawType === "multi_select") {
      inputType = "multi_select";
      options = (Array.isArray(inp.options) ? inp.options : []).map((o: any) => {
        if (typeof o === "string") return { label: o, value: labelToSlug(o) };
        return { label: String(o.label ?? o.value ?? ""), value: String(o.value ?? labelToSlug(o.label ?? "")) };
      });
    } else if (rawType === "message_only") {
      inputType = "message_only";
    }
    variableName = inp.variable || inp.variableName || "";
    required = !!inp.required;
  }

  const branches: ChatFlowBranchEditor[] = Array.isArray(s.branches)
    ? s.branches.map((b: any) => ({
        variableName: b.variableName || b.variable || "",
        operator: (b.operator || "equals") as ChatFlowBranchEditor["operator"],
        value: b.value || "",
        targetStepId: b.targetStepId || b.target || "",
      }))
    : [];

  return { id, messages, inputType, variableName, required, options, optionSetVar: "", optionSetMap: [], branches };
}

function importJsonToEditorData(raw: string): Omit<ChatFlowEditorData, "showJson"> {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Expected a JSON object at the top level.");
  if (!Array.isArray(parsed.steps)) throw new Error("Missing 'steps' array.");

  // Detect format: simplified uses `input` key; native uses `inputType`
  const isSimplified = parsed.steps.length === 0 || parsed.steps.some((s: any) => "input" in s);
  if (isSimplified) {
    return {
      steps: parsed.steps.map(importSimplifiedStep),
      optionSets: [],
      summaryTemplate: parsed.summaryTemplate || "",
    };
  }
  // Native internal format — existing parser handles it
  return parseChatFlowEditorData(raw);
}

// ────────────────────────────────────────────────────────────────────────────

function ChatFlowSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const { toast } = useToast();

  // ── Parse current videoUrl from chat flow JSON ──
  const chatFlowVideoUrl = useMemo(() => {
    try { return (JSON.parse(content || "{}") as { videoUrl?: string }).videoUrl || null; }
    catch { return null; }
  }, [content]);

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch("/api/admin/upload-video", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const p = JSON.parse(content);
      p.videoUrl = data.url;
      onChange(JSON.stringify(p, null, 2));
      toast({ title: "Video uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingVideo(false);
      e.target.value = "";
    }
  }, [content, onChange, toast]);

  const handleRemoveVideo = useCallback(() => {
    try {
      const p = JSON.parse(content);
      delete p.videoUrl;
      onChange(JSON.stringify(p, null, 2));
    } catch {
      toast({ title: "Could not remove video", variant: "destructive" });
    }
  }, [content, onChange, toast]);

  // ── Parse narrator messages for audio panel ──
  const narratorMessages = useMemo(() => {
    try {
      const p = JSON.parse(content || "{}");
      if (!Array.isArray(p.steps)) return [];
      const result: Array<{ stepId: string; msgIdx: number; text: string; audio: string | null; isQuestion: boolean }> = [];
      for (const step of p.steps) {
        if (step.type !== "narrator" && step.type !== "open_text") continue;
        const rawMsgs: Array<string | { text: string; audio?: string }> = [
          ...(step.content ? [step.content] : []),
          ...(Array.isArray(step.messages) ? step.messages : []),
        ];
        rawMsgs.forEach((m, i) => {
          const text = typeof m === "string" ? m : (m.text || "");
          const audio = typeof m === "string" ? null : (m.audio || null);
          if (text.trim()) result.push({ stepId: step.id || "", msgIdx: i, text, audio, isQuestion: false });
        });
        // Also include the question field for open_text steps
        if (step.type === "open_text" && step.question && step.question.trim()) {
          result.push({ stepId: step.id || "", msgIdx: -1, text: step.question, audio: step.questionAudio || null, isQuestion: true });
        }
      }
      return result;
    } catch { return []; }
  }, [content]);

  // ── Upload audio for a narrator message or question prompt ──
  const handleNarratorAudioUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>, stepId: string, msgIdx: number, isQuestion: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `${stepId}-${isQuestion ? "q" : msgIdx}`;
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/admin/upload-audio", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const audioUrl = data.url as string;
      const p = JSON.parse(content);
      const step = p.steps.find((s: any) => s.id === stepId);
      if (!step) throw new Error("Step not found");
      if (isQuestion) {
        // Patch questionAudio on the step directly
        step.questionAudio = audioUrl;
      } else {
        // Patch the messages array entry
        const rawMsgs: Array<string | { text: string; audio?: string }> = [
          ...(step.content ? [step.content as string] : []),
          ...(Array.isArray(step.messages) ? step.messages : []),
        ];
        if (step.content) { delete step.content; }
        step.messages = rawMsgs.map((m, i) => {
          if (i !== msgIdx) return m;
          const txt = typeof m === "string" ? m : (m.text || "");
          return { text: txt, audio: audioUrl };
        });
      }
      onChange(JSON.stringify(p, null, 2));
      toast({ title: "Audio uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingKey(null);
      e.target.value = "";
    }
  }, [content, onChange, toast]);

  // ── Remove audio from a narrator message or question prompt ──
  const handleRemoveNarratorAudio = useCallback((stepId: string, msgIdx: number, isQuestion: boolean) => {
    try {
      const p = JSON.parse(content);
      const step = p.steps.find((s: any) => s.id === stepId);
      if (!step) return;
      if (isQuestion) {
        delete step.questionAudio;
      } else {
        const rawMsgs: Array<string | { text: string; audio?: string }> = [
          ...(step.content ? [step.content as string] : []),
          ...(Array.isArray(step.messages) ? step.messages : []),
        ];
        if (step.content) { delete step.content; }
        step.messages = rawMsgs.map((m, i) => {
          if (i !== msgIdx) return m;
          const txt = typeof m === "string" ? m : (m.text || "");
          return txt;
        });
      }
      onChange(JSON.stringify(p, null, 2));
    } catch {
      toast({ title: "Could not remove audio", variant: "destructive" });
    }
  }, [content, onChange, toast]);

  // ── Validation / status ──
  const flowStatus = useMemo(() => {
    try {
      const p = JSON.parse(content || "{}");
      if (!Array.isArray(p.steps)) return { ok: false, error: "Missing 'steps' array", stepCount: 0, isRich: false };
      const isRich = p.steps.some((s: any) => "type" in s || "content" in s || "question" in s);
      return { ok: true, error: null, stepCount: p.steps.length, isRich };
    } catch (e: any) {
      return { ok: false, error: e.message || "Invalid JSON", stepCount: 0, isRich: false };
    }
  }, [content]);

  // ── Import handler — accepts both rich and legacy formats ──
  const handleImport = () => {
    setImportError(null);
    try {
      if (!importText.trim()) throw new Error("Paste your JSON first.");
      const p = JSON.parse(importText.trim());
      if (!p || typeof p !== "object") throw new Error("Expected a JSON object at the top level.");
      if (!Array.isArray(p.steps)) throw new Error("Missing 'steps' array.");
      // Pretty-print and set as the content directly — engine handles both formats
      onChange(JSON.stringify(p, null, 2));
      setShowImportModal(false);
      setImportText("");
      toast({ title: `Imported ${p.steps.length} step${p.steps.length === 1 ? "" : "s"} successfully.` });
    } catch (err: any) {
      setImportError(err.message || "Failed to parse JSON.");
    }
  };

  // ── Export — copy to clipboard ──
  const handleExport = () => {
    try {
      const pretty = JSON.stringify(JSON.parse(content || "{}"), null, 2);
      navigator.clipboard.writeText(pretty).then(() => {
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2000);
      });
    } catch {
      toast({ title: "Export failed", description: "Could not copy JSON.", variant: "destructive" });
    }
  };

  // ── Format button — pretty-print in place ──
  const handleFormat = () => {
    try {
      onChange(JSON.stringify(JSON.parse(content), null, 2));
    } catch {
      toast({ title: "Cannot format: invalid JSON", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3" data-testid={`chatflow-editor-${index}`}>
      {/* ── Import JSON modal ── */}
      <Dialog open={showImportModal} onOpenChange={open => { setShowImportModal(open); if (!open) setImportError(null); }}>
        <DialogContent className="max-w-2xl" data-testid={`chatflow-import-modal-${index}`}>
          <DialogHeader>
            <DialogTitle>Import JSON Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Paste a JSON object with a <code className="bg-muted px-1 rounded">steps</code> array.
              Accepts both the rich schema (<code className="bg-muted px-1 rounded">type</code> field) and the legacy format.
              Importing will <span className="text-destructive font-medium">replace</span> all current steps.
            </p>
            <div className="text-xs text-muted-foreground bg-muted rounded p-2 font-mono leading-relaxed whitespace-pre">{`{
  "steps": [
    { "id": "s1", "type": "narrator", "content": "Welcome." },
    {
      "id": "s2", "type": "single_select",
      "question": "How do you feel?",
      "options": [{ "id": "A", "text": "Anxious" }, { "id": "B", "text": "At peace" }],
      "variable": "feeling",
      "branch_reflections": { "A": "That takes courage.", "B": "What a gift." },
      "branches": { "A": [{ "id": "s3a", "type": "narrator", "content": "Let's explore that." }] }
    },
    { "id": "s4", "type": "open_text", "question": "What else?", "variable": "more" },
    { "id": "s5", "type": "final", "content": "Thank you for sharing." }
  ],
  "summaryTemplate": "I feel {feeling}. {more}"
}`}</div>
            <Textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(null); }}
              rows={12}
              placeholder='{ "steps": [ ... ] }'
              className="font-mono text-xs"
              data-testid={`textarea-chatflow-import-${index}`}
            />
            {importError && (
              <p className="text-xs text-destructive flex items-center gap-1" data-testid={`text-chatflow-import-error-${index}`}>
                <AlertTriangle className="w-3 h-3 shrink-0" /> {importError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setShowImportModal(false); setImportError(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleImport} data-testid={`button-chatflow-import-confirm-${index}`}>Import & Replace</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Status + toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status pill */}
        {flowStatus.ok ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            {flowStatus.stepCount} step{flowStatus.stepCount === 1 ? "" : "s"} · {flowStatus.isRich ? "Rich schema" : "Legacy schema"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-destructive">
            <AlertTriangle className="w-3 h-3" />
            {flowStatus.error}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleFormat} data-testid={`button-chatflow-format-${index}`}>Format</Button>
          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleExport} data-testid={`button-chatflow-export-${index}`}>
            {exportCopied ? "Copied!" : "Export JSON"}
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setShowImportModal(true)} data-testid={`button-chatflow-import-${index}`}>Import JSON</Button>
        </div>
      </div>

      {/* ── JSON editor ── */}
      <Textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        rows={28}
        className="font-mono text-xs"
        placeholder={'{\n  "steps": [\n    { "id": "s1", "type": "narrator", "content": "Hello!" }\n  ]\n}'}
        data-testid={`textarea-chatflow-json-${index}`}
      />

      {/* ── Video asset ── */}
      <div className="border rounded-md p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">Video asset (looping, top of chat)</span>
        </div>
        {chatFlowVideoUrl ? (
          <div className="flex items-center gap-2">
            <Play className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">
              {chatFlowVideoUrl.split("/").pop()}
            </span>
            <button
              onClick={handleRemoveVideo}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title="Remove video"
              data-testid={`button-chatflow-video-remove-${index}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label
            className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded border cursor-pointer transition-colors w-fit ${isUploadingVideo ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}
            data-testid={`button-chatflow-video-upload-${index}`}
          >
            {isUploadingVideo ? "Uploading…" : <><Upload className="w-3 h-3" /> Upload MP4 / WebM</>}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleVideoUpload}
              disabled={isUploadingVideo}
            />
          </label>
        )}
      </div>

      {/* ── Audio clips panel (collapsible) ── */}
      <div>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          onClick={() => setShowAudioPanel(a => !a)}
          data-testid={`button-chatflow-audio-toggle-${index}`}
        >
          {showAudioPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Narrator audio clips
          {narratorMessages.some(m => m.audio) && (
            <span className="ml-1 px-1.5 py-0 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px]">
              {narratorMessages.filter(m => m.audio).length} uploaded
            </span>
          )}
        </button>
        {showAudioPanel && (
          <div className="mt-2 border rounded-md divide-y">
            {narratorMessages.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No narrator messages found. Add steps with <code className="bg-muted px-1 rounded">type: "narrator"</code> and messages.</p>
            ) : (
              narratorMessages.map(({ stepId, msgIdx, text, audio, isQuestion }) => {
                const key = `${stepId}-${isQuestion ? "q" : msgIdx}`;
                const isUploading = uploadingKey === key;
                const filename = audio ? audio.split("/").pop()?.split("_").slice(0, -1).join("_") || audio.split("/").pop() : null;
                return (
                  <div key={key} className="flex items-center gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      {isQuestion && (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">question prompt · </span>
                      )}
                      <span className="text-xs text-muted-foreground truncate">"{text}"</span>
                    </div>
                    {audio ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Volume2 className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
                        <span className="text-[11px] text-muted-foreground max-w-[120px] truncate">{filename}</span>
                        <button
                          onClick={() => handleRemoveNarratorAudio(stepId, msgIdx, isQuestion)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove audio"
                          data-testid={`button-chatflow-audio-remove-${key}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`shrink-0 flex items-center gap-1 text-[11px] px-2 py-1 rounded border cursor-pointer transition-colors ${isUploading ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}
                        data-testid={`button-chatflow-audio-upload-${key}`}
                      >
                        {isUploading ? "Uploading…" : <><Upload className="w-3 h-3" /> Upload</>}
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => handleNarratorAudioUpload(e, stepId, msgIdx, isQuestion)}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── JSON reference (collapsible) ── */}
      <div>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          onClick={() => setShowReference(r => !r)}
          data-testid={`button-chatflow-reference-toggle-${index}`}
        >
          {showReference ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Schema reference
        </button>
        {showReference && (
          <div className="mt-2 p-3 bg-muted/40 rounded text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre overflow-x-auto">{`Step types:
  narrator       → content or messages[], no input
  single_select  → question, options [{id, text}], variable, allow_other
  open_text      → question, variable, required
  final          → content or messages[], no input, ends flow

Rich features:
  branch_reflections: { "optionId": "text shown after answer" }
  branches:           { "optionId": [ ...sub-steps ] }
  dynamic_reflection: { "template": "You said {variable}" }
  allow_other:        true  (shows free-text field alongside options)

Template tokens:
  {variable}   or  {{variable}}  (both work in summaryTemplate & dynamic_reflection)

Legacy schema (inputType) also accepted for backward compatibility.`}</div>
        )}
      </div>
    </div>
  );
}

function ScenarioStepImageUpload({ stepIndex, editorIndex, currentUrl, onUploaded }: { stepIndex: number; editorIndex: number; currentUrl: string; onUploaded: (url: string) => void }) {
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
      console.error("Scenario step image upload error:", err instanceof Error ? err.message : err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploaded]);

  return (
    <div className="flex items-center gap-2">
      {currentUrl && (
        <img
          src={currentUrl}
          alt="Step"
          className="w-10 h-10 rounded-lg object-cover shrink-0 border"
          data-testid={`img-scenario-step-preview-${editorIndex}-${stepIndex}`}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleUpload}
        data-testid={`input-scenario-step-file-${editorIndex}-${stepIndex}`}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-2 flex-1"
        data-testid={`button-scenario-step-upload-${editorIndex}-${stepIndex}`}
      >
        <Upload className="w-3 h-3" />
        {uploading ? "Uploading..." : currentUrl ? "Change Image" : "Upload Image"}
      </Button>
    </div>
  );
}

function ScenarioSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let parsed: { headline?: string; steps?: { imageUrl?: string; text?: string }[] } = {};
  try { parsed = JSON.parse(content); } catch {}
  const headline = parsed.headline ?? "";
  const steps: { imageUrl: string; text: string }[] = (parsed.steps ?? []).map((s: { imageUrl?: string; text?: string }) => ({ imageUrl: s.imageUrl ?? "", text: s.text ?? "" }));

  const update = (newHeadline: string, newSteps: { imageUrl: string; text: string }[]) => {
    onChange(JSON.stringify({ headline: newHeadline, steps: newSteps }));
  };

  const setHeadline = (val: string) => update(val, steps);
  const setStep = (i: number, field: "imageUrl" | "text", val: string) => {
    const updated = steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    update(headline, updated);
  };
  const addStep = () => update(headline, [...steps, { imageUrl: "", text: "" }]);
  const removeStep = (i: number) => update(headline, steps.filter((_, idx) => idx !== i));
  const moveStep = (i: number, dir: "up" | "down") => {
    const arr = [...steps];
    const swap = dir === "up" ? i - 1 : i + 1;
    [arr[i], arr[swap]] = [arr[swap], arr[i]];
    update(headline, arr);
  };

  return (
    <div className="space-y-3" data-testid={`scenario-editor-${index}`}>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Headline</label>
        <Input
          value={headline}
          onChange={e => setHeadline(e.target.value)}
          placeholder="Imagine the following scenario"
          data-testid={`input-scenario-headline-${index}`}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Steps (revealed one at a time)</label>
        {steps.map((step, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30" data-testid={`scenario-step-editor-${index}-${i}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(i, "up")} disabled={i === 0} data-testid={`button-scenario-step-up-${index}-${i}`}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(i, "down")} disabled={i === steps.length - 1} data-testid={`button-scenario-step-down-${index}-${i}`}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeStep(i)} data-testid={`button-scenario-step-delete-${index}-${i}`}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <ScenarioStepImageUpload
              stepIndex={i}
              editorIndex={index}
              currentUrl={step.imageUrl}
              onUploaded={(url) => setStep(i, "imageUrl", url)}
            />
            <Textarea
              value={step.text}
              onChange={e => setStep(i, "text", e.target.value)}
              placeholder="Step text..."
              rows={2}
              data-testid={`textarea-scenario-step-text-${index}-${i}`}
            />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addStep} className="gap-2 w-full" data-testid={`button-scenario-add-step-${index}`}>
          <Plus className="w-3 h-3" /> Add Step
        </Button>
      </div>
    </div>
  );
}

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
  let data: { url: string; text: string; mediaType: "video" | "music"; title: string };
  try {
    const parsed = JSON.parse(content || "{}");
    if (parsed && typeof parsed.url === "string") {
      data = {
        url: parsed.url,
        text: parsed.text || "",
        mediaType: parsed.mediaType === "music" ? "music" : "video",
        title: parsed.title || "",
      };
    } else {
      data = { url: content || "", text: "", mediaType: "video", title: "" };
    }
  } catch {
    data = { url: content || "", text: "", mediaType: "video", title: "" };
  }

  const updateData = (next: typeof data) => {
    const isMusic = next.mediaType === "music";
    const hasExtras = next.text || isMusic || next.title;
    if (!hasExtras) {
      onChange(next.url);
    } else {
      const obj: Record<string, string> = { url: next.url };
      if (next.text) obj.text = next.text;
      if (isMusic) obj.mediaType = "music";
      if (next.title) obj.title = next.title;
      onChange(JSON.stringify(obj));
    }
  };

  const mediaUrl = data.url;
  const isImage = mediaUrl && (mediaUrl.startsWith("/api/images/") || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(mediaUrl));

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Media Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateData({ ...data, mediaType: "video" })}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              data.mediaType !== "music"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-input hover:bg-accent"
            }`}
            data-testid={`button-media-type-video-${index}`}
          >
            🎬 Video / Image
          </button>
          <button
            type="button"
            onClick={() => updateData({ ...data, mediaType: "music" })}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              data.mediaType === "music"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-input hover:bg-accent"
            }`}
            data-testid={`button-media-type-music-${index}`}
          >
            🎵 Music
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {data.mediaType === "music" ? "YouTube URL or MP3 path" : "Video URL or Image"}
        </label>
        <input
          type="text"
          value={data.url}
          onChange={(e) => updateData({ ...data, url: e.target.value })}
          placeholder={data.mediaType === "music" ? "Paste YouTube URL or MP3 file path" : "Paste YouTube/Vimeo URL or upload an image below"}
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-media-url-${index}`}
        />
      </div>

      {data.mediaType === "music" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Song Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateData({ ...data, title: e.target.value })}
            placeholder="e.g. Come As You Are — Crowder"
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            data-testid={`input-media-title-${index}`}
          />
        </div>
      )}

      {data.mediaType !== "music" && (
        <ModuleImageUpload
          currentUrl={isImage ? mediaUrl : null}
          onUploaded={(url) => updateData({ ...data, url })}
        />
      )}

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

function BeforeAfterImageUpload({ label, currentUrl, onUploaded, testPrefix }: { label: string; currentUrl: string; onUploaded: (url: string) => void; testPrefix: string }) {
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
      console.error("Before/after upload error:", err instanceof Error ? err.message : err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploaded]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {currentUrl && (
        <img src={currentUrl} alt={label} className="w-full h-24 object-cover rounded-md border" data-testid={`${testPrefix}-preview`} />
      )}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} data-testid={`${testPrefix}-input`} />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2 w-full" data-testid={`${testPrefix}-button`}>
        <Upload className="w-3 h-3" />
        {uploading ? "Uploading..." : currentUrl ? "Change" : "Upload"}
      </Button>
    </div>
  );
}

function BeforeAfterSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let parsed: { beforeImage: string; afterImage: string; headline: string; body: string } = { beforeImage: "", afterImage: "", headline: "", body: "" };
  try {
    const p = JSON.parse(content || "{}");
    parsed = {
      beforeImage: p.beforeImage ?? "",
      afterImage: p.afterImage ?? "",
      headline: p.headline ?? "",
      body: p.body ?? "",
    };
  } catch {}

  const update = (next: typeof parsed) => onChange(JSON.stringify(next));

  return (
    <div className="space-y-4" data-testid={`before-after-editor-${index}`}>
      <div className="grid grid-cols-2 gap-3">
        <BeforeAfterImageUpload
          label="Before Image"
          currentUrl={parsed.beforeImage}
          onUploaded={(url) => update({ ...parsed, beforeImage: url })}
          testPrefix={`before-img-${index}`}
        />
        <BeforeAfterImageUpload
          label="After Image"
          currentUrl={parsed.afterImage}
          onUploaded={(url) => update({ ...parsed, afterImage: url })}
          testPrefix={`after-img-${index}`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Headline (optional)</label>
        <input
          type="text"
          value={parsed.headline}
          onChange={(e) => update({ ...parsed, headline: e.target.value })}
          placeholder="e.g. The same need, two very different paths."
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-before-after-headline-${index}`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Body text (optional — use • for bullets)</label>
        <textarea
          value={parsed.body}
          onChange={(e) => update({ ...parsed, body: e.target.value })}
          placeholder={"e.g. Real needs are not the problem.\n• The direction we take them is."}
          rows={4}
          className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-y"
          data-testid={`textarea-before-after-body-${index}`}
        />
      </div>
    </div>
  );
}

const PATH_SELECTOR_DEFAULT = JSON.stringify({
  headline: "Pick a pathway to explore",
  options: [
    {
      id: "answers",
      label: "Seeking Answers",
      description: "You were looking for answers. What you found felt real. But something shifted.",
      imageUrl: "",
      nextContent: { type: "media", content: "https://vimeo.com/1177577159?share=copy&fl=sv&fe=ci" },
    },
    {
      id: "control",
      label: "Seeking Control",
      description: "The world is loud. You seek calm in breath and focus to gain power over your day. Yet, the unrest remains.",
      imageUrl: "",
      nextContent: { type: "media", content: "https://vimeo.com/1177815632?fl=ip&fe=ec" },
    },
    {
      id: "loved",
      label: "Seeking to be Loved",
      description: "You long to be seen, known, and cherished. But love has felt distant or out of reach.",
      imageUrl: "",
      nextContent: { type: "media", content: "https://vimeo.com/1177840022?share=copy&fl=sv&fe=ci" },
    },
  ],
}, null, 2);

const STORY_CHOICE_DEFAULT = JSON.stringify({
  prompt: "Someone looks at you. 'You good?'",
  leftLabel: "Say you're fine",
  rightLabel: "Say you're tired",
  image: "",
}, null, 2);

const BEFORE_AFTER_DEFAULT = JSON.stringify({
  beforeImage: "",
  afterImage: "",
  headline: "",
  body: "",
}, null, 2);

function CarouselImageUpload({ index, editorIndex, currentUrl, onUploaded, onRemove }: { index: number; editorIndex: number; currentUrl: string; onUploaded: (url: string) => void; onRemove: () => void }) {
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
      console.error("Carousel image upload error:", err instanceof Error ? err.message : err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploaded]);

  return (
    <div className="flex items-center gap-2" data-testid={`carousel-img-row-${editorIndex}-${index}`}>
      {currentUrl ? (
        <img src={currentUrl} alt="" className="w-12 h-12 rounded object-cover border shrink-0" data-testid={`carousel-img-preview-${editorIndex}-${index}`} />
      ) : (
        <div className="w-12 h-12 rounded border bg-muted shrink-0 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} data-testid={`carousel-img-input-${editorIndex}-${index}`} />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1 flex-1" data-testid={`carousel-img-upload-${editorIndex}-${index}`}>
        <Upload className="w-3 h-3" />
        {uploading ? "Uploading..." : currentUrl ? "Change" : "Upload"}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={onRemove} data-testid={`carousel-img-remove-${editorIndex}-${index}`}>
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

function ImageCarouselSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let parsed: { headline: string; body: string; images: string[] } = { headline: "", body: "", images: [] };
  try {
    const p = JSON.parse(content || "{}");
    parsed = {
      headline: p.headline ?? "",
      body: p.body ?? "",
      images: Array.isArray(p.images) ? p.images : [],
    };
  } catch {}

  const update = (next: typeof parsed) => onChange(JSON.stringify(next));

  const setImage = (i: number, url: string) => {
    const imgs = [...parsed.images];
    imgs[i] = url;
    update({ ...parsed, images: imgs });
  };
  const removeImage = (i: number) => update({ ...parsed, images: parsed.images.filter((_, idx) => idx !== i) });
  const addImage = () => update({ ...parsed, images: [...parsed.images, ""] });

  return (
    <div className="space-y-4" data-testid={`carousel-editor-${index}`}>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Images</label>
        {parsed.images.map((url, i) => (
          <CarouselImageUpload
            key={i}
            index={i}
            editorIndex={index}
            currentUrl={url}
            onUploaded={(u) => setImage(i, u)}
            onRemove={() => removeImage(i)}
          />
        ))}
        <Button variant="outline" size="sm" onClick={addImage} className="gap-2 w-full" data-testid={`carousel-add-image-${index}`}>
          <Plus className="w-3 h-3" /> Add Image
        </Button>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Headline (optional)</label>
        <input
          type="text"
          value={parsed.headline}
          onChange={(e) => update({ ...parsed, headline: e.target.value })}
          placeholder="e.g. Many sins begin as attempts to meet real needs…"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-carousel-headline-${index}`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Body text (optional — use • for bullets)</label>
        <textarea
          value={parsed.body}
          onChange={(e) => update({ ...parsed, body: e.target.value })}
          placeholder={"e.g. A person may want love but look for it in destructive places.\n• Bullet point"}
          rows={4}
          className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-y"
          data-testid={`textarea-carousel-body-${index}`}
        />
      </div>
    </div>
  );
}

const IMAGE_CAROUSEL_DEFAULT = JSON.stringify({
  headline: "Many sins begin as attempts to meet real needs in unhealthy ways.",
  body: "Many sins begin as attempts to meet real needs in unhealthy ways.\n• A person may want love but look for it in destructive places.\n• A person may want peace but turn toward habits that numb pain.\n• A person may want control and begin manipulating others.\nSin often grows from wounded desires.",
  images: [
    "/img/01.png",
    "/img/02.png",
    "/img/03.png",
    "/img/04.png",
    "/img/05.png",
  ],
}, null, 2);

const CROSS_GRID_DEFAULT = JSON.stringify({
  headline: "The Five Keys to Healing",
  imageUrl: "",
  pieces: [
    { id: "center", label: "Truth", definition: "The foundation. Jesus said, 'I am the Way, the Truth, and the Life.' Truth is not an idea — it's a Person who loves you completely." },
    { id: "top", label: "Repentance", definition: "Turning away from what harms you and toward God. Not shame — freedom. God's kindness leads you here." },
    { id: "left", label: "Trust", definition: "Letting go of control. When you trust God fully, you stop managing your own healing and let Him lead." },
    { id: "right", label: "Healing", definition: "God restores what was broken — emotionally, spiritually, relationally. It is His will for you. Ask Him." },
    { id: "bottom", label: "Freedom", definition: "Where Truth, Repentance, Trust, and Healing lead. The life you were made for. It is available to you now." },
  ],
}, null, 2);

const CROSS_GRID_DUAL_DEFAULT = JSON.stringify({
  phase: "dual",
  leftCards: [
    { title: "Quick Fix", subtext: "Make the pain stop now." },
    { title: "Quick Prayer", subtext: "Say the words. Move on." },
    { title: "Quick Deliverance", subtext: "Remove it instantly." },
  ],
  rightGrid: [
    { id: "truth",      title: "Truth",      subtext: "Face what is real.",            position: "center" },
    { id: "repentance", title: "Repentance", subtext: "Turn away from what is false.", position: "top"    },
    { id: "trust",      title: "Trust",      subtext: "Let go of control.",            position: "left"   },
    { id: "surrender",  title: "Surrender",  subtext: "Give it to God.",               position: "right"  },
    { id: "healing",    title: "Healing",    subtext: "God restores what was broken.", position: "bottom" },
  ],
  leftRevealImage: { tiles: 3, type: "distorted" },
  overlayText: ["But it does not heal you.", "It keeps you in control."],
  finalText: ["This is how healing happens.", "Not instantly. But truly."],
}, null, 2);

function CrossGridSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(content || "{}"); } catch { /* ignore */ }
  const isDual = parsed?.phase === "dual";

  const switchMode = (dual: boolean) => {
    onChange(dual ? CROSS_GRID_DUAL_DEFAULT : CROSS_GRID_DEFAULT);
  };

  if (!isDual) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Mode:</span>
          <button
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-medium"
            disabled
          >
            Standard
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-input text-muted-foreground hover:bg-accent"
            onClick={() => switchMode(true)}
            data-testid={`btn-cross-grid-dual-mode-${index}`}
          >
            Dual Phase
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Content (JSON)</label>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full font-mono text-xs rounded-md border border-input bg-background px-3 py-2 min-h-[160px] resize-y"
            spellCheck={false}
            data-testid={`textarea-cross-grid-json-${index}`}
          />
        </div>
      </div>
    );
  }

  let dualData: {
    leftCards: { title: string; subtext: string }[];
    rightGrid: { id: string; title: string; subtext: string; position: string }[];
    overlayText: string[];
    finalText: string[];
  };
  try {
    const p = JSON.parse(content || "{}");
    dualData = {
      leftCards: Array.isArray(p.leftCards) ? p.leftCards : [],
      rightGrid: Array.isArray(p.rightGrid) ? p.rightGrid : [],
      overlayText: Array.isArray(p.overlayText) ? p.overlayText : ["", ""],
      finalText: Array.isArray(p.finalText) ? p.finalText : ["", ""],
    };
  } catch {
    dualData = { leftCards: [], rightGrid: [], overlayText: ["", ""], finalText: ["", ""] };
  }

  const update = (next: typeof dualData) => {
    const base = (() => { try { return JSON.parse(content); } catch { return {}; } })();
    onChange(JSON.stringify({ ...base, ...next }, null, 2));
  };

  const updateLeftCard = (i: number, field: "title" | "subtext", val: string) => {
    const cards = [...dualData.leftCards];
    cards[i] = { ...cards[i], [field]: val };
    update({ ...dualData, leftCards: cards });
  };

  const updateRightTile = (i: number, field: "title" | "subtext", val: string) => {
    const tiles = [...dualData.rightGrid];
    tiles[i] = { ...tiles[i], [field]: val };
    update({ ...dualData, rightGrid: tiles });
  };

  const POSITION_LABELS: Record<string, string> = {
    center: "Center", top: "Top", left: "Left", right: "Right", bottom: "Bottom",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Mode:</span>
        <button
          className="text-xs px-2 py-1 rounded border border-input text-muted-foreground hover:bg-accent"
          onClick={() => switchMode(false)}
          data-testid={`btn-cross-grid-standard-mode-${index}`}
        >
          Standard
        </button>
        <button
          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-medium"
          disabled
        >
          Dual Phase
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Left Cards (Phase 1)</p>
        {dualData.leftCards.map((card, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded border border-input bg-muted/30">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Card {i + 1} Title</label>
              <input
                className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                value={card.title}
                onChange={(e) => updateLeftCard(i, "title", e.target.value)}
                data-testid={`input-left-card-title-${index}-${i}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Subtext</label>
              <input
                className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                value={card.subtext}
                onChange={(e) => updateLeftCard(i, "subtext", e.target.value)}
                data-testid={`input-left-card-subtext-${index}-${i}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overlay Text (after Phase 1)</p>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-1">
              <label className="text-xs text-muted-foreground">Line {i + 1}</label>
              <input
                className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                value={dualData.overlayText[i] || ""}
                onChange={(e) => {
                  const t = [...dualData.overlayText];
                  t[i] = e.target.value;
                  update({ ...dualData, overlayText: t });
                }}
                data-testid={`input-overlay-text-${index}-${i}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Right Grid Tiles (Phase 2)</p>
        {dualData.rightGrid.map((tile, i) => (
          <div key={tile.id || i} className="grid grid-cols-2 gap-2 p-2 rounded border border-input bg-muted/30">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{POSITION_LABELS[tile.position] || tile.position} — Title</label>
              <input
                className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                value={tile.title}
                onChange={(e) => updateRightTile(i, "title", e.target.value)}
                data-testid={`input-right-tile-title-${index}-${i}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Subtext</label>
              <input
                className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                value={tile.subtext}
                onChange={(e) => updateRightTile(i, "subtext", e.target.value)}
                data-testid={`input-right-tile-subtext-${index}-${i}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Final Text (after Phase 2)</p>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-1">
              <label className="text-xs text-muted-foreground">Line {i + 1}</label>
              <input
                className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                value={dualData.finalText[i] || ""}
                onChange={(e) => {
                  const t = [...dualData.finalText];
                  t[i] = e.target.value;
                  update({ ...dualData, finalText: t });
                }}
                data-testid={`input-final-text-${index}-${i}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_PATH_OPTIONS = [
  { id: "answers", label: "Seeking Answers", description: "You were looking for answers. What you found felt real. But something shifted.", imageUrl: "", nextContent: { type: "media", content: "https://vimeo.com/1177577159?share=copy&fl=sv&fe=ci" } },
  { id: "control", label: "Seeking Control", description: "The world is loud. You seek calm in breath and focus to gain power over your day. Yet, the unrest remains.", imageUrl: "", nextContent: { type: "media", content: "https://vimeo.com/1177815632?fl=ip&fe=ec" } },
  { id: "loved", label: "Seeking to be Loved", description: "You long to be seen, known, and cherished. But love has felt distant or out of reach.", imageUrl: "", nextContent: { type: "media", content: "https://vimeo.com/1177840022?share=copy&fl=sv&fe=ci" } },
];

function PathSelectorSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: { headline: string; options: { id: string; label: string; imageUrl: string; nextContent: { type: string; content: string } }[] };
  try {
    const parsed = JSON.parse(content || "{}");
    const rawOpts = Array.isArray(parsed.options) && parsed.options.length > 0 ? parsed.options : DEFAULT_PATH_OPTIONS;
    data = {
      headline: parsed.headline || "",
      options: rawOpts,
    };
  } catch {
    data = { headline: "", options: DEFAULT_PATH_OPTIONS };
  }

  const update = (next: typeof data) => onChange(JSON.stringify(next, null, 2));

  const updateOption = (i: number, field: string, value: string) => {
    const opts = data.options.map((o, idx) => idx === i ? { ...o, [field]: value } : o);
    update({ ...data, options: opts });
  };

  const updateNextContent = (i: number, field: string, value: string) => {
    const opts = data.options.map((o, idx) => idx === i
      ? { ...o, nextContent: { ...o.nextContent, [field]: value } }
      : o
    );
    update({ ...data, options: opts });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Headline</label>
        <input
          type="text"
          value={data.headline}
          onChange={(e) => update({ ...data, headline: e.target.value })}
          placeholder="Pick a pathway to explore"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-path-headline-${index}`}
        />
      </div>
      {data.options.map((opt, i) => (
        <div key={opt.id || i} className="border rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Card {i + 1}: {opt.id || "—"}</p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Label</label>
            <input
              type="text"
              value={opt.label}
              onChange={(e) => updateOption(i, "label", e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-path-label-${index}-${i}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description (shown on card)</label>
            <textarea
              value={(opt as any).description || ""}
              onChange={(e) => updateOption(i, "description", e.target.value)}
              rows={2}
              placeholder="Short description shown beneath the card label"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none"
              data-testid={`input-path-description-${index}-${i}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Image URL (optional override)</label>
            <input
              type="text"
              value={opt.imageUrl || ""}
              onChange={(e) => updateOption(i, "imageUrl", e.target.value)}
              placeholder="Leave blank to use built-in image"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-path-image-${index}-${i}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Video URL (Vimeo)</label>
            <input
              type="text"
              value={opt.nextContent?.content || ""}
              onChange={(e) => updateNextContent(i, "content", e.target.value)}
              placeholder="https://vimeo.com/..."
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-path-video-${index}-${i}`}
            />
          </div>
        </div>
      ))}
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


function KnowledgeQuizEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: { intro: { title: string; subtitle: string }; questions: { question: string; options: string[]; correctIndex: number }[]; conclusion: string };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      intro: {
        title: parsed.intro?.title || "",
        subtitle: parsed.intro?.subtitle || "",
      },
      questions: Array.isArray(parsed.questions) ? parsed.questions.map((q: any) => ({
        question: q.question || "",
        options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
      })) : [{ question: "", options: ["", "", "", ""], correctIndex: 0 }],
      conclusion: parsed.conclusion || "",
    };
  } catch {
    data = { intro: { title: "", subtitle: "" }, questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }], conclusion: "" };
  }

  const update = (next: typeof data) => onChange(JSON.stringify(next));

  const updateQuestion = (qi: number, field: "question" | "correctIndex", value: string | number) => {
    const questions = data.questions.map((q, i) => i === qi ? { ...q, [field]: value } : q);
    update({ ...data, questions });
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qi) return q;
      const options = [...q.options];
      options[oi] = value;
      return { ...q, options };
    });
    update({ ...data, questions });
  };

  const addOption = (qi: number) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qi || q.options.length >= 4) return q;
      return { ...q, options: [...q.options, ""] };
    });
    update({ ...data, questions });
  };

  const removeOption = (qi: number, oi: number) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qi || q.options.length <= 2) return q;
      const options = q.options.filter((_, j) => j !== oi);
      let ci = q.correctIndex;
      if (oi === ci) ci = 0;
      else if (oi < ci) ci = ci - 1;
      return { ...q, options, correctIndex: ci };
    });
    update({ ...data, questions });
  };

  const addQuestion = () => {
    update({ ...data, questions: [...data.questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }] });
  };

  const removeQuestion = (qi: number) => {
    if (data.questions.length <= 1) return;
    update({ ...data, questions: data.questions.filter((_, i) => i !== qi) });
  };

  const moveQuestion = (qi: number, dir: "up" | "down") => {
    const newIndex = dir === "up" ? qi - 1 : qi + 1;
    if (newIndex < 0 || newIndex >= data.questions.length) return;
    const questions = [...data.questions];
    [questions[qi], questions[newIndex]] = [questions[newIndex], questions[qi]];
    update({ ...data, questions });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 p-3 border rounded-md bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Intro Screen</p>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <input
            type="text"
            value={data.intro.title}
            onChange={(e) => update({ ...data, intro: { ...data.intro, title: e.target.value } })}
            placeholder="e.g. Test your knowledge of the spiritual world"
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            data-testid={`input-kq-intro-title-${index}`}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Subtitle (optional)</label>
          <input
            type="text"
            value={data.intro.subtitle}
            onChange={(e) => update({ ...data, intro: { ...data.intro, subtitle: e.target.value } })}
            placeholder="Brief description shown below the title"
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            data-testid={`input-kq-intro-subtitle-${index}`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions</p>
        {data.questions.map((q, qi) => (
          <div key={qi} className="p-3 border rounded-md space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Question {qi + 1}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveQuestion(qi, "up")}
                  disabled={qi === 0}
                  data-testid={`button-kq-q-up-${index}-${qi}`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveQuestion(qi, "down")}
                  disabled={qi === data.questions.length - 1}
                  data-testid={`button-kq-q-down-${index}-${qi}`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                {data.questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeQuestion(qi)}
                    data-testid={`button-kq-q-remove-${index}-${qi}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={q.question}
              onChange={(e) => updateQuestion(qi, "question", e.target.value)}
              placeholder="Enter the question..."
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-kq-question-${index}-${qi}`}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Options (circle = correct answer)</label>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, "correctIndex", oi)}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      q.correctIndex === oi
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    title={q.correctIndex === oi ? "Correct answer" : "Mark as correct"}
                    data-testid={`kq-correct-radio-${index}-${qi}-${oi}`}
                  >
                    {q.correctIndex === oi && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                    data-testid={`input-kq-option-${index}-${qi}-${oi}`}
                  />
                  {q.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => removeOption(qi, oi)}
                      data-testid={`button-kq-remove-option-${index}-${qi}-${oi}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {q.options.length < 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(qi)}
                  data-testid={`button-kq-add-option-${index}-${qi}`}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addQuestion}
          data-testid={`button-kq-add-question-${index}`}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Question
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Conclusion (shown on results screen)</label>
        <input
          type="text"
          value={data.conclusion}
          onChange={(e) => update({ ...data, conclusion: e.target.value })}
          placeholder="e.g. Great work! Keep diving deeper into your faith."
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          data-testid={`input-kq-conclusion-${index}`}
        />
      </div>
    </div>
  );
}

function TimerSlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: { duration: number; text: string; audioUrl?: string };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      duration: typeof parsed.duration === "number" ? parsed.duration : 60,
      text: typeof parsed.text === "string" ? parsed.text : "",
      audioUrl: typeof parsed.audioUrl === "string" ? parsed.audioUrl : undefined,
    };
  } catch {
    data = { duration: 60, text: content || "" };
  }

  const update = (field: "duration" | "text" | "audioUrl", value: number | string | undefined) => {
    const next = { ...data, [field]: value };
    if (value === undefined) delete (next as any)[field];
    onChange(JSON.stringify(next));
  };

  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/admin/upload-audio", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      let latest: any = {};
      try { latest = JSON.parse(contentRef.current || "{}"); } catch {}
      onChange(JSON.stringify({ ...latest, audioUrl: url }));
    } catch (err) {
      console.error("Audio upload error:", err);
    } finally {
      setAudioUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }, [onChange]);

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
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Scripture Audio (optional)</label>
        {data.audioUrl ? (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
            <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1">{data.audioUrl.split("/").pop()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => update("audioUrl", undefined)}
              className="h-6 px-2"
              data-testid={`button-remove-audio-${index}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : null}
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac"
          className="hidden"
          onChange={handleAudioUpload}
          data-testid={`input-timer-audio-${index}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => audioInputRef.current?.click()}
          disabled={audioUploading}
          className="w-full"
          data-testid={`button-upload-audio-${index}`}
        >
          <Upload className="w-4 h-4 mr-2" />
          {audioUploading ? "Uploading..." : data.audioUrl ? "Change Audio" : "Upload Audio"}
        </Button>
      </div>
    </div>
  );
}

function PdfDownloadEditor({ content, onChange, index, prefix }: { content: string; onChange: (val: string) => void; index: number; prefix: string }) {
  let data: { url: string; label: string };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      url: typeof parsed.url === "string" ? parsed.url : "",
      label: typeof parsed.label === "string" ? parsed.label : "",
    };
  } catch {
    data = { url: "", label: "" };
  }

  const contentRef = useRef(content);
  contentRef.current = content;

  const update = (fields: Partial<typeof data>) => {
    onChange(JSON.stringify({ ...data, ...fields }));
  };

  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataUrl = evt.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/admin/upload-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, data: base64, mimeType: file.type }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(err.message || "Upload failed");
        }
        const json = await res.json();
        let latest: { url: string; label: string } = { url: "", label: "" };
        try { const p = JSON.parse(contentRef.current || "{}"); latest = { url: typeof p.url === "string" ? p.url : "", label: typeof p.label === "string" ? p.label : "" }; } catch { /* use defaults */ }
        onChange(JSON.stringify({ ...latest, url: json.url }));
        toast({ title: "PDF uploaded", description: file.name });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err?.message || "Please try again.", variant: "destructive" });
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      toast({ title: "Upload failed", description: "Could not read the file.", variant: "destructive" });
      setUploading(false);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Label (e.g. "workbook", "guide")</label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="e.g. workbook"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-testid={`input-${prefix}-pdf-label-${index}`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">PDF File</label>
        {data.url && (
          <p className="text-xs text-muted-foreground/80 truncate mb-1">Current: <span className="font-mono">{data.url}</span></p>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById(`pdf-upload-${prefix}-${index}`)?.click()}
            data-testid={`button-${prefix}-pdf-upload-${index}`}
          >
            <Upload className="w-3 h-3 mr-1" />
            {uploading ? "Uploading…" : data.url ? "Replace PDF" : "Upload PDF"}
          </Button>
          <input
            id={`pdf-upload-${prefix}-${index}`}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handlePdfUpload}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground/60">The slide will show the label in its title and a download button that opens the PDF in a new tab.</p>
    </div>
  );
}

function ScripturePracticeEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  let data: {
    duration: number;
    text: string;
    audioUrl?: string;
    reference: string;
    chunks: string[];
    reflectionDuration: number;
    reflectionTitle: string;
  };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      duration: typeof parsed.duration === "number" ? parsed.duration : 180,
      text: typeof parsed.text === "string" ? parsed.text : "",
      audioUrl: typeof parsed.audioUrl === "string" && parsed.audioUrl ? parsed.audioUrl : undefined,
      reference: typeof parsed.reference === "string" ? parsed.reference : "",
      chunks: Array.isArray(parsed.chunks) && parsed.chunks.length > 0 ? parsed.chunks : [""],
      reflectionDuration: typeof parsed.reflectionDuration === "number" ? parsed.reflectionDuration : 120,
      reflectionTitle: typeof parsed.reflectionTitle === "string" ? parsed.reflectionTitle : "",
    };
  } catch {
    data = { duration: 180, text: "", reference: "", chunks: [""], reflectionDuration: 120, reflectionTitle: "" };
  }

  const update = (fields: Partial<typeof data>) => {
    const next = { ...data, ...fields };
    if (!next.audioUrl) delete (next as any).audioUrl;
    onChange(JSON.stringify(next));
  };

  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/admin/upload-audio", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      let latest: any = {};
      try { latest = JSON.parse(contentRef.current || "{}"); } catch {}
      onChange(JSON.stringify({ ...latest, audioUrl: url }));
    } catch (err) {
      console.error("Audio upload error:", err);
    } finally {
      setAudioUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }, [onChange]);

  const updateChunk = (idx: number, value: string) => {
    const chunks = [...data.chunks];
    chunks[idx] = value;
    update({ chunks });
  };

  const addChunk = () => update({ chunks: [...data.chunks, ""] });

  const removeChunk = (idx: number) => {
    if (data.chunks.length <= 1) return;
    update({ chunks: data.chunks.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <Tabs defaultValue="read" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-3">
          <TabsTrigger value="read" className="text-xs" data-testid={`tab-practice-read-${index}`}>Read Once</TabsTrigger>
          <TabsTrigger value="select" className="text-xs" data-testid={`tab-practice-select-${index}`}>What Stands Out</TabsTrigger>
          <TabsTrigger value="reflect" className="text-xs" data-testid={`tab-practice-reflect-${index}`}>Reflect</TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="space-y-3 mt-0">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Timer Duration (seconds)</label>
            <input
              type="number"
              min={5}
              max={3600}
              value={data.duration}
              onChange={(e) => update({ duration: Math.max(5, parseInt(e.target.value) || 180) })}
              className="w-32 px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-practice-duration-${index}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Verse Text (displayed during timer)</label>
            <textarea
              value={data.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder={`"If you remain in my word, you are truly my disciples..."`}
              rows={4}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-y"
              data-testid={`textarea-practice-text-${index}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Scripture Audio (optional)</label>
            {data.audioUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{data.audioUrl.split("/").pop()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => update({ audioUrl: undefined })}
                  className="h-6 px-2"
                  data-testid={`button-practice-remove-audio-${index}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : null}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac"
              className="hidden"
              onChange={handleAudioUpload}
              data-testid={`input-practice-audio-${index}`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => audioInputRef.current?.click()}
              disabled={audioUploading}
              className="w-full"
              data-testid={`button-practice-upload-audio-${index}`}
            >
              <Upload className="w-4 h-4 mr-2" />
              {audioUploading ? "Uploading..." : data.audioUrl ? "Change Audio" : "Upload Audio"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="select" className="space-y-3 mt-0">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Scripture Reference</label>
            <input
              type="text"
              value={data.reference}
              onChange={(e) => update({ reference: e.target.value })}
              placeholder="e.g. John 8:31–32"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-practice-reference-${index}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Scripture Chunks (one phrase per entry — user taps to select)</label>
            {data.chunks.map((chunk, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chunk}
                  onChange={(e) => updateChunk(idx, e.target.value)}
                  placeholder={`Phrase ${idx + 1}`}
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  data-testid={`input-practice-chunk-${index}-${idx}`}
                />
                <button
                  type="button"
                  onClick={() => removeChunk(idx)}
                  disabled={data.chunks.length <= 1}
                  className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid={`button-practice-remove-chunk-${index}-${idx}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addChunk}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              data-testid={`button-practice-add-chunk-${index}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add phrase
            </button>
          </div>
        </TabsContent>

        <TabsContent value="reflect" className="space-y-3 mt-0">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reflection Timer Duration (seconds)</label>
            <input
              type="number"
              min={10}
              max={600}
              value={data.reflectionDuration}
              onChange={(e) => update({ reflectionDuration: parseInt(e.target.value) || 120 })}
              className="w-32 px-3 py-2 text-sm border rounded-md bg-background"
              data-testid={`input-practice-reflection-duration-${index}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reflection Title (optional — shown on Tab 3)</label>
            <textarea
              value={data.reflectionTitle}
              onChange={(e) => update({ reflectionTitle: e.target.value })}
              placeholder="Stay with this and bring it to God.&#10;Explore the thoughts that come up."
              rows={2}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none"
              data-testid={`textarea-practice-reflection-title-${index}`}
            />
          </div>
        </TabsContent>
      </Tabs>
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

// ============================================================
// Survey Slide Editor
// ============================================================

interface SurveyEditorQuestion {
  id: string;
  type: "single_select" | "multi_select" | "rating" | "text";
  label: string;
  options?: string[];
}

interface SurveyEditorData {
  title: string;
  description: string;
  questions: SurveyEditorQuestion[];
}

const SURVEY_Q_TYPE_LABELS: Record<string, string> = {
  single_select: "Single Select",
  multi_select: "Multi Select",
  rating: "Rating (1–5)",
  text: "Short Text",
};

function parseSurveyEditorData(content: string): SurveyEditorData {
  try {
    const p = JSON.parse(content || "{}");
    return {
      title: p.title || "",
      description: p.description || "",
      questions: Array.isArray(p.questions) ? p.questions : [],
    };
  } catch {
    return { title: "", description: "", questions: [] };
  }
}

function newSurveyQuestion(): SurveyEditorQuestion {
  return { id: `q${Date.now()}`, type: "single_select", label: "", options: ["", ""] };
}

function SurveySlideEditor({ content, onChange, index }: { content: string; onChange: (val: string) => void; index: number }) {
  const data = parseSurveyEditorData(content);

  const update = (next: SurveyEditorData) => onChange(JSON.stringify(next, null, 2));

  const updateQuestion = (qIdx: number, patch: Partial<SurveyEditorQuestion>) => {
    const questions = data.questions.map((q, i) => i === qIdx ? { ...q, ...patch } : q);
    update({ ...data, questions });
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const q = data.questions[qIdx];
    if (!q.options) return;
    const options = q.options.map((o, i) => i === optIdx ? value : o);
    updateQuestion(qIdx, { options });
  };

  const addOption = (qIdx: number) => {
    const q = data.questions[qIdx];
    const options = [...(q.options || []), ""];
    updateQuestion(qIdx, { options });
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const q = data.questions[qIdx];
    if (!q.options || q.options.length <= 2) return;
    updateQuestion(qIdx, { options: q.options.filter((_, i) => i !== optIdx) });
  };

  const addQuestion = () => {
    update({ ...data, questions: [...data.questions, newSurveyQuestion()] });
  };

  const removeQuestion = (qIdx: number) => {
    if (data.questions.length <= 1) return;
    update({ ...data, questions: data.questions.filter((_, i) => i !== qIdx) });
  };

  const moveQuestion = (qIdx: number, dir: "up" | "down") => {
    const qs = [...data.questions];
    const target = dir === "up" ? qIdx - 1 : qIdx + 1;
    if (target < 0 || target >= qs.length) return;
    [qs[qIdx], qs[target]] = [qs[target], qs[qIdx]];
    update({ ...data, questions: qs });
  };

  const needsOptions = (type: string) => type === "single_select" || type === "multi_select";

  return (
    <div className="space-y-4" data-testid={`survey-editor-${index}`}>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Survey Title (optional)</label>
        <Input
          value={data.title}
          onChange={e => update({ ...data, title: e.target.value })}
          placeholder="e.g. End of Week 1 Reflection"
          data-testid={`input-survey-title-${index}`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
        <Textarea
          value={data.description}
          onChange={e => update({ ...data, description: e.target.value })}
          placeholder="Brief instructions for participants..."
          rows={2}
          data-testid={`input-survey-description-${index}`}
        />
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</label>
        {data.questions.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No questions yet. Add one below.</p>
        )}
        {data.questions.map((q, qIdx) => (
          <div key={q.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Question {qIdx + 1}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveQuestion(qIdx, "up")} disabled={qIdx === 0} data-testid={`button-survey-q-up-${qIdx}`}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveQuestion(qIdx, "down")} disabled={qIdx === data.questions.length - 1} data-testid={`button-survey-q-down-${qIdx}`}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                {data.questions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeQuestion(qIdx)} data-testid={`button-survey-q-remove-${qIdx}`}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
            </div>

            <Select
              value={q.type}
              onValueChange={val => {
                const t = val as SurveyEditorQuestion["type"];
                const needOpts = needsOptions(t);
                updateQuestion(qIdx, { type: t, options: needOpts ? (q.options?.length ? q.options : ["", ""]) : undefined });
              }}
            >
              <SelectTrigger className="h-8 text-xs" data-testid={`select-survey-q-type-${qIdx}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SURVEY_Q_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={q.label}
              onChange={e => updateQuestion(qIdx, { label: e.target.value })}
              placeholder="Question text..."
              className="text-sm"
              data-testid={`input-survey-q-label-${qIdx}`}
            />

            {needsOptions(q.type) && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Options</label>
                {(q.options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-1.5">
                    <Input
                      value={opt}
                      onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className="text-sm flex-1"
                      data-testid={`input-survey-opt-${qIdx}-${optIdx}`}
                    />
                    {(q.options || []).length > 2 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeOption(qIdx, optIdx)} data-testid={`button-survey-opt-remove-${qIdx}-${optIdx}`}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {(q.options || []).length < 8 && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOption(qIdx)} data-testid={`button-survey-opt-add-${qIdx}`}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>
            )}

            {q.type === "rating" && (
              <p className="text-xs text-muted-foreground italic">Rating question: participants tap 1–5.</p>
            )}
            {q.type === "text" && (
              <p className="text-xs text-muted-foreground italic">Text question: participants write a short response.</p>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addQuestion} data-testid={`button-survey-add-q-${index}`}>
          <Plus className="w-3 h-3 mr-1" />
          Add Question
        </Button>
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
  sortOrder: number;
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

function SortableDayCard({
  dayNumber,
  dayContent,
  onOpen,
  onPreview,
  modules,
  currentWeekNumber,
  onMove,
}: {
  dayNumber: number;
  dayContent: TrackAContentData | undefined;
  onOpen: (dayNumber: number) => void;
  onPreview: (dayNumber: number) => void;
  modules?: TrackAModuleData[];
  currentWeekNumber?: number;
  onMove?: (dayNumber: number, newWeekNumber: number) => void;
}) {
  const [moveSelectKey, setMoveSelectKey] = useState(0);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dayNumber });
  const slideCount = dayContent?.slides?.length || 0;
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const otherModules = modules?.filter(m => m.weekNumber !== currentWeekNumber) ?? [];

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onOpen(dayNumber)}
        data-testid={`card-day-${dayNumber}`}
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div
              className="p-1 rounded text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              data-testid={`drag-handle-day-${dayNumber}`}
            >
              <GripVertical className="w-4 h-4" />
            </div>
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
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {onMove && otherModules.length > 0 && (
                <Select
                  key={moveSelectKey}
                  onValueChange={(val) => {
                    onMove(dayNumber, Number(val));
                    setMoveSelectKey(k => k + 1);
                  }}
                >
                  <SelectTrigger
                    className="h-7 w-auto px-2 text-xs border-dashed text-muted-foreground gap-1 focus:ring-0"
                    data-testid={`select-move-day-${dayNumber}`}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span className="hidden sm:inline">Move</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-[11px]">Move to module…</SelectLabel>
                      {otherModules.map(m => (
                        <SelectItem key={m.weekNumber} value={String(m.weekNumber)} data-testid={`option-move-week-${m.weekNumber}`}>
                          Week {m.weekNumber}: {m.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              {slideCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  data-testid={`button-preview-day-${dayNumber}`}
                  onClick={(e) => { e.stopPropagation(); onPreview(dayNumber); }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </Button>
              )}
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
    </div>
  );
}

function SortableModuleCard({
  mod,
  allContent,
  onOpen,
  onEdit,
}: {
  mod: TrackAModuleData;
  allContent: TrackAContentData[] | undefined;
  onOpen: (weekNumber: number) => void;
  onEdit: (mod: TrackAModuleData) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.weekNumber });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const days = (() => {
    const start = (mod.weekNumber - 1) * 6 + 1;
    const end = Math.min(mod.weekNumber * 6, 30);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();
  const dayContents = days.map(d => allContent?.find(c => c.dayNumber === d));
  const filledCount = dayContents.filter(c => c && c.slides && c.slides.length > 0).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      data-testid={`card-module-${mod.weekNumber}`}
    >
      <div onClick={() => onOpen(mod.weekNumber)}>
        {mod.imageUrl ? (
          <div className="h-36 overflow-hidden relative">
            <img src={mod.imageUrl} alt={mod.title} className="w-full h-full object-cover" data-testid={`img-module-${mod.weekNumber}`} />
            <div
              className="absolute top-2 right-2 p-1 rounded bg-black/40 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              data-testid={`drag-handle-module-${mod.weekNumber}`}
            >
              <GripVertical className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center bg-muted relative">
            <Layers className="w-10 h-10 text-muted-foreground/40" />
            <div
              className="absolute top-2 right-2 p-1 rounded bg-muted-foreground/20 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              data-testid={`drag-handle-module-${mod.weekNumber}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
        <div className="pt-4 pb-3 px-4">
          <p className="text-xs font-medium mb-1 text-muted-foreground" data-testid={`text-module-week-${mod.weekNumber}`}>Week {mod.weekNumber}</p>
          <h3 className="font-semibold text-base truncate" data-testid={`text-module-title-${mod.weekNumber}`}>{mod.title}</h3>
          <p className="text-sm truncate text-muted-foreground" data-testid={`text-module-subtitle-${mod.weekNumber}`}>{mod.subtitle}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{days.length} lessons · {filledCount} with content</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onEdit(mod); }} data-testid={`button-edit-module-${mod.weekNumber}`}>
          <Edit2 className="w-3 h-3 mr-1" />
          Edit Module
        </Button>
      </div>
    </div>
  );
}

function TrackAContentManagementView() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<"modules" | "days" | "slides">("modules");
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [centralTheme, setCentralTheme] = useState("");
  const [slides, setSlides] = useState<TrackASlide[]>([]);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [addSlideType, setAddSlideType] = useState<string>("text");
  const [slideClipboard, setSlideClipboard] = useState<TrackASlide | null>(() => {
    try {
      const stored = localStorage.getItem("trackA_slideClipboard");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [dayImageUrl, setDayImageUrl] = useState<string | null>(null);
  const [daySubtitle, setDaySubtitle] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [editingModule, setEditingModule] = useState<TrackAModuleData | null>(null);
  const [editModuleDialogOpen, setEditModuleDialogOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubtitle, setModuleSubtitle] = useState("");
  const [moduleImageUrl, setModuleImageUrl] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [localModuleOrder, setLocalModuleOrder] = useState<number[]>([]);
  const [localDayOrder, setLocalDayOrder] = useState<number[]>([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotExpanded, setSnapshotExpanded] = useState(false);
  const [restoreConfirmId, setRestoreConfirmId] = useState<number | null>(null);
  const [restoreConfirmName, setRestoreConfirmName] = useState("");
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const snapshotsQuery = useQuery<{ id: number; name: string; createdAt: string }[]>({
    queryKey: ['/api/admin/track-a/snapshots'],
    queryFn: () => fetch('/api/admin/track-a/snapshots', { credentials: 'include' }).then(r => r.json()),
  });

  const createSnapshotMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", '/api/admin/track-a/snapshots', { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/track-a/snapshots'] });
      setSnapshotName("");
      setSnapshotExpanded(true);
      toast({ title: "Snapshot saved", description: "You can restore it any time from this panel." });
    },
    onError: () => toast({ title: "Failed to save snapshot", variant: "destructive" }),
  });

  const restoreSnapshotMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/track-a/snapshots/${id}/restore`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prelim-modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/track-a/snapshots'] });
      setRestoreConfirmId(null);
      toast({ title: "Snapshot restored", description: "Track A content and pre-modules have been restored." });
    },
    onError: () => {
      setRestoreConfirmId(null);
      toast({ title: "Restore failed", variant: "destructive" });
    },
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/track-a/snapshots/${id}`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/track-a/snapshots'] }),
    onError: () => toast({ title: "Failed to delete snapshot", variant: "destructive" }),
  });

  const handleCsvExport = async () => {
    try {
      const res = await fetch('/api/admin/export/track-a.csv', { credentials: 'include' });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'track-a-content.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Export failed", description: "Could not download the CSV file.", variant: "destructive" });
    }
  };

  const handleCsvImport = async () => {
    const file = csvFileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a CSV file first.", variant: "destructive" });
      return;
    }
    setCsvImporting(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      const res = await fetch('/api/admin/import/track-a', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Import failed");
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
      toast({ title: "Import successful", description: `${json.updated} day${json.updated !== 1 ? 's' : ''} updated.` });
      if (csvFileRef.current) csvFileRef.current.value = '';
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message || "Could not import CSV.", variant: "destructive" });
    } finally {
      setCsvImporting(false);
    }
  };

  const { data: modules, isLoading: modulesLoading } = useQuery<TrackAModuleData[]>({
    queryKey: ['/api/track-a-modules'],
    queryFn: async () => {
      const res = await fetch('/api/track-a-modules', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch modules");
      return res.json();
    },
  });

  useEffect(() => {
    if (modules) {
      setLocalModuleOrder(modules.map(m => m.weekNumber));
    }
  }, [modules]);

  const sortedModules = useMemo(() => {
    if (!modules) return [];
    if (localModuleOrder.length === 0) return modules;
    const byWeek = new Map(modules.map(m => [m.weekNumber, m]));
    return localModuleOrder.map(wn => byWeek.get(wn)).filter(Boolean) as TrackAModuleData[];
  }, [modules, localModuleOrder]);

  const reorderMutation = useMutation({
    mutationFn: async (weekNumbers: number[]) => {
      const res = await apiRequest("PATCH", '/api/admin/track-a/modules/reorder', { weekNumbers });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-modules'] });
    },
    onError: () => {
      toast({ title: "Failed to save order", description: "The module order could not be saved.", variant: "destructive" });
      if (modules) setLocalModuleOrder(modules.map(m => m.weekNumber));
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localModuleOrder.indexOf(Number(active.id));
    const newIndex = localModuleOrder.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(localModuleOrder, oldIndex, newIndex);
    setLocalModuleOrder(newOrder);
    reorderMutation.mutate(newOrder);
  };

  const reorderDaysMutation = useMutation({
    mutationFn: async (dayNumbers: number[]) => {
      const res = await apiRequest("PATCH", '/api/admin/track-a/content/reorder', { dayNumbers });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
    },
    onError: () => {
      toast({ title: "Failed to save order", description: "The day order could not be saved.", variant: "destructive" });
    },
  });

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localDayOrder.indexOf(Number(active.id));
    const newIndex = localDayOrder.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(localDayOrder, oldIndex, newIndex);
    setLocalDayOrder(newOrder);
    reorderDaysMutation.mutate(newOrder);
  };

  const { data: allContent, isLoading: contentLoading } = useQuery<TrackAContentData[]>({
    queryKey: ['/api/track-a-content'],
    queryFn: async () => {
      const res = await fetch('/api/track-a-content', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Track A content");
      return res.json();
    },
  });

  useEffect(() => {
    if (allContent && selectedModule !== null) {
      const daysInModule = allContent
        .filter(c => c.weekNumber === selectedModule)
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map(c => c.dayNumber);
      setLocalDayOrder(daysInModule);
    }
  }, [allContent, selectedModule]);

  const moduleSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", '/api/admin/track-a-modules', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-modules'] });
      toast({ title: "Module saved" });
      setEditModuleDialogOpen(false);
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

  const moveDayMutation = useMutation({
    mutationFn: async ({ dayNumber, newWeekNumber }: { dayNumber: number; newWeekNumber: number }) => {
      const content = allContent?.find(c => c.dayNumber === dayNumber);
      if (!content) throw new Error("Day content not found");
      const res = await apiRequest("POST", '/api/admin/track-a-content', {
        dayNumber: content.dayNumber,
        weekNumber: newWeekNumber,
        centralTheme: content.centralTheme,
        subtitle: content.subtitle ?? null,
        slides: content.slides ?? [],
        imageUrl: content.imageUrl ?? null,
        completionMessage: content.completionMessage ?? null,
      });
      return res.json();
    },
    onSuccess: (_data, { newWeekNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
      const targetModule = modules?.find(m => m.weekNumber === newWeekNumber);
      toast({ title: "Lesson moved", description: `Moved to Week ${newWeekNumber}${targetModule ? `: ${targetModule.title}` : ""}.` });
    },
    onError: () => toast({ title: "Failed to move lesson", variant: "destructive" }),
  });

  const renumberMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", '/api/admin/track-a/renumber', {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/track-a-content'] });
      setRenumberConfirmOpen(false);
      const count = data.changes?.length ?? 0;
      toast({ title: "Days renumbered", description: count > 0 ? `${count} day${count === 1 ? "" : "s"} updated to sequential numbering.` : "All day numbers were already in order." });
    },
    onError: () => toast({ title: "Failed to renumber days", variant: "destructive" }),
  });

  const currentContent = allContent?.find(c => c.dayNumber === selectedDay);

  const loadContentIntoState = (content: TrackAContentData | undefined) => {
    if (content) {
      setCentralTheme(content.centralTheme || "");
      setSlides(content.slides ? [...content.slides] : []);
      setDayImageUrl(content.imageUrl || null);
      setDaySubtitle(content.subtitle || "");
      setCompletionMessage(content.completionMessage || "");
    } else {
      setCentralTheme("");
      setSlides([]);
      setDayImageUrl(null);
      setDaySubtitle("");
      setCompletionMessage("");
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
    setEditModuleDialogOpen(true);
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

  const KNOWLEDGE_QUIZ_DEFAULT = JSON.stringify({ intro: { title: "Test Your Knowledge", subtitle: "" }, questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }], conclusion: "" });

  const getTrackADefaultSlideContent = (type: string): string => {
    if (type === "quiz") return JSON.stringify({ questions: [{ question: "", options: ["", "", "", ""] }], results: { A: { title: "", description: "" }, B: { title: "", description: "" }, C: { title: "", description: "" }, D: { title: "", description: "" } } });
    if (type === "timer") return JSON.stringify({ duration: 60, text: "" });
    if (type === "knowledge_check") return JSON.stringify({ question: "", options: ["", ""], correctIndex: 0, explanation: "" });
    if (type === "knowledge_quiz") return KNOWLEDGE_QUIZ_DEFAULT;
    if (type === "scenario") return JSON.stringify({ headline: "Imagine the following scenario", steps: [{ imageUrl: "", text: "" }] });
    if (type === "chat_flow") return ORIGIN_OF_THE_WEIGHT_TEMPLATE;
    if (type === "path_selector") return PATH_SELECTOR_DEFAULT;
    if (type === "cross_grid") return CROSS_GRID_DEFAULT;
    if (type === "story_choice") return STORY_CHOICE_DEFAULT;
    if (type === "image_carousel") return IMAGE_CAROUSEL_DEFAULT;
    if (type === "before_after") return BEFORE_AFTER_DEFAULT;
    if (type === "scene") return "{}";
    if (type === "captivity_builder") return JSON.stringify({ intro: "" });
    if (type === "confession_finder") return JSON.stringify({ title: "Find a Confession", subtitle: "Make a plan to receive the Sacrament.", introText: "Enter your ZIP code and we'll show you listed Confession times at nearby parishes.", searchLabel: "Your ZIP code", searchPlaceholder: "e.g. 60611", confirmationReminder: "Parish schedules can change — please verify on the parish website or by calling before you go.", manualEntryEnabled: true, allowSkip: true, skipText: "I need help finding a time", saveVariable: "confession_plan" }, null, 2);
    if (type === "pdf_download") return JSON.stringify({ url: "", label: "" });
    if (type === "guided_prayer_process") return GUIDED_PRAYER_DEFAULT;
    return "";
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { type: addSlideType, content: getTrackADefaultSlideContent(addSlideType) }]);
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

  const copySlide = (index: number) => {
    const slide = slides[index];
    if (!slide) return;
    const copied = { type: slide.type, content: slide.content };
    setSlideClipboard(copied);
    try { localStorage.setItem("trackA_slideClipboard", JSON.stringify(copied)); } catch {}
    toast({ title: "Slide copied", description: `${SLIDE_TYPE_LABELS[slide.type] ?? slide.type} slide is ready to paste into any lesson.` });
  };

  const pasteSlide = () => {
    if (!slideClipboard) return;
    const pasted = { type: slideClipboard.type, content: slideClipboard.content };
    setSlides(prev => [...prev, pasted]);
    setExpandedSlide(slides.length);
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
      <div className="space-y-8">
        {/* Edit Module Dialog */}
        <Dialog open={editModuleDialogOpen} onOpenChange={(open) => { setEditModuleDialogOpen(open); if (!open) setEditingModule(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Edit Module — Week {editingModule?.weekNumber}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="e.g., Foundations" data-testid="input-module-title" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Subtitle</label>
                <Input value={moduleSubtitle} onChange={(e) => setModuleSubtitle(e.target.value)} placeholder="e.g., Who God Is & How We Relate to Him" data-testid="input-module-subtitle" />
              </div>
              <ModuleImageUpload currentUrl={moduleImageUrl} onUploaded={setModuleImageUrl} />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => { setEditModuleDialogOpen(false); setEditingModule(null); }} data-testid="button-cancel-module">Cancel</Button>
                <Button onClick={saveModule} disabled={moduleSaveMutation.isPending} data-testid="button-save-module">
                  <Save className="w-4 h-4 mr-2" />
                  {moduleSaveMutation.isPending ? "Saving..." : "Save Module"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Renumber Days Confirmation Dialog */}
        <Dialog open={renumberConfirmOpen} onOpenChange={setRenumberConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Renumber All Days?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground pt-1">
              This will reassign day numbers sequentially (1, 2, 3…) based on the current week order. Any participant progress is updated to match. This cannot be undone — consider saving a snapshot first.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setRenumberConfirmOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => renumberMutation.mutate()}
                disabled={renumberMutation.isPending}
                data-testid="button-confirm-renumber"
              >
                {renumberMutation.isPending ? "Renumbering…" : "Yes, Renumber Days"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* CSV Import / Export */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-3 bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mr-auto">Bulk Edit via CSV</p>
          <Button size="sm" variant="outline" onClick={handleCsvExport} data-testid="button-export-track-a-csv">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <div className="flex items-center gap-2">
            <input
              ref={csvFileRef}
              type="file"
              accept=".csv,text/csv"
              className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground cursor-pointer"
              data-testid="input-import-track-a-csv"
            />
            <Button size="sm" onClick={handleCsvImport} disabled={csvImporting} data-testid="button-import-track-a-csv">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {csvImporting ? "Importing…" : "Import"}
            </Button>
          </div>
        </div>

        {/* Renumber Days */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-3 bg-muted/30">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fix Day Numbering</p>
            <p className="text-xs text-muted-foreground mt-0.5">After moving lessons between weeks, renumber days so they run sequentially again.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setRenumberConfirmOpen(true)} data-testid="button-renumber-days">
            <Hash className="w-3.5 h-3.5 mr-1.5" />
            Renumber Days
          </Button>
        </div>

        {/* Content Snapshots */}
        <div className="rounded-lg border border-dashed px-4 py-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mr-auto">
              Content Snapshots
            </p>
            <div className="flex items-center gap-2">
              <Input
                className="h-7 text-xs w-44"
                placeholder="Snapshot name (optional)"
                value={snapshotName}
                onChange={e => setSnapshotName(e.target.value)}
                data-testid="input-snapshot-name"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => createSnapshotMutation.mutate(snapshotName)}
                disabled={createSnapshotMutation.isPending}
                data-testid="button-create-snapshot"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {createSnapshotMutation.isPending ? "Saving…" : "Save Snapshot"}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => setSnapshotExpanded(e => !e)}
              data-testid="button-toggle-snapshots"
            >
              {snapshotExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          {snapshotExpanded && (
            <div className="mt-3 space-y-1">
              {snapshotsQuery.isLoading && (
                <p className="text-xs text-muted-foreground">Loading snapshots…</p>
              )}
              {!snapshotsQuery.isLoading && (!snapshotsQuery.data || snapshotsQuery.data.length === 0) && (
                <p className="text-xs text-muted-foreground italic">No snapshots yet. Save one before making edits.</p>
              )}
              {snapshotsQuery.data?.map(snap => (
                <div key={snap.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{snap.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(snap.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2 shrink-0"
                    onClick={() => { setRestoreConfirmId(snap.id); setRestoreConfirmName(snap.name); }}
                    data-testid={`button-restore-snapshot-${snap.id}`}
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSnapshotMutation.mutate(snap.id)}
                    data-testid={`button-delete-snapshot-${snap.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restore confirmation dialog */}
        <Dialog open={restoreConfirmId !== null} onOpenChange={open => { if (!open) setRestoreConfirmId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Snapshot?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will replace all Track A days and pre-modules with the state saved in{" "}
              <span className="font-medium text-foreground">"{restoreConfirmName}"</span>.
              All current content will be overwritten. Consider saving a snapshot first if you haven't.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setRestoreConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => { if (restoreConfirmId !== null) restoreSnapshotMutation.mutate(restoreConfirmId); }}
                disabled={restoreSnapshotMutation.isPending}
                data-testid="button-confirm-restore-snapshot"
              >
                {restoreSnapshotMutation.isPending ? "Restoring…" : "Yes, Restore"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pre-Modules section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-muted-foreground">
            Pre-Modules (Pre-Cohort Onboarding)
          </p>
          <PrelimContentManagementView />
        </div>

        <hr className="border-border" />

        {/* Weekly modules */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Weekly Modules
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {modules?.length || 0}
            </span>
          </div>

          <div
            className="cursor-pointer rounded-lg border mb-4 transition-shadow hover:shadow-md"
            onClick={() => openDay(0)}
            data-testid="card-day-0-intro"
          >
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium" data-testid="text-day0-admin-title">
                    Introduction — {allContent?.find(c => c.dayNumber === 0)?.centralTheme ?? "Goal of 30 Days"}
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
                      : <Circle className="w-4 h-4 text-muted-foreground" />;
                  })()}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localModuleOrder} strategy={rectSortingStrategy}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedModules.map(mod => (
                  <SortableModuleCard
                    key={mod.weekNumber}
                    mod={mod}
                    allContent={allContent}
                    onOpen={openModule}
                    onEdit={startEditModule}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    );
  }

  // === DAY LIST VIEW ===
  if (view === "days" && selectedModule) {
    const currentModule = modules?.find(m => m.weekNumber === selectedModule);

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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
          <SortableContext items={localDayOrder} strategy={rectSortingStrategy}>
            <div className="space-y-2">
              {localDayOrder.map(dayNumber => (
                <SortableDayCard
                  key={dayNumber}
                  dayNumber={dayNumber}
                  dayContent={allContent?.find(c => c.dayNumber === dayNumber)}
                  onOpen={openDay}
                  onPreview={(dn) => setLocation(`/preview/track-a/${dn}`)}
                  modules={modules}
                  currentWeekNumber={selectedModule ?? undefined}
                  onMove={(dn, wk) => moveDayMutation.mutate({ dayNumber: dn, newWeekNumber: wk })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
                {isDay0 ? `Introduction — ${currentContent?.centralTheme || "Goal of 30 Days"}` : `Day ${selectedDay} — ${currentContent?.centralTheme || "No content"}`}
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
                                if (val === "knowledge_quiz") {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", JSON.stringify({ intro: { title: "Test Your Knowledge", subtitle: "" }, questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }], conclusion: "" }));
                                  }
                                }
                                if (val === "scenario") {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", JSON.stringify({ headline: "Imagine the following scenario", steps: [{ imageUrl: "", text: "" }] }));
                                  }
                                }
                                if (val === "path_selector") {
                                  try {
                                    const p = JSON.parse(slide.content);
                                    if (!Array.isArray(p.options) || p.options.length === 0) throw new Error();
                                  } catch {
                                    updateSlide(index, "content", PATH_SELECTOR_DEFAULT);
                                  }
                                }
                                if (val === "cross_grid") {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", CROSS_GRID_DEFAULT);
                                  }
                                }
                                if (val === "story_choice") {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", STORY_CHOICE_DEFAULT);
                                  }
                                }
                              }}>
                                <SelectTrigger data-testid={`select-slide-type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TRACK_A_SLIDE_TYPES.map(t => (
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
                            ) : slide.type === "knowledge_quiz" ? (
                              <KnowledgeQuizEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "survey" ? (
                              <SurveySlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "scenario" ? (
                              <ScenarioSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "chat_flow" ? (
                              <ChatFlowSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "path_selector" ? (
                              <PathSelectorSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "scripture_practice" ? (
                              <ScripturePracticeEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "before_after" ? (
                              <BeforeAfterSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "image_carousel" ? (
                              <ImageCarouselSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "cross_grid" ? (
                              <CrossGridSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "story_choice" ? (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Content (JSON)</label>
                                <textarea
                                  value={slide.content}
                                  onChange={(e) => updateSlide(index, "content", e.target.value)}
                                  className="w-full font-mono text-xs rounded-md border border-input bg-background px-3 py-2 min-h-[200px] resize-y"
                                  spellCheck={false}
                                  data-testid={`textarea-slide-json-${index}`}
                                />
                              </div>
                            ) : slide.type === "scene" ? (
                              <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-center">
                                <p className="text-xs text-muted-foreground">Pot &amp; Bandage Scene — no configuration required.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">The interactive cracked-pot scene is self-contained and plays automatically when this slide is shown.</p>
                              </div>
                            ) : slide.type === "captivity_builder" ? (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-muted-foreground">Intro text (optional)</label>
                                  <textarea
                                    value={(() => { try { return JSON.parse(slide.content).intro || ""; } catch { return ""; } })()}
                                    onChange={(e) => {
                                      try {
                                        const p = JSON.parse(slide.content);
                                        p.intro = e.target.value;
                                        updateSlide(index, "content", JSON.stringify(p));
                                      } catch {
                                        updateSlide(index, "content", JSON.stringify({ intro: e.target.value }));
                                      }
                                    }}
                                    placeholder="Optional intro shown above the builder..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                                    data-testid={`textarea-captivity-intro-${index}`}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground/60">The 12 spirits and prayer template are built in — no further configuration needed.</p>
                              </div>
                            ) : slide.type === "pdf_download" ? (
                              <PdfDownloadEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                                prefix="slide"
                              />
                            ) : slide.type === "guided_prayer_process" ? (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Steps (JSON)</label>
                                <textarea
                                  value={slide.content}
                                  onChange={e => updateSlide(index, "content", e.target.value)}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono min-h-[200px] resize-y"
                                  data-testid={`textarea-slide-gpp-${index}`}
                                />
                                <p className="text-[11px] text-muted-foreground/60">Edit the JSON to configure steps (instruction, input, list_input, choice, prayer, reflection). Variable names in prayer_text use {`{{variable_name}}`} syntax.</p>
                              </div>
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
                        <Button variant="ghost" size="icon" title="Copy slide" onClick={() => copySlide(index)} data-testid={`button-slide-copy-${index}`}>
                          <Copy className="w-4 h-4" />
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
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={addSlideType} onValueChange={setAddSlideType}>
                  <SelectTrigger className="w-[180px]" data-testid="select-add-slide-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_A_SLIDE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSlide} data-testid="button-add-slide">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slide
                </Button>
              </div>
              {slideClipboard && (
                <div className="flex items-center gap-3 pt-1 border-t border-dashed">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5" data-testid="text-clipboard-indicator">
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Clipboard: <span className="font-medium text-foreground">{SLIDE_TYPE_LABELS[slideClipboard.type] ?? slideClipboard.type}</span> slide
                  </span>
                  <Button size="sm" variant="outline" onClick={pasteSlide} data-testid="button-paste-slide">
                    <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
                    Paste Slide
                  </Button>
                </div>
              )}
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
                        })() : slide.type === "knowledge_quiz" ? (() => {
                          try {
                            const d = JSON.parse(slide.content);
                            return `"${d.intro?.title || "(no title)"}" — ${d.questions?.length || 0} question${d.questions?.length !== 1 ? "s" : ""}`;
                          } catch { return slide.content || "(empty)"; }
                        })() : slide.type === "timer" ? (() => {
                          try {
                            const d = JSON.parse(slide.content);
                            return `${d.duration || 60}s timer${d.audioUrl ? " 🔊" : ""}`;
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

      <CompletionUnlockSection contextKey={`chat-flow-${selectedDay}`} />

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

// ============================================================
// Survey Results View (T004)
// ============================================================

interface SurveyResponseRow {
  id: number;
  userId: number;
  track: string;
  dayNumber: number;
  questionIndex: number;
  questionLabel: string;
  questionType: string;
  response: string;
  submittedAt: string;
}

interface AggregatedQuestion {
  index: number;
  label: string;
  type: string;
  responses: string[];
}

function aggregateQuestions(rows: SurveyResponseRow[]): AggregatedQuestion[] {
  const map = new Map<number, AggregatedQuestion>();
  for (const row of rows) {
    if (!map.has(row.questionIndex)) {
      map.set(row.questionIndex, { index: row.questionIndex, label: row.questionLabel, type: row.questionType, responses: [] });
    }
    map.get(row.questionIndex)!.responses.push(row.response);
  }
  return Array.from(map.values()).sort((a, b) => a.index - b.index);
}

function countOptions(responses: string[], type: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    if (type === "multi_select") {
      try {
        const arr: string[] = JSON.parse(r);
        for (const o of arr) counts[o] = (counts[o] || 0) + 1;
      } catch { counts[r] = (counts[r] || 0) + 1; }
    } else {
      counts[r] = (counts[r] || 0) + 1;
    }
  }
  return counts;
}

function QuestionResultCard({ q, totalRespondents }: { q: AggregatedQuestion; totalRespondents: number }) {
  if (q.type === "text") {
    return (
      <Card data-testid={`survey-result-q-${q.index}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-xs mt-0.5">Text</Badge>
            <CardTitle className="text-base leading-snug">{q.label}</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">{q.responses.length} response{q.responses.length !== 1 ? "s" : ""}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {q.responses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No responses yet.</p>
            ) : q.responses.map((r, i) => (
              <div key={i} className="p-2.5 bg-muted/40 rounded-md border border-border/50">
                <p className="text-sm text-foreground leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (q.type === "rating") {
    const counts = countOptions(q.responses, "rating");
    const total = q.responses.filter(r => r.trim()).length;
    const avg = total > 0 ? q.responses.reduce((s, r) => s + (parseInt(r) || 0), 0) / total : 0;
    const max = Math.max(...Object.values(counts), 1);
    return (
      <Card data-testid={`survey-result-q-${q.index}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-xs mt-0.5">Rating</Badge>
            <CardTitle className="text-base leading-snug">{q.label}</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">{total} response{total !== 1 ? "s" : ""} · avg {avg.toFixed(1)}/5</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(n => {
              const c = counts[String(n)] || 0;
              const pct = total > 0 ? Math.round((c / total) * 100) : 0;
              return (
                <div key={n} className="flex items-center gap-3" data-testid={`survey-rating-bar-${n}`}>
                  <span className="w-4 text-sm font-semibold text-muted-foreground text-right shrink-0">{n}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#00b57a] rounded-full transition-all"
                      style={{ width: `${max > 0 ? (c / max) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-muted-foreground shrink-0">{c} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // single_select / multi_select
  const counts = countOptions(q.responses, q.type);
  const denominator = q.type === "multi_select"
    ? q.responses.filter(r => r.trim()).length
    : q.responses.filter(r => r.trim()).length;
  const allOptions = Object.keys(counts).sort();
  const maxCount = Math.max(...Object.values(counts), 1);
  const typeLabel = q.type === "multi_select" ? "Multi Select" : "Single Select";

  return (
    <Card data-testid={`survey-result-q-${q.index}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="shrink-0 text-xs mt-0.5">{typeLabel}</Badge>
          <CardTitle className="text-base leading-snug">{q.label}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{denominator} response{denominator !== 1 ? "s" : ""}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {allOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No responses yet.</p>
          ) : allOptions.map(opt => {
            const c = counts[opt] || 0;
            const pct = denominator > 0 ? Math.round((c / denominator) * 100) : 0;
            return (
              <div key={opt} className="space-y-0.5" data-testid={`survey-option-bar-${opt}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[70%]">{opt}</span>
                  <span className="text-muted-foreground text-xs shrink-0">{c} ({pct}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#00b57a] rounded-full transition-all"
                    style={{ width: `${maxCount > 0 ? (c / maxCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SurveyResultsView() {
  const [filterTrack, setFilterTrack] = useState<string>("A");
  const [filterDay, setFilterDay] = useState<string>("");

  const queryKey = ["/api/admin/survey-responses", filterTrack, filterDay];
  const { data: rows = [], isLoading } = useQuery<SurveyResponseRow[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTrack) params.set("track", filterTrack);
      if (filterDay) params.set("dayNumber", filterDay);
      const res = await fetch(`/api/admin/survey-responses?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const questions = aggregateQuestions(rows);
  const respondentCount = filterDay
    ? new Set(rows.filter(r => r.questionIndex === 0).map(r => r.userId)).size
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-serif text-primary mb-1">Survey Results</h2>
        <p className="text-sm text-muted-foreground">Filter by track and day to view aggregated responses.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Track</label>
          <Select value={filterTrack} onValueChange={setFilterTrack}>
            <SelectTrigger className="w-36" data-testid="select-survey-track">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Track A</SelectItem>
              <SelectItem value="B">Track B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Day</label>
          <Select value={filterDay || "all"} onValueChange={v => setFilterDay(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="select-survey-day">
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {Array.from({ length: 31 }, (_, i) => i).map(d => (
                <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filterDay && respondentCount > 0 && (
          <div className="pb-1">
            <Badge variant="secondary" className="text-xs">
              {respondentCount} respondent{respondentCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">No survey responses found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterDay ? `No responses for Track ${filterTrack}, Day ${filterDay} yet.` : "Select a day to view results."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <QuestionResultCard key={q.index} q={q} totalRespondents={respondentCount} />
          ))}
        </div>
      )}
    </div>
  );
}

// ========================
// Shared slide helpers (used by Prelim and Healing editors)
// ========================

function getDefaultSlideContent(type: string): string {
  if (type === "quiz") return JSON.stringify({ questions: [{ question: "", options: ["", "", "", ""] }], results: { A: { title: "", description: "" }, B: { title: "", description: "" }, C: { title: "", description: "" }, D: { title: "", description: "" } } }, null, 2);
  if (type === "timer") return JSON.stringify({ duration: 60, text: "" });
  if (type === "knowledge_check") return JSON.stringify({ question: "", options: ["", ""], correctIndex: 0, explanation: "" });
  if (type === "knowledge_quiz") return JSON.stringify({ intro: { title: "Test Your Knowledge", subtitle: "" }, questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }], conclusion: "" });
  if (type === "scenario") return JSON.stringify({ headline: "Imagine the following scenario", steps: [{ imageUrl: "", text: "" }] });
  if (type === "chat_flow") return ORIGIN_OF_THE_WEIGHT_TEMPLATE;
  if (type === "path_selector") return PATH_SELECTOR_DEFAULT;
  if (type === "cross_grid") return CROSS_GRID_DEFAULT;
  if (type === "story_choice") return STORY_CHOICE_DEFAULT;
  if (type === "image_carousel") return IMAGE_CAROUSEL_DEFAULT;
  if (type === "before_after") return BEFORE_AFTER_DEFAULT;
  if (type === "scene") return "{}";
  if (type === "captivity_builder") return JSON.stringify({ intro: "" });
  if (type === "confession_finder") return JSON.stringify({ title: "Find a Confession", subtitle: "Make a plan to receive the Sacrament.", introText: "Enter your ZIP code and we'll show you listed Confession times at nearby parishes.", searchLabel: "Your ZIP code", searchPlaceholder: "e.g. 60611", confirmationReminder: "Parish schedules can change — please verify on the parish website or by calling before you go.", manualEntryEnabled: true, allowSkip: true, skipText: "I need help finding a time", saveVariable: "confession_plan" }, null, 2);
  if (type === "pdf_download") return JSON.stringify({ url: "", label: "" });
  if (type === "guided_prayer_process") return GUIDED_PRAYER_OCCULT_DEFAULT;
  return "";
}

// ========================
// Prelim Modules Editor
// ========================

type PrelimModuleAdminData = {
  id: number;
  position: number;
  title: string;
  subtitle: string | null;
  slides: TrackASlide[] | null;
  imageUrl: string | null;
};

function PrelimContentManagementView() {
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [slides, setSlides] = useState<TrackASlide[]>([]);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [addSlideType, setAddSlideType] = useState<string>("text");

  const { data: prelimModules, isLoading } = useQuery<PrelimModuleAdminData[]>({
    queryKey: ['/api/prelim-modules'],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { position: number; title: string; subtitle: string | null; slides: TrackASlide[]; imageUrl: string | null }) => {
      const res = await apiRequest("PUT", `/api/admin/prelim-modules/${data.position}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prelim-modules'] });
      toast({ title: "Prelim module saved" });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to save module", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const currentModule = prelimModules?.find(m => m.position === selectedPosition);

  const loadModuleIntoState = (mod: PrelimModuleAdminData | undefined) => {
    if (mod) {
      setTitle(mod.title);
      setSubtitle(mod.subtitle || "");
      setImageUrl(mod.imageUrl || null);
      setSlides(mod.slides ? [...mod.slides] : []);
    } else {
      setTitle("");
      setSubtitle("");
      setImageUrl(null);
      setSlides([]);
    }
    setExpandedSlide(null);
  };

  const handleSave = () => {
    if (!selectedPosition) return;
    saveMutation.mutate({ position: selectedPosition, title: title || "Untitled", subtitle: subtitle || null, slides, imageUrl });
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { type: addSlideType, content: getDefaultSlideContent(addSlideType) }]);
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
    return <Card><CardContent className="py-8 text-center">Loading prelim modules...</CardContent></Card>;
  }

  if (selectedPosition === null) {
    const defaultModules: PrelimModuleAdminData[] = [
      { id: 0, position: 1, title: "Welcome to Lumen Fidei", subtitle: null, slides: null, imageUrl: null },
      { id: 0, position: 2, title: "The Program Structure", subtitle: null, slides: null, imageUrl: null },
    ];
    const displayModules = (prelimModules && prelimModules.length > 0) ? prelimModules : defaultModules;
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Pre-Cohort Onboarding Modules
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These 2 modules must be completed by participants before the main program unlocks. Click a module to edit its content and upload a card image.
            </p>
          </CardHeader>
        </Card>
        <div className="space-y-3">
          {displayModules.map(mod => (
            <Card
              key={mod.position}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => {
                setSelectedPosition(mod.position);
                loadModuleIntoState(mod);
                setEditMode(false);
              }}
              data-testid={`card-prelim-admin-${mod.position}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-orange-600 dark:text-orange-400">{mod.position}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium" data-testid={`text-prelim-admin-title-${mod.position}`}>{mod.title}</h4>
                    {mod.subtitle && <p className="text-xs text-muted-foreground truncate">{mod.subtitle}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mod.slides && mod.slides.length > 0 ? `${mod.slides.length} slide${mod.slides.length !== 1 ? "s" : ""}` : "Empty"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSelectedPosition(null)} className="gap-2" data-testid="button-prelim-back">
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </Button>
        <Badge variant="outline">Module {selectedPosition}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {currentModule?.title || `Prelim Module ${selectedPosition}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editMode ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Module title" data-testid="input-prelim-title" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Brief description (optional)" data-testid="input-prelim-subtitle" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Background Image</label>
                <p className="text-xs text-muted-foreground">Full-span image shown on the dashboard card. Covers the entire card.</p>
                <ModuleImageUpload currentUrl={imageUrl} onUploaded={setImageUrl} />
              </div>
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{currentModule?.title}</p>
                {currentModule?.subtitle && <p className="text-sm text-muted-foreground">{currentModule.subtitle}</p>}
                {currentModule?.imageUrl && (
                  <div className="mt-3">
                    <img src={currentModule.imageUrl} alt="" className="h-20 w-auto rounded object-cover border border-border" />
                  </div>
                )}
              </div>
              <Button size="sm" onClick={() => { loadModuleIntoState(currentModule); setEditMode(true); }} data-testid="button-prelim-edit">
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {editMode && (
        <>
          <div className="space-y-3">
            {slides.map((slide, index) => {
              const isExpanded = expandedSlide === index;
              return (
                <Card key={index} data-testid={`card-prelim-slide-${index}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <SlideTypeBadge type={slide.type} />
                          {!isExpanded && (
                            <span className="text-sm text-muted-foreground truncate">
                              {slide.content ? (slide.content.length > 80 ? slide.content.substring(0, 80) + "..." : slide.content) : "(empty)"}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="space-y-3 mt-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Slide Type</label>
                              <Select value={slide.type} onValueChange={(val) => {
                                updateSlide(index, "type", val);
                                const defaultContent = getDefaultSlideContent(val);
                                if (defaultContent) {
                                  try { JSON.parse(slide.content); } catch {
                                    updateSlide(index, "content", defaultContent);
                                  }
                                }
                                if (val === "path_selector") {
                                  try {
                                    const p = JSON.parse(slide.content);
                                    if (!Array.isArray(p.options) || p.options.length === 0) throw new Error();
                                  } catch {
                                    updateSlide(index, "content", PATH_SELECTOR_DEFAULT);
                                  }
                                }
                              }}>
                                <SelectTrigger data-testid={`select-prelim-slide-type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRELIM_SLIDE_TYPES.map(t => (
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
                            ) : slide.type === "knowledge_quiz" ? (
                              <KnowledgeQuizEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "survey" ? (
                              <SurveySlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "scenario" ? (
                              <ScenarioSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "chat_flow" ? (
                              <ChatFlowSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "path_selector" ? (
                              <PathSelectorSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "scripture_practice" ? (
                              <ScripturePracticeEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "before_after" ? (
                              <BeforeAfterSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "image_carousel" ? (
                              <ImageCarouselSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "cross_grid" ? (
                              <CrossGridSlideEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                              />
                            ) : slide.type === "story_choice" ? (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Content (JSON)</label>
                                <textarea
                                  value={slide.content}
                                  onChange={(e) => updateSlide(index, "content", e.target.value)}
                                  className="w-full font-mono text-xs rounded-md border border-input bg-background px-3 py-2 min-h-[200px] resize-y"
                                  spellCheck={false}
                                  data-testid={`textarea-prelim-json-${index}`}
                                />
                              </div>
                            ) : slide.type === "scene" ? (
                              <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-center">
                                <p className="text-xs text-muted-foreground">Pot &amp; Bandage Scene — no configuration required.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">The interactive cracked-pot scene is self-contained and plays automatically when this slide is shown.</p>
                              </div>
                            ) : slide.type === "captivity_builder" ? (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-muted-foreground">Intro text (optional)</label>
                                  <textarea
                                    value={(() => { try { return JSON.parse(slide.content).intro || ""; } catch { return ""; } })()}
                                    onChange={(e) => {
                                      try {
                                        const p = JSON.parse(slide.content);
                                        p.intro = e.target.value;
                                        updateSlide(index, "content", JSON.stringify(p));
                                      } catch {
                                        updateSlide(index, "content", JSON.stringify({ intro: e.target.value }));
                                      }
                                    }}
                                    placeholder="Optional intro shown above the builder..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                                    data-testid={`textarea-prelim-captivity-intro-${index}`}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground/60">The 12 spirits and prayer template are built in — no further configuration needed.</p>
                              </div>
                            ) : slide.type === "pdf_download" ? (
                              <PdfDownloadEditor
                                content={slide.content}
                                onChange={(val) => updateSlide(index, "content", val)}
                                index={index}
                                prefix="prelim"
                              />
                            ) : slide.type === "guided_prayer_process" ? (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Steps (JSON)</label>
                                <textarea
                                  value={slide.content}
                                  onChange={e => updateSlide(index, "content", e.target.value)}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono min-h-[200px] resize-y"
                                  data-testid={`textarea-prelim-gpp-${index}`}
                                />
                                <p className="text-[11px] text-muted-foreground/60">Edit the JSON to configure steps (instruction, input, list_input, choice, prayer, reflection). Variable names in prayer_text use {`{{variable_name}}`} syntax.</p>
                              </div>
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
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedSlide(isExpanded ? null : index)} data-testid={`button-prelim-expand-${index}`}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(index, "up")} disabled={index === 0} data-testid={`button-prelim-move-up-${index}`}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(index, "down")} disabled={index === slides.length - 1} data-testid={`button-prelim-move-down-${index}`}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeSlide(index)} data-testid={`button-prelim-remove-${index}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Select value={addSlideType} onValueChange={setAddSlideType}>
                  <SelectTrigger className="w-48" data-testid="select-prelim-add-slide-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRELIM_SLIDE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSlide} className="gap-2" data-testid="button-prelim-add-slide">
                  <Plus className="w-4 h-4" /> Add Slide
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setEditMode(false); setExpandedSlide(null); }} data-testid="button-prelim-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2" data-testid="button-prelim-save">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saving..." : "Save Module"}
            </Button>
          </div>
        </>
      )}

      {!editMode && currentModule && (
        <div className="space-y-3">
          {(currentModule.slides || []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No slides yet. Click Edit to add content.
              </CardContent>
            </Card>
          ) : (
            (currentModule.slides || []).map((slide, index) => (
              <Card key={index}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-muted-foreground pt-1 w-5 shrink-0">{index + 1}</span>
                    <SlideTypeBadge type={slide.type} />
                    <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
                      {slide.content || "(empty)"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedPosition !== null && (
        <CompletionUnlockSection contextKey={`prelim-module-${selectedPosition}`} />
      )}

    </div>
  );
}

// === Testimonies Admin ===

function TestimonyImageUpload({ currentUrl, onUploaded }: { currentUrl: string; onUploaded: (url: string) => void }) {
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
      console.error("Thumbnail upload error:", err instanceof Error ? err.message : err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploaded]);

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border">
          <img src={currentUrl} alt="Thumbnail" className="w-full h-full object-cover" data-testid="img-testimony-thumbnail-preview" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border" data-testid="placeholder-testimony-thumbnail">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} data-testid="input-testimony-thumbnail-file" />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} data-testid="button-upload-testimony-thumbnail">
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {uploading ? "Uploading..." : currentUrl ? "Change Photo" : "Upload Photo"}
      </Button>
    </div>
  );
}

interface AdminTestimonyPart {
  id: number;
  testimonyId: number;
  partNumber: number;
  title: string;
  videoUrl: string;
  unlockKey: string;
}

interface AdminTestimony {
  id: number;
  position: number;
  personName: string;
  description: string;
  thumbnailUrl: string;
  fullVideoUrl: string;
  parts: AdminTestimonyPart[];
}

const UNLOCK_KEY_OPTIONS = [
  { value: "prelim", label: "Prelim — All Preliminary Modules" },
  { value: "week-1-first", label: "Week 1 — First lesson" },
  { value: "week-1-last", label: "Week 1 — Last lesson" },
  { value: "week-2-first", label: "Week 2 — First lesson" },
  { value: "week-2-last", label: "Week 2 — Last lesson" },
  { value: "week-3-first", label: "Week 3 — First lesson" },
  { value: "week-3-last", label: "Week 3 — Last lesson" },
  { value: "week-4-first", label: "Week 4 — First lesson" },
  { value: "week-4-last", label: "Week 4 — Last lesson" },
  { value: "week-5-first", label: "Week 5 — First lesson" },
  { value: "week-5-last", label: "Week 5 — Last lesson" },
];

function TestimonyPartRow({
  part,
  testimonyId,
  onSaved,
}: {
  part?: AdminTestimonyPart;
  testimonyId: number;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isNew = !part;
  const [partNumber, setPartNumber] = useState(part?.partNumber?.toString() ?? "");
  const [title, setTitle] = useState(part?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(part?.videoUrl ?? "");
  const [unlockKey, setUnlockKey] = useState(part?.unlockKey ?? "prelim");
  const [editing, setEditing] = useState(isNew);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { partNumber: parseInt(partNumber), title, videoUrl, unlockKey };
      if (isNew) {
        await apiRequest("POST", `/api/admin/testimonies/${testimonyId}/parts`, body);
      } else {
        await apiRequest("PATCH", `/api/admin/testimonies/${testimonyId}/parts/${part!.id}`, body);
      }
    },
    onSuccess: () => {
      toast({ title: isNew ? "Part added" : "Part updated" });
      onSaved();
      if (isNew) { setPartNumber(""); setTitle(""); setVideoUrl(""); setUnlockKey("prelim"); }
      else setEditing(false);
    },
    onError: () => toast({ title: "Error saving part", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/testimonies/${testimonyId}/parts/${part!.id}`),
    onSuccess: () => { toast({ title: "Part deleted" }); onSaved(); },
    onError: () => toast({ title: "Error deleting part", variant: "destructive" }),
  });

  if (!isNew && !editing) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-muted/30" data-testid={`row-part-${part!.id}`}>
        <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium flex-shrink-0">Part {part!.partNumber}</span>
        <span className="text-sm text-muted-foreground flex-1 truncate">{part!.title || "(no title)"}</span>
        <Badge variant="outline" className="text-xs flex-shrink-0">{part!.unlockKey}</Badge>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} data-testid={`button-edit-part-${part!.id}`}><Edit2 className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid={`button-delete-part-${part!.id}`}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-background" data-testid={isNew ? "form-new-part" : `form-edit-part-${part?.id}`}>
      <div className="flex gap-2">
        <Input type="number" placeholder="Part #" value={partNumber} onChange={e => setPartNumber(e.target.value)} className="w-20" data-testid="input-part-number" />
        <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} className="flex-1" data-testid="input-part-title" />
      </div>
      <Input placeholder="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} data-testid="input-part-video-url" />
      <Select value={unlockKey} onValueChange={setUnlockKey}>
        <SelectTrigger data-testid="select-unlock-key"><SelectValue placeholder="Unlock key" /></SelectTrigger>
        <SelectContent>
          {UNLOCK_KEY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex gap-2 justify-end">
        {!isNew && <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-edit-part">Cancel</Button>}
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !partNumber} data-testid="button-save-part">
          {isNew ? "Add Part" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function TestimonyRow({ testimony, onSaved }: { testimony: AdminTestimony; onSaved: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [personName, setPersonName] = useState(testimony.personName);
  const [description, setDescription] = useState(testimony.description);
  const [thumbnailUrl, setThumbnailUrl] = useState(testimony.thumbnailUrl);
  const [fullVideoUrl, setFullVideoUrl] = useState(testimony.fullVideoUrl);
  const [position, setPosition] = useState(testimony.position.toString());

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/testimonies/${testimony.id}`, {
      position: parseInt(position), personName, description, thumbnailUrl, fullVideoUrl,
    }),
    onSuccess: () => { toast({ title: "Testimony updated" }); setEditing(false); onSaved(); },
    onError: () => toast({ title: "Error updating testimony", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/testimonies/${testimony.id}`),
    onSuccess: () => { toast({ title: "Testimony deleted" }); onSaved(); },
    onError: () => toast({ title: "Error deleting testimony", variant: "destructive" }),
  });

  return (
    <Card data-testid={`card-admin-testimony-${testimony.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input type="number" placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} className="w-20" data-testid="input-testimony-position" />
                  <Input placeholder="Person name" value={personName} onChange={e => setPersonName(e.target.value)} className="flex-1" data-testid="input-testimony-name" />
                </div>
                <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} data-testid="input-testimony-description" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Thumbnail Photo</p>
                  <TestimonyImageUpload currentUrl={thumbnailUrl} onUploaded={setThumbnailUrl} />
                </div>
                <Input placeholder="Full video URL (optional)" value={fullVideoUrl} onChange={e => setFullVideoUrl(e.target.value)} data-testid="input-testimony-full-video" />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-testimony">Cancel</Button>
                  <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-testimony">Save</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">#{testimony.position}</p>
                <h3 className="font-semibold text-base">{testimony.personName}</h3>
                {testimony.description && <p className="text-sm text-muted-foreground mt-0.5">{testimony.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{testimony.parts.length} part{testimony.parts.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
          {!editing && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)} data-testid={`button-expand-admin-testimony-${testimony.id}`}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} data-testid={`button-edit-testimony-${testimony.id}`}><Edit2 className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid={`button-delete-testimony-${testimony.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parts</p>
          {testimony.parts.map(part => (
            <TestimonyPartRow key={part.id} part={part} testimonyId={testimony.id} onSaved={onSaved} />
          ))}
          <TestimonyPartRow testimonyId={testimony.id} onSaved={onSaved} />
        </CardContent>
      )}
    </Card>
  );
}

function TestimoniesAdminView() {
  const { toast } = useToast();
  const { data: testimonies = [], isLoading, refetch } = useQuery<AdminTestimony[]>({
    queryKey: ["/api/admin/testimonies"],
  });
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newFullVideoUrl, setNewFullVideoUrl] = useState("");
  const [newPosition, setNewPosition] = useState("");

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/testimonies", {
      position: parseInt(newPosition) || (testimonies.length + 1),
      personName: newName,
      description: newDescription,
      thumbnailUrl: newThumbnailUrl,
      fullVideoUrl: newFullVideoUrl,
    }),
    onSuccess: () => {
      toast({ title: "Testimony created" });
      setAddingNew(false); setNewName(""); setNewDescription(""); setNewThumbnailUrl(""); setNewFullVideoUrl(""); setNewPosition("");
      refetch();
    },
    onError: () => toast({ title: "Error creating testimony", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Testimonies</h2>
          <p className="text-sm text-muted-foreground">Manage participant testimonies and their unlock conditions</p>
        </div>
        <Button onClick={() => setAddingNew(a => !a)} data-testid="button-add-testimony"><Plus className="w-4 h-4 mr-2" /> Add Testimony</Button>
      </div>

      {addingNew && (
        <Card data-testid="form-new-testimony">
          <CardHeader><CardTitle className="text-base">New Testimony</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input type="number" placeholder="Position" value={newPosition} onChange={e => setNewPosition(e.target.value)} className="w-24" data-testid="input-new-testimony-position" />
              <Input placeholder="Person name" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1" data-testid="input-new-testimony-name" />
            </div>
            <Input placeholder="Description" value={newDescription} onChange={e => setNewDescription(e.target.value)} data-testid="input-new-testimony-description" />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Thumbnail Photo</p>
              <TestimonyImageUpload currentUrl={newThumbnailUrl} onUploaded={setNewThumbnailUrl} />
            </div>
            <Input placeholder="Full video URL (optional)" value={newFullVideoUrl} onChange={e => setNewFullVideoUrl(e.target.value)} data-testid="input-new-testimony-full-video" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setAddingNew(false)} data-testid="button-cancel-new-testimony">Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newName} data-testid="button-save-new-testimony">Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : testimonies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No testimonies yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonies.map(t => <TestimonyRow key={t.id} testimony={t} onSaved={refetch} />)}
        </div>
      )}
    </div>
  );
}

function HealingAdminView() {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modSubtitle, setModSubtitle] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [modImageUrl, setModImageUrl] = useState<string | null>(null);
  const [slides, setSlides] = useState<TrackASlide[]>([]);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [addSlideType, setAddSlideType] = useState<string>("text");
  const [certTemplateFile, setCertTemplateFile] = useState<File | null>(null);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);

  const { data: modules, isLoading: modulesLoading } = useQuery<HealingModule[]>({
    queryKey: ['/api/healing/modules'],
    queryFn: () => fetch('/api/healing/modules', { credentials: 'include' }).then(r => r.json()),
  });
  const { data: allContent } = useQuery<HealingContent[]>({
    queryKey: ['/api/healing/content'],
    queryFn: () => fetch('/api/healing/content', { credentials: 'include' }).then(r => r.json()),
  });
  const { data: allUsers } = useQuery<SafeUser[]>({
    queryKey: ['/api/admin/users'],
    queryFn: () => fetch('/api/admin/users', { credentials: 'include' }).then(r => r.json()),
  });

  const reorderMutation = useMutation({
    mutationFn: async (moduleNumbers: number[]) => {
      await apiRequest("PATCH", '/api/admin/healing/modules/reorder', { moduleNumbers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/healing/modules'] });
    },
    onError: () => {
      toast({ title: "Failed to reorder modules", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (moduleNumber: number) => {
      await apiRequest("DELETE", `/api/admin/healing/modules/${moduleNumber}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/healing/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/healing/content'] });
      if (selectedModule !== null) setSelectedModule(null);
      toast({ title: "Module deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete module", variant: "destructive" });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async () => {
      const maxNum = modules && modules.length > 0 ? Math.max(...modules.map((m) => m.moduleNumber)) : 0;
      const maxSort = modules && modules.length > 0 ? Math.max(...modules.map((m) => m.sortOrder)) : 0;
      const newNum = maxNum + 1;
      const newSort = maxSort + 1;
      await apiRequest("POST", '/api/admin/healing/create-module', { moduleNumber: newNum, title: `Module ${newNum}`, sortOrder: newSort });
      return newNum;
    },
    onSuccess: (newNum) => {
      queryClient.invalidateQueries({ queryKey: ['/api/healing/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/healing/content'] });
      setSelectedModule(newNum);
      setModTitle(`Module ${newNum}`);
      setModSubtitle("");
      setCompletionMessage("");
      setModImageUrl(null);
      setSlides([]);
      setEditMode(true);
      toast({ title: "New module created" });
    },
    onError: () => {
      toast({ title: "Failed to create module", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { moduleNumber: number; title: string; subtitle: string | null; imageUrl: string | null; slides: TrackASlide[]; completionMessage: string | null }) => {
      const existingSortOrder = modules?.find((m) => m.moduleNumber === data.moduleNumber)?.sortOrder ?? data.moduleNumber;
      await apiRequest("POST", '/api/admin/healing/modules', { moduleNumber: data.moduleNumber, title: data.title, subtitle: data.subtitle, imageUrl: data.imageUrl, sortOrder: existingSortOrder });
      await apiRequest("POST", '/api/admin/healing/content', { moduleNumber: data.moduleNumber, title: data.title, subtitle: data.subtitle, imageUrl: data.imageUrl, slides: data.slides, completionMessage: data.completionMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/healing/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/healing/content'] });
      toast({ title: "Module saved" });
      setEditMode(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save module", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const handleCertUpload = async () => {
    if (!certTemplateFile) return;
    setIsUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('image', certTemplateFile);
      const res = await fetch('/api/admin/healing/certificate-template', { method: 'POST', credentials: 'include', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      toast({ title: 'Certificate template uploaded' });
      setCertTemplateFile(null);
      if (certInputRef.current) certInputRef.current.value = '';
    } catch {
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsUploadingCert(false);
    }
  };

  const contentMap = new Map((allContent ?? []).map((c) => [c.moduleNumber, c]));
  const modulesWithContent = (modules ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((m) => ({ ...m, content: contentMap.get(m.moduleNumber) }));
  const healingParticipants = allUsers?.filter((u) => u.track === 'C') ?? [];

  const loadModuleIntoState = (moduleNumber: number) => {
    const mod = modules?.find((m) => m.moduleNumber === moduleNumber);
    const cont = contentMap.get(moduleNumber);
    setModTitle(mod?.title ?? `Module ${moduleNumber}`);
    setModSubtitle(mod?.subtitle ?? "");
    setCompletionMessage(cont?.completionMessage ?? "");
    setModImageUrl(mod?.imageUrl ?? cont?.imageUrl ?? null);
    setSlides(cont?.slides ? [...cont.slides] : []);
    setExpandedSlide(null);
  };

  const handleSave = () => {
    if (selectedModule === null) return;
    saveMutation.mutate({
      moduleNumber: selectedModule,
      title: modTitle || `Module ${selectedModule}`,
      subtitle: modSubtitle || null,
      imageUrl: modImageUrl,
      slides,
      completionMessage: completionMessage || null,
    });
  };

  const handleReorder = (moduleNumber: number, dir: "up" | "down") => {
    if (!modules) return;
    const sorted = [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((m) => m.moduleNumber === moduleNumber);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newOrder = [...sorted];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderMutation.mutate(newOrder.map((m) => m.moduleNumber));
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { type: addSlideType, content: getDefaultSlideContent(addSlideType) }]);
    setExpandedSlide(slides.length);
  };

  const removeSlide = (index: number) => {
    setSlides(prev => prev.filter((_, i) => i !== index));
    if (expandedSlide === index) setExpandedSlide(null);
    else if (expandedSlide !== null && expandedSlide > index) setExpandedSlide(expandedSlide - 1);
  };

  const moveSlide = (index: number, dir: "up" | "down") => {
    const newIdx = dir === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      [next[index], next[newIdx]] = [next[newIdx], next[index]];
      return next;
    });
    if (expandedSlide === index) setExpandedSlide(newIdx);
    else if (expandedSlide === newIdx) setExpandedSlide(index);
  };

  const updateSlide = (index: number, field: "type" | "content", value: string) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  // Module list view
  if (selectedModule === null) {
    return (
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4" /> Certificate Template
            </CardTitle>
            <p className="text-sm text-muted-foreground">Upload a custom PNG certificate background for the Healing Track. Leave blank to use the default.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input ref={certInputRef} type="file" accept="image/png" data-testid="input-healing-cert-template" onChange={(e) => setCertTemplateFile(e.target.files?.[0] ?? null)} className="text-sm" />
              <Button size="sm" onClick={handleCertUpload} disabled={!certTemplateFile || isUploadingCert} data-testid="button-upload-healing-cert">
                {isUploadingCert ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Modules
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 h-8 text-xs"
                disabled={createModuleMutation.isPending}
                onClick={() => createModuleMutation.mutate()}
                data-testid="button-healing-add-module"
              >
                <Plus className="w-3 h-3" /> Add Module
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Click any module to edit its title, subtitle, and slide content.</p>
          </CardHeader>
          <CardContent className="p-0">
            {modulesLoading ? (
              <div className="space-y-2 p-4">{[1,2,3].map(i => <div key={i} className="h-12 rounded bg-secondary animate-pulse" />)}</div>
            ) : (
              <div className="divide-y divide-border">
                {modulesWithContent.map((m, idx) => (
                  <div
                    key={m.moduleNumber}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    data-testid={`row-healing-module-admin-${m.moduleNumber}`}
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => { setSelectedModule(m.moduleNumber); loadModuleIntoState(m.moduleNumber); setEditMode(false); }}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0">{m.moduleNumber < 10 ? `0${m.moduleNumber}` : m.moduleNumber}</span>
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.title}</p>
                        {m.subtitle && <p className="text-xs text-muted-foreground truncate">{m.subtitle}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground mr-2">{m.content?.slides?.length ?? 0} slides</span>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); handleReorder(m.moduleNumber, "up"); }}
                        data-testid={`button-healing-module-up-${m.moduleNumber}`}
                      >
                        <ChevronLeft className="w-3 h-3 -rotate-90" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        disabled={idx === modulesWithContent.length - 1 || reorderMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); handleReorder(m.moduleNumber, "down"); }}
                        data-testid={`button-healing-module-down-${m.moduleNumber}`}
                      >
                        <ChevronLeft className="w-3 h-3 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete Module ${m.moduleNumber} "${m.title}"? This cannot be undone.`)) {
                            deleteMutation.mutate(m.moduleNumber);
                          }
                        }}
                        data-testid={`button-healing-module-delete-${m.moduleNumber}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <ChevronRight
                        className="w-4 h-4 text-muted-foreground cursor-pointer"
                        onClick={() => { setSelectedModule(m.moduleNumber); loadModuleIntoState(m.moduleNumber); setEditMode(false); }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Module detail/edit view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedModule(null); setEditMode(false); }} className="gap-2" data-testid="button-healing-back">
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </Button>
        <Badge variant="outline">Module {selectedModule}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{modTitle || `Module ${selectedModule}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editMode ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={modTitle} onChange={e => setModTitle(e.target.value)} placeholder="Module title" data-testid="input-healing-module-title" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input value={modSubtitle} onChange={e => setModSubtitle(e.target.value)} placeholder="Brief description (optional)" data-testid="input-healing-module-subtitle" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Completion Message</label>
                <Input value={completionMessage} onChange={e => setCompletionMessage(e.target.value)} placeholder="Message shown after marking complete (optional)" data-testid="input-healing-completion-message" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Background Image</label>
                <p className="text-xs text-muted-foreground">Image displayed on the module card in the healing dashboard.</p>
                <ModuleImageUpload currentUrl={modImageUrl} onUploaded={setModImageUrl} />
              </div>
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{modTitle}</p>
                {modSubtitle && <p className="text-sm text-muted-foreground">{modSubtitle}</p>}
                {completionMessage && <p className="text-xs text-muted-foreground mt-1">Completion: "{completionMessage}"</p>}
                {modImageUrl && (
                  <div className="mt-3">
                    <img src={modImageUrl} alt="" className="h-20 w-auto rounded object-cover border border-border" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{slides.length} slide{slides.length !== 1 ? 's' : ''}</p>
              </div>
              <Button size="sm" onClick={() => { loadModuleIntoState(selectedModule); setEditMode(true); }} data-testid="button-healing-edit-module">
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {editMode && (
        <>
          <div className="space-y-3">
            {slides.map((slide, index) => {
              const isExpanded = expandedSlide === index;
              return (
                <Card key={index} data-testid={`card-healing-slide-${index}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <SlideTypeBadge type={slide.type} />
                          {!isExpanded && (
                            <span className="text-sm text-muted-foreground truncate">
                              {slide.content ? (slide.content.length > 80 ? slide.content.substring(0, 80) + "..." : slide.content) : "(empty)"}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="space-y-3 mt-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Slide Type</label>
                              <Select value={slide.type} onValueChange={(val) => {
                                updateSlide(index, "type", val);
                                const def = getDefaultSlideContent(val);
                                if (def) updateSlide(index, "content", def);
                              }}>
                                <SelectTrigger data-testid={`select-healing-slide-type-${index}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {PRELIM_SLIDE_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {slide.type === "quiz" ? (
                              <QuizSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "media" ? (
                              <MediaSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "timer" ? (
                              <TimerSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "knowledge_check" ? (
                              <KnowledgeCheckEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "knowledge_quiz" ? (
                              <KnowledgeQuizEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "survey" ? (
                              <SurveySlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "scenario" ? (
                              <ScenarioSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "chat_flow" ? (
                              <ChatFlowSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "path_selector" ? (
                              <PathSelectorSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "before_after" ? (
                              <BeforeAfterSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "image_carousel" ? (
                              <ImageCarouselSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : slide.type === "cross_grid" ? (
                              <CrossGridSlideEditor content={slide.content} onChange={(val) => updateSlide(index, "content", val)} index={index} />
                            ) : (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Content</label>
                                <Textarea
                                  value={slide.content}
                                  onChange={e => updateSlide(index, "content", e.target.value)}
                                  rows={4}
                                  placeholder="Slide content…"
                                  data-testid={`textarea-healing-slide-content-${index}`}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedSlide(isExpanded ? null : index)} data-testid={`button-toggle-healing-slide-${index}`}>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(index, "up")} disabled={index === 0} data-testid={`button-healing-slide-up-${index}`}>
                          <ChevronLeft className="w-3 h-3 -rotate-90" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(index, "down")} disabled={index === slides.length - 1} data-testid={`button-healing-slide-down-${index}`}>
                          <ChevronLeft className="w-3 h-3 rotate-90" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeSlide(index)} data-testid={`button-healing-slide-delete-${index}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Select value={addSlideType} onValueChange={setAddSlideType}>
                  <SelectTrigger className="flex-1" data-testid="select-healing-add-slide-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRELIM_SLIDE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSlide} data-testid="button-healing-add-slide">
                  <Plus className="w-4 h-4 mr-1" /> Add Slide
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => { loadModuleIntoState(selectedModule); setEditMode(false); }} data-testid="button-healing-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-healing-save-module">
              {saveMutation.isPending ? "Saving…" : "Save Module"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
