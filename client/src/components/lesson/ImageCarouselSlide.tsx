import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  imageUrl: string;
  title?: string;
  description?: string;
}

interface ImageCarouselContent {
  items: CarouselItem[];
}

function parse(content: string): ImageCarouselContent {
  try {
    const p = JSON.parse(content);
    if (Array.isArray(p.items)) {
      return {
        items: p.items
          .filter((it: unknown) => it && typeof it === "object")
          .map((it: { imageUrl?: unknown; title?: unknown; description?: unknown }) => ({
            imageUrl: typeof it.imageUrl === "string" ? it.imageUrl : "",
            title: typeof it.title === "string" ? it.title : undefined,
            description: typeof it.description === "string" ? it.description : undefined,
          })),
      };
    }
    // Legacy fallback: old shape { images[], headline, body }
    if (Array.isArray(p.images)) {
      return {
        items: (p.images as string[]).map((url) => ({
          imageUrl: url,
          title: typeof p.headline === "string" ? p.headline : undefined,
          description: typeof p.body === "string" ? p.body : undefined,
        })),
      };
    }
  } catch {}
  return { items: [] };
}

const NAV_BTN: React.CSSProperties = {
  flexShrink: 0,
  width: 36,
  height: 36,
  borderRadius: 6,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "rgba(255,255,255,0.80)",
  transition: "background 0.15s",
};

export function ImageCarouselSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const { items } = parse(content);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animating, setAnimating] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const count = items.length;
  const current = items[index] ?? null;

  useEffect(() => {
    if (count <= 1) onInteracted?.();
  }, []);

  // Clamp index when items shrink (e.g. admin preview)
  useEffect(() => {
    if (count > 0 && index >= count) setIndex(count - 1);
  }, [count]);

  function go(dir: 1 | -1) {
    if (animating || count < 2) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev + dir + count) % count);
      setAnimating(false);
      if (!hasNavigated) {
        setHasNavigated(true);
        onInteracted?.();
      }
    }, 220);
  }

  if (count === 0) return null;

  const imgStyle: React.CSSProperties = {
    transition: animating ? "opacity 0.18s ease, transform 0.22s ease" : "none",
    opacity: animating ? 0 : 1,
    transform: animating ? `translateX(${direction * 20}px)` : "translateX(0)",
  };

  return (
    <div
      data-testid="slide-image-carousel"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        alignItems: "center",
        userSelect: "none",
      }}
    >
      {/* ── Image + arrows ───────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          gap: 12,
          padding: "0 8px",
        }}
      >
        {/* Left arrow */}
        <button
          type="button"
          data-testid="button-carousel-prev"
          onClick={() => go(-1)}
          disabled={count < 2}
          style={{
            ...NAV_BTN,
            cursor: count < 2 ? "default" : "pointer",
            color: count < 2 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.80)",
          }}
          onMouseEnter={(e) => {
            if (count < 2) return;
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Image card */}
        <div
          style={{
            flex: 1,
            maxWidth: 280,
            position: "relative",
            borderRadius: 6,
            border: "0.5px solid rgba(255,255,255,0.6)",
            aspectRatio: "268/279",
            overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 8px 12px 8px",
          }}
        >
          {/* Background image */}
          {current?.imageUrl && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              <img
                key={index}
                src={current.imageUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  ...imgStyle,
                }}
              />
              {/* Gradient scrim so badge is readable */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)",
                }}
              />
            </div>
          )}

          {/* Title badge */}
          {current?.title && (
            <div
              data-testid="carousel-item-title"
              style={{
                position: "relative",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 6,
                padding: "6px 16px",
                ...imgStyle,
              }}
            >
              <span
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: "#ffffff",
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                }}
              >
                {current.title}
              </span>
            </div>
          )}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          data-testid="button-carousel-next"
          onClick={() => go(1)}
          disabled={count < 2}
          style={{
            ...NAV_BTN,
            cursor: count < 2 ? "default" : "pointer",
            color: count < 2 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.80)",
          }}
          onMouseEnter={(e) => {
            if (count < 2) return;
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Dot indicators ──────────────────────────────────── */}
      {count > 1 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginTop: 14,
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              data-testid={`button-carousel-dot-${i}`}
              onClick={() => {
                if (i === index || animating) return;
                setDirection(i > index ? 1 : -1);
                setAnimating(true);
                setTimeout(() => {
                  setIndex(i);
                  setAnimating(false);
                  if (!hasNavigated) {
                    setHasNavigated(true);
                    onInteracted?.();
                  }
                }, 220);
              }}
              style={{
                width: i === index ? 18 : 8,
                height: 8,
                borderRadius: 4,
                background: i === index ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 0.25s ease, background 0.25s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Per-item description ─────────────────────────────── */}
      {current?.description && (
        <p
          key={index}
          data-testid="carousel-item-description"
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "clamp(15px, 2.5vw, 17px)",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.65,
            margin: 0,
            marginTop: 16,
            padding: "0 4px",
            textAlign: "center",
            maxWidth: 380,
            ...imgStyle,
          }}
        >
          {current.description}
        </p>
      )}

      {/* ── Counter ─────────────────────────────────────────── */}
      {count > 1 && (
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: 0,
            marginTop: 8,
          }}
        >
          {index + 1} of {count}
        </p>
      )}
    </div>
  );
}
