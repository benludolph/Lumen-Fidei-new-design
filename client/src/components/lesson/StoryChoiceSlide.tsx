import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { PanInfo } from "framer-motion";
import swipeSound from "@assets/Shapeforms_-_The_Mint_-_Credit_Card_Swipe_1775326675495.wav";

interface StoryChoiceItem {
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  image?: string;
}

const DEFAULT_ITEMS: StoryChoiceItem[] = [
  {
    prompt: "Someone looks at you. 'You good?'",
    leftLabel: "Say you're fine",
    rightLabel: "Say you're tired",
  },
];

const SWIPE_THRESHOLD = 80;

function isValidItem(p: unknown): p is StoryChoiceItem {
  return (
    typeof p === "object" &&
    p !== null &&
    typeof (p as StoryChoiceItem).prompt === "string" &&
    typeof (p as StoryChoiceItem).leftLabel === "string" &&
    typeof (p as StoryChoiceItem).rightLabel === "string"
  );
}

function parseItems(content: string): StoryChoiceItem[] {
  try {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const valid = arr.filter(isValidItem).map((p) => ({
      prompt: p.prompt,
      leftLabel: p.leftLabel,
      rightLabel: p.rightLabel,
      image: typeof p.image === "string" && p.image.trim() ? p.image.trim() : undefined,
    }));
    if (valid.length > 0) return valid;
  } catch {}
  return DEFAULT_ITEMS;
}

// ─── NextCardFlip — 3D flip, non-interactive, rendered behind current card ────

function NextCardFlip({
  item,
  isFlipping,
  onFlipDone,
}: {
  item: StoryChoiceItem;
  isFlipping: boolean;
  onFlipDone: () => void;
}) {
  const { prompt, image } = item;
  const cardH = image ? "340px" : "260px";

  const handleTransitionEnd = useCallback(() => {
    if (isFlipping) onFlipDone();
  }, [isFlipping, onFlipDone]);

  return (
    <div
      style={{
        width: "100%",
        height: cardH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Inner wrapper — rotates on Y axis */}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          width: "min(300px, 85vw)",
          height: cardH,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: isFlipping ? "rotateY(0deg)" : "rotateY(180deg)",
          transition: "transform 820ms cubic-bezier(0.4, 0, 0.2, 1) 60ms",
          willChange: "transform",
        }}
      >
        {/* Front face — shows next item content */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            background: "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
            overflow: "hidden",
            padding: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {image ? (
            <>
              <div style={{ position: "relative", width: "100%", height: "160px", flexShrink: 0 }}>
                <img
                  src={image}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(15,16,17,0.72) 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "22px 22px 26px",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <p
                  className="type-display-md font-medium text-center"
                  style={{
                    color: "rgba(255,255,255,0.90)",
                    lineHeight: 1.55,
                    margin: 0,
                    width: "100%",
                  }}
                >
                  {prompt}
                </p>
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                flex: 1,
                padding: "0 26px 28px",
              }}
            >
              <p
                className="type-display-md font-medium text-center"
                style={{ color: "rgba(255,255,255,0.90)", lineHeight: 1.55, margin: 0 }}
              >
                {prompt}
              </p>
            </div>
          )}
        </div>

        {/* Back face — mystery surface, plain dark card per Figma */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            background: "linear-gradient(138deg, #17181F 0%, #0F1011 65%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
            transform: "rotateY(180deg)",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
}

// ─── StoryCard — interactive current card, owns all motion state ──────────────

function StoryCard({
  item,
  onChoiceStart,
  onMadeChoice,
}: {
  item: StoryChoiceItem;
  onChoiceStart?: () => void;
  onMadeChoice: (choice: "left" | "right") => void;
}) {
  const [chosen, setChosen] = useState<"left" | "right" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 0, 160], [-6, 0, 6]);
  const cardScale = useTransform(x, [-120, 0, 120], [1.03, 1, 1.03]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20, 0], [1, 0.35, 0]);
  const rightOpacity = useTransform(x, [0, 20, SWIPE_THRESHOLD], [0, 0.35, 1]);

  const triggerChoice = useCallback(
    (side: "left" | "right") => {
      if (chosen) return;
      setChosen(side);
      onChoiceStart?.();
      try {
        const sfx = new Audio(swipeSound);
        sfx.volume = 0.15;
        sfx.play().catch(() => {});
      } catch {}
      const target = side === "left" ? -520 : 520;
      animate(x, target, {
        duration: 0.22,
        ease: "easeIn",
        onComplete: () => onMadeChoice(side),
      });
    },
    [chosen, x, onChoiceStart, onMadeChoice]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (chosen) return;
      if (e.key === "ArrowLeft") triggerChoice("left");
      if (e.key === "ArrowRight") triggerChoice("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chosen, triggerChoice]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (chosen || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const delta = e.clientX - (rect.left + rect.width / 2);
    x.set((delta / (rect.width / 2)) * SWIPE_THRESHOLD * 1.1);
  };

  const handleMouseLeave = () => {
    if (chosen) return;
    animate(x, 0, { duration: 0.35, ease: "easeOut" });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (chosen) return;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      triggerChoice("left");
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      triggerChoice("right");
    } else {
      animate(x, 0, { duration: 0.4, ease: "easeOut" });
    }
  };

  const handleTap = (e: MouseEvent | TouchEvent | PointerEvent) => {
    if (chosen || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX =
      "changedTouches" in e
        ? (e as TouchEvent).changedTouches[0]?.clientX ?? rect.left + rect.width / 2
        : (e as MouseEvent | PointerEvent).clientX;
    triggerChoice(clientX < rect.left + rect.width / 2 ? "left" : "right");
  };

  const { prompt, leftLabel, rightLabel, image } = item;

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: image ? "340px" : "260px" }}
    >
      {/* Left label */}
      <motion.div
        style={{ opacity: leftOpacity, pointerEvents: "none" }}
        className="absolute left-0 top-3 z-10"
      >
        <span
          className="font-semibold"
          style={{ color: "rgba(255,255,255,0.80)", fontSize: "15px" }}
          data-testid="label-story-left"
        >
          ← {leftLabel}
        </span>
      </motion.div>

      {/* Right label */}
      <motion.div
        style={{ opacity: rightOpacity, pointerEvents: "none" }}
        className="absolute right-0 top-3 z-10"
      >
        <span
          className="font-semibold"
          style={{ color: "rgba(255,255,255,0.80)", fontSize: "15px" }}
          data-testid="label-story-right"
        >
          {rightLabel} →
        </span>
      </motion.div>

      {/* Card */}
      <motion.div
        ref={cardRef}
        style={{
          x,
          rotate,
          scale: cardScale,
          touchAction: "none",
          width: "min(300px, 85vw)",
          height: image ? "340px" : "260px",
          background: "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
          cursor: "grab",
          overflow: "hidden",
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        aria-label="Choice card — swipe or click left or right"
        whileTap={{ cursor: "grabbing" }}
        data-testid="card-story-choice"
      >
        {image ? (
          <>
            <div
              style={{ position: "relative", width: "100%", height: "160px", flexShrink: 0 }}
              data-testid="img-story-choice"
            >
              <img
                src={image}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(15,16,17,0.72) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div style={{ padding: "22px 22px 26px" }}>
              <p
                className="type-display-md font-medium text-center"
                style={{ color: "rgba(255,255,255,0.90)", lineHeight: 1.55, margin: 0 }}
              >
                {prompt}
              </p>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              flex: 1,
              padding: "0 26px 28px",
            }}
          >
            <p
              className="type-display-md font-medium text-center"
              style={{ color: "rgba(255,255,255,0.90)", lineHeight: 1.55, margin: 0 }}
            >
              {prompt}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── StoryChoiceSlide — outer, manages sequence + flip state ─────────────────

export function StoryChoiceSlide({
  content,
  onInteracted,
  onChoice,
}: {
  content: string;
  onInteracted?: () => void;
  onChoice?: (choice: "left" | "right") => void;
}) {
  const items = parseItems(content);
  const [index, setIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isFlippingNext, setIsFlippingNext] = useState(false);

  const currentItem = items[index];
  const nextItem = items[index + 1] ?? null;

  // Called by NextCardFlip after its flip-to-front animation completes
  const handleFlipDone = useCallback(() => {
    setIndex((prev) => prev + 1);
    setIsFlippingNext(false);
  }, []);

  // Called immediately when user commits a choice (before exit animation)
  const handleChoiceStart = useCallback(() => {
    if (nextItem) {
      setIsFlippingNext(true);
    }
  }, [nextItem]);

  // Called after the current card's exit animation completes (220ms after choice)
  const handleMadeChoice = useCallback(
    (choice: "left" | "right") => {
      onChoice?.(choice);
      if (!nextItem) {
        onInteracted?.();
        setIsDone(true);
      }
      // If nextItem exists: flip was already triggered via handleChoiceStart;
      // handleFlipDone (via onTransitionEnd) will advance the index.
    },
    [nextItem, onChoice, onInteracted]
  );

  if (isDone) {
    return (
      <div
        className="w-full flex items-center justify-center py-12"
        data-testid="slide-story-choice-done"
      >
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="type-body-md"
          style={{ color: "var(--white-30)" }}
        >
          Your choice has been made.
        </motion.p>
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-4 select-none"
      data-testid="slide-story-choice"
    >
      {/*
        Card stack: next card sits behind the current card.
        NextCardFlip is position:absolute (fills container), StoryCard is
        position:relative (defines container height via its own minHeight).
      */}
      <div style={{ position: "relative", width: "100%", perspective: "1200px" }}>
        {/* Next card — behind, shows back face until flip */}
        {nextItem && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
            }}
          >
            <NextCardFlip
              key={index}
              item={nextItem}
              isFlipping={isFlippingNext}
              onFlipDone={handleFlipDone}
            />
          </div>
        )}

        {/* Current card — in front, interactive */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <StoryCard
            key={index}
            item={currentItem}
            onChoiceStart={handleChoiceStart}
            onMadeChoice={handleMadeChoice}
          />
        </div>
      </div>

      <p
        className="type-caption-sm text-center"
        style={{ color: "var(--white-25)", letterSpacing: "0.05em" }}
        data-testid="text-story-choice-hint"
      >
        swipe or click left / right to choose
      </p>
    </div>
  );
}
