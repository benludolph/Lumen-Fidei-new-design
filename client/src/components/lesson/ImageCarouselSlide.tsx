import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ZoomIn, X } from "lucide-react";

interface ImageCarouselContent {
  headline?: string;
  body?: string;
  images?: string[];
}

function parse(content: string): ImageCarouselContent {
  try {
    const p = JSON.parse(content);
    return {
      headline: typeof p.headline === "string" ? p.headline : undefined,
      body: typeof p.body === "string" ? p.body : undefined,
      images: Array.isArray(p.images) ? p.images.filter((s: unknown) => typeof s === "string") : [],
    };
  } catch {
    return { images: [] };
  }
}

const IMG_W = 158;
const IMG_H = 164;
const GAP = 10;

export function ImageCarouselSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const { headline, body, images = [] } = parse(content);

  // Duplicate for seamless loop — need at least one full pass
  const loopImages = images.length > 0 ? [...images, ...images, ...images] : [];
  const singlePassW = images.length * (IMG_W + GAP);

  // Signal interacted immediately — this is a display-only slide
  useEffect(() => {
    onInteracted?.();
  }, []);

  const x = useMotionValue(0);
  const controlRef = useRef<ReturnType<typeof animate> | null>(null);
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null);

  const startAnimation = useCallback(() => {
    if (singlePassW === 0) return;
    controlRef.current?.stop();
    const speed = 18; // px per second
    const duration = singlePassW / speed;
    controlRef.current = animate(x, -singlePassW, {
      duration,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
      onRepeat: () => x.set(0),
    });
  }, [singlePassW, x]);

  useEffect(() => {
    startAnimation();
    return () => controlRef.current?.stop();
  }, [startAnimation]);

  // Pause animation while zoomed
  useEffect(() => {
    if (zoomedSrc) {
      controlRef.current?.stop();
    } else {
      startAnimation();
    }
  }, [zoomedSrc, startAnimation]);

  // Close on Escape
  useEffect(() => {
    if (!zoomedSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedSrc(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [zoomedSrc]);

  // Parse body into lines for bullet support
  const lines = (body ?? "").split("\n").filter(Boolean);

  return (
    <>
      <div
        className="flex flex-col w-full"
        data-testid="slide-image-carousel"
      >
        {/* ── Image strip ──────────────────────────────────────── */}
        <div style={{ overflow: "hidden", width: "100%", flexShrink: 0 }}>
          <motion.div
            style={{
              x,
              display: "flex",
              gap: GAP,
              paddingLeft: GAP,
              width: "max-content",
            }}
          >
            {loopImages.map((src, i) => (
              <div
                key={i}
                style={{ position: "relative", flexShrink: 0 }}
                className="group"
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    width: IMG_W,
                    height: IMG_H,
                    objectFit: "cover",
                    objectPosition: "center",
                    borderRadius: 6,
                    display: "block",
                  }}
                />
                {/* Zoom button — bottom-right corner */}
                <button
                  type="button"
                  data-testid={`button-zoom-image-${i}`}
                  onClick={() => setZoomedSrc(src)}
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    border: "0.5px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.85)",
                    opacity: 0,
                    transition: "opacity 0.15s",
                  }}
                  className="zoom-btn"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Text content ─────────────────────────────────────── */}
        {(headline || lines.length > 0) && (
          <div
            style={{
              padding: "28px 24px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {headline && (
              <h2
                style={{
                  fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(20px, 5vw, 26px)",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.25,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
                data-testid="carousel-headline"
              >
                {headline}
              </h2>
            )}

            {lines.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lines.map((line, i) => {
                  const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
                  const text = isBullet ? line.replace(/^[•\-\*]\s*/, "") : line;
                  return (
                    <p
                      key={i}
                      className="type-body-xl"
                      style={{
                        fontWeight: 400,
                        color: "var(--white-80)",
                        lineHeight: 1.5,
                        margin: 0,
                        paddingLeft: isBullet ? "16px" : 0,
                        position: "relative",
                      }}
                      data-testid={`carousel-body-line-${i}`}
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

      {/* ── Zoom overlay ─────────────────────────────────────── */}
      {zoomedSrc && (
        <div
          data-testid="image-zoom-overlay"
          onClick={() => setZoomedSrc(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "lf-fade-in 0.18s ease",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            data-testid="button-zoom-close"
            onClick={() => setZoomedSrc(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.7)",
              zIndex: 1,
            }}
          >
            <X size={16} />
          </button>

          {/* Image */}
          <img
            src={zoomedSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 10,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}

      {/* Hover styles for zoom button */}
      <style>{`
        .group:hover .zoom-btn,
        .group:focus-within .zoom-btn {
          opacity: 1 !important;
        }
        @media (pointer: coarse) {
          .zoom-btn {
            opacity: 1 !important;
          }
        }
        @keyframes lf-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
