import { useState } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type MessageData = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export function MessageManagementView() {
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
