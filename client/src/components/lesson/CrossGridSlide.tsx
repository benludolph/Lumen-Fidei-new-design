import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import sacredHeartImg from "@assets/amethyst1__jesus_with_the_divine_sacred_heart_in_his_hands_te_1775149739636.webp";

interface Piece {
  id: string;
  label: string;
  definition: string;
}

interface CrossGridContent {
  headline?: string;
  imageUrl?: string;
  pieces: Piece[];
}

const DEFAULT_PIECES: Piece[] = [
  {
    id: "center",
    label: "Truth",
    definition: "The foundation. Jesus said, 'I am the Way, the Truth, and the Life.' Truth is not an idea — it's a Person who loves you completely.",
  },
  {
    id: "top",
    label: "Repentance",
    definition: "Turning away from what harms you and toward God. Not shame — freedom. God's kindness leads you here.",
  },
  {
    id: "left",
    label: "Trust",
    definition: "Letting go of control. When you trust God fully, you stop managing your own healing and let Him lead.",
  },
  {
    id: "right",
    label: "Healing",
    definition: "God restores what was broken — emotionally, spiritually, relationally. It is His will for you. Ask Him.",
  },
  {
    id: "bottom",
    label: "Freedom",
    definition: "Where Truth, Repentance, Trust, and Healing lead. The life you were made for. It is available to you now.",
  },
];

const REQUIRED_IDS = new Set(["center", "top", "left", "right", "bottom"]);

const PIECE_GRID: Record<string, { row: number; col: number; bgPos: string }> = {
  top:    { row: 0, col: 1, bgPos: "50% 0%" },
  left:   { row: 1, col: 0, bgPos: "0% 50%" },
  center: { row: 1, col: 1, bgPos: "50% 50%" },
  right:  { row: 1, col: 2, bgPos: "100% 50%" },
  bottom: { row: 2, col: 1, bgPos: "50% 100%" },
};

function FlipTile({
  piece,
  isFlipped,
  isLocked,
  isAllComplete,
  imageUrl,
  onFlip,
  isActive,
}: {
  piece: Piece;
  isFlipped: boolean;
  isLocked: boolean;
  isAllComplete: boolean;
  imageUrl: string;
  onFlip: () => void;
  isActive: boolean;
}) {
  const grid = PIECE_GRID[piece.id];

  return (
    <div
      style={{
        gridRow: grid.row + 1,
        gridColumn: grid.col + 1,
      }}
    >
      <div
        style={{
          width: "100%",
          height: 0,
          paddingBottom: "100%",
          position: "relative",
          perspective: "900px",
        }}
      >
        <motion.div
          onClick={!isLocked ? onFlip : undefined}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            cursor: isLocked ? "default" : "pointer",
            borderRadius: "10px",
          }}
        >
          {/* ── Front face ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: "10px",
              background: isActive && !isFlipped ? "rgba(255,255,255,0.07)" : "#0F1011",
              border: isAllComplete
                ? "1px solid transparent"
                : `1px solid ${
                    isLocked
                      ? "rgba(255,255,255,0.05)"
                      : isActive
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(255,255,255,0.10)"
                  }`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "border-color 0.3s, background 0.3s",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: "clamp(9px, 2.2vw, 12px)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isLocked ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.75)",
                textAlign: "center",
                padding: "0 6px",
                lineHeight: 1.2,
              }}
            >
              {piece.label}
            </span>
            {isLocked && (
              <span style={{ fontSize: "clamp(10px, 2.5vw, 14px)", color: "rgba(255,255,255,0.12)", marginTop: "2px", lineHeight: 1 }}>
                ⊘
              </span>
            )}
            {!isLocked && !isFlipped && (
              <span style={{ fontSize: "clamp(8px, 1.6vw, 10px)", color: "rgba(255,255,255,0.28)", marginTop: "2px", letterSpacing: "0.05em" }}>
                tap
              </span>
            )}
          </div>

          {/* ── Back face ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "10px",
              overflow: "hidden",
              border: isAllComplete ? "none" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "300% 300%",
                backgroundPosition: grid.bgPos,
                backgroundRepeat: "no-repeat",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function CrossGridSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [activePiece, setActivePiece] = useState<Piece | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { headline, imageUrl, pieces } = useMemo<CrossGridContent>(() => {
    try {
      const p = JSON.parse(content);
      const parsed: Piece[] | null =
        Array.isArray(p.pieces) && p.pieces.length === 5 ? p.pieces : null;
      const hasValidIds =
        parsed !== null &&
        parsed.every(
          (piece) =>
            typeof piece.id === "string" &&
            REQUIRED_IDS.has(piece.id) &&
            typeof piece.label === "string" &&
            typeof piece.definition === "string"
        );
      return {
        headline: p.headline || undefined,
        imageUrl: p.imageUrl || sacredHeartImg,
        pieces: hasValidIds ? parsed! : DEFAULT_PIECES,
      };
    } catch {
      return { headline: undefined, imageUrl: sacredHeartImg, pieces: DEFAULT_PIECES };
    }
  }, [content]);

  const resolvedImage = imageUrl || sacredHeartImg;
  const isAllComplete = flipped.size === 5;
  const isCenterFlipped = flipped.has("center");

  const handleFlip = (piece: Piece) => {
    if (flipped.has(piece.id)) return;
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteracted?.();
    }
    const next = new Set(flipped);
    next.add(piece.id);
    setFlipped(next);
    setActivePiece(piece);
  };

  const isLocked = (pieceId: string) =>
    pieceId !== "center" && !isCenterFlipped;

  return (
    <div className="w-full flex flex-col gap-5">
      {headline && (
        <p
          className="type-label-md text-center"
          style={{
            color: "var(--white-40)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {headline}
        </p>
      )}

      {/* Responsive wrapper: column on mobile, row on desktop */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full">

        {/* ── Puzzle ── */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          {/* Glow when complete */}
          {isAllComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{
                position: "absolute",
                inset: "-16px",
                borderRadius: "20px",
                background:
                  "radial-gradient(ellipse at center, rgba(200,160,70,0.22) 0%, rgba(200,160,70,0) 70%)",
                boxShadow: "0 0 48px 12px rgba(200,160,70,0.14)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          )}

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridTemplateRows: "repeat(3, 1fr)",
              gap: "6px",
              width: "clamp(210px, 60vw, 288px)",
              height: "clamp(210px, 60vw, 288px)",
            }}
          >
            {pieces.map((piece) => (
              <FlipTile
                key={piece.id}
                piece={piece}
                isFlipped={flipped.has(piece.id)}
                isLocked={isLocked(piece.id)}
                isAllComplete={isAllComplete}
                imageUrl={resolvedImage}
                onFlip={() => handleFlip(piece)}
                isActive={activePiece?.id === piece.id}
              />
            ))}
          </div>
        </div>

        {/* ── Details panel ── */}
        <div
          className="w-full lg:flex-1"
          style={{
            maxWidth: "360px",
            minHeight: "120px",
            background: "#0F1011",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "10px",
            boxSizing: "border-box",
          }}
        >
          {activePiece ? (
            <motion.div
              key={activePiece.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <p
                className={cn("type-caption-lg")}
                style={{ color: "white", margin: 0 }}
              >
                {activePiece.label}
              </p>
              <p
                className="type-body-lg"
                style={{ color: "var(--white-60)", margin: 0, lineHeight: 1.65 }}
              >
                {activePiece.definition}
              </p>
              {isAllComplete && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="type-body-sm"
                  style={{
                    color: "rgba(200,160,70,0.85)",
                    margin: "6px 0 0",
                    fontStyle: "italic",
                  }}
                >
                  The full picture is revealed.
                </motion.p>
              )}
            </motion.div>
          ) : (
            <p
              className="type-body-md"
              style={{ color: "var(--white-30)", margin: 0, lineHeight: 1.6 }}
            >
              Tap{" "}
              <strong style={{ color: "var(--white-55)", fontWeight: 600 }}>
                Truth
              </strong>{" "}
              at the center to begin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
