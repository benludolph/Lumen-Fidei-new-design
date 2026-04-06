import { useRef, useState, useCallback, useEffect } from "react";

interface BeforeAfterContent {
  beforeImage?: string;
  afterImage?: string;
  headline?: string;
  body?: string;
}

function parse(content: string): BeforeAfterContent {
  try {
    const p = JSON.parse(content);
    return {
      beforeImage: typeof p.beforeImage === "string" ? p.beforeImage : undefined,
      afterImage: typeof p.afterImage === "string" ? p.afterImage : undefined,
      headline: typeof p.headline === "string" ? p.headline : undefined,
      body: typeof p.body === "string" ? p.body : undefined,
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
  const { beforeImage, afterImage, headline, body } = parse(content);

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0.5);
  const dragging = useRef(false);

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

  const hasText = !!(headline || body);
  const bodyLines = (body ?? "").split("\n").filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: hasText ? undefined : "100%",
        gap: 20,
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
          flex: hasText ? "0 0 auto" : "1 1 auto",
          height: hasText ? "35vh" : "100%",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.05)",
          background: "#0F1011",
          cursor: "ew-resize",
          touchAction: "none",
          userSelect: "none",
        }}
        data-testid="before-after-container"
      >
        {/* After image — full width base layer */}
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

        {/* Before image — clipped to the left portion */}
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
          <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M6 1L1.5 5.5L6 10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M1 1L5.5 5.5L1 10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Optional text content ── */}
      {hasText && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {headline && (
            <h2
              style={{
                fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(19px, 5vw, 24px)",
                fontWeight: 500,
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1.25,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
              data-testid="before-after-headline"
            >
              {headline}
            </h2>
          )}

          {bodyLines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {bodyLines.map((line, i) => {
                const isBullet = /^[•\-\*]/.test(line);
                const text = isBullet ? line.replace(/^[•\-\*]\s*/, "") : line;
                return (
                  <p
                    key={i}
                    style={{
                      fontFamily: "'Afacad', system-ui, sans-serif",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.70)",
                      lineHeight: 1.5,
                      margin: 0,
                      paddingLeft: isBullet ? 16 : 0,
                      position: "relative",
                    }}
                    data-testid={`before-after-body-${i}`}
                  >
                    {isBullet && (
                      <span style={{ position: "absolute", left: 0, color: "rgba(255,255,255,0.35)" }}>
                        •
                      </span>
                    )}
                    {text}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
