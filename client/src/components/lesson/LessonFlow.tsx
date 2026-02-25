import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackAContent } from "@shared/schema";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonProgressBar } from "./LessonProgressBar";
import { LessonSlide, type SlideType } from "./LessonSlide";
import { LessonCompletionScreen } from "./LessonCompletionScreen";

interface SlideData {
  type: SlideType;
  content: string;
}

const FONT_SIZES_KEYS = ["small", "medium", "large", "xlarge"] as const;
type FontSizeKey = (typeof FONT_SIZES_KEYS)[number];

interface LessonFlowProps {
  content: TrackAContent;
  dayNumber: number;
  backgroundImage?: string;
  existingAnswer?: string;
  onExit: () => void;
  onComplete: () => void;
}

export function LessonFlow({
  content,
  dayNumber,
  backgroundImage,
  existingAnswer,
  onExit,
  onComplete,
}: LessonFlowProps) {
  type FlowState = "loading" | "slides" | "complete";
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [journalDraft, setJournalDraft] = useState(existingAnswer || "");

  const [fontSize, setFontSize] = useState<FontSizeKey>(() => {
    const saved = localStorage.getItem("lumenFidei_fontSize");
    return (saved as FontSizeKey) || "medium";
  });

  useEffect(() => {
    localStorage.setItem("lumenFidei_fontSize", fontSize);
  }, [fontSize]);

  const decreaseFontSize = useCallback(() => {
    const idx = FONT_SIZES_KEYS.indexOf(fontSize);
    if (idx > 0) setFontSize(FONT_SIZES_KEYS[idx - 1]);
  }, [fontSize]);

  const increaseFontSize = useCallback(() => {
    const idx = FONT_SIZES_KEYS.indexOf(fontSize);
    if (idx < FONT_SIZES_KEYS.length - 1) setFontSize(FONT_SIZES_KEYS[idx + 1]);
  }, [fontSize]);

  const slides = useMemo<SlideData[]>(() => {
    if (!content.slides || content.slides.length === 0) return [];
    return content.slides.map((s) => ({ type: s.type as SlideType, content: s.content }));
  }, [content]);

  const handleLoadingComplete = useCallback(() => {
    setFlowState("slides");
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide >= slides.length - 1) {
      setFlowState("complete");
    } else {
      setDirection("forward");
      setCurrentSlide((prev) => prev + 1);
      setAnimKey((prev) => prev + 1);
    }
  }, [currentSlide, slides.length]);

  const handlePrev = useCallback(() => {
    if (currentSlide <= 0) {
      onExit();
    } else {
      setDirection("backward");
      setCurrentSlide((prev) => prev - 1);
      setAnimKey((prev) => prev + 1);
    }
  }, [currentSlide, onExit]);

  const handleContinue = useCallback(() => {
    onComplete();
  }, [onComplete]);

  if (flowState === "loading") {
    return (
      <LessonLoadingScreen
        dayNumber={dayNumber}
        theme={content.centralTheme}
        backgroundImage={backgroundImage}
        onComplete={handleLoadingComplete}
      />
    );
  }

  if (flowState === "complete") {
    return (
      <LessonCompletionScreen
        dayNumber={dayNumber}
        theme={content.centralTheme}
        onContinue={handleContinue}
      />
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-muted-foreground">No content available for this day.</p>
        <Button variant="outline" onClick={onExit} data-testid="button-exit-empty">
          Back to Overview
        </Button>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background overflow-x-hidden" data-testid="lesson-flow">
      <LessonProgressBar
        currentStep={currentSlide}
        totalSteps={slides.length}
        onExit={onExit}
      />

      <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground tracking-widest uppercase">
          Day {dayNumber}
        </p>
        <h1 className="font-['Afacad',sans-serif] font-semibold text-sm sm:text-base md:text-lg text-foreground truncate">
          {content.centralTheme}
        </h1>
      </div>

      <LessonSlide
        key={`slide-${animKey}`}
        type={currentSlideData.type}
        content={currentSlideData.content}
        dayNumber={dayNumber}
        existingAnswer={currentSlideData.type === "journal" ? journalDraft : undefined}
        onJournalChange={currentSlideData.type === "journal" ? setJournalDraft : undefined}
        fontSize={fontSize}
        increaseFontSize={increaseFontSize}
        decreaseFontSize={decreaseFontSize}
        direction={direction}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t px-3 sm:px-4 py-3 sm:py-4 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrev}
            className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            data-testid="button-lesson-prev"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            {isFirstSlide ? "Exit" : "Back"}
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            className={cn(
              "gap-1 sm:gap-2 flex-1 sm:flex-none sm:px-8",
              isLastSlide && "bg-green-600"
            )}
            data-testid="button-lesson-next"
          >
            {isLastSlide ? "Finish" : "Continue"}
            {!isLastSlide && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
