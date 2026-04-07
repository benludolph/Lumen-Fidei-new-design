import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import sacredHeartImg from "@assets/amethyst1__jesus_with_the_divine_sacred_heart_in_his_hands_te_1775149739636.webp";

// ─── Standard Mode Types ──────────────────────────────────────────────────────

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

// ─── Dual Phase Types ─────────────────────────────────────────────────────────

interface LeftCard {
  title: string;
  subtext: string;
}

interface RightTile {
  id: string;
  title: string;
  subtext: string;
  position: "center" | "top" | "left" | "right" | "bottom";
}

interface DualPhaseContent {
  phase: "dual";
  leftCards: LeftCard[];
  rightGrid: RightTile[];
  overlayText: string[];
  finalText: string[];
}

type PhaseState = "left" | "transition" | "right" | "complete";

// ─── Standard Mode ────────────────────────────────────────────────────────────

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

function StandardCrossGridSlide({
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

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full">
        <div style={{ flexShrink: 0, position: "relative" }}>
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

// ─── Dual Phase Mode ──────────────────────────────────────────────────────────

const RIGHT_GRID_POS: Record<string, { row: number; col: number }> = {
  top:    { row: 1, col: 2 },
  left:   { row: 2, col: 1 },
  center: { row: 2, col: 2 },
  right:  { row: 2, col: 3 },
  bottom: { row: 3, col: 2 },
};

function DualRightTile({
  tile,
  isSelected,
  isLocked,
  isComplete,
  onClick,
}: {
  tile: RightTile;
  isSelected: boolean;
  isLocked: boolean;
  isComplete: boolean;
  onClick: (id: string) => void;
}) {
  const pos = RIGHT_GRID_POS[tile.position];
  const isCenter = tile.position === "center";

  return (
    <motion.div
      onClick={() => !isLocked && !isSelected ? onClick(tile.id) : undefined}
      animate={{
        opacity: isLocked ? 0.22 : 1,
        boxShadow: isSelected
          ? "0 0 18px 4px rgba(200,160,70,0.28), inset 0 0 0 1px rgba(200,160,70,0.45)"
          : isCenter && !isLocked
          ? "inset 0 0 0 1px rgba(255,255,255,0.28)"
          : "inset 0 0 0 1px rgba(255,255,255,0.10)",
        background: isSelected
          ? "rgba(200,160,70,0.10)"
          : isCenter && !isSelected
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)",
      }}
      transition={{ duration: 0.35 }}
      style={{
        gridRow: pos.row,
        gridColumn: pos.col,
        borderRadius: "8px",
        padding: "10px 8px",
        cursor: isLocked || isSelected ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        textAlign: "center",
        position: "relative",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "8px",
            background: "radial-gradient(ellipse at center, rgba(200,160,70,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      <span
        style={{
          fontSize: "clamp(8px, 1.8vw, 11px)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: isSelected
            ? "rgba(220,185,100,0.95)"
            : isLocked
            ? "rgba(255,255,255,0.18)"
            : "rgba(255,255,255,0.72)",
          lineHeight: 1.2,
        }}
      >
        {tile.title}
      </span>
      {!isLocked && (
        <span
          style={{
            fontSize: "clamp(7px, 1.4vw, 9px)",
            color: isSelected ? "rgba(200,160,70,0.6)" : "rgba(255,255,255,0.28)",
            lineHeight: 1.3,
          }}
        >
          {tile.subtext}
        </span>
      )}
      {isLocked && (
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.12)" }}>⊘</span>
      )}
    </motion.div>
  );
}

const DEFAULT_LEFT_CARDS: LeftCard[] = [
  { title: "Quick Fix", subtext: "Make the pain stop now." },
  { title: "Quick Prayer", subtext: "Say the words. Move on." },
  { title: "Quick Deliverance", subtext: "Remove it instantly." },
];

const DEFAULT_RIGHT_GRID: RightTile[] = [
  { id: "truth",      title: "Truth",      subtext: "Face what is real.",            position: "center" },
  { id: "repentance", title: "Repentance", subtext: "Turn away from what is false.", position: "top"    },
  { id: "trust",      title: "Trust",      subtext: "Let go of control.",            position: "left"   },
  { id: "surrender",  title: "Surrender",  subtext: "Give it to God.",               position: "right"  },
  { id: "healing",    title: "Healing",    subtext: "God restores what was broken.", position: "bottom" },
];

const IMAGE_OBJECT_POSITIONS = ["50% 10%", "50% 50%", "50% 90%"];

function DualPhaseSlide({
  data,
  onInteracted,
}: {
  data: DualPhaseContent;
  onInteracted?: () => void;
}) {
  const leftCards = Array.isArray(data.leftCards) && data.leftCards.length === 3 ? data.leftCards : DEFAULT_LEFT_CARDS;
  const rightGrid = Array.isArray(data.rightGrid) && data.rightGrid.length === 5 ? data.rightGrid : DEFAULT_RIGHT_GRID;
  const overlayText = Array.isArray(data.overlayText) && data.overlayText.length >= 2 ? data.overlayText : ["But it does not heal you.", "It keeps you in control."];
  const finalText = Array.isArray(data.finalText) && data.finalText.length >= 2 ? data.finalText : ["This is how healing happens.", "Not instantly. But truly."];

  const [phaseState, setPhaseState] = useState<PhaseState>("left");
  const [leftSelections, setLeftSelections] = useState<number[]>([]);
  const [rightSelections, setRightSelections] = useState<string[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [overlayLine, setOverlayLine] = useState(0);

  const handleLeftTap = useCallback((idx: number) => {
    if (leftSelections.includes(idx) || phaseState !== "left") return;

    if (!hasInteracted) {
      setHasInteracted(true);
      onInteracted?.();
    }

    const next = [...leftSelections, idx];
    setLeftSelections(next);

    if (next.length === leftCards.length) {
      setPhaseState("transition");
      setOverlayLine(1);
      setTimeout(() => setOverlayLine(2), 450);
      setTimeout(() => setOverlayLine(0), 2000);
      setTimeout(() => setPhaseState("right"), 2400);
    }
  }, [leftSelections, phaseState, hasInteracted, leftCards.length, onInteracted]);

  const handleRightTap = useCallback((id: string) => {
    if (rightSelections.includes(id) || phaseState !== "right") return;
    if (id !== "truth" && !rightSelections.includes("truth")) return;

    const next = [...rightSelections, id];
    setRightSelections(next);

    if (next.length === rightGrid.length) {
      setTimeout(() => setPhaseState("complete"), 500);
    }
  }, [rightSelections, phaseState, rightGrid.length]);

  const isTruthSelected = rightSelections.includes("truth");
  const crossProgress = rightSelections.length / rightGrid.length;
  const isPhase2Active = phaseState === "right" || phaseState === "complete";
  const isComplete = phaseState === "complete";

  const leftColOpacity = phaseState === "left" || phaseState === "transition" ? 1 : 0.2;
  const rightPhase1Opacity = isPhase2Active ? 0 : 1;
  const rightPhase2Opacity = isPhase2Active ? 1 : 0;

  const tileRevealedCount = leftSelections.length;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        minHeight: "260px",
      }}
    >
      {/* ── LEFT COLUMN (40%) ── */}
      <motion.div
        animate={{ opacity: leftColOpacity }}
        transition={{ duration: 0.55 }}
        style={{
          width: "40%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <p
          style={{
            fontSize: "clamp(9px, 1.8vw, 11px)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            margin: "0 0 4px",
          }}
        >
          What People Want
        </p>

        {leftCards.map((card, idx) => {
          const selected = leftSelections.includes(idx);
          return (
            <motion.div
              key={idx}
              onClick={() => handleLeftTap(idx)}
              animate={{
                opacity: selected ? 0.55 : 1,
                background: selected ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
              }}
              transition={{ duration: 0.3 }}
              style={{
                border: `1px solid ${selected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)"}`,
                borderRadius: "10px",
                padding: "12px 14px 12px 14px",
                cursor: selected || phaseState !== "left" ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                position: "relative",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {selected && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "12px",
                    color: "rgba(200,160,70,0.75)",
                    fontSize: "12px",
                    lineHeight: 1,
                  }}
                >
                  ✓
                </motion.span>
              )}
              <span
                style={{
                  fontSize: "clamp(9px, 2vw, 12px)",
                  fontWeight: 700,
                  color: selected ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.82)",
                  letterSpacing: "0.02em",
                  paddingRight: selected ? "18px" : 0,
                }}
              >
                {card.title}
              </span>
              <span
                style={{
                  fontSize: "clamp(8px, 1.6vw, 10px)",
                  color: "rgba(255,255,255,0.28)",
                  lineHeight: 1.4,
                }}
              >
                {card.subtext}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── RIGHT COLUMN (60%) ── */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", minHeight: "clamp(210px, 44vw, 280px)" }}>

        {/* Phase 1 layer: distorted image tiles — always absolute so Phase 2 drives layout height */}
        <motion.div
          animate={{ opacity: rightPhase1Opacity }}
          transition={{ duration: 0.45 }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: phaseState === "left" ? "auto" : "none",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: isPhase2Active ? 0 : 1,
          }}
        >
          <motion.div
            animate={{ opacity: phaseState === "left" || phaseState === "transition" ? 0.35 : 1 }}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "clamp(68px, 15vw, 88px)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  position: "relative",
                  background: "#0a0a0b",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <motion.div
                  animate={{ opacity: i < tileRevealedCount ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: "easeIn" }}
                  style={{
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <img
                    src={sacredHeartImg}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: IMAGE_OBJECT_POSITIONS[i],
                      filter: "grayscale(1) brightness(0.22) contrast(1.7) hue-rotate(190deg) saturate(1.4)",
                    }}
                    draggable={false}
                    alt=""
                  />
                </motion.div>
                {i >= tileRevealedCount && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(15,16,17,0.92)",
                    }}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Overlay text during transition */}
          <AnimatePresence>
            {phaseState === "transition" && overlayLine > 0 && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  pointerEvents: "none",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    background: "rgba(10,10,12,0.82)",
                    borderRadius: "10px",
                    padding: "18px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    alignItems: "center",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "clamp(11px, 2.4vw, 14px)",
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.75)",
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    {overlayText[0]}
                  </p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: overlayLine >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      margin: 0,
                      fontSize: "clamp(10px, 2vw, 12px)",
                      color: "rgba(255,255,255,0.45)",
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    {overlayText[1]}
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Phase 2 layer: cross grid */}
        <motion.div
          animate={{ opacity: rightPhase2Opacity }}
          transition={{ duration: 0.5 }}
          style={{
            position: "relative",
            pointerEvents: isPhase2Active ? "auto" : "none",
          }}
        >
          <p
            style={{
              fontSize: "clamp(9px, 1.8vw, 11px)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              margin: "0 0 8px",
            }}
          >
            What Actually Heals
          </p>

          {/* Grid container with cross glow */}
          <div style={{ position: "relative" }}>
            {/* Cross glow bars */}
            <motion.div
              animate={{ opacity: crossProgress * 0.75 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 0,
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* Vertical bar */}
              <div
                style={{
                  position: "absolute",
                  left: "33.33%",
                  width: "33.33%",
                  top: 0,
                  bottom: 0,
                  background: "linear-gradient(to right, transparent 0%, rgba(200,160,70,0.35) 50%, transparent 100%)",
                }}
              />
              {/* Horizontal bar */}
              <div
                style={{
                  position: "absolute",
                  top: "33.33%",
                  height: "33.33%",
                  left: 0,
                  right: 0,
                  background: "linear-gradient(to bottom, transparent 0%, rgba(200,160,70,0.35) 50%, transparent 100%)",
                }}
              />
            </motion.div>

            {/* Sacred Heart image (on complete) */}
            <AnimatePresence>
              {isComplete && (
                <motion.img
                  key="sacred-heart"
                  src={sacredHeartImg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.28 }}
                  transition={{ duration: 0.7, delay: 0.35 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                  draggable={false}
                  alt=""
                />
              )}
            </AnimatePresence>

            {/* Outer glow on complete */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  position: "absolute",
                  inset: "-10px",
                  borderRadius: "14px",
                  background: "radial-gradient(ellipse at center, rgba(200,160,70,0.16) 0%, rgba(200,160,70,0) 70%)",
                  boxShadow: "0 0 36px 8px rgba(200,160,70,0.12)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            )}

            {/* 3×3 cross grid */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
                gap: "5px",
              }}
            >
              {/* Empty corner cells */}
              <div style={{ gridRow: 1, gridColumn: 1 }} />
              <div style={{ gridRow: 1, gridColumn: 3 }} />
              <div style={{ gridRow: 3, gridColumn: 1 }} />
              <div style={{ gridRow: 3, gridColumn: 3 }} />

              {/* Active tiles */}
              {rightGrid.map((tile) => (
                <DualRightTile
                  key={tile.id}
                  tile={tile}
                  isSelected={rightSelections.includes(tile.id)}
                  isLocked={tile.id !== "truth" && !isTruthSelected}
                  isComplete={isComplete}
                  onClick={handleRightTap}
                />
              ))}
            </div>
          </div>

          {/* Final text */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                key="final-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                style={{
                  marginTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  paddingLeft: "2px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(11px, 2.2vw, 13px)",
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.5,
                  }}
                >
                  {finalText[0]}
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.4 }}
                  style={{
                    margin: 0,
                    fontSize: "clamp(10px, 1.8vw, 11px)",
                    color: "rgba(200,160,70,0.65)",
                    lineHeight: 1.5,
                  }}
                >
                  {finalText[1]}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

export function CrossGridSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);

  if (parsed?.phase === "dual") {
    return (
      <DualPhaseSlide
        data={parsed as DualPhaseContent}
        onInteracted={onInteracted}
      />
    );
  }

  return <StandardCrossGridSlide content={content} onInteracted={onInteracted} />;
}
