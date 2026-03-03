import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { playLessonComplete } from "@/lib/sounds";
import fireworksVideo from "@assets/bearcla_httpss.mj.run9sb94es-b58_simple_fireworks._Nothing_el__1772560150122.mp4";

interface LessonCompletionScreenProps {
  dayNumber: number;
  theme: string;
  onContinue: () => void;
}

const SAINT_QUOTES = [
  {
    quote: "Pray, hope, and don't worry. Worry is useless. God is merciful and will hear your prayer.",
    saint: "St. Padre Pio",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Padre_Pio.jpg/220px-Padre_Pio.jpg",
  },
  {
    quote: "The soul that walks in love neither tires others nor grows tired.",
    saint: "St. John of the Cross",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Fray_Juan_de_la_Cruz.jpg/220px-Fray_Juan_de_la_Cruz.jpg",
  },
  {
    quote: "You must ask God to give you power to fight against the sin of pride which is your greatest enemy — the root of all that is evil, and the failure of all that is good.",
    saint: "St. Vincent de Paul",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/St_Vincent_de_Paul.PNG/220px-St_Vincent_de_Paul.PNG",
  },
  {
    quote: "Do not be dismayed by the sins you commit, for even the saints died daily in their struggle.",
    saint: "St. Josemaría Escrivá",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Jmescriva.jpg/220px-Jmescriva.jpg",
  },
  {
    quote: "Have patience with all things, but chiefly have patience with yourself.",
    saint: "St. Francis de Sales",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Francis_de_Sales.jpg/220px-Francis_de_Sales.jpg",
  },
  {
    quote: "Lord, make me an instrument of Your peace. Where there is hatred, let me sow love.",
    saint: "St. Francis of Assisi",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Saint_Francis_of_Assisi_by_Jusepe_de_Ribera.jpg/220px-Saint_Francis_of_Assisi_by_Jusepe_de_Ribera.jpg",
  },
  {
    quote: "If God can work through me, He can work through anyone.",
    saint: "St. Francis of Assisi",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Saint_Francis_of_Assisi_by_Jusepe_de_Ribera.jpg/220px-Saint_Francis_of_Assisi_by_Jusepe_de_Ribera.jpg",
  },
  {
    quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    saint: "St. Augustine",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Saint_Augustine_by_Philippe_de_Champaigne.jpg/220px-Saint_Augustine_by_Philippe_de_Champaigne.jpg",
  },
  {
    quote: "To one who has faith, no explanation is necessary. To one without faith, no explanation is possible.",
    saint: "St. Thomas Aquinas",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/St-thomas-aquinas.jpg/220px-St-thomas-aquinas.jpg",
  },
  {
    quote: "Be who God meant you to be and you will set the world on fire.",
    saint: "St. Catherine of Siena",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Giovanni_Battista_Tiepolo_094.jpg/220px-Giovanni_Battista_Tiepolo_094.jpg",
  },
];

function SaintCard({ image }: { image: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(600px) rotateX(0deg) rotateY(0deg)");

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 15;
    setTransform(`perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform("perspective(600px) rotateX(0deg) rotateY(0deg)");
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl overflow-hidden shadow-xl"
      style={{
        transform,
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      data-testid="saint-card-tilt"
    >
      <img
        src={image}
        alt="Saint"
        className="w-[154px] h-[230px] object-cover rounded-xl"
        data-testid="saint-image"
      />
    </div>
  );
}

export function LessonCompletionScreen({
  dayNumber,
  theme,
  onContinue,
}: LessonCompletionScreenProps) {
  const [step, setStep] = useState<"success" | "quote">("success");
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

  const handleContinueToQuote = useCallback(() => {
    setStep("quote");
    setShowContent(false);
    setShowButton(false);
    setTimeout(() => setShowContent(true), 200);
    setTimeout(() => setShowButton(true), 600);
  }, []);

  if (step === "quote") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-white"
        data-testid="lesson-saint-quote-screen"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center max-w-[393px] w-full">
            <div
              className={cn(
                "mb-6 transition-all duration-500",
                showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
              )}
            >
              <SaintCard image={saintData.image} />
            </div>

            <div
              className={cn(
                "text-center space-y-2 transition-all duration-700",
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <p className="font-['Afacad',sans-serif] font-semibold text-black text-[22px] sm:text-[25px] leading-[37.5px]">
                {saintData.quote}
              </p>
              <p className="font-['Afacad',sans-serif] font-bold text-black text-[18px] leading-[37.5px]">
                ─ {saintData.saint}
              </p>
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
            onClick={onContinue}
            className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 h-9 px-4 text-sm font-medium rounded-md shadow-md font-['Afacad',sans-serif]"
            data-testid="button-continue-after-quote"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
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
            <div className="w-[212px] h-[212px] rounded-xl overflow-hidden">
              <video
                src={fireworksVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                data-testid="fireworks-video"
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
          onClick={handleContinueToQuote}
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
