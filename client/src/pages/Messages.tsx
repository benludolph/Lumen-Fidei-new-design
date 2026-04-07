import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, useAllUsers } from "@/hooks/use-users";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
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
        background: "var(--brand-subtle)",
        border: "1px solid var(--brand-border)",
        color: "var(--brand)",
        fontFamily: "Afacad, sans-serif",
        fontSize: size * 0.33, /* approved exception: dynamically computed from avatar size prop */
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

function UserAvatar({ name, photoUrl, size = 36 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid var(--brand-border)",
        }}
      />
    );
  }
  return <InitialsAvatar name={name} size={size} />;
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
      <PageContainer
        variant="fullMd"
        className="flex"
        style={{
          height: "calc(100vh - 72px)",
          backgroundColor: "var(--surface-ground)",
          overflow: "hidden",
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
              borderRight: isMobile ? "none" : "1px solid var(--white-8)",
              background: "var(--white-3)",
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
                borderBottom: "1px solid var(--white-8)",
                flexShrink: 0,
              }}
            >
              <span className="type-display-sm font-semibold" style={{ color: "white", letterSpacing: "0.01em" }}>
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
                        background: "var(--white-6)",
                        border: "1px solid var(--white-10)",
                        color: "var(--brand)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = "var(--brand-subtle)";
                        btn.style.borderColor = "var(--brand-border)";
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = "var(--white-6)";
                        btn.style.borderColor = "var(--white-10)";
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </DialogTrigger>

                  {/* New chat dialog — dark themed */}
                  <DialogContent
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--white-8)",
                      borderRadius: "10px",
                      color: "white",
                      maxWidth: "420px",
                      width: "95vw",
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle className="type-body-md font-semibold" style={{ color: "white" }}>
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
                            color: "var(--white-40)",
                            pointerEvents: "none",
                          }}
                        />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search users…"
                          data-testid="input-search-users"
                          className="type-body-md"
                          style={{
                            width: "100%",
                            paddingLeft: "32px",
                            paddingRight: "12px",
                            paddingTop: "8px",
                            paddingBottom: "8px",
                            background: "var(--white-5)",
                            border: "1px solid var(--white-8)",
                            borderRadius: "6px",
                            color: "white",
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
                          <p className="type-body-md text-center" style={{ color: "var(--white-40)", padding: "24px 0" }}>
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
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--white-5)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "none";
                              }}
                            >
                              <UserAvatar name={u.name} photoUrl={u.profilePhotoUrl} size={32} />
                              <div>
                                <p className="type-body-md font-medium" style={{ color: "white", margin: 0 }}>
                                  {u.name}
                                </p>
                                <p className="type-body-sm" style={{ color: "var(--white-40)", margin: 0, textTransform: "capitalize" }}>
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
                <p className="type-body-md text-center" style={{ color: "var(--white-30)", padding: "32px 16px" }}>
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
                      background: isSelected ? "var(--white-6)" : "none",
                      border: "none",
                      borderLeft: isSelected
                        ? "2px solid var(--brand)"
                        : "2px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, border-color 0.15s",
                      marginBottom: "2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--white-3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "none";
                    }}
                  >
                    <UserAvatar name={contact.name} photoUrl={contact.profilePhotoUrl} size={36} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p className="type-body-md font-medium" style={{ color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contact.name}
                      </p>
                      <p className="type-body-sm" style={{ color: "var(--white-40)", margin: 0, textTransform: "capitalize" }}>
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
              background: "var(--surface-ground)",
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
                otherUserPhotoUrl={
                  contacts?.find((c) => c.id === selectedContactId)?.profilePhotoUrl ||
                  allUsers?.find((u) => u.id === selectedContactId)?.profilePhotoUrl ||
                  null
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
                  color: "var(--white-30)",
                  padding: "24px",
                  textAlign: "center",
                }}
                className="type-body-md"
              >
                Select a conversation to start messaging
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

function ChatWindow({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserPhotoUrl,
  isMobile,
  onBack,
}: {
  currentUserId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserPhotoUrl?: string | null;
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
          background: "var(--black-35)",
          borderBottom: "1px solid var(--white-8)",
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
              color: "var(--white-60)",
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
              (e.currentTarget as HTMLButtonElement).style.color = "var(--white-60)";
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <UserAvatar name={otherUserName} photoUrl={otherUserPhotoUrl} size={30} />
        <span className="type-body-lg font-medium" style={{ color: "white" }}>
          {otherUserName}
        </span>
      </div>

      {/* Messages scroll area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
        {isLoading ? (
          <div
            className="type-body-md"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--white-30)",
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
                className="type-body-md"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--white-30)",
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
                    background: isMe ? "var(--bubble-sent)" : "var(--bubble-received)",
                    color: "var(--white-90)",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                  className="type-body-md"
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
          borderTop: "1px solid var(--white-8)",
          background: "var(--white-3)",
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
            className="type-body-md"
            style={{
              flex: 1,
              padding: "9px 14px",
              background: "var(--white-5)",
              border: "1px solid var(--white-8)",
              borderRadius: "8px",
              color: "white",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-focus)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "var(--white-8)";
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
              background: isPending || !content.trim() ? "var(--brand-border)" : "var(--brand)",
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
