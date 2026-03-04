import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { playLessonComplete } from "@/lib/sounds";
import { SaintRevealModal } from "./SaintRevealModal";
import successVideo from "@assets/Untitled_design_1772578374170.mp4";
import imgPadrePio from "@assets/St.PadrePio_1772600715389.png";
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
    return (
      <SaintRevealModal
        saintName={saintData.saint}
        quote={saintData.quote}
        imageUrl={saintData.image}
        onContinue={onContinue}
        onAddToCollection={onContinue}
      />
    );
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
