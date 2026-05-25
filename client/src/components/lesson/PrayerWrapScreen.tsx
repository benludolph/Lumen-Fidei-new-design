import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PrayerWrapScreenProps {
  kind: "opening" | "closing";
  prayerText: string;
  audioUrl?: string | null;
  canSkip: boolean;
  onContinue: () => void;
}

export function PrayerWrapScreen({
  kind,
  prayerText,
  audioUrl,
  canSkip,
  onContinue,
}: PrayerWrapScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    };
  }, [audioUrl, tryAutoPlay]);

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div
              aria-hidden="true"
              style={{
                fontFamily: "'IvyOra Display', serif",
                fontSize: "clamp(2.5rem, 8vw, 4rem)",
                color: "rgba(255,255,255,0.18)",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              ✝
            </div>
            <p
              style={{
                fontFamily: "'IvyOra Display', serif",
                fontSize: "clamp(0.7rem, 2.5vw, 0.8rem)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              {caption}
            </p>
          </div>

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

      <div
        style={{
          padding: "16px 24px 32px",
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
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "15px 24px",
            borderRadius: "100px",
            border: "none",
            cursor: continueUnlocked ? "pointer" : "not-allowed",
            background: continueUnlocked
              ? "rgba(255,255,255,0.92)"
              : "rgba(255,255,255,0.12)",
            color: continueUnlocked ? "#0c0b09" : "rgba(255,255,255,0.25)",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            transition: "background 200ms, color 200ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {continueUnlocked ? (
            <>
              Continue
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ opacity: 0.5 }}>
                <rect x="3" y="6" width="8" height="6" rx="1" />
                <path d="M5 6V4a3 3 0 016 0v2" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />
              </svg>
              Continue
            </>
          )}
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
