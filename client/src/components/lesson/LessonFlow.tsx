import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackAContent } from "@shared/schema";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonProgressBar } from "./LessonProgressBar";
import { LessonSlide, type SlideType, type QuizData } from "./LessonSlide";
import { LessonCompletionScreen } from "./LessonCompletionScreen";
import { playClickContinue } from "@/lib/sounds";

interface SlideData {
  type: SlideType;
  content: string;
  quizId?: number;
  quizQuestionIndex?: number;
  quizData?: QuizData;
}

interface LessonFlowProps {
  content: TrackAContent;
  dayNumber: number;
  backgroundImage?: string;
  existingAnswer?: string;
  mentorId?: number | null;
  onExit: () => void;
  onComplete: () => void;
}

export function LessonFlow({
  content,
  dayNumber,
  backgroundImage,
  existingAnswer,
  mentorId,
  onExit,
  onComplete,
}: LessonFlowProps) {
  type FlowState = "loading" | "slides" | "complete";
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [journalDraft, setJournalDraft] = useState(existingAnswer || "");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, Record<number, string>>>({});
  const [timerDone, setTimerDone] = useState(false);
  const [completedTimerSlides, setCompletedTimerSlides] = useState<Set<number>>(new Set());
  const [kcAnswered, setKcAnswered] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = useMemo<SlideData[]>(() => {
    if (!content.slides || content.slides.length === 0) return [];
    const expanded: SlideData[] = [];
    let quizCounter = 0;
    for (const s of content.slides) {
      if (s.type === "quiz") {
        try {
          const parsed: QuizData = JSON.parse(s.content);
          const qid = quizCounter++;
          for (let i = 0; i < parsed.questions.length; i++) {
            expanded.push({
              type: "quiz",
              content: s.content,
              quizId: qid,
              quizQuestionIndex: i,
              quizData: parsed,
            });
          }
          expanded.push({
            type: "quiz_result",
            content: s.content,
            quizId: qid,
            quizData: parsed,
          });
        } catch {
          expanded.push({ type: "text", content: s.content });
        }
      } else {
        expanded.push({ type: s.type as SlideType, content: s.content });
      }
    }
    return expanded;
  }, [content]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setFlowState("slides");
  }, []);

  const handleNext = useCallback(() => {
    cancelAutoAdvance();
    if (currentSlide >= slides.length - 1) {
      setFlowState("complete");
    } else {
      playClickContinue();
      const nextSlide = currentSlide + 1;
      setDirection("forward");
      setCurrentSlide(nextSlide);
      setAnimKey((prev) => prev + 1);
      setTimerDone(completedTimerSlides.has(nextSlide));
      setKcAnswered(false);
    }
  }, [currentSlide, slides.length, cancelAutoAdvance, completedTimerSlides]);

  const handlePrev = useCallback(() => {
    cancelAutoAdvance();
    if (currentSlide <= 0) {
      onExit();
    } else {
      const prevSlide = currentSlide - 1;
      setDirection("backward");
      setCurrentSlide(prevSlide);
      setAnimKey((prev) => prev + 1);
      setTimerDone(completedTimerSlides.has(prevSlide));
      setKcAnswered(false);
    }
  }, [currentSlide, onExit, cancelAutoAdvance, completedTimerSlides]);

  const handleTimerComplete = useCallback(() => {
    setTimerDone(true);
    setCompletedTimerSlides((prev) => new Set(prev).add(currentSlide));
  }, [currentSlide]);

  const handleKcAnswered = useCallback(() => {
    setKcAnswered(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleQuizAnswer = useCallback((quizId: number, questionIndex: number, letter: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [quizId]: { ...(prev[quizId] || {}), [questionIndex]: letter },
    }));
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      setDirection("forward");
      setCurrentSlide((prev) => {
        if (prev >= slides.length - 1) {
          setFlowState("complete");
          return prev;
        }
        return prev + 1;
      });
      setAnimKey((prev) => prev + 1);
    }, 400);
  }, [slides.length]);

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
        completionMessage={content.completionMessage}
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

  const isValidKc = currentSlideData.type === "knowledge_check" && (() => {
    try {
      const d = JSON.parse(currentSlideData.content);
      return Array.isArray(d.options) && d.options.length > 0;
    } catch { return false; }
  })();

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
        mentorId={mentorId}
        onTimerComplete={currentSlideData.type === "timer" ? handleTimerComplete : undefined}
        timerAlreadyDone={currentSlideData.type === "timer" ? completedTimerSlides.has(currentSlide) : undefined}
        onKnowledgeCheckAnswered={currentSlideData.type === "knowledge_check" ? handleKcAnswered : undefined}
        onKnowledgeCheckNext={currentSlideData.type === "knowledge_check" ? handleNext : undefined}
        quizData={currentSlideData.quizData}
        quizQuestionIndex={currentSlideData.quizQuestionIndex}
        quizAnswers={currentSlideData.quizId !== undefined ? quizAnswers[currentSlideData.quizId] : undefined}
        onQuizAnswer={currentSlideData.quizId !== undefined && currentSlideData.quizQuestionIndex !== undefined
          ? (letter: string) => handleQuizAnswer(currentSlideData.quizId!, currentSlideData.quizQuestionIndex!, letter)
          : undefined
        }
      />

      {isValidKc && kcAnswered ? null : (
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
              disabled={(currentSlideData.type === "timer" && !timerDone) || isValidKc}
              className={cn(
                "gap-2",
                (currentSlideData.type === "timer" && !timerDone) || isValidKc
                  ? "bg-black/30 text-white/50 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90"
              )}
              data-testid="button-lesson-next"
            >
              {isLastSlide ? "Finish" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
