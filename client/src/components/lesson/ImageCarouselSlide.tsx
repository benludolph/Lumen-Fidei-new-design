import { useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

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

  useEffect(() => {
    if (singlePassW === 0) return;
    controlRef.current?.stop();
    // Animate one full pass then loop
    const speed = 18; // px per second
    const duration = singlePassW / speed;
    controlRef.current = animate(x, -singlePassW, {
      duration,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
      onRepeat: () => x.set(0),
    });
    return () => controlRef.current?.stop();
  }, [singlePassW]);

  // Parse body into lines for bullet support
  const lines = (body ?? "").split("\n").filter(Boolean);

  return (
    <div
      className="flex flex-col w-full"
      data-testid="slide-image-carousel"
    >
      {/* ── Image strip ──────────────────────────────────────── */}
      <div
        style={{ overflow: "hidden", width: "100%", flexShrink: 0 }}
      >
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
            <img
              key={i}
              src={src}
              alt=""
              draggable={false}
              style={{
                width: IMG_W,
                height: IMG_H,
                objectFit: "cover",
                objectPosition: "center",
                borderRadius: 6,
                flexShrink: 0,
                display: "block",
              }}
            />
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
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
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
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
