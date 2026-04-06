import { useRef, useState, useCallback, useEffect } from "react";

interface BeforeAfterContent {
  beforeImage?: string;
  afterImage?: string;
}

function parse(content: string): BeforeAfterContent {
  try {
    const p = JSON.parse(content);
    return {
      beforeImage: typeof p.beforeImage === "string" ? p.beforeImage : undefined,
      afterImage: typeof p.afterImage === "string" ? p.afterImage : undefined,
    };
  } catch {
    return {};
  }
}

const HANDLE_SIZE = 30;

export function BeforeAfterSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const { beforeImage, afterImage } = parse(content);

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0.5); // 0–1, default centred
  const dragging = useRef(false);

  // Signal interacted on mount — display-only slide
  useEffect(() => {
    onInteracted?.();
  }, []);

  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const positionFromEvent = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0.5;
    return clamp((clientX - rect.left) / rect.width);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setPosition(positionFromEvent(e.clientX));
    },
    [positionFromEvent],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setPosition(positionFromEvent(e.clientX));
    },
    [positionFromEvent],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const pct = `${(position * 100).toFixed(2)}%`;
  const rightPct = `${((1 - position) * 100).toFixed(2)}%`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "20px 16px 28px",
        boxSizing: "border-box",
      }}
      data-testid="slide-before-after"
    >
      {/* ── Image comparison area ── */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          aspectRatio: "4 / 3",
          borderRadius: 12,
          overflow: "hidden",
          background: "#0F1011",
          cursor: "ew-resize",
          touchAction: "none",
          userSelect: "none",
          boxShadow: "0 2px 24px rgba(0,0,0,0.5)",
        }}
        data-testid="before-after-container"
      >
        {/* After image (bottom — full width) */}
        {afterImage && (
          <img
            src={afterImage}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        )}

        {/* Before image (top — clipped to left portion) */}
        {beforeImage && (
          <img
            src={beforeImage}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              clipPath: `inset(0 ${rightPct} 0 0)`,
            }}
          />
        )}

        {/* Divider line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: pct,
            transform: "translateX(-50%)",
            width: 1.5,
            background: "rgba(255,255,255,0.75)",
            pointerEvents: "none",
          }}
        />

        {/* Handle */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: pct,
            transform: "translate(-50%, -50%)",
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            pointerEvents: "none",
            boxShadow: "0 1px 8px rgba(0,0,0,0.35)",
          }}
          data-testid="before-after-handle"
        >
          {/* Left chevron */}
          <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M6 1L1.5 5.5L6 10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Right chevron */}
          <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M1 1L5.5 5.5L1 10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
