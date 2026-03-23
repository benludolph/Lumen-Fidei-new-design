import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, useAllUsers } from "@/hooks/use-users";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, ArrowLeft, Plus, Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";

function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(240,120,48,0.15)",
        border: "1px solid rgba(240,120,48,0.3)",
        color: "#F07830",
        fontFamily: "Afacad, sans-serif",
        fontSize: size * 0.33,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const initialUserId = searchParams.get("user") || searchParams.get("mentorId");

  const hasNavigatedBackRef = useRef(false);

  const { data: contacts } = useUsers();
  const canAddContacts = user?.role === "admin" || user?.role === "mentor";
  const { data: allUsers } = useAllUsers(canAddContacts);

  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (hasNavigatedBackRef.current) return;
    if (initialUserId) {
      setSelectedContactId(Number(initialUserId));
    } else if (contacts && contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [initialUserId, contacts, selectedContactId]);

  useEffect(() => {
    if (user) {
      apiRequest("POST", "/api/messages/mark-read")
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/unread/count"] });
        })
        .catch(() => {});
    }
  }, [user]);

  const showChat = isMobile ? selectedContactId !== null : true;
  const showContacts = isMobile ? selectedContactId === null : true;

  const availableUsers =
    allUsers?.filter(
      (u) =>
        u.id !== user?.id &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  const handleSelectNewContact = (userId: number) => {
    hasNavigatedBackRef.current = false;
    setSelectedContactId(userId);
    setShowNewChatDialog(false);
    setSearchQuery("");
  };

  const handleBackToContacts = () => {
    hasNavigatedBackRef.current = true;
    setSelectedContactId(null);
    if (location.includes("?")) {
      setLocation("/messages");
    }
  };

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 72px)",
          backgroundColor: "#0b0b0b",
          overflow: "hidden",
          paddingLeft: isMobile ? "0" : "107px",
          paddingRight: isMobile ? "0" : "107px",
        }}
      >
        {/* ── Left panel: contacts ─────────────────────────── */}
        {showContacts && (
          <div
            style={{
              width: isMobile ? "100%" : "300px",
              minWidth: isMobile ? undefined : "260px",
              display: "flex",
              flexDirection: "column",
              borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              flexShrink: 0,
            }}
          >
            {/* Panel header */}
            <div
              style={{
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "Afacad, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "white",
                  letterSpacing: "0.01em",
                }}
              >
                Messages
              </span>

              {canAddContacts && (
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <button
                      data-testid="button-new-chat"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "#F07830",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = "rgba(240,120,48,0.12)";
                        btn.style.borderColor = "rgba(240,120,48,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = "rgba(255,255,255,0.06)";
                        btn.style.borderColor = "rgba(255,255,255,0.10)";
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </DialogTrigger>

                  {/* New chat dialog — dark themed */}
                  <DialogContent
                    style={{
                      background: "#141516",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      color: "white",
                      maxWidth: "420px",
                      width: "95vw",
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle
                        style={{
                          fontFamily: "Afacad, sans-serif",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        Start New Conversation
                      </DialogTitle>
                    </DialogHeader>

                    <div style={{ marginTop: "12px" }}>
                      {/* Search input */}
                      <div style={{ position: "relative", marginBottom: "12px" }}>
                        <Search
                          size={14}
                          style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "rgba(255,255,255,0.4)",
                            pointerEvents: "none",
                          }}
                        />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search users…"
                          data-testid="input-search-users"
                          style={{
                            width: "100%",
                            paddingLeft: "32px",
                            paddingRight: "12px",
                            paddingTop: "8px",
                            paddingBottom: "8px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "6px",
                            color: "white",
                            fontFamily: "Afacad, sans-serif",
                            fontSize: "14px",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* User list */}
                      <div
                        style={{
                          maxHeight: "280px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {availableUsers.length === 0 ? (
                          <p
                            style={{
                              fontFamily: "Afacad, sans-serif",
                              fontSize: "14px",
                              color: "rgba(255,255,255,0.4)",
                              textAlign: "center",
                              padding: "24px 0",
                            }}
                          >
                            {searchQuery ? "No users found" : "No new users to message"}
                          </p>
                        ) : (
                          availableUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => handleSelectNewContact(u.id)}
                              data-testid={`new-contact-${u.id}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 10px",
                                borderRadius: "6px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 0.15s",
                                width: "100%",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "rgba(255,255,255,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "none";
                              }}
                            >
                              <InitialsAvatar name={u.name} size={32} />
                              <div>
                                <p
                                  style={{
                                    fontFamily: "Afacad, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "white",
                                    margin: 0,
                                  }}
                                >
                                  {u.name}
                                </p>
                                <p
                                  style={{
                                    fontFamily: "Afacad, sans-serif",
                                    fontSize: "12px",
                                    color: "rgba(255,255,255,0.4)",
                                    margin: 0,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {u.role}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Contact list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {contacts?.length === 0 && (
                <p
                  style={{
                    fontFamily: "Afacad, sans-serif",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.3)",
                    textAlign: "center",
                    padding: "32px 16px",
                  }}
                >
                  No contacts available.
                </p>
              )}

              {contacts?.map((contact) => {
                const isSelected = selectedContactId === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      hasNavigatedBackRef.current = false;
                      setSelectedContactId(contact.id);
                    }}
                    data-testid={`contact-${contact.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 10px 10px 8px",
                      borderRadius: "6px",
                      background: isSelected ? "rgba(255,255,255,0.06)" : "none",
                      border: "none",
                      borderLeft: isSelected
                        ? "2px solid #F07830"
                        : "2px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, border-color 0.15s",
                      marginBottom: "2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "none";
                    }}
                  >
                    <InitialsAvatar name={contact.name} size={36} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontFamily: "Afacad, sans-serif",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "white",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {contact.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "Afacad, sans-serif",
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.4)",
                          margin: 0,
                          textTransform: "capitalize",
                        }}
                      >
                        {contact.role}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Right panel: chat ─────────────────────────────── */}
        {showChat && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              background: "#0b0b0b",
            }}
          >
            {selectedContactId ? (
              <ChatWindow
                currentUserId={user!.id}
                otherUserId={selectedContactId}
                otherUserName={
                  contacts?.find((c) => c.id === selectedContactId)?.name ||
                  allUsers?.find((u) => u.id === selectedContactId)?.name ||
                  "Unknown"
                }
                isMobile={isMobile}
                onBack={handleBackToContacts}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Afacad, sans-serif",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.3)",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                Select a conversation to start messaging
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ChatWindow({
  currentUserId,
  otherUserId,
  otherUserName,
  isMobile,
  onBack,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage({ receiverId: otherUserId, content }, { onSuccess: () => setContent("") });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat header — glass blur */}
      <div
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 16px",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          background: "rgba(0,0,0,0.35)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {isMobile && (
          <button
            data-testid="button-back-to-contacts"
            onClick={onBack}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <InitialsAvatar name={otherUserName} size={30} />
        <span
          style={{
            fontFamily: "Afacad, sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "white",
          }}
        >
          {otherUserName}
        </span>
      </div>

      {/* Messages scroll area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontFamily: "Afacad, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Loading messages…
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              minHeight: "100%",
            }}
          >
            {messages?.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Afacad, sans-serif",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.3)",
                  paddingTop: "40px",
                }}
              >
                No messages yet. Start the conversation!
              </div>
            )}

            {messages?.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  data-testid={`message-${msg.id}`}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "72%",
                    padding: "9px 14px",
                    borderRadius: isMe ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                    background: isMe ? "#484D55" : "#292929",
                    color: "rgba(255,255,255,0.9)",
                    fontFamily: "Afacad, sans-serif",
                    fontSize: "14px",
                    lineHeight: "1.45",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <form
          onSubmit={handleSend}
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message…"
            data-testid="input-message"
            style={{
              flex: 1,
              padding: "9px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              color: "white",
              fontFamily: "Afacad, sans-serif",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "rgba(240,120,48,0.4)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "rgba(255,255,255,0.08)";
            }}
          />
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            data-testid="button-send-message"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background:
                isPending || !content.trim() ? "rgba(240,120,48,0.3)" : "#F07830",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPending || !content.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
