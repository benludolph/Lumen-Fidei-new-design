import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { PanInfo } from "framer-motion";

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

// ─── Inner card — owns all motion state, fresh per key ───────────────────────

function StoryCard({
  item,
  onMadeChoice,
}: {
  item: StoryChoiceItem;
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
      const target = side === "left" ? -520 : 520;
      animate(x, target, {
        duration: 0.22,
        ease: "easeIn",
        onComplete: () => onMadeChoice(side),
      });
    },
    [chosen, x, onMadeChoice]
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
      style={{ minHeight: image ? "340px" : "260px" }}
    >
      {/* Left label */}
      <motion.div
        style={{ opacity: leftOpacity, pointerEvents: "none" }}
        className="absolute left-0 top-3 z-10"
      >
        <span
          className="type-body-sm font-semibold"
          style={{ color: "rgba(255,255,255,0.80)" }}
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
          className="type-body-sm font-semibold"
          style={{ color: "rgba(255,255,255,0.80)" }}
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
          background: "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
          cursor: "grab",
          overflow: "hidden",
          padding: image ? 0 : "36px 26px",
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
          <p
            className="type-display-md font-medium text-center"
            style={{ color: "rgba(255,255,255,0.90)", lineHeight: 1.55, margin: 0 }}
          >
            {prompt}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Outer slide — manages sequence ──────────────────────────────────────────

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

  const handleMadeChoice = useCallback(
    (choice: "left" | "right") => {
      onChoice?.(choice);
      if (index < items.length - 1) {
        setTimeout(() => {
          setIndex((prev) => prev + 1);
        }, 220);
      } else {
        onInteracted?.();
        setIsDone(true);
      }
    },
    [index, items.length, onChoice, onInteracted]
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
      <StoryCard key={index} item={items[index]} onMadeChoice={handleMadeChoice} />

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
