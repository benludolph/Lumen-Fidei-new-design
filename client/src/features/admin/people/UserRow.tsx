import { useState, useRef } from "react";
import { TrackAssignment } from "@/components/TrackManagement";
import { trackFetch as fetch } from "@/lib/track-context";
import { useUpdateUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Trash2, Upload, Image as ImageIcon, UserX, UserCheck, CalendarCheck, CalendarClock, BookX } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserDetailsDialog } from "@/features/admin/people/UserDetailsDialog";

export function UserRow({ user, allUsers }: { user: any, allUsers: any[] }) {
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

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      const action = user.isActive === false ? "reactivate" : "deactivate";
      const res = await apiRequest("POST", `/api/admin/users/${user.id}/${action}`);
      return res.json();
    },
    onSuccess: () => {
      const wasActive = user.isActive !== false;
      toast({ title: wasActive ? "Account deactivated" : "Account reactivated", description: wasActive ? `${user.name} can no longer log in. All data is preserved.` : `${user.name} can now log in again.` });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({ title: "Action failed", variant: "destructive" });
    },
  });

  const handleAssignRole = (role: string) => {
    updateUser({ id: user.id, role: role as any });
  };

  const handleToggleDayOverride = () => {
    const hasOverride = user.manualDayOverride != null;
    updateUser({ id: user.id, manualDayOverride: hasOverride ? null : 30 } as any);
  };

  const handleToggleWorkbookExempt = () => {
    updateUser({ id: user.id, workbookExempt: !user.workbookExempt } as any);
  };

  const handleAssignMentor = (mentorId: string) => {
     updateUser({ id: user.id, mentorId: Number(mentorId) });
  };
  
  const handleAssignTrack = (track: string) => {
    updateUser({ id: user.id, track });
  };

  const handleAssignVariant = (val: string) => {
    updateUser({ id: user.id, contentVariantSnapshotId: val === "live" ? null : Number(val) } as any);
  };

  const variantsQuery = useQuery<{ id: number; name: string; variantLabel: string | null }[]>({
    queryKey: ['/api/admin/track-a/variants'],
    queryFn: () => fetch('/api/admin/track-a/variants', { credentials: 'include' }).then(r => r.json()),
  });

  const handleResetPassword = () => {
    if (newPassword.length >= 6) {
      resetPasswordMutation.mutate(newPassword);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={user.isActive === false ? "text-muted-foreground line-through" : ""}>{user.name}</span>
          {user.isActive === false && (
            <Badge variant="secondary" className="text-xs">Deactivated</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell>
        {user.role === 'admin' ? (
          <span className="capitalize text-muted-foreground">{user.role}</span>
        ) : (
          <Select value={user.role} onValueChange={handleAssignRole}>
            <SelectTrigger className="w-[120px] h-8" data-testid={`select-role-${user.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="participant">Participant</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="superuser">Superuser</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        {(user.role === 'participant' || user.role === 'superuser') ? (
           <TrackAssignment value={user.track} onChange={handleAssignTrack} />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {(user.role === 'participant' || user.role === 'superuser') ? (
          <Select
            value={user.contentVariantSnapshotId ? String(user.contentVariantSnapshotId) : "live"}
            onValueChange={handleAssignVariant}
          >
            <SelectTrigger className="w-[130px] h-8" data-testid={`select-variant-${user.id}`}>
              <SelectValue placeholder="Live" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live</SelectItem>
              {(variantsQuery.data ?? []).map(v => (
                <SelectItem key={v.id} value={String(v.id)} data-testid={`option-variant-${v.id}`}>
                  {v.variantLabel || v.name}
                </SelectItem>
              ))}
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

          {user.role === 'participant' && (
            <Button
              variant="ghost"
              size="icon"
              title={user.manualDayOverride != null ? "Remove day override (use cohort calendar)" : "Unlock all 30 days for this participant"}
              data-testid={`button-day-override-${user.id}`}
              onClick={handleToggleDayOverride}
            >
              {user.manualDayOverride != null ? (
                <CalendarCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {user.role === 'participant' && (
            <Button
              variant="ghost"
              size="icon"
              title={user.workbookExempt ? "Remove workbook exemption (restore access)" : "Exempt from deliverance workbook (scrupulosity)"}
              data-testid={`button-workbook-exempt-${user.id}`}
              onClick={handleToggleWorkbookExempt}
            >
              <BookX className={`w-4 h-4 ${user.workbookExempt ? "text-amber-500" : "text-muted-foreground"}`} />
            </Button>
          )}

          {user.role !== 'admin' && (
            <Button
              variant="ghost"
              size="icon"
              title={user.isActive === false ? "Reactivate account" : "Deactivate account"}
              data-testid={`button-toggle-active-${user.id}`}
              onClick={() => toggleActiveMutation.mutate()}
              disabled={toggleActiveMutation.isPending}
            >
              {user.isActive === false ? (
                <UserCheck className="w-4 h-4 text-green-600" />
              ) : (
                <UserX className="w-4 h-4 text-amber-500" />
              )}
            </Button>
          )}

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
