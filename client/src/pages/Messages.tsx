import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, useAllUsers } from "@/hooks/use-users";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, User as UserIcon, ArrowLeft, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Messages() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialUserId = searchParams.get('user');

  // API returns filtered list based on user's role
  const { data: contacts } = useUsers();
  // For admins/mentors: get all users for adding new conversations
  const { data: allUsers } = useAllUsers();

  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync selected contact with URL parameter or default to first contact
  useEffect(() => {
    if (initialUserId) {
      setSelectedContactId(Number(initialUserId));
    } else if (contacts && contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [initialUserId, contacts, selectedContactId]);

  // Mark messages as read when visiting the Messages page
  useEffect(() => {
    if (user) {
      apiRequest("POST", "/api/messages/mark-read").then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/messages/unread/count"] });
      }).catch(() => {
        // Silently fail - not critical
      });
    }
  }, [user]);

  // For mobile: show either contacts list or chat, not both
  const showChat = isMobile ? selectedContactId !== null : true;
  const showContacts = isMobile ? selectedContactId === null : true;

  // Filter users for new chat dialog (exclude only self, allow searching all users)
  const availableUsers = allUsers?.filter(u => 
    u.id !== user?.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleSelectNewContact = (userId: number) => {
    setSelectedContactId(userId);
    setShowNewChatDialog(false);
    setSearchQuery("");
  };

  const handleBackToContacts = () => {
    setSelectedContactId(null);
  };

  const canAddContacts = user?.role === 'admin' || user?.role === 'mentor';

  return (
    <Shell>
      <div className={cn(
        "bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden",
        isMobile ? "h-[calc(100vh-6rem)]" : "h-[calc(100vh-8rem)] grid grid-cols-12"
      )}>
        {/* Contacts List - Hidden on mobile when chat is open */}
        {showContacts && (
          <div className={cn(
            "border-r border-border bg-stone-50 dark:bg-muted/30 flex flex-col",
            isMobile ? "h-full" : "col-span-4"
          )}>
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-2 shrink-0">
              <h2 className="font-serif font-bold text-base sm:text-lg">Messages</h2>
              {canAddContacts && (
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-new-chat">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search users..."
                          className="pl-9"
                          data-testid="input-search-users"
                        />
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-1">
                          {availableUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {searchQuery ? "No users found" : "No new users to message"}
                            </p>
                          ) : (
                            availableUsers.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => handleSelectNewContact(u.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                                data-testid={`new-contact-${u.id}`}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                    {u.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{u.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {contacts?.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedContactId === contact.id ? "bg-white dark:bg-background shadow-sm ring-1 ring-border" : "hover:bg-white/50 dark:hover:bg-background/50"
                    )}
                    data-testid={`contact-${contact.id}`}
                  >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{contact.role}</p>
                    </div>
                  </button>
                ))}
                
                {contacts?.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No contacts available.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Chat Area */}
        {showChat && (
          <div className={cn(
            "flex flex-col bg-white dark:bg-card",
            isMobile ? "h-full" : "col-span-8"
          )}>
            {selectedContactId ? (
              <ChatWindow 
                currentUserId={user!.id} 
                otherUserId={selectedContactId} 
                otherUserName={contacts?.find(c => c.id === selectedContactId)?.name || 
                              allUsers?.find(u => u.id === selectedContactId)?.name || 
                              "Unknown"} 
                isMobile={isMobile}
                onBack={handleBackToContacts}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

function ChatWindow({ 
  currentUserId, 
  otherUserId, 
  otherUserName,
  isMobile,
  onBack
}: { 
  currentUserId: number; 
  otherUserId: number; 
  otherUserName: string;
  isMobile: boolean;
  onBack: () => void;
}) {
  const { data: messages, isLoading } = useMessages(otherUserId);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    sendMessage(
      { receiverId: otherUserId, content },
      { onSuccess: () => setContent("") }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2 sm:gap-3 shrink-0 bg-white dark:bg-card">
        {isMobile && (
          <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back-to-contacts">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary">{otherUserName.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm sm:text-base">{otherUserName}</span>
      </div>
      
      {/* Messages - Scrollable container with fixed height */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Loading messages...
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 flex flex-col min-h-full">
              {messages?.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages?.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2 rounded-2xl text-sm",
                      isMe 
                        ? "bg-primary text-primary-foreground self-end rounded-br-none" 
                        : "bg-secondary text-secondary-foreground self-start rounded-bl-none"
                    )}
                    data-testid={`message-${msg.id}`}
                  >
                    {msg.content}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="p-3 sm:p-4 border-t border-border bg-stone-50 dark:bg-muted/30 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="bg-white dark:bg-background text-sm"
            data-testid="input-message"
          />
          <Button type="submit" size="icon" disabled={isPending || !content.trim()} data-testid="button-send-message">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
