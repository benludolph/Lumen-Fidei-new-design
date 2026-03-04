import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookmarkPlus } from "lucide-react";

interface SaintRevealModalProps {
  saintName: string;
  quote: string;
  imageUrl: string;
  onContinue: () => void;
  onAddToCollection: () => void;
}

type Phase = "slideUp" | "center" | "indent" | "popReveal" | "showText" | "collecting";

export function SaintRevealModal({
  saintName,
  quote,
  imageUrl,
  onContinue,
  onAddToCollection,
}: SaintRevealModalProps) {
  const [phase, setPhase] = useState<Phase>("slideUp");
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardControls = useAnimation();
  const textControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("center"), 600),
      setTimeout(() => setPhase("indent"), 1200),
      setTimeout(() => setPhase("popReveal"), 1550),
      setTimeout(() => setPhase("showText"), 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleAddToCollection = useCallback(async () => {
    if (phase !== "showText") return;
    setPhase("collecting");

    const cardEl = cardRef.current;
    const btnEl = buttonRef.current;

    let translateX = 0;
    let translateY = 150;

    if (cardEl && btnEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const btnRect = btnEl.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;
      translateX = btnCenterX - cardCenterX;
      translateY = btnCenterY - cardCenterY;
    }

    await Promise.all([
      textControls.start({
        opacity: 0,
        y: 10,
        transition: { duration: 0.25, ease: "easeIn" },
      }),
      cardControls.start({
        scale: 0.12,
        x: translateX,
        y: translateY,
        opacity: 0,
        transition: {
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 0.4, delay: 0.1 },
        },
      }),
    ]);

    await buttonControls.start({
      scale: [1, 1.15, 1],
      transition: {
        duration: 0.35,
        times: [0, 0.5, 1],
        ease: "easeInOut",
      },
    });

    await new Promise((r) => setTimeout(r, 200));
    onAddToCollection();
  }, [phase, cardControls, textControls, buttonControls, onAddToCollection]);

  const isCenter = ["center", "indent", "popReveal", "showText", "collecting"].includes(phase);
  const isIndent = phase === "indent";
  const isRevealed = ["popReveal", "showText"].includes(phase);
  const showText = phase === "showText";
  const isCollecting = phase === "collecting";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      data-testid="saint-reveal-modal"
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "#1a1a1a" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[320px] mx-4">
        <motion.div
          ref={cardRef}
          className="relative"
          initial={{ y: "100vh", opacity: 0 }}
          animate={
            isCollecting
              ? cardControls
              : {
                  y: isCenter ? 0 : "100vh",
                  opacity: isCenter ? 1 : 0,
                  scale: isIndent ? 0.82 : isRevealed ? 1.02 : 1,
                  x: 0,
                }
          }
          transition={
            isIndent
              ? { scale: { duration: 0.25, ease: "easeIn" } }
              : isRevealed
                ? { scale: { type: "spring", stiffness: 400, damping: 15, mass: 0.8 } }
                : { y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3 } }
          }
        >
          <motion.div
            className="relative overflow-hidden rounded-lg"
            animate={{
              filter: isRevealed || showText ? "brightness(1) saturate(1)" : "brightness(0.3) saturate(0)",
            }}
            transition={{ duration: isRevealed ? 0.35 : 0.1 }}
            style={{
              boxShadow: isRevealed || showText
                ? "0 8px 40px rgba(212,175,55,0.3), 0 20px 60px rgba(0,0,0,0.5)"
                : "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            <img
              src={imageUrl}
              alt={saintName}
              className="w-[152px] h-[225px] object-cover rounded-lg"
              data-testid="saint-reveal-image"
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center mt-6 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={
            isCollecting
              ? textControls
              : {
                  opacity: showText ? 1 : 0,
                  y: showText ? 0 : 20,
                }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p
            className="font-['Afacad',sans-serif] text-[#d4af37]/70 text-[13px] font-semibold tracking-[3px] uppercase mb-1"
            data-testid="text-unlocked-label"
          >
            UNLOCKED
          </p>

          <h2
            className="font-['Afacad',sans-serif] font-bold text-white text-[24px] leading-tight text-center mb-3"
            data-testid="saint-reveal-name"
          >
            {saintName}
          </h2>

          <motion.p
            className="font-['Afacad',sans-serif] text-white/60 text-[15px] leading-[22px] text-center italic px-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: showText && !isCollecting ? 1 : 0,
              y: showText && !isCollecting ? 0 : 10,
            }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            data-testid="saint-reveal-quote"
          >
            "{quote}"
          </motion.p>

          <motion.div
            className="mt-6 w-full flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: showText && !isCollecting ? 1 : 0,
              y: showText && !isCollecting ? 0 : 10,
            }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          >
            <motion.div animate={buttonControls}>
              <Button
                ref={buttonRef}
                onClick={handleAddToCollection}
                variant="outline"
                className="gap-2 font-['Afacad',sans-serif] font-medium text-sm bg-transparent border-white/20 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/40 rounded-full px-6 h-9"
                data-testid="button-add-to-collection"
              >
                <BookmarkPlus className="w-4 h-4" />
                Add to Collection
              </Button>
            </motion.div>
          </motion.div>

          <motion.button
            className="mt-8 font-['Afacad',sans-serif] text-white/40 text-[14px] hover:text-white/60 transition-colors"
            onClick={onContinue}
            initial={{ opacity: 0 }}
            animate={{ opacity: showText && !isCollecting ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            data-testid="button-continue-after-reveal"
          >
            Continue
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
