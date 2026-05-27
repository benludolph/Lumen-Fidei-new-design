import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  imageUrl: string;
  description: string;
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
          .map((it: { imageUrl?: unknown; description?: unknown }) => ({
            imageUrl: typeof it.imageUrl === "string" ? it.imageUrl : "",
            description: typeof it.description === "string" ? it.description : "",
          })),
      };
    }
    // Legacy fallback: old shape had images[] + headline/body — render as items with no description
    if (Array.isArray(p.images)) {
      return {
        items: (p.images as string[]).map((url) => ({ imageUrl: url, description: p.body ?? "" })),
      };
    }
  } catch {}
  return { items: [] };
}

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

  // Single item — mark interacted immediately
  useEffect(() => {
    if (count <= 1) onInteracted?.();
  }, []);

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

  const slideStyle: React.CSSProperties = {
    transition: animating ? "opacity 0.18s ease, transform 0.22s ease" : "none",
    opacity: animating ? 0 : 1,
    transform: animating
      ? `translateX(${direction * 24}px)`
      : "translateX(0)",
  };

  return (
    <div
      data-testid="slide-image-carousel"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        alignItems: "center",
        gap: 0,
        userSelect: "none",
      }}
    >
      {/* ── Image + arrows row ─────────────────────────────── */}
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
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "0.5px solid rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: count < 2 ? "default" : "pointer",
            color: count < 2 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (count < 2) return;
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.13)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Image */}
        <div
          style={{
            flex: 1,
            maxWidth: 300,
            position: "relative",
            overflow: "hidden",
            borderRadius: 10,
            aspectRatio: "3/4",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {current?.imageUrl ? (
            <img
              key={index}
              src={current.imageUrl}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                display: "block",
                borderRadius: 10,
                ...slideStyle,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.2)",
                fontSize: 13,
              }}
            >
              No image
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
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "0.5px solid rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: count < 2 ? "default" : "pointer",
            color: count < 2 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (count < 2) return;
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.13)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Dot indicators ─────────────────────────────────── */}
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

      {/* ── Per-item description ────────────────────────────── */}
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
            marginTop: 20,
            padding: "0 4px",
            textAlign: "center",
            maxWidth: 380,
            ...slideStyle,
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
            marginTop: 10,
          }}
        >
          {index + 1} of {count}
        </p>
      )}
    </div>
  );
}
