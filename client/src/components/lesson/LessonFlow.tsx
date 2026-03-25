import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackAContent } from "@shared/schema";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonSlide, type SlideType, type QuizData } from "./LessonSlide";
import slideBg from "@assets/SlideBG_1774302310257.webp";
import { LessonCompletionScreen } from "./LessonCompletionScreen";
import { CompletionOverlay, type OverlayConfig } from "./CompletionOverlay";
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
  type FlowState = "loading" | "slides" | "overlay" | "complete";
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const overlayShownRef = useRef(false);
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

  const overlayContextKey =
    dayNumber < 0 ? `prelim-module-${Math.abs(dayNumber)}` : `chat-flow-${dayNumber}`;

  const { data: overlayConfig } = useQuery<OverlayConfig>({
    queryKey: ["/api/admin/module-overlays", overlayContextKey],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/module-overlays/${encodeURIComponent(overlayContextKey)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

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
      if (overlayConfig?.enabled && !overlayShownRef.current) {
        overlayShownRef.current = true;
        setFlowState("overlay");
      } else {
        setFlowState("complete");
      }
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
  }, [currentSlide, slides, cancelAutoAdvance, completedTimerSlides, scenarioRevealCount, overlayConfig]);

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
          if (overlayConfig?.enabled && !overlayShownRef.current) {
            overlayShownRef.current = true;
            setFlowState("overlay");
          } else {
            setFlowState("complete");
          }
          return prev;
        }
        return prev + 1;
      });
      setAnimKey((prev) => prev + 1);
    }, 400);
  }, [slides.length, overlayConfig]);

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

  if (flowState === "overlay" && overlayConfig?.enabled) {
    return (
      <CompletionOverlay
        overlayConfig={overlayConfig}
        onDismiss={() => setFlowState("complete")}
      />
    );
  }

  if (flowState === "complete") {
    return createPortal(
      <LessonCompletionScreen
        dayNumber={dayNumber}
        theme={content.centralTheme}
        completionMessage={content.completionMessage}
        onContinue={handleContinue}
        onBack={() => setFlowState("slides")}
      />,
      document.body
    );
  }

  if (slides.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 p-6 bg-[var(--surface-base)]">
        <p className="type-body-lg text-[var(--white-60)]">No content available for this day.</p>
        <Button variant="outline" onClick={onExit} data-testid="button-exit-empty">
          Back to Overview
        </Button>
      </div>,
      document.body
    );
  }

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

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
      <div className="fixed inset-0 z-[200] flex flex-col overflow-x-hidden bg-[var(--surface-base)]" data-testid="lesson-flow">
        {lessonSlideEl}
      </div>,
      document.body
    );
  }

  const navBlocked = (currentSlideData.type === "timer" && !timerDone) || isValidKc || requiresInteraction || surveyBlocked;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-x-hidden"
      data-testid="lesson-flow"
    >
      {/* ── Full-screen background: painting + radial vignette ── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          src={slideBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 140% 80% at 50% 120%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.05) 100%)",
          }}
        />
      </div>

      {/* ── Header: blurred top nav bar ── */}
      <div
        className="relative shrink-0 flex items-center justify-between"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "var(--black-60)",
          borderBottom: "1px solid var(--white-5)",
          boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "24px",
          paddingBottom: "24px",
        }}
      >
        {/* Left: Back button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={handlePrev}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: "40px",
              height: "40px",
              background: "var(--surface-float)",
              backdropFilter: "blur(11px)",
              WebkitBackdropFilter: "blur(11px)",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid="button-lesson-header-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Center: Lesson name pill + slide counter */}
        <div
          className="flex items-center"
          style={{
            background: "var(--surface-float)",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            maxHeight: "42px",
          }}
        >
          {content.centralTheme && (
            <span
              className="type-body-md font-medium whitespace-nowrap overflow-hidden"
              style={{
                color: "#efefef",
                lineHeight: "18px",
                maxWidth: "132px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {content.centralTheme}
            </span>
          )}
          <span
            className="type-body-sm whitespace-nowrap"
            style={{ color: "#8b8b8b", lineHeight: "18px", paddingLeft: "8px" }}
          >
            {currentSlide + 1} of {slides.length}
          </span>
        </div>

        {/* Right: Exit button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onExit}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: "40px",
              height: "40px",
              background: "var(--surface-float)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid="button-lesson-exit"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div
        className="relative flex-1 flex flex-col items-center overflow-hidden"
        style={{ paddingTop: "32px", paddingLeft: "20px", paddingRight: "20px" }}
      >
        {/* Dark card — fills remaining height, top corners rounded */}
        <div
          className="relative flex-1 flex flex-col overflow-hidden w-full max-w-[640px]"
          style={{
            background: "var(--surface-base)",
            border: "0.5px solid var(--white-5)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            padding: "48px",
          }}
        >
          {/* Subtle radial highlight at top-left corner */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              background: "radial-gradient(ellipse at 0% 0%, var(--white-4) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex-1 overflow-y-auto">
            {lessonSlideEl}
          </div>
        </div>
      </div>

      {/* ── Footer: black bar with right-aligned CONTINUE button ── */}
      {!(isValidKc && kcAnswered) && (
        <div
          className="relative shrink-0 flex flex-col items-center justify-center"
          style={{
            background: "var(--surface-ground)",
            borderTop: "1px solid var(--white-5)",
            padding: "32px",
          }}
        >
          <div className="max-w-[640px] w-full flex items-center justify-end">
            <button
              onClick={handleNext}
              disabled={navBlocked}
              className={cn(
                "flex items-center gap-2 justify-center type-caption-lg text-[#fafafa] transition-opacity",
                navBlocked ? "opacity-40 cursor-not-allowed" : "opacity-100 hover:opacity-80"
              )}
              style={{
                background: "var(--surface-float)",
                borderRadius: "6px",
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
                boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)",
              }}
              data-testid="button-lesson-next"
            >
              {isLastSlide ? "FINISH" : "CONTINUE"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
