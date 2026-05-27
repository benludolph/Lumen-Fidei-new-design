import { useState, useEffect } from "react";

interface BentoItem {
  imageUrl?: string;
  label: string;
  revealText: string;
  accentColor?: string;
}

interface BentoRevealContent {
  headline?: string;
  items: BentoItem[];
  completionText?: string;
  completionColor?: string;
}

function parse(content: string): BentoRevealContent {
  try {
    const p = JSON.parse(content);
    const items: BentoItem[] = Array.isArray(p.items)
      ? p.items.map((it: any) => ({
          imageUrl: typeof it.imageUrl === "string" && it.imageUrl ? it.imageUrl : undefined,
          label: typeof it.label === "string" ? it.label : "",
          revealText: typeof it.revealText === "string" ? it.revealText : "",
          accentColor: typeof it.accentColor === "string" && it.accentColor ? it.accentColor : undefined,
        }))
      : [];
    return {
      headline: typeof p.headline === "string" && p.headline ? p.headline : undefined,
      items,
      completionText: typeof p.completionText === "string" && p.completionText ? p.completionText : undefined,
      completionColor: typeof p.completionColor === "string" && p.completionColor ? p.completionColor : "#2d6b3a",
    };
  } catch {
    return { items: [] };
  }
}

export function BentoRevealSlide({ content }: { content: string }) {
  const { headline, items, completionText, completionColor } = parse(content);
  const [tapped, setTapped] = useState<Set<number>>(new Set());

  const allTapped = items.length === 0 || tapped.size >= items.length;

  // Emit event whenever tap state changes so LessonFlow can gate Continue
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("lf:bento-all-tapped", {
      detail: { allTapped },
    }));
  }, [allTapped]);

  // Clean up on unmount — release the Continue gate
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("lf:bento-all-tapped", {
        detail: { allTapped: false },
      }));
    };
  }, []);

  const handleTap = (i: number) => {
    setTapped(prev => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 24px 8px" }}
      data-testid="slide-bento-reveal"
    >
      {headline && (
        <p
          className="type-body-xl"
          style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}
        >
          {headline}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {items.map((item, i) => {
          const isTapped = tapped.has(i);
          const accent = item.accentColor ?? "#ffffff";
          const bg = isTapped ? `${accent}22` : "rgba(255,255,255,0.04)";
          const borderColor = isTapped ? `${accent}99` : "rgba(255,255,255,0.12)";

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleTap(i)}
              data-testid={`button-bento-card-${i}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 10,
                padding: "20px 14px 18px",
                borderRadius: 16,
                border: `1.5px solid ${borderColor}`,
                background: bg,
                cursor: isTapped ? "default" : "pointer",
                transition: "background 0.25s, border-color 0.25s",
                textAlign: "center",
                minHeight: 160,
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  style={{ width: 56, height: 56, objectFit: "contain", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
              )}

              <span
                style={{
                  fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </span>

              {isTapped ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item.revealText}
                </p>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  TAP
                </span>
              )}
            </button>
          );
        })}
      </div>

      {allTapped && completionText && (
        <p
          data-testid="text-bento-completion"
          style={{
            margin: "4px 0 0",
            fontSize: 16,
            fontWeight: 600,
            color: completionColor,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {completionText}
        </p>
      )}
    </div>
  );
}
