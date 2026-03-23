import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackAContent } from "@shared/schema";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonSlide, type SlideType, type QuizData } from "./LessonSlide";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";
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
  const [completedSurveySlides, setCompletedSurveySlides] = useState<Set<number>>(new Set());
  const [kcAnswered, setKcAnswered] = useState(false);
  const [slideInteracted, setSlideInteracted] = useState(false);
  const [scenarioRevealCount, setScenarioRevealCount] = useState(1);
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
    const currentSlideData = slides[currentSlide];
    if (currentSlideData?.type === "scenario") {
      try {
        const parsed = JSON.parse(currentSlideData.content);
        const total = Array.isArray(parsed.steps) ? parsed.steps.length : 0;
        if (scenarioRevealCount < total) {
          setScenarioRevealCount((prev) => prev + 1);
          return;
        }
      } catch {}
    }
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
      setSlideInteracted(false);
      setScenarioRevealCount(1);
    }
  }, [currentSlide, slides, cancelAutoAdvance, completedTimerSlides, scenarioRevealCount]);

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
      setSlideInteracted(false);
      setScenarioRevealCount(1);
    }
  }, [currentSlide, onExit, cancelAutoAdvance, completedTimerSlides]);

  const handleTimerComplete = useCallback(() => {
    setTimerDone(true);
    setCompletedTimerSlides((prev) => new Set(prev).add(currentSlide));
  }, [currentSlide]);

  const handleKcAnswered = useCallback(() => {
    setKcAnswered(true);
  }, []);

  const handleSurveySubmitted = useCallback(() => {
    setCompletedSurveySlides((prev) => new Set(prev).add(currentSlide));
  }, [currentSlide]);

  const handleSlideInteracted = useCallback(() => {
    setSlideInteracted(true);
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
    return createPortal(
      <LessonLoadingScreen
        dayNumber={dayNumber}
        theme={content.centralTheme}
        backgroundImage={backgroundImage}
        onComplete={handleLoadingComplete}
      />,
      document.body
    );
  }

  if (flowState === "complete") {
    return createPortal(
      <LessonCompletionScreen
        dayNumber={dayNumber}
        theme={content.centralTheme}
        onContinue={handleContinue}
        onBack={() => setFlowState("slides")}
      />,
      document.body
    );
  }

  if (slides.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 p-6 bg-white">
        <p className="text-muted-foreground">No content available for this day.</p>
        <Button variant="outline" onClick={onExit} data-testid="button-exit-empty">
          Back to Overview
        </Button>
      </div>,
      document.body
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

  const INTERACTIVE_TYPES = new Set(["multi_select", "single_select", "text_input", "action", "mentor_message", "chat_flow"]);
  const requiresInteraction = INTERACTIVE_TYPES.has(currentSlideData.type) && !slideInteracted;
  const surveyBlocked = currentSlideData.type === "survey" && !completedSurveySlides.has(currentSlide);
  const isChatFlow = currentSlideData.type === "chat_flow";

  const lessonSlideEl = (
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
      onInteracted={handleSlideInteracted}
      onSurveySubmitted={currentSlideData.type === "survey" ? handleSurveySubmitted : undefined}
      surveyAlreadySubmitted={currentSlideData.type === "survey" ? completedSurveySlides.has(currentSlide) : undefined}
      scenarioRevealCount={currentSlideData.type === "scenario" ? scenarioRevealCount : undefined}
      chatFlowContextKey={currentSlideData.type === "chat_flow"
        ? (dayNumber < 0
            ? `prelim-module${Math.abs(dayNumber)}-slide${currentSlide}`
            : `track_a-day${dayNumber}-slide${currentSlide}`)
        : undefined}
      chatFlowTotalSlides={slides.length}
      chatFlowSlideIndex={currentSlide}
      onChatFlowComplete={currentSlideData.type === "chat_flow" ? handleNext : undefined}
      onChatFlowExit={currentSlideData.type === "chat_flow" ? onExit : undefined}
    />
  );

  if (isChatFlow) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col overflow-x-hidden bg-[#111]" data-testid="lesson-flow">
        {lessonSlideEl}
      </div>,
      document.body
    );
  }

  const navBlocked = (currentSlideData.type === "timer" && !timerDone) || isValidKc || requiresInteraction || surveyBlocked;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-x-hidden bg-[#111]"
      data-testid="lesson-flow"
      style={{ paddingTop: "24px" }}
    >
      {/* ── Header: back | REFLECTION pill | exit ── */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{ paddingLeft: "24px", paddingRight: "24px", paddingBottom: "24px" }}
      >
        {/* Left: Back / Exit button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={handlePrev}
            className="flex items-center justify-center rounded-[20px] transition-colors hover:bg-[rgba(52,52,52,0.6)]"
            style={{
              width: "40px",
              height: "40px",
              background: "rgba(42,42,42,0.5)",
              backdropFilter: "blur(18px)",
            }}
            data-testid="button-lesson-header-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Center: Progress pill */}
        <div
          className="flex items-center justify-center"
          style={{
            background: "#202020",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            maxHeight: "42px",
          }}
        >
          <span
            className="font-['Afacad'] font-medium whitespace-nowrap uppercase"
            style={{ fontSize: "14px", letterSpacing: "2.8px", color: "#efefef", lineHeight: "18px" }}
          >
            REFLECTION
          </span>
          <span
            className="font-['Afacad'] font-normal whitespace-nowrap"
            style={{ fontSize: "13.9px", color: "#8b8b8b", lineHeight: "18px", paddingLeft: "8px" }}
          >
            {currentSlide + 1} of {slides.length}
          </span>
        </div>

        {/* Right: Exit button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onExit}
            className="flex items-center justify-center rounded-[20px] transition-colors hover:bg-[rgba(52,52,52,0.6)]"
            style={{
              width: "40px",
              height: "40px",
              background: "rgba(42,42,42,0.5)",
              backdropFilter: "blur(18px)",
            }}
            data-testid="button-lesson-exit"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content area: bg image behind, white card on top ── */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Background image + gradient (absolute, fills this area) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <img
            src={candleBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
            }}
          />
        </div>

        {/* White card: 32px gap at top shows bg image, then fills remaining space */}
        <div
          className="absolute left-0 right-0 bottom-0 flex flex-col overflow-hidden bg-white"
          style={{ top: "32px", borderRadius: "24px 24px 0 0" }}
        >
          {lessonSlideEl}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      {!(isValidKc && kcAnswered) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e4e4e7] px-6 py-8 z-[210]">
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
              disabled={navBlocked}
              className={cn(
                "gap-2",
                navBlocked
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
    </div>,
    document.body
  );
}
