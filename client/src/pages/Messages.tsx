import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Messages() {
  const { user } = useAuth();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialUserId = searchParams.get('user');

  // Logic: 
  // If participant -> can only chat with Mentor (API returns just their mentor)
  // If mentor -> can chat with all assigned mentees (API returns their mentees)
  
  // API returns filtered list based on user's role - participants get their mentor, mentors get their mentees
  const { data: contacts } = useUsers();

  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  // Sync selected contact with URL parameter or default to first contact
  useEffect(() => {
    if (initialUserId) {
      setSelectedContactId(Number(initialUserId));
    } else if (contacts && contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [initialUserId, contacts, selectedContactId]);

  return (
    <Shell>
      <div className="h-[calc(100vh-8rem)] grid grid-cols-12 gap-6 bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Contacts List */}
        <div className="col-span-4 border-r border-border bg-stone-50">
          <div className="p-4 border-b border-border">
            <h2 className="font-serif font-bold text-lg">Messages</h2>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="space-y-1 p-2">
              {contacts?.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    selectedContactId === contact.id ? "bg-white shadow-sm ring-1 ring-border" : "hover:bg-white/50"
                  )}
                  data-testid={`contact-${contact.id}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
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

        {/* Chat Area */}
        <div className="col-span-8 flex flex-col bg-white">
          {selectedContactId ? (
            <ChatWindow 
              currentUserId={user!.id} 
              otherUserId={selectedContactId} 
              otherUserName={contacts?.find(c => c.id === selectedContactId)?.name || "Unknown"} 
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function ChatWindow({ currentUserId, otherUserId, otherUserName }: { currentUserId: number, otherUserId: number, otherUserName: string }) {
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

  if (isLoading) return <div className="p-4">Loading messages...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
        <Avatar className="h-8 w-8">
           <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{otherUserName}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 flex flex-col min-h-full">
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
                  "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
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
      </div>

      <div className="p-4 border-t border-border bg-stone-50 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="bg-white"
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
