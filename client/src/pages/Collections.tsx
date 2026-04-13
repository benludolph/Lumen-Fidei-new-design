import { useRef, useCallback, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { Lock, Play, X, CircleUser } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import augustineImg from "@assets/Augustine_1773958855879.webp";
import benedictImg from "@assets/Benedict_1773958855880.webp";
import catherineImg from "@assets/Catherine_of_Siena_1773958855880.webp";
import francisImg from "@assets/Francis_1773958855880.webp";
import francisBorgiaImg from "@assets/Francis_Borgia_1773958855880.webp";
import gemmaImg from "@assets/Gemma_Galgani_1773958855880.webp";
import johnCrossImg from "@assets/John_of_the_Cross_1773958855880.png";
import johnVianImg from "@assets/John_Vianney_1773958855880.webp";
import josephImg from "@assets/Joseph_1773958855880.webp";
import maxImg from "@assets/Maximilian_Kolbe_1773958855880.webp";
import padreImg from "@assets/Padre_Pio_1773958855880.webp";
import jpiiImg from "@assets/Pope_JOhn_Paul_II_1773958855880.webp";
import teresaCalcImg from "@assets/Teresa_of_Calcutta_1773958855880.webp";
import teresaAvilaImg from "@assets/Teresa_1773958855880.webp";
import thereseImg from "@assets/Therese_of_Liseux_1773958855881.webp";

interface Saint {
  id: string;
  name: string;
  image: string;
}

const SAINTS: Saint[] = [
  { id: "augustine", name: "St. Augustine of Hippo", image: augustineImg },
  { id: "benedict", name: "St. Benedict", image: benedictImg },
  { id: "catherine", name: "St. Catherine of Siena", image: catherineImg },
  { id: "francis", name: "St. Francis of Assisi", image: francisImg },
  { id: "francis-borgia", name: "St. Francis Borgia", image: francisBorgiaImg },
  { id: "gemma", name: "St. Gemma Galgani", image: gemmaImg },
  { id: "john-cross", name: "St. John of the Cross", image: johnCrossImg },
  { id: "john-vian", name: "St. John Vianney", image: johnVianImg },
  { id: "joseph", name: "St. Joseph", image: josephImg },
  { id: "maximilian", name: "St. Maximilian Kolbe", image: maxImg },
  { id: "padre-pio", name: "Padre Pio", image: padreImg },
  { id: "jpii", name: "Pope John Paul II", image: jpiiImg },
  { id: "teresa-calcutta", name: "St. Teresa of Calcutta", image: teresaCalcImg },
  { id: "teresa-avila", name: "St. Teresa of Ávila", image: teresaAvilaImg },
  { id: "therese", name: "St. Thérèse of Lisieux", image: thereseImg },
];

// ─── Saints tab components ────────────────────────────────────────────────────

function HoloCard({ saint }: { saint: Saint }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const rainbowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isHovering = useRef(false);

  const applyEffect = useCallback((mx: number, my: number, rect: DOMRect) => {
    const px = (mx - rect.left) / rect.width;
    const py = (my - rect.top) / rect.height;
    const cx = px - 0.5;
    const cy = py - 0.5;

    const rotateX = cy * -14;
    const rotateY = cx * 14;

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`;
      cardRef.current.style.transition = "none";
    }

    if (overlayRef.current) {
      overlayRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, var(--white-18) 0%, rgba(120,180,255,0.08) 30%, transparent 65%)`;
      overlayRef.current.style.opacity = "1";
    }

    if (sheenRef.current) {
      const angle = 120;
      const pos = (px * 100 + py * 100) / 2;
      sheenRef.current.style.background = `linear-gradient(${angle}deg, transparent ${pos - 25}%, var(--white-12) ${pos}%, var(--white-8) ${pos + 5}%, transparent ${pos + 30}%)`;
      sheenRef.current.style.opacity = "1";
    }

    if (rainbowRef.current) {
      rainbowRef.current.style.opacity = "0.15";
      const hueShift = px * 120;
      rainbowRef.current.style.background = `linear-gradient(${125 + cx * 30}deg, hsl(${200 + hueShift},100%,70%) 0%, hsl(${240 + hueShift},90%,65%) 25%, hsl(${280 + hueShift},85%,60%) 50%, hsl(${200 + hueShift},80%,70%) 75%, hsl(${220 + hueShift},90%,65%) 100%)`;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering.current) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX;
    const my = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => applyEffect(mx, my, rect));
  }, [applyEffect]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isHovering.current = true;
    if (rainbowRef.current) rainbowRef.current.style.opacity = "0.15";
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    applyEffect(e.clientX, e.clientY, rect);
  }, [applyEffect]);

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.4s ease";
      cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = "opacity 0.4s ease";
      overlayRef.current.style.opacity = "0";
    }
    if (sheenRef.current) {
      sheenRef.current.style.transition = "opacity 0.4s ease";
      sheenRef.current.style.opacity = "0";
    }
    if (rainbowRef.current) {
      rainbowRef.current.style.transition = "opacity 0.4s ease";
      rainbowRef.current.style.opacity = "0";
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{ perspective: "800px", cursor: "pointer" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`card-saint-${saint.id}`}
    >
      <div
        ref={cardRef}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: "6px",
          overflow: "hidden",
          border: "0.5px solid var(--white-5)",
          transformStyle: "preserve-3d",
          willChange: "transform",
          boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        <img
          src={saint.image}
          alt={saint.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
          draggable={false}
        />

        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            zIndex: 1,
          }}
        />

        <div
          ref={sheenRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            zIndex: 2,
          }}
        />

        <div
          ref={rainbowRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            mixBlendMode: "color-dodge",
            zIndex: 3,
            background:
              "linear-gradient(125deg, hsl(200,100%,70%) 0%, hsl(240,90%,65%) 25%, hsl(280,85%,60%) 50%, hsl(200,80%,70%) 75%, hsl(220,90%,65%) 100%)",
          }}
        />
      </div>
    </div>
  );
}

function SaintsDivider() {
  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(180,188,208,0.15))" }} />
      <span className="type-caption-md whitespace-nowrap" style={{ color: "#d0d6e0" }}>
        SAINTS
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(180,188,208,0.15))" }} />
    </div>
  );
}

// ─── Testimonies tab components ───────────────────────────────────────────────

interface TestimonyPartWithStatus {
  id: number;
  testimonyId: number;
  partNumber: number;
  title: string;
  videoUrl: string;
  unlockKey: string;
  unlocked: boolean;
}

interface TestimonyWithStatus {
  id: number;
  position: number;
  personName: string;
  description: string;
  thumbnailUrl: string;
  fullVideoUrl: string;
  parts: TestimonyPartWithStatus[];
  unlockedCount: number;
  totalParts: number;
  fullyUnlocked: boolean;
}

function unlockHintText(unlockKey: string): string {
  if (unlockKey === "prelim") return "Complete Preliminary Modules";
  const weekFirstMatch = unlockKey.match(/^week-(\d+)-first$/);
  if (weekFirstMatch) return `Complete Week ${weekFirstMatch[1]} first lesson`;
  const weekLastMatch = unlockKey.match(/^week-(\d+)-last$/);
  if (weekLastMatch) return `Complete Week ${weekLastMatch[1]}`;
  return "Complete more lessons";
}

function getEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v");
      if (!id) id = u.pathname.split("/").filter(Boolean).pop() ?? "";
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    if (u.hostname === "player.cloudinary.com") {
      u.searchParams.set("autoplay", "true");
      u.searchParams.set("controls", "true");
      return u.toString();
    }
    if (u.hostname === "res.cloudinary.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const cloudName = parts[0];
      const uploadIdx = parts.indexOf("upload");
      if (uploadIdx >= 0) {
        const publicId = parts.slice(uploadIdx + 1).join("/").replace(/\.[^.]+$/, "");
        return `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${encodeURIComponent(publicId)}&autoplay=true&controls=true`;
      }
    }
  } catch (_) {}
  return raw;
}

function VideoModal({
  open,
  onClose,
  videoUrl,
  title,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-3xl w-full p-0 overflow-hidden bg-black border-0"
        data-testid="dialog-video-modal"
      >
        <div className="relative">
          <button
            onClick={onClose}
            data-testid="button-close-video-modal"
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {open && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={getEmbedUrl(videoUrl)}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
        <div className="px-5 py-3 bg-black">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TestimonyCard({
  testimony,
  onPlay,
}: {
  testimony: TestimonyWithStatus;
  onPlay: (url: string, title: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLocked = testimony.unlockedCount === 0;
  const firstUnlockedPart = testimony.parts.find(p => p.unlocked);
  const lockHint = testimony.parts[0] ? unlockHintText(testimony.parts[0].unlockKey) : "Complete more lessons";

  const handleClick = () => {
    if (isLocked) return;
    if (testimony.fullyUnlocked && testimony.fullVideoUrl) {
      onPlay(testimony.fullVideoUrl, `${testimony.personName} — Full Testimony`);
    } else if (firstUnlockedPart) {
      onPlay(
        firstUnlockedPart.videoUrl,
        `${testimony.personName}${firstUnlockedPart.title ? ` — ${firstUnlockedPart.title}` : ` — Part ${firstUnlockedPart.partNumber}`}`
      );
    }
  };

  const INFO_H = 62;

  return (
    <div
      data-testid={`card-testimony-${testimony.id}`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3/4",
        background: "#0F1011",
        border: `1px solid ${hovered && !isLocked ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "6px",
        overflow: "hidden",
        cursor: isLocked ? "default" : "pointer",
        transition: "border-color 0.2s",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: `${INFO_H}px`,
          mixBlendMode: "luminosity",
          opacity: isLocked ? 0.3 : hovered ? 0.65 : 0.5,
          transition: "opacity 0.2s",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "#0f1011" }} />
        {testimony.thumbnailUrl ? (
          <img
            alt={testimony.personName}
            src={testimony.thumbnailUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.7,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircleUser size={48} style={{ color: "rgba(255,255,255,0.12)" }} />
          </div>
        )}
      </div>

      {!isLocked && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: `${INFO_H}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            background: "rgba(0,0,0,0.2)",
            transition: "opacity 0.2s",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={18} style={{ color: "white", fill: "white", marginLeft: "2px" }} />
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${INFO_H}px`,
          background: "#0F1011",
          borderTop: "0.5px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: "14px",
          paddingLeft: "8px",
          paddingRight: "8px",
          gap: "3px",
        }}
      >
        <div
          className="absolute flex items-center justify-center rounded-full w-[10px] h-[10px] sm:w-[20px] sm:h-[20px] -top-[5px] sm:-top-[10px]"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1b1c1d",
            zIndex: 2,
          }}
        >
          {isLocked
            ? <Lock className="w-[4px] h-[4px] sm:w-[8px] sm:h-[8px]" style={{ color: "rgba(255,255,255,0.4)" }} />
            : <CircleUser className="w-[4px] h-[4px] sm:w-[8px] sm:h-[8px]" style={{ color: "rgba(255,255,255,0.5)" }} />
          }
        </div>

        <p
          className="type-caption-sm"
          style={{
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {isLocked ? lockHint : (testimony.description || "\u00A0")}
        </p>

        <p
          data-testid={`text-testimony-name-${testimony.id}`}
          style={{
            fontFamily: "'IvyOra Display', serif",
            fontWeight: 500,
            fontSize: "15px",
            lineHeight: 1,
            color: isLocked ? "rgba(255,255,255,0.35)" : "white",
            margin: 0,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {testimony.personName}
        </p>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-1px",
          pointerEvents: "none",
          borderRadius: "inherit",
          boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}

function TestimoniesTabDivider() {
  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(180,188,208,0.15))" }} />
      <span className="type-caption-md whitespace-nowrap" style={{ color: "#d0d6e0" }}>
        COMPLETE LESSONS TO UNLOCK
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(180,188,208,0.15))" }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        width: "100%",
        aspectRatio: "3/4",
        background: "var(--surface-raised)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
      }}
    />
  );
}

function TestimoniesTab() {
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  const { data: testimonies = [], isLoading } = useQuery<TestimonyWithStatus[]>({
    queryKey: ["/api/testimonies"],
  });

  const openVideo = (url: string, title: string) => {
    setModalUrl(url);
    setModalTitle(title);
  };
  const closeModal = () => setModalUrl(null);

  return (
    <>
      <VideoModal
        open={!!modalUrl}
        onClose={closeModal}
        videoUrl={modalUrl ?? ""}
        title={modalTitle}
      />

      <TestimoniesTabDivider />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : testimonies.length === 0 ? (
        <p className="type-body-md" style={{ color: "var(--white-40)", textAlign: "center", paddingTop: "40px" }}>
          No testimonies have been added yet.
        </p>
      ) : (
        <div
          data-testid="testimonies-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full"
        >
          {testimonies.map(testimony => (
            <TestimonyCard
              key={testimony.id}
              testimony={testimony}
              onPlay={openVideo}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Tab toggle ───────────────────────────────────────────────────────────────

type Tab = "saints" | "testimonies";

function TabToggle({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "saints", label: "Saints" },
    { id: "testimonies", label: "Testimonies" },
  ];

  return (
    <div
      data-testid="tab-toggle-collection"
      style={{
        display: "inline-flex",
        background: "var(--white-5)",
        border: "1px solid var(--white-8)",
        borderRadius: "8px",
        padding: "3px",
        gap: "2px",
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          data-testid={`tab-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className="type-body-md"
          style={{
            padding: "6px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
            background: active === tab.id ? "var(--white-12)" : "transparent",
            color: active === tab.id ? "white" : "var(--white-50)",
            fontWeight: active === tab.id ? 500 : 400,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Collections() {
  const [, navigate] = useLocation();
  const search = useSearch();

  const params = new URLSearchParams(search);
  const rawTab = params.get("tab");
  const activeTab: Tab = rawTab === "testimonies" ? "testimonies" : "saints";

  const handleTabChange = (tab: Tab) => {
    navigate(`/collections?tab=${tab}`);
  };

  return (
    <DashboardLayout>
      <PageContainer
        variant="narrow"
        className="pt-[80px] pb-20 min-h-[calc(100vh-72px)]"
      >
        <div data-testid="collections-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "48px" }}>
          <h1 className="type-display-xl text-center text-white">
            Collection
          </h1>

          <TabToggle active={activeTab} onChange={handleTabChange} />

          {activeTab === "saints" ? (
            <>
              <SaintsDivider />
              <div className="grid grid-cols-3 gap-4 w-full">
                {SAINTS.map((saint) => (
                  <HoloCard key={saint.id} saint={saint} />
                ))}
              </div>
            </>
          ) : (
            <TestimoniesTab />
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
