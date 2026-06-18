import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Camera, Loader2, Check } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HealingLayout } from "@/components/layout/HealingLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import UserProfileEditor from "@/components/workbook/UserProfileEditor";
import type { UserProfile } from "@shared/schema";

function Breadcrumb({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: "60px",
        display: "flex",
        alignItems: "center",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "var(--black-35)",
        borderBottom: "1px solid var(--white-8)",
        boxShadow: "0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)",
      }}
    >
      <PageContainer variant="full" className="flex items-center gap-2">
        <Link href={backHref}>
          <span
            data-testid="breadcrumb-back"
            className="type-body-lg"
            style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {backLabel}
          </span>
        </Link>
        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>
        <span
          data-testid="breadcrumb-current"
          className="type-body-lg"
          style={{ color: "var(--white-60)", whiteSpace: "nowrap" }}
        >
          My Profile
        </span>
      </PageContainer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.85)",
  fontFamily: "'Afacad', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Afacad', sans-serif",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "6px",
  display: "block",
};

function MentorProfileEditor({ user }: { user: { id: number; name: string; profilePhotoUrl?: string | null } }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Name editing
  const [nameValue, setNameValue] = useState(user.name);
  const [nameSaveState, setNameSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // Bio editing
  const [bioValue, setBioValue] = useState<string>("");
  const [bioSaveState, setBioSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const bioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bioHydrated = useRef(false);

  const currentPhotoUrl = previewUrl || user.profilePhotoUrl || null;

  // Load existing profile for bio
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user-profile", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (profile !== undefined && !bioHydrated.current) {
      bioHydrated.current = true;
      setBioValue(profile?.bio ?? "");
    }
  }, [profile]);

  const saveBioMutation = useMutation({
    mutationFn: async (bio: string) => {
      return apiRequest("PUT", "/api/user-profile", {
        familyMembers: profile?.familyMembers ?? [],
        spouseName: profile?.spouseName ?? "",
        childrenNames: profile?.childrenNames ?? [],
        chronicIssues: profile?.chronicIssues ?? [],
        chronicIdentityLabels: profile?.chronicIdentityLabels ?? [],
        bio,
      });
    },
    onMutate: () => setBioSaveState("saving"),
    onSuccess: () => {
      setBioSaveState("saved");
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile"] });
      setTimeout(() => setBioSaveState("idle"), 1800);
    },
    onError: () => setBioSaveState("idle"),
  });

  function handleBioChange(value: string) {
    setBioValue(value);
    if (bioDebounceRef.current) clearTimeout(bioDebounceRef.current);
    bioDebounceRef.current = setTimeout(() => {
      saveBioMutation.mutate(value);
    }, 700);
  }

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue === user.name) return;
    setNameSaveState("saving");
    try {
      await apiRequest("PATCH", "/api/user/name", { name: nameValue.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setNameSaveState("saved");
      toast({ title: "Name updated", description: "Your display name has been saved." });
      setTimeout(() => setNameSaveState("idle"), 1800);
    } catch (err: any) {
      setNameSaveState("idle");
      toast({ title: "Failed to save", description: err?.message || "Please try again.", variant: "destructive" });
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/mentor/upload-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      const data = await res.json();
      setPreviewUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "16px",
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontFamily: "'IvyOra Display', serif",
            fontSize: "1.5rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.9)",
            marginBottom: "4px",
          }}
        >
          My Profile
        </h2>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Afacad', sans-serif" }}>
          Your photo and name appear in mentor lessons and participant messages.
        </p>
      </div>

      {/* Photo section */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Profile Photo</label>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "var(--brand-subtle)",
              border: "1.5px solid var(--brand-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--brand)",
              flexShrink: 0,
            }}
          >
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt={user.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>
              {currentPhotoUrl ? "Photo uploaded" : "No photo uploaded yet"}
            </p>
            <button
              data-testid="button-change-photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(255,255,255,0.07)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: isUploading ? "not-allowed" : "pointer",
                opacity: isUploading ? 0.6 : 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.11)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
              }}
            >
              {isUploading ? (
                <><Loader2 size={13} className="animate-spin" /> Uploading…</>
              ) : (
                <><Camera size={13} /> {currentPhotoUrl ? "Change Photo" : "Upload Photo"}</>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
              data-testid="input-photo-file"
            />
          </div>
        </div>
      </div>

      {/* Display name section */}
      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="mentor-display-name">
          Display Name
        </label>
        <p style={{ marginTop: "-2px", marginBottom: "10px", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4, fontFamily: "'Afacad', sans-serif" }}>
          Shown next to your messages and in participant lessons.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            id="mentor-display-name"
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
            data-testid="input-display-name"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
          />
          <button
            onClick={handleSaveName}
            disabled={nameSaveState === "saving" || !nameValue.trim() || nameValue === user.name}
            data-testid="button-save-name"
            style={{
              padding: "0 14px",
              height: "36px",
              background: nameSaveState === "saved" ? "rgba(120,220,120,0.15)" : "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              color: nameSaveState === "saved" ? "rgba(120,220,120,0.8)" : "rgba(255,255,255,0.65)",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: nameSaveState === "saving" || !nameValue.trim() || nameValue === user.name ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              opacity: !nameValue.trim() || nameValue === user.name ? 0.4 : 1,
            }}
          >
            {nameSaveState === "saving" ? (
              <><Loader2 size={12} className="animate-spin" /> Saving</>
            ) : nameSaveState === "saved" ? (
              <><Check size={12} /> Saved</>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {/* Bio section */}
      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="mentor-bio">
          Short Bio
          {bioSaveState !== "idle" && (
            <span
              style={{
                marginLeft: "8px",
                fontWeight: 600,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: bioSaveState === "saved" ? "rgba(120,220,120,0.7)" : "rgba(255,255,255,0.3)",
              }}
            >
              {bioSaveState === "saving" ? "Saving…" : "Saved"}
            </span>
          )}
        </label>
        <p style={{ marginTop: "-2px", marginBottom: "10px", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4, fontFamily: "'Afacad', sans-serif" }}>
          A short introduction about yourself visible to your mentees.
        </p>
        <textarea
          id="mentor-bio"
          value={bioValue}
          onChange={(e) => handleBioChange(e.target.value)}
          placeholder="Share a little about yourself…"
          data-testid="input-mentor-bio"
          rows={4}
          style={{
            ...inputStyle,
            height: "auto",
            resize: "vertical",
            padding: "10px 12px",
            lineHeight: 1.6,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const isHealingTrack = user?.track === "C";
  const isMentor = user?.role === "mentor";
  const Layout = isHealingTrack ? HealingLayout : DashboardLayout;

  const backHref = isMentor ? "/mentor" : "/resources";
  const backLabel = isMentor ? "Dashboard" : "Resources";

  return (
    <Layout>
      <Breadcrumb backHref={backHref} backLabel={backLabel} />
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          minHeight: "calc(100vh - 132px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PageContainer variant="narrow" className="pt-10 pb-16">
          {isMentor && user ? (
            <MentorProfileEditor user={user} />
          ) : (
            <UserProfileEditor />
          )}
        </PageContainer>
      </div>
    </Layout>
  );
}
