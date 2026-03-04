import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/hooks/use-auth";
import { ALL_SAINTS, SaintData } from "@/components/lesson/LessonCompletionScreen";
import { getCollectedSaints } from "@/lib/saintCollection";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function SaintCardDetail({ saint, onClose }: { saint: SaintData; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <motion.div
        className="relative z-10 flex flex-col items-center max-w-[320px] mx-4"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white/60 hover:text-white hover:bg-white/10"
          onClick={onClose}
          data-testid="button-close-saint-detail"
        >
          <X className="w-5 h-5" />
        </Button>

        <div
          className="rounded-lg overflow-hidden"
          style={{
            boxShadow: "0 8px 40px rgba(212,175,55,0.3), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <img
            src={saint.image}
            alt={saint.saint}
            className="w-[200px] h-[296px] object-cover"
            data-testid={`saint-detail-image-${saint.id}`}
          />
        </div>

        <p
          className="font-['Afacad',sans-serif] text-[#d4af37]/70 text-[13px] font-semibold tracking-[3px] uppercase mt-5 mb-1"
        >
          COLLECTED
        </p>

        <h2 className="font-['Afacad',sans-serif] font-bold text-white text-[22px] leading-tight text-center mb-3">
          {saint.saint}
        </h2>

        <p className="font-['Afacad',sans-serif] text-white/60 text-[15px] leading-[22px] text-center italic px-2">
          "{saint.quote}"
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function Collections() {
  const { user } = useAuth();
  const [selectedSaint, setSelectedSaint] = useState<SaintData | null>(null);

  const collected = user ? getCollectedSaints(user.id) : [];
  const collectedCount = collected.length;
  const totalCount = ALL_SAINTS.length;

  return (
    <Shell>
      <div className="max-w-2xl mx-auto" data-testid="collections-page">
        <div className="mb-8">
          <h1 className="font-['Afacad',sans-serif] font-bold text-[28px] text-foreground">
            Saint Collection
          </h1>
          <p className="font-['Afacad',sans-serif] text-muted-foreground text-[15px] mt-1">
            Complete lessons to unlock saint cards
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "#d4af37" }}
                initial={{ width: 0 }}
                animate={{ width: `${(collectedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="font-['Afacad',sans-serif] text-sm font-medium text-muted-foreground whitespace-nowrap" data-testid="text-collection-count">
              {collectedCount}/{totalCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
          {ALL_SAINTS.map((saint) => {
            const isCollected = collected.includes(saint.id);
            return (
              <motion.div
                key={saint.id}
                className="relative cursor-pointer group"
                whileHover={isCollected ? { scale: 1.03 } : undefined}
                whileTap={isCollected ? { scale: 0.97 } : undefined}
                onClick={() => isCollected && setSelectedSaint(saint)}
                data-testid={`card-saint-${saint.id}`}
              >
                <div
                  className="rounded-lg overflow-hidden aspect-[152/225]"
                  style={{
                    boxShadow: isCollected
                      ? "0 4px 16px rgba(212,175,55,0.15), 0 2px 8px rgba(0,0,0,0.2)"
                      : "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={saint.image}
                    alt={isCollected ? saint.saint : "Locked"}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isCollected
                        ? "brightness-100 saturate-100"
                        : "brightness-[0.3] saturate-0 blur-[1px]"
                    }`}
                  />
                  {!isCollected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10">
                        <Lock className="w-4 h-4 text-white/40" />
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={`font-['Afacad',sans-serif] text-[12px] sm:text-[13px] mt-1.5 text-center leading-tight truncate ${
                    isCollected ? "text-foreground font-medium" : "text-muted-foreground/50"
                  }`}
                >
                  {isCollected ? saint.saint.replace("St. ", "") : "???"}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedSaint && (
          <SaintCardDetail
            saint={selectedSaint}
            onClose={() => setSelectedSaint(null)}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}
