import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Users, BarChart3, CheckCircle2, Circle, Sun, Moon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

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
      </Tabs>
    </Shell>
  );
}

function UserRow({ user, allUsers }: { user: any, allUsers: any[] }) {
  const { mutate: updateUser } = useUpdateUser();
  const mentors = allUsers.filter(u => u.role === 'mentor');

  // Simple quick-edit for assignment
  const handleAssignMentor = (mentorId: string) => {
     updateUser({ id: user.id, mentorId: Number(mentorId) });
  };
  
  const handleAssignTrack = (track: string) => {
    // Cast to correct enum type manually for simplicity
    updateUser({ id: user.id, track: track as "A" | "B" | "C" });
  };

  const mentorName = allUsers.find(u => u.id === user.mentorId)?.name;

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
        {/* Actions like delete/reset password could go here */}
      </TableCell>
    </TableRow>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Participant Progress</CardTitle>
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
              <TableHead>Today</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progressData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No participants yet
                </TableCell>
              </TableRow>
            ) : progressData?.map((p) => (
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
                    <Progress value={(p.daysCompleted / 30) * 100} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground">{p.daysCompleted}/30</span>
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
