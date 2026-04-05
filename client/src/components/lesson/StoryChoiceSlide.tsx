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
  const { image } = item;
  const cardW = "min(220px, 70vw)";
  const cardH = "min(360px, calc(100dvh - 340px))";

  const handleTransitionEnd = useCallback(() => {
    if (isFlipping) onFlipDone();
  }, [isFlipping, onFlipDone]);

  return (
    <div
      style={{
        width: cardW,
        height: cardH,
        pointerEvents: "none",
        flexShrink: 0,
      }}
    >
      {/* Inner wrapper — rotates on Y axis */}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: isFlipping ? "rotateY(0deg)" : "rotateY(180deg)",
          transition: "transform 1400ms cubic-bezier(0.4, 0, 0.2, 1) 60ms",
          willChange: "transform",
        }}
      >
        {/* Front face — full-bleed image, no prompt (prompt is above the stack) */}
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: image
                ? "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.55) 100%)"
                : "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
              pointerEvents: "none",
            }}
          />
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
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
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

  const { leftLabel, rightLabel, image } = item;

  // Overlay shows whenever the card is leaning — no hover gate
  const overlayVisible = direction !== null;
  const overlayLabel = direction === "left" ? `← ${leftLabel}` : direction === "right" ? `${rightLabel} →` : "";

  const cardW = "min(220px, 70vw)";
  const cardH = "min(360px, calc(100dvh - 340px))";

  return (
    <div
      style={{ width: cardW, height: cardH, position: "relative" }}
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
          width: "100%",
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
        tabIndex={0}
        aria-label="Choice card — swipe or click left or right"
        whileTap={{ cursor: "grabbing" }}
        data-testid="card-story-choice"
      >
        {/* Full-bleed image */}
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

        {/* Permanent dark gradient scrim — bottom-weighted */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: image
              ? "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.55) 100%)"
              : "transparent",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Choice underlay — dark panel slides up from bottom (Reigns-style) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "46%",
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.90) 28%, rgba(0,0,0,0.97) 100%)",
            transform: overlayVisible ? "translateY(0%)" : "translateY(100%)",
            opacity: overlayVisible ? 1 : 0,
            transition: "transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            pointerEvents: "none",
          }}
          data-testid="overlay-story-choice"
        >
          <span
            style={{
              fontFamily: "Afacad, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "0.02em",
              marginTop: "20px",
            }}
          >
            {overlayLabel}
          </span>
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
      className="w-full flex flex-col items-center select-none"
      style={{ gap: "20px" }}
      data-testid="slide-story-choice"
    >
      {/* Prompt — fixed-height container so card never shifts */}
      <div
        style={{
          height: "80px",
          maxWidth: "370px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: "Afacad, sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.90)",
            lineHeight: 1.5,
            textAlign: "center",
            margin: 0,
          }}
          data-testid="text-story-prompt"
        >
          {currentItem.prompt}
        </p>
      </div>

      {/* Card stack — centered, perspective for 3D flip */}
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          perspective: "1200px",
          cursor: "pointer",
        }}
        onClick={handleStackClick}
      >
        {/* Next card — behind, aligned over the same center position */}
        {nextItem && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              display: "flex",
              justifyContent: "center",
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

        {/* Current card — in front, defines stack height */}
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
