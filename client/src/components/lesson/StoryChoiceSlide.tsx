import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { PanInfo } from "framer-motion";

interface StoryChoiceContent {
  prompt: string;
  leftLabel: string;
  rightLabel: string;
}

const DEFAULT_CONTENT: StoryChoiceContent = {
  prompt: "Someone looks at you. 'You good?'",
  leftLabel: "Say you're fine",
  rightLabel: "Say you're tired",
};

const SWIPE_THRESHOLD = 80;

export function StoryChoiceSlide({
  content,
  onInteracted,
  onChoice,
}: {
  content: string;
  onInteracted?: () => void;
  onChoice?: (choice: "left" | "right") => void;
}) {
  const [chosen, setChosen] = useState<"left" | "right" | null>(null);
  const [isDone, setIsDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 0, 160], [-6, 0, 6]);
  const cardScale = useTransform(x, [-120, 0, 120], [1.03, 1, 1.03]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20, 0], [1, 0.35, 0]);
  const rightOpacity = useTransform(x, [0, 20, SWIPE_THRESHOLD], [0, 0.35, 1]);

  const { prompt, leftLabel, rightLabel } = useMemo<StoryChoiceContent>(() => {
    try {
      const p = JSON.parse(content);
      if (
        typeof p.prompt === "string" &&
        typeof p.leftLabel === "string" &&
        typeof p.rightLabel === "string"
      ) {
        return { prompt: p.prompt, leftLabel: p.leftLabel, rightLabel: p.rightLabel };
      }
    } catch {}
    return DEFAULT_CONTENT;
  }, [content]);

  const triggerChoice = useCallback(
    (side: "left" | "right") => {
      if (chosen) return;
      setChosen(side);
      const target = side === "left" ? -520 : 520;
      animate(x, target, {
        duration: 0.22,
        ease: "easeIn",
        onComplete: () => {
          onChoice?.(side);
          onInteracted?.();
          setIsDone(true);
        },
      });
    },
    [chosen, x, onChoice, onInteracted]
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
    const side = clientX < rect.left + rect.width / 2 ? "left" : "right";
    triggerChoice(side);
  };

  if (isDone) {
    return (
      <div className="w-full flex items-center justify-center py-12" data-testid="slide-story-choice-done">
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
      <div
        className="relative w-full flex items-center justify-center"
        style={{ minHeight: "260px" }}
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
            padding: "36px 26px",
            background: "linear-gradient(160deg, #17181f 0%, #0F1011 65%)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
            cursor: "grab",
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
          <p
            className="type-display-md font-medium text-center"
            style={{ color: "rgba(255,255,255,0.90)", lineHeight: 1.55, margin: 0 }}
          >
            {prompt}
          </p>
        </motion.div>
      </div>

      {/* Hint */}
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
