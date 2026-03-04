import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookmarkPlus } from "lucide-react";

interface SaintRevealModalProps {
  saintName: string;
  quote: string;
  imageUrl: string;
  onContinue: () => void;
  onAddToCollection: () => void;
}

type Phase = "overlay" | "silhouette" | "glow" | "flip" | "text";

export function SaintRevealModal({
  saintName,
  quote,
  imageUrl,
  onContinue,
  onAddToCollection,
}: SaintRevealModalProps) {
  const [phase, setPhase] = useState<Phase>("overlay");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("silhouette"), 500),
      setTimeout(() => setPhase("glow"), 1200),
      setTimeout(() => setPhase("flip"), 2000),
      setTimeout(() => setPhase("text"), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const phaseIndex = ["overlay", "silhouette", "glow", "flip", "text"].indexOf(phase);
  const pastSilhouette = phaseIndex >= 1;
  const pastGlow = phaseIndex >= 2;
  const pastFlip = phaseIndex >= 3;
  const pastText = phaseIndex >= 4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ perspective: "1200px" }}
      data-testid="saint-reveal-modal"
    >
      <motion.div
        className="absolute inset-0 bg-black/85"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: pastGlow ? 1 : 0,
          scale: pastGlow ? 1 : 0.6,
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div
          className="w-[350px] h-[450px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 35%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-[320px] mx-4">
        <motion.div
          className="relative w-full"
          style={{
            transformStyle: "preserve-3d",
          }}
          initial={{ rotateY: 180, scale: 0.9, opacity: 0 }}
          animate={{
            rotateY: pastFlip ? 0 : 180,
            scale: pastSilhouette ? 1 : 0.9,
            opacity: pastSilhouette ? (pastFlip ? 1 : 0.35) : 0,
          }}
          transition={{
            rotateY: { duration: 0.7, ease: "easeOut" },
            scale: { duration: 0.6, ease: "easeOut" },
            opacity: { duration: 0.5 },
          }}
        >
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              backfaceVisibility: "hidden",
              boxShadow: pastFlip
                ? "0 0 40px rgba(212,175,55,0.25), 0 20px 40px rgba(0,0,0,0.4)"
                : "none",
            }}
          >
            <img
              src={imageUrl}
              alt={saintName}
              className="w-full h-auto object-cover rounded-xl"
              data-testid="saint-reveal-image"
            />

            {!pastFlip && (
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 100%)",
                  mixBlendMode: "multiply",
                }}
              />
            )}
          </div>
        </motion.div>

        <motion.h2
          className="font-['Afacad',sans-serif] font-bold text-[#d4af37] text-[26px] leading-tight text-center mt-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: pastText ? 1 : 0,
            y: pastText ? 0 : 12,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          data-testid="saint-reveal-name"
        >
          {saintName}
        </motion.h2>

        <motion.p
          className="font-['Afacad',sans-serif] text-white/75 text-[15px] leading-[22px] text-center italic mt-3 px-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: pastText ? 1 : 0,
            y: pastText ? 0 : 12,
          }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          data-testid="saint-reveal-quote"
        >
          "{quote}"
        </motion.p>

        <motion.div
          className="flex flex-col gap-3 w-full mt-7"
          initial={{ opacity: 0, y: 15 }}
          animate={{
            opacity: pastText ? 1 : 0,
            y: pastText ? 0 : 15,
          }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        >
          <Button
            onClick={onAddToCollection}
            variant="outline"
            className="w-full h-11 gap-2 font-['Afacad',sans-serif] font-medium text-sm bg-transparent border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#d4af37] hover:border-[#d4af37]/60 rounded-lg"
            data-testid="button-add-to-collection"
          >
            <BookmarkPlus className="w-4 h-4" />
            Add to Collection
          </Button>
          <Button
            onClick={onContinue}
            className="w-full h-11 gap-2 font-['Afacad',sans-serif] font-medium text-sm bg-[#d4af37] hover:bg-[#c9a432] text-black rounded-lg shadow-md"
            data-testid="button-continue-after-reveal"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
