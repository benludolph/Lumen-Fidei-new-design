import { useState, useRef } from "react";
import { Link } from "wouter";
import { ChevronRight, Camera, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HealingLayout } from "@/components/layout/HealingLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import UserProfileEditor from "@/components/workbook/UserProfileEditor";

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

function MentorProfileEditor({ user }: { user: { name: string; profilePhotoUrl?: string | null } }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentPhotoUrl = previewUrl || user.profilePhotoUrl || null;

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

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginBottom: "4px",
          }}
        >
          My Profile
        </h2>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Afacad', sans-serif" }}>
          Your profile photo appears next to your messages and in participant lessons.
        </p>
      </div>

      {/* Photo upload section */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          Profile Photo
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Avatar */}
          <div
            style={{ position: "relative", flexShrink: 0 }}
            className="group"
          >
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
          </div>

          <div>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "white",
                margin: "0 0 4px",
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.35)",
                margin: "0 0 12px",
              }}
            >
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
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.11)";
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
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
