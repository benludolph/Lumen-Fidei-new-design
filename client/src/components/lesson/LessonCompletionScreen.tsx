import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { playLessonComplete } from "@/lib/sounds";
import successVideo from "@assets/Untitled_design_1772578374170.mp4";
import imgPadrePio from "@assets/PadrePio_1772577338030.png";
import imgTeresaCalcutta from "@assets/image_1772578071253.png";
import imgJohnVianney from "@assets/st-john-vianney-icon-415_1772578077577.jpg";
import imgAugustine from "@assets/image_1772578111200.png";
import imgAnthony from "@assets/image_1772578126634.png";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  onContinue: () => void;
}

const SAINT_QUOTES = [
  {
    quote: "Pray, hope, and don't worry. Worry is useless. God is merciful and will hear your prayer.",
    saint: "St. Padre Pio",
    image: imgPadrePio,
  },
  {
    quote: "If you are what you should be, you will set the whole world on fire.",
    saint: "St. Teresa of Calcutta",
    image: imgTeresaCalcutta,
  },
  {
    quote: "The eyes of the world see no further than this life, but the eyes of the Christian see deep into eternity.",
    saint: "St. John Vianney",
    image: imgJohnVianney,
  },
  {
    quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    saint: "St. Augustine",
    image: imgAugustine,
  },
  {
    quote: "Actions speak louder than words; let your words teach and your actions speak.",
    saint: "St. Anthony of Padua",
    image: imgAnthony,
  },
  {
    quote: "Have patience with all things, but chiefly have patience with yourself.",
    saint: "St. Padre Pio",
    image: imgPadrePio,
  },
  {
    quote: "Not all of us can do great things. But we can do small things with great love.",
    saint: "St. Teresa of Calcutta",
    image: imgTeresaCalcutta,
  },
  {
    quote: "Private prayer is like straw scattered here and there: if you set it on fire, it makes a lot of little flames. But gather these straws into a bundle and light them, and you get a mighty fire.",
    saint: "St. John Vianney",
    image: imgJohnVianney,
  },
  {
    quote: "You have made us for Yourself, O Lord, and our hearts are restless until they rest in You.",
    saint: "St. Augustine",
    image: imgAugustine,
  },
  {
    quote: "The life of the body is the soul; the life of the soul is God.",
    saint: "St. Anthony of Padua",
    image: imgAnthony,
  },
];

function SaintRevealStep({
  saintData,
  onContinue,
}: {
  saintData: typeof SAINT_QUOTES[0];
  onContinue: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="lesson-saint-reveal"
    >
      <motion.div
        className="absolute inset-0 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1.2 }}
      >
        <div
          className="w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,200,118,0.25) 0%, rgba(212,200,118,0.08) 40%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col items-center w-full max-w-[340px] mx-4"
        initial={{ y: 60, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
      >
        <div
          className="relative rounded-2xl overflow-hidden bg-zinc-900/90 border border-[#d4c876]/20 shadow-2xl w-full"
          style={{
            boxShadow: "0 0 60px rgba(212,200,118,0.15), 0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "60%",
                height: "200%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                animation: "light-sweep 1.8s ease-in-out 1.0s forwards",
                transform: "translateX(-100%) rotate(-45deg)",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-6">
            <motion.div
              className="mb-5 rounded-xl overflow-hidden shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{ boxShadow: "0 0 30px rgba(212,200,118,0.2)" }}
            >
              <img
                src={saintData.image}
                alt={saintData.saint}
                className="w-[180px] h-[240px] object-cover rounded-xl"
                data-testid="saint-reveal-image"
              />
            </motion.div>

            <motion.h2
              className="font-['Afacad',sans-serif] font-bold text-[#d4c876] text-[24px] leading-tight text-center mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              data-testid="saint-reveal-name"
            >
              {saintData.saint}
            </motion.h2>

            <motion.p
              className="font-['Afacad',sans-serif] text-white/80 text-[15px] leading-[24px] text-center italic px-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              data-testid="saint-reveal-quote"
            >
              "{saintData.quote}"
            </motion.p>
          </div>
        </div>

        <motion.div
          className="flex flex-col gap-3 w-full mt-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
        >
          <Button
            onClick={onContinue}
            variant="outline"
            className="w-full h-11 gap-2 font-['Afacad',sans-serif] font-medium text-sm bg-transparent border-[#d4c876]/40 text-[#d4c876] hover:bg-[#d4c876]/10 hover:text-[#d4c876] hover:border-[#d4c876]/60 rounded-lg"
            data-testid="button-add-to-collection"
          >
            <BookmarkPlus className="w-4 h-4" />
            Add to Collection
          </Button>
          <Button
            onClick={onContinue}
            className="w-full h-11 gap-2 font-['Afacad',sans-serif] font-medium text-sm bg-[#d4c876] hover:bg-[#d4c876]/90 text-black rounded-lg shadow-md"
            data-testid="button-continue-after-reveal"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function LessonCompletionScreen({
  dayNumber,
  theme,
  onContinue,
}: LessonCompletionScreenProps) {
  const [step, setStep] = useState<"success" | "reveal">("success");
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const saintData = SAINT_QUOTES[(dayNumber - 1) % SAINT_QUOTES.length];

  useEffect(() => {
    playLessonComplete();
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    const buttonTimer = setTimeout(() => setShowButton(true), 900);
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const handleContinueToReveal = useCallback(() => {
    setStep("reveal");
  }, []);

  if (step === "reveal") {
    return <SaintRevealStep saintData={saintData} onContinue={onContinue} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      data-testid="lesson-completion-screen"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center max-w-[393px] w-full">
          <div
            className={cn(
              "mb-4 transition-all duration-500",
              showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            <div className="w-[160px] h-[160px] rounded-xl overflow-hidden">
              <video
                src={successVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                data-testid="success-video"
              />
            </div>
          </div>

          <div
            className={cn(
              "text-center space-y-1 transition-all duration-700",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h1 className="font-['Afacad',sans-serif] font-bold text-black text-[30px] leading-[37.5px]">
              Lesson Complete
            </h1>
            <div className="space-y-0">
              <p className="font-['Afacad',sans-serif] font-semibold text-black text-[16px] tracking-[1.6px] uppercase leading-none pt-3">
                DAY {dayNumber}
              </p>
              <p className="font-['Afacad',sans-serif] font-semibold text-black text-[18px] leading-[37.5px]">
                {theme}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-zinc-200 bg-white py-6 sm:py-8 flex justify-center transition-all duration-500",
          showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <Button
          onClick={handleContinueToReveal}
          className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 h-9 px-4 text-sm font-medium rounded-md shadow-md font-['Afacad',sans-serif]"
          data-testid="button-continue-after-completion"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
