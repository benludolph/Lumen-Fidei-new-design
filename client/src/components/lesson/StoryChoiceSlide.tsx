import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { PanInfo } from "framer-motion";
import swipeSound from "@assets/Shapeforms_-_The_Mint_-_Credit_Card_Swipe_1775326675495.wav";
import cardBackImage from "@assets/Back_of_Card_(1)_1775355890768.webp";

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
  const cardH = "min(480px, calc(100dvh - 250px))";

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
          transition: "transform 1400ms cubic-bezier(0.4, 0, 0.2, 1) 60ms",
          willChange: "transform",
        }}
      >
        {/* Front face — full-bleed image layout */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            background: image
              ? "transparent"
              : "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >
          {/* Full-bleed image background */}
          {image && (
            <img
              src={image}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Dark scrim for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: image
                ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.30) 100%)"
                : "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
              pointerEvents: "none",
            }}
          />

          {/* Prompt anchored to top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "20px 22px 0",
              zIndex: 2,
            }}
          >
            <p
              className="type-display-md font-medium text-center"
              style={{
                color: "rgba(255,255,255,0.90)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {prompt}
            </p>
          </div>
        </div>

        {/* Back face — branded card back image */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
            transform: "rotateY(180deg)",
            overflow: "hidden",
          }}
        >
          <img
            src={cardBackImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── StoryCard — interactive current card, owns all motion state ──────────────

interface StoryCardHandle {
  triggerChoice: (side: "left" | "right") => void;
  getX: () => number;
  wasDragging: () => boolean;
}

interface StoryCardProps {
  item: StoryChoiceItem;
  onChoiceStart?: () => void;
  onMadeChoice: (choice: "left" | "right") => void;
}

const StoryCard = forwardRef<StoryCardHandle, StoryCardProps>(function StoryCard({
  item,
  onChoiceStart,
  onMadeChoice,
}, ref) {
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const chosenRef = useRef(false);
  const wasDraggingRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const cardOpacity = useMotionValue(1);
  const rotate = useTransform(x, [-160, 0, 160], [-6, 0, 6]);
  const cardScale = useTransform(x, [-120, 0, 120], [1.03, 1, 1.03]);

  // Update direction based on x motion value — but only show overlay while hovered or dragging
  useEffect(() => {
    const unsubscribe = x.on("change", (val) => {
      if (chosenRef.current) return;
      if (val < -20) {
        setDirection("left");
      } else if (val > 20) {
        setDirection("right");
      } else {
        setDirection(null);
      }
    });
    return unsubscribe;
  }, [x]);

  const triggerChoice = useCallback(
    (side: "left" | "right") => {
      if (chosenRef.current) return;
      chosenRef.current = true;
      onChoiceStart?.();
      try {
        const sfx = new Audio(swipeSound);
        sfx.volume = 0.15;
        sfx.play().catch(() => {});
      } catch {}
      // Drift further in the chosen direction while fading out
      const target = side === "left" ? -420 : 420;
      animate(x, target, { duration: 0.7, ease: [0.4, 0, 1, 1] });
      animate(cardOpacity, 0, {
        duration: 0.5,
        ease: "easeIn",
        onComplete: () => onMadeChoice(side),
      });
    },
    [x, cardOpacity, onChoiceStart, onMadeChoice]
  );

  useImperativeHandle(ref, () => ({
    triggerChoice,
    getX: () => x.get(),
    wasDragging: () => wasDraggingRef.current,
  }), [triggerChoice, x]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (chosenRef.current) return;
      if (e.key === "ArrowLeft") triggerChoice("left");
      if (e.key === "ArrowRight") triggerChoice("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [triggerChoice]);

  // Global mouse tracking — card leans toward whichever side of the screen the mouse is on
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (chosenRef.current) return;
      const normalized = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      x.set(normalized * 160);
    };
    const onMouseLeaveWindow = () => {
      if (chosenRef.current) return;
      animate(x, 0, { duration: 0.35, ease: "easeOut" });
    };
    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeaveWindow);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeaveWindow);
    };
  }, [x]);

  const handleDragStart = () => {
    wasDraggingRef.current = true;
    setIsDragging(true);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    if (chosenRef.current) return;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      triggerChoice("left");
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      triggerChoice("right");
    } else {
      animate(x, 0, { duration: 0.4, ease: "easeOut" });
      // Suppress the click that fires after a non-committing drag
      setTimeout(() => { wasDraggingRef.current = false; }, 150);
    }
  };

  const { prompt, leftLabel, rightLabel, image } = item;

  // Overlay only shows when hovering the card or actively dragging it
  const showOverlay = isHovered || isDragging;
  const isLeft = showOverlay && direction === "left";
  const isRight = showOverlay && direction === "right";

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: "min(480px, calc(100dvh - 250px))" }}
      data-testid="story-card"
    >
      {/* Card */}
      <motion.div
        ref={cardRef}
        style={{
          x,
          rotate,
          scale: cardScale,
          opacity: cardOpacity,
          touchAction: "none",
          width: "min(300px, 85vw)",
          height: "100%",
          background: image
            ? "transparent"
            : "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
          cursor: "grab",
          overflow: "hidden",
          position: "relative",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        tabIndex={0}
        aria-label="Choice card — swipe or click left or right"
        whileTap={{ cursor: "grabbing" }}
        data-testid="card-story-choice"
      >
        {/* Full-bleed image background */}
        {image && (
          <img
            src={image}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
              zIndex: 0,
            }}
            data-testid="img-story-choice"
          />
        )}

        {/* Dark scrim for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: image
              ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.30) 100%)"
              : "transparent",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Directional overlay — slides down from top on hover/drag */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            overflow: "hidden",
            borderRadius: "inherit",
          }}
        >
          {/* Left overlay — red tint */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(180deg, rgba(220,38,38,0.72) 0%, rgba(185,28,28,0.45) 55%, rgba(0,0,0,0) 100%)",
              transform: isLeft ? "translateY(0%)" : "translateY(-100%)",
              opacity: isLeft ? 1 : 0,
              transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "80px",
            }}
            data-testid="overlay-story-left"
          >
            <span
              className="font-semibold"
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: "18px",
                letterSpacing: "0.01em",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              ← {leftLabel}
            </span>
          </div>

          {/* Right overlay — green tint */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(180deg, rgba(22,163,74,0.72) 0%, rgba(21,128,61,0.45) 55%, rgba(0,0,0,0) 100%)",
              transform: isRight ? "translateY(0%)" : "translateY(-100%)",
              opacity: isRight ? 1 : 0,
              transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "80px",
            }}
            data-testid="overlay-story-right"
          >
            <span
              className="font-semibold"
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: "18px",
                letterSpacing: "0.01em",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              {rightLabel} →
            </span>
          </div>
        </div>

        {/* Prompt anchored to top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "20px 22px 0",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <p
            className="type-display-md font-medium text-center"
            style={{
              color: "rgba(255,255,255,0.90)",
              lineHeight: 1.55,
              margin: 0,
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
            data-testid="text-story-prompt"
          >
            {prompt}
          </p>
        </div>
      </motion.div>
    </div>
  );
});

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
  const storyCardRef = useRef<StoryCardHandle>(null);

  const currentItem = items[index];
  const nextItem = items[index + 1] ?? null;

  // Any click in the stack area confirms the current lean direction.
  // If the card is neutral (centered), fall back to click-position left/right.
  const handleStackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore clicks that are the tail end of a drag gesture
    if (storyCardRef.current?.wasDragging()) return;
    const currentX = storyCardRef.current?.getX() ?? 0;
    if (Math.abs(currentX) > 20) {
      storyCardRef.current?.triggerChoice(currentX < 0 ? "left" : "right");
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      storyCardRef.current?.triggerChoice(e.clientX < rect.left + rect.width / 2 ? "left" : "right");
    }
  }, []);

  // Listen for clicks on the hills/background area (outside the dark content card).
  // LessonFlow dispatches this event when the user clicks directly on the background.
  useEffect(() => {
    const handler = (e: Event) => {
      const { clientX, screenW } = (e as CustomEvent<{ clientX: number; screenW: number }>).detail;
      if (storyCardRef.current?.wasDragging()) return;
      const currentX = storyCardRef.current?.getX() ?? 0;
      if (Math.abs(currentX) > 20) {
        storyCardRef.current?.triggerChoice(currentX < 0 ? "left" : "right");
      } else {
        storyCardRef.current?.triggerChoice(clientX < screenW / 2 ? "left" : "right");
      }
    };
    window.addEventListener("lf:story-choice-bg-click", handler);
    return () => window.removeEventListener("lf:story-choice-bg-click", handler);
  }, []);

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
      <div
        style={{ position: "relative", width: "100%", perspective: "1200px", cursor: "pointer" }}
        onClick={handleStackClick}
      >
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
            ref={storyCardRef}
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
