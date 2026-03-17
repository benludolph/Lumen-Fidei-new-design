import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { playLessonComplete } from "@/lib/sounds";
import { SaintRevealModal } from "./SaintRevealModal";
import successVideo from "@assets/Untitled_design_1772578374170.mp4";

import imgMotherTeresa from "@assets/image_160_1772648401411.png";
import imgAnthony from "@assets/image_161_1772648401411.png";
import imgAlphonsus from "@assets/image_161-1_1772648401411.png";
import imgPadrePio from "@assets/image_162_1772648401412.png";
import imgTherese from "@assets/image_162-1_1772648401412.png";
import imgAugustine from "@assets/image_163_1772649687455.png";
import imgCatherine from "@assets/image_164_1772648401412.png";
import imgFrancis from "@assets/image_164-1_1772648401412.png";
import imgTeresaAvila from "@assets/image_164-2_1772648401412.png";
import imgGemma from "@assets/image_165_1772648401412.png";
import imgJohnCross from "@assets/image_165_1772649687455.png";
import imgJohnPaul from "@assets/image_166_1772648401412.png";
import { addToSaintCollection } from "@/lib/saintCollection";
import { useAuth } from "@/hooks/use-auth";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  onContinue: () => void;
  saintId?: string | null;
  saintName?: string | null;
  saintImage?: string | null;
  saintQuote?: string | null;
}

export interface SaintData {
  id: string;
  quote: string;
  saint: string;
  image: string;
}

export const ALL_SAINTS: SaintData[] = [
  {
    id: "madre-teresa",
    quote: "Not all of us can do great things. But we can do small things with great love.",
    saint: "St. Mother Teresa of Calcutta",
    image: imgMotherTeresa,
  },
  {
    id: "anthony-padua",
    quote: "Actions speak louder than words; let your words teach and your actions speak.",
    saint: "St. Anthony of Padua",
    image: imgAnthony,
  },
  {
    id: "alphonsus-liguori",
    quote: "He who trusts himself is lost. He who trusts in God can do all things.",
    saint: "St. Alphonsus Liguori",
    image: imgAlphonsus,
  },
  {
    id: "padre-pio",
    quote: "Pray, hope, and don't worry. Worry is useless. God is merciful and will hear your prayer.",
    saint: "St. Padre Pio",
    image: imgPadrePio,
  },
  {
    id: "therese-lisieux",
    quote: "Miss no single opportunity of making some small sacrifice, here by a smiling look, there by a kindly word.",
    saint: "St. Thérèse of Lisieux",
    image: imgTherese,
  },
  {
    id: "augustine-hippo",
    quote: "You have made us for Yourself, O Lord, and our hearts are restless until they rest in You.",
    saint: "St. Augustine of Hippo",
    image: imgAugustine,
  },
  {
    id: "catherine-siena",
    quote: "Be who God meant you to be and you will set the world on fire.",
    saint: "St. Catherine of Siena",
    image: imgCatherine,
  },
  {
    id: "francis-assisi",
    quote: "Start by doing what is necessary; then do what is possible; and suddenly you are doing the impossible.",
    saint: "St. Francis of Assisi",
    image: imgFrancis,
  },
  {
    id: "teresa-avila",
    quote: "Let nothing disturb you, let nothing frighten you. All things are passing; God never changes.",
    saint: "St. Teresa of Avila",
    image: imgTeresaAvila,
  },
  {
    id: "gemma-galgani",
    quote: "I wish I could love my Jesus more, but I have no more love; if I want more I must get it from Him.",
    saint: "St. Gemma Galgani",
    image: imgGemma,
  },
  {
    id: "john-cross",
    quote: "In the twilight of life, God will not judge us on our earthly possessions and human success, but rather on how much we have loved.",
    saint: "St. John of the Cross",
    image: imgJohnCross,
  },
  {
    id: "john-paul-ii",
    quote: "Do not be afraid. Open wide the doors to Christ.",
    saint: "St. Pope John Paul II",
    image: imgJohnPaul,
  },
];

export function LessonCompletionScreen({
  dayNumber,
  theme,
  onContinue,
  saintId,
  saintName: customSaintName,
  saintImage,
  saintQuote,
}: LessonCompletionScreenProps) {
  const [step, setStep] = useState<"success" | "reveal">("success");
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { user } = useAuth();

  const baseSaint = dayNumber === 0
    ? ALL_SAINTS[0]
    : (saintId && ALL_SAINTS.find(s => s.id === saintId)) || ALL_SAINTS[(dayNumber - 1) % ALL_SAINTS.length];

  const saintData = {
    ...baseSaint,
    saint: customSaintName || baseSaint.saint,
    image: saintImage || baseSaint.image,
    quote: saintQuote || baseSaint.quote,
  };

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
    if (dayNumber <= 0) {
      onContinue();
      return;
    }
    setStep("reveal");
  }, [dayNumber, onContinue]);

  const handleAddToCollection = useCallback(() => {
    if (user) {
      addToSaintCollection(user.id, {
        dayNumber,
        name: saintData.saint,
        image: saintData.image,
        quote: saintData.quote,
      });
    }
    onContinue();
  }, [user, saintData, dayNumber, onContinue]);

  if (step === "reveal") {
    return (
      <SaintRevealModal
        saintName={saintData.saint}
        quote={saintData.quote}
        imageUrl={saintData.image}
        onAddToCollection={handleAddToCollection}
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
              {dayNumber > 0 && (
                <p className="font-['Afacad',sans-serif] font-semibold text-black text-[16px] tracking-[1.6px] uppercase leading-none pt-3">
                  DAY {dayNumber}
                </p>
              )}
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
