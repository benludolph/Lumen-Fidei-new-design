import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "wouter";
import { ChevronRight, Play, X, Clock, Copy, Check, Trash2, Maximize2, Plus } from "lucide-react";
import { useUserAnswers, useCreateAnswer } from "@/hooks/use-answers";
import { CaptivityBuilderSlide } from "@/components/lesson/CaptivityBuilderSlide";
import { SPIRITS, type SavedState } from "@/components/lesson/captivity-builder-data";
import heroImg from "@assets/bearcla_intrusive_thoughts_--ar_169_--profile_qin2lfz_--v_8.1__1778103896965.png";

const STANDALONE_DAY = 0;
const HOW_TO_VIDEO_URL = "https://res.cloudinary.com/dsv0rjvoi/video/upload/v1778103999/Captivity_Excercise_dhrmy9.mp4";

interface PrayerItem extends SavedState {
  id: string;
  createdAt: string;
}

function Breadcrumb() {
  return (
    <div
      style={{
        position: "sticky",
        top: "72px",
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
        <Link href="/resources">
          <span
            data-testid="breadcrumb-resources"
            className="type-body-lg"
            style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Resources
          </span>
        </Link>
        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>
        <span
          data-testid="breadcrumb-current"
          className="type-body-lg"
          style={{ color: "var(--white-60)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}
        >
          Breaking Lies
        </span>
      </PageContainer>
    </div>
  );
}

function SavedPrayerCard({
  prayer,
  onCopy,
  onDelete,
  copied,
}: {
  prayer: PrayerItem;
  onCopy: () => void;
  onDelete: () => void;
  copied: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const spirit = SPIRITS.find(s => s.id === prayer.spiritId);
  const lines = prayer.prayer.split("\n");

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
            Saved prayer
          </span>
          {spirit && (
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
              Against the spirit of{" "}
              <span style={{ color: "rgba(255,255,255,0.7)", fontStyle: "normal" }}>{spirit.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Copy */}
          <button
            type="button"
            onClick={onCopy}
            data-testid={`button-copy-prayer-${prayer.id}`}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            title="Copy prayer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="type-body-xs px-2 py-1 rounded transition-colors"
                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete(); }}
                data-testid={`button-delete-prayer-${prayer.id}`}
                className="type-body-xs px-2 py-1 rounded transition-colors"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              title="Delete prayer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* Prayer text */}
      <div className="px-5 py-5">
        <div style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.75 }}>
          {lines.map((line, i) => (
            <p key={i} style={{ margin: i > 0 ? "0.55em 0 0" : 0 }}>
              {line || "\u00a0"}
            </p>
          ))}
        </div>
        {prayer.scriptureRef && (
          <p className="type-body-sm" style={{ marginTop: "16px", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
            {prayer.scriptureRef}
          </p>
        )}
      </div>
    </div>
  );
}

function HowToVideoWidget({ onClose }: { onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  };

  return (
    <div
      data-testid="howto-video-widget"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 50,
        width: "300px",
        borderRadius: "11px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "var(--surface-ground)",
        overflow: "hidden",
        boxShadow: "inset 0px 2px 0px 0px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {/* Video area */}
      <div style={{ position: "relative", aspectRatio: "320/180", overflow: "hidden", cursor: "pointer" }} onClick={toggle}>
        <video
          ref={videoRef}
          src={HOW_TO_VIDEO_URL}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          onEnded={() => setPlaying(false)}
          playsInline
        />
        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))", pointerEvents: "none" }} />
        {/* Play overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "56px",
            height: "56px",
            borderRadius: "999px",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: playing ? 0 : 1,
            transition: "opacity 0.2s",
            pointerEvents: "none",
          }}
        >
          <Play style={{ width: "24px", height: "24px", color: "white", marginLeft: "2px" }} />
        </div>
        {/* Top action buttons */}
        <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px", zIndex: 10 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={handleFullscreen}
            style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
            title="Full screen"
            aria-label="Fullscreen"
          >
            <Maximize2 size={11} />
          </button>
          <button
            data-testid="button-close-howto-video"
            onClick={onClose}
            style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
            aria-label="Close video"
          >
            <X size={11} />
          </button>
        </div>
        <div style={{ position: "absolute", inset: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none" }} />
      </div>

      {/* Info row */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="type-body-lg font-semibold" style={{ color: "white", letterSpacing: "-0.1px" }}>
            How to Use this Tool
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
            <span className="type-body-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Follow-along tutorial
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaptivityBuilderResource() {
  const { data: answers = [], isLoading } = useUserAnswers();
  const { mutate: savePrayers } = useCreateAnswer();
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const existingAnswer = answers.find((a) => a.dayNumber === STANDALONE_DAY)?.content;

  // Parse existing answers (supports legacy single-prayer and new multi-prayer format)
  useEffect(() => {
    if (!existingAnswer) return;
    try {
      const parsed = JSON.parse(existingAnswer);
      if (Array.isArray(parsed.prayers)) {
        setPrayers(parsed.prayers);
      } else if (parsed.prayer) {
        // Migrate legacy single-prayer format to array
        setPrayers([{
          id: crypto.randomUUID(),
          thought: parsed.thought ?? "",
          spiritId: parsed.spiritId ?? "",
          antonym: parsed.antonym ?? "",
          scriptureRef: parsed.scriptureRef ?? "",
          scriptureText: parsed.scriptureText ?? "",
          from: parsed.from ?? "",
          to: parsed.to ?? "",
          now: parsed.now ?? "",
          prayer: parsed.prayer,
          createdAt: new Date().toISOString(),
        }]);
      }
    } catch {}
  }, [existingAnswer]);

  const persistPrayers = (updated: PrayerItem[]) => {
    savePrayers({ dayNumber: STANDALONE_DAY, content: JSON.stringify({ prayers: updated }) });
  };

  const handleSavePrayer = (data: SavedState) => {
    const newPrayer: PrayerItem = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [...prayers, newPrayer];
    setPrayers(updated);
    persistPrayers(updated);
    setShowForm(false);
  };

  const handleDeletePrayer = (id: string) => {
    const updated = prayers.filter((p) => p.id !== id);
    setPrayers(updated);
    persistPrayers(updated);
  };

  const handleCopyPrayer = async (prayerText: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prayerText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // When there are no prayers yet and answers are loaded → show form directly
  const hasPrayers = prayers.length > 0;
  const formVisible = !hasPrayers || showForm;

  return (
    <DashboardLayout>
      <Breadcrumb />

      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "685px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "40px",
            paddingBottom: "100px",
            paddingLeft: "20px",
            paddingRight: "20px",
            width: "100%",
          }}
        >
          {/* Hero card */}
          <div
            data-testid="hero-card-resource"
            style={{
              position: "relative",
              backgroundColor: "var(--surface-ground)",
              border: "1px solid var(--white-5)",
              borderRadius: "8px",
              overflow: "clip",
              paddingTop: "379.94px",
              maxWidth: "960px",
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              flexDirection: "column",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: "-3px",
                right: "-3px",
                height: "470px",
                overflow: "hidden",
                backgroundColor: "var(--surface-ground)",
              }}
            >
              <img
                src={heroImg}
                alt="Breaking Lies"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "99px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "335px", background: "linear-gradient(to bottom, transparent, var(--surface-ground))", pointerEvents: "none" }} />
            </div>
            <div
              className="px-5 sm:px-10"
              style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "9.25px", alignItems: "flex-start", width: "100%", paddingBottom: "40px" }}
            >
              <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0 }}>Tool · Spiritual Warfare</p>
              <h1
                data-testid="resource-title"
                className="font-serif"
                style={{ fontWeight: 500, fontSize: "clamp(36px, 6vw + 10px, 80.2px)", lineHeight: "1.01", color: "white", margin: 0 }}
              >
                Breaking Lies
              </h1>
              <p
                data-testid="resource-subtitle"
                className="type-body-lg"
                style={{ color: "var(--white-60)", margin: 0 }}
              >
                Build your personalized rebuke prayer against an intrusive thought.
              </p>
            </div>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", boxShadow: "inset 0px 1px 0px 0px var(--white-10)" }} />
          </div>

          {/* Content below hero */}
          <div style={{ maxWidth: "960px", width: "100%", marginTop: "30px" }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div
                  className="animate-spin"
                  style={{ width: "24px", height: "24px", border: "2px solid var(--white-10)", borderTopColor: "var(--white-50)", borderRadius: "50%" }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Saved prayer cards */}
                {hasPrayers && (
                  <div className="space-y-4">
                    {prayers.map((p) => (
                      <SavedPrayerCard
                        key={p.id}
                        prayer={p}
                        onCopy={() => handleCopyPrayer(p.prayer, p.id)}
                        onDelete={() => handleDeletePrayer(p.id)}
                        copied={copiedId === p.id}
                      />
                    ))}
                  </div>
                )}

                {/* Build new prayer form */}
                {formVisible && (
                  <div>
                    {hasPrayers && (
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                        <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                          Build another prayer
                        </span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      </div>
                    )}
                    <CaptivityBuilderSlide
                      dayNumber={STANDALONE_DAY}
                      onSavePrayer={handleSavePrayer}
                    />
                    {hasPrayers && showForm && (
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="type-body-sm text-[var(--white-30)] hover:text-[var(--white-60)] transition-colors mt-4"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                {/* "Add another prayer" button — only when prayers exist and form is hidden */}
                {hasPrayers && !showForm && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    data-testid="button-add-new-prayer"
                    className="flex items-center gap-2 type-body-md text-[var(--white-50)] hover:text-white border border-[var(--white-10)] hover:border-[var(--white-20)] rounded-lg px-4 py-3 transition-colors w-full justify-center"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <Plus size={16} />
                    Build another prayer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video widget — open or collapsed to pill */}
      {showVideo ? (
        <HowToVideoWidget onClose={() => setShowVideo(false)} />
      ) : (
        <button
          data-testid="button-reopen-howto-video"
          onClick={() => setShowVideo(true)}
          className="flex items-center gap-2 type-body-sm font-medium"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 50,
            background: "var(--surface-raised)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "999px",
            padding: "8px 16px 8px 12px",
            cursor: "pointer",
            color: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <Play size={12} style={{ marginLeft: "1px" }} />
          Watch Tutorial
        </button>
      )}
    </DashboardLayout>
  );
}
