import { useState } from "react";
import { TrackAssignment } from "@/components/TrackManagement";
import { useTracks } from "@/hooks/use-tracks";
import { useCreateUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const tracks = useTracks();
  const { toast } = useToast();
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
    if ((data.role === "participant" || data.role === "superuser") &&
      !tracks.data?.some(track => track.id === data.track && track.status === "published")) {
      toast({ title: "Choose a published track", variant: "destructive" });
      return;
    }
    // Ensure startDate is set for participants
    const payload = {
      ...data,
      startDate: new Date(), // Start today by default
    };
    try {
      await mutateAsync(payload);
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Could not create user", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
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
              <TrackAssignment value={form.watch("track")} onChange={v => form.setValue("track", v)} />
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
