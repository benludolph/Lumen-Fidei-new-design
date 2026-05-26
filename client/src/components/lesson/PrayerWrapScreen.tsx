import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface PrayerWrapScreenProps {
  kind: "opening" | "closing";
  prayerText: string;
  audioUrl?: string | null;
  canSkip: boolean;
  onContinue: () => void;
  onExit: () => void;
  lessonTitle?: string;
}

export function PrayerWrapScreen({
  kind,
  prayerText,
  audioUrl,
  canSkip,
  onContinue,
  onExit,
  lessonTitle,
}: PrayerWrapScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onContinueRef = useRef(onContinue);
  useEffect(() => { onContinueRef.current = onContinue; }, [onContinue]);

  const [audioReady, setAudioReady] = useState(false);
  const [audioDone, setAudioDone] = useState(!audioUrl);
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudio] = useState(!!audioUrl);

  const continueUnlocked = audioDone || !hasAudio;

  const tryAutoPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
    });
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    const el = new Audio(audioUrl);
    el.preload = "auto";
    audioRef.current = el;

    const onLoaded = () => {
      setAudioReady(true);
      setDuration(el.duration || 0);
      tryAutoPlay();
    };
    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      if (el.duration && el.currentTime >= el.duration - 5) {
        setAudioDone(true);
      }
    };
    const onEnded = () => {
      setAudioDone(true);
      setIsPlaying(false);
      if (kind === "opening") {
        autoAdvanceTimer.current = setTimeout(() => onContinueRef.current(), 900);
      }
    };
    const onError = () => {
      setAudioError(true);
      setAudioDone(true);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("canplay", onLoaded);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    return () => {
      el.pause();
      el.src = "";
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("canplay", onLoaded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [audioUrl, tryAutoPlay, kind]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const caption = kind === "opening" ? "Opening Prayer" : "Closing Prayer";

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: "#0c0b09" }}
      data-testid={`prayer-wrap-screen-${kind}`}
    >
      {/* ── Navbar (same as slide pages) ── */}
      <div
        className="relative shrink-0 flex items-center justify-between"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "var(--black-60)",
          borderBottom: "1px solid var(--white-5)",
          boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "16px",
          paddingBottom: "16px",
        }}
      >
        {/* Left: back/exit */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onExit}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: "40px",
              height: "40px",
              background: "var(--surface-float)",
              backdropFilter: "blur(11px)",
              WebkitBackdropFilter: "blur(11px)",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid={`button-prayer-back-${kind}`}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Center: lesson title pill */}
        <div
          className="flex items-center"
          style={{
            background: "var(--surface-float)",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            maxHeight: "42px",
          }}
        >
          {lessonTitle && (
            <span
              className="type-body-md font-medium whitespace-nowrap overflow-hidden"
              style={{
                color: "#efefef",
                lineHeight: "18px",
                maxWidth: "132px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {lessonTitle}
            </span>
          )}
          <span
            className="type-body-sm whitespace-nowrap"
            style={{ color: "#8b8b8b", lineHeight: "18px", paddingLeft: lessonTitle ? "8px" : "0" }}
          >
            {caption}
          </span>
        </div>

        {/* Right: exit */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onExit}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: "40px",
              height: "40px",
              background: "var(--surface-float)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid={`button-prayer-exit-${kind}`}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-10 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col items-center gap-10">
          {/* Caption label */}
          <p className="type-caption-lg" style={{ color: "rgba(255,255,255,0.38)" }}>
            {caption}
          </p>

          {/* Prayer text */}
          {prayerText ? (
            <div
              style={{
                fontFamily: "'IvyOra Display', serif",
                fontSize: "clamp(1rem, 3.5vw, 1.15rem)",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.82)",
                textAlign: "center",
                whiteSpace: "pre-wrap",
                maxWidth: "38ch",
              }}
            >
              {prayerText}
            </div>
          ) : null}

          {/* Audio player */}
          {hasAudio && !audioError && (
            <div
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!audioReady}
                  data-testid={`button-prayer-audio-${kind}`}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: audioReady ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: "none",
                    cursor: audioReady ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 150ms",
                  }}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="rgba(255,255,255,0.8)">
                      <rect x="2" y="2" width="4" height="10" rx="1" />
                      <rect x="8" y="2" width="4" height="10" rx="1" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="rgba(255,255,255,0.8)">
                      <path d="M3 2 L12 7 L3 12 Z" />
                    </svg>
                  )}
                </button>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div
                    style={{
                      height: "3px",
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progressPct}%`,
                        background: "rgba(255,255,255,0.5)",
                        borderRadius: "2px",
                        transition: "width 0.5s linear",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "0.68rem",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
                  </div>
                </div>
              </div>

              {!audioDone && (
                <p
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.25)",
                    textAlign: "center",
                  }}
                >
                  Listen until the end to continue
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "16px 24px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={continueUnlocked ? onContinue : undefined}
          disabled={!continueUnlocked}
          data-testid={`button-prayer-continue-${kind}`}
          className={`flex items-center gap-2 justify-center type-caption-lg text-[#fafafa] whitespace-nowrap ${continueUnlocked ? "opacity-100 hover:opacity-80" : "opacity-40 cursor-not-allowed"}`}
          style={{
            background: "var(--surface-float)",
            borderRadius: "6px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)",
            border: "none",
            cursor: continueUnlocked ? "pointer" : "not-allowed",
          }}
        >
          CONTINUE
          <ArrowRight className="w-4 h-4" />
        </button>

        {canSkip && (
          <button
            type="button"
            onClick={onContinue}
            data-testid={`button-prayer-skip-${kind}`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.28)",
              letterSpacing: "0.05em",
              padding: "4px 8px",
              textDecoration: "underline",
              textDecorationColor: "rgba(255,255,255,0.15)",
            }}
          >
            Skip prayer
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
