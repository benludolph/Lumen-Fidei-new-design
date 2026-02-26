import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { TrackAContent } from "@shared/schema";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonProgressBar } from "./LessonProgressBar";
import { LessonSlide, type SlideType } from "./LessonSlide";
import { LessonCompletionScreen } from "./LessonCompletionScreen";

interface SlideData {
  type: SlideType;
  content: string;
}

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
    <div className="fixed inset-0 z-40 flex flex-col bg-white overflow-x-hidden" data-testid="lesson-flow">
      <LessonProgressBar
        currentStep={currentSlide}
        totalSteps={slides.length}
        onExit={onExit}
      />

      <LessonSlide
        key={`slide-${animKey}`}
        type={currentSlideData.type}
        content={currentSlideData.content}
        dayNumber={dayNumber}
        existingAnswer={currentSlideData.type === "text_input" ? journalDraft : undefined}
        onJournalChange={currentSlideData.type === "text_input" ? setJournalDraft : undefined}
        direction={direction}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e4e4e7] px-6 py-8 z-50">
        <div className="max-w-[540px] mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrev}
            className="gap-2 bg-[#f0f0f0] text-black hover:bg-[#e4e4e4]"
            data-testid="button-lesson-prev"
          >
            <ArrowLeft className="w-5 h-5" />
            {isFirstSlide ? "Exit" : "Back"}
          </Button>

          <Button
            variant="default"
            onClick={handleNext}
            className="gap-2 bg-black text-white hover:bg-black/90"
            data-testid="button-lesson-next"
          >
            {isLastSlide ? "Finish" : "Continue"}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
