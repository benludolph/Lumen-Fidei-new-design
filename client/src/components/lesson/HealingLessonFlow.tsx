import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonSlide, type SlideType, type QuizData } from "./LessonSlide";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonCompletionScreen } from "./LessonCompletionScreen";
import { playClickContinue } from "@/lib/sounds";
import { apiRequest, queryClient } from "@/lib/queryClient";
import slideBg from "@assets/SlideBG_1774302310257.webp";
import type { TrackAContent } from "@shared/schema";

interface SlideData {
  type: SlideType;
  content: string;
  quizId?: number;
  quizQuestionIndex?: number;
  quizData?: QuizData;
}

interface HealingLessonFlowProps {
  content: TrackAContent;
  moduleNumber: number;
  existingAnswer?: string;
  onExit: () => void;
  onComplete: () => void;
}

export function HealingLessonFlow({
  content,
  moduleNumber,
  existingAnswer,
  onExit,
  onComplete,
}: HealingLessonFlowProps) {
  type FlowState = "loading" | "slides" | "complete";
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [journalDraft, setJournalDraft] = useState(existingAnswer || "");
  const [journalSaved, setJournalSaved] = useState(!!existingAnswer);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, Record<number, string>>>({});
  const [timerDone, setTimerDone] = useState(false);
  const [completedTimerSlides, setCompletedTimerSlides] = useState<Set<number>>(new Set());
  const [completedSurveySlides, setCompletedSurveySlides] = useState<Set<number>>(new Set());
  const [kcAnswered, setKcAnswered] = useState(false);
  const [slideInteracted, setSlideInteracted] = useState(false);
  const [scenarioRevealCount, setScenarioRevealCount] = useState(1);
  const [pendingInjectedSlide, setPendingInjectedSlide] = useState<{ type: SlideType; content: string } | null>(null);
  const [isShowingInjected, setIsShowingInjected] = useState(false);
  const [practiceChunkSelections, setPracticeChunkSelections] = useState<Record<number, number>>({});
  const [sessionVars, setSessionVars] = useState<Record<string, unknown>>({});
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(true);

  // ── Healing-specific: save text_input to /api/healing/answers ──
  const healingAnswerMutation = useMutation({
    mutationFn: (text: string) =>
      apiRequest("POST", "/api/healing/answers", { moduleNumber, content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healing/answers"] });
      setJournalSaved(true);
    },
  });

  useEffect(() => {
    return () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current); };
  }, []);

  // Scroll detection (same as LessonFlow)
  useEffect(() => {
    setCanScroll(false);
    setHasReachedBottom(true);
    const el = scrollContentRef.current;
    if (!el) return;
    const rawSlides = (content.slides ?? []) as { type: string; content: string }[];
    if (rawSlides[currentSlide]?.type === "media") return;
    let settled = false;
    const check = (resetScroll: boolean) => {
      if (resetScroll) el.scrollTop = 0;
      const scrollable = el.scrollHeight > el.clientHeight + 8;
      if (!settled || scrollable) { settled = true; setCanScroll(scrollable); setHasReachedBottom(!scrollable); }
    };
    const t1 = setTimeout(() => check(true), 80);
    const t2 = setTimeout(() => check(false), 500);
    const ro = new ResizeObserver(() => check(false));
    ro.observe(el);
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); };
  }, [currentSlide, content.slides]);

  const handleContentScroll = useCallback(() => {
    const el = scrollContentRef.current;
    if (!el || hasReachedBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setHasReachedBottom(true);
  }, [hasReachedBottom]);

  // Quiz slide expansion (same as LessonFlow)
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
            expanded.push({ type: "quiz", content: s.content, quizId: qid, quizQuestionIndex: i, quizData: parsed });
          }
          expanded.push({ type: "quiz_result", content: s.content, quizId: qid, quizData: parsed });
        } catch {
          expanded.push({ type: "text", content: s.content });
        }
      } else {
        expanded.push({ type: s.type as SlideType, content: s.content });
      }
    }
    return expanded;
  }, [content]);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) { clearTimeout(autoAdvanceTimer.current); autoAdvanceTimer.current = null; }
  }, []);

  const handleNext = useCallback(() => {
    cancelAutoAdvance();
    if (!isShowingInjected && pendingInjectedSlide && slides[currentSlide]?.type === "path_selector") {
      playClickContinue();
      setIsShowingInjected(true);
      setDirection("forward");
      setAnimKey((p) => p + 1);
      return;
    }
    if (isShowingInjected) {
      setIsShowingInjected(false);
      setPendingInjectedSlide(null);
      setSlideInteracted(false);
      if (currentSlide >= slides.length - 1) { setFlowState("complete"); }
      else { playClickContinue(); const n = currentSlide + 1; setDirection("forward"); setCurrentSlide(n); setAnimKey((p) => p + 1); setTimerDone(completedTimerSlides.has(n)); setKcAnswered(false); setScenarioRevealCount(1); }
      return;
    }
    const curr = slides[currentSlide];
    if (curr?.type === "scenario") {
      try { const p = JSON.parse(curr.content); if (scenarioRevealCount < (Array.isArray(p.steps) ? p.steps.length : 0)) { setScenarioRevealCount((v) => v + 1); return; } } catch {}
    }
    if (currentSlide >= slides.length - 1) { setFlowState("complete"); }
    else { playClickContinue(); const n = currentSlide + 1; setDirection("forward"); setCurrentSlide(n); setAnimKey((p) => p + 1); setTimerDone(completedTimerSlides.has(n)); setKcAnswered(false); setSlideInteracted(false); setScenarioRevealCount(1); }
  }, [currentSlide, slides, cancelAutoAdvance, completedTimerSlides, scenarioRevealCount, isShowingInjected, pendingInjectedSlide]);

  const handlePrev = useCallback(() => {
    cancelAutoAdvance();
    if (isShowingInjected) { setIsShowingInjected(false); setPendingInjectedSlide(null); setSlideInteracted(false); setDirection("backward"); setAnimKey((p) => p + 1); return; }
    if (pendingInjectedSlide) setPendingInjectedSlide(null);
    if (currentSlide <= 0) { onExit(); }
    else { const p = currentSlide - 1; setDirection("backward"); setCurrentSlide(p); setAnimKey((k) => k + 1); setTimerDone(completedTimerSlides.has(p)); setKcAnswered(false); setSlideInteracted(false); setScenarioRevealCount(1); }
  }, [currentSlide, onExit, cancelAutoAdvance, completedTimerSlides, isShowingInjected, pendingInjectedSlide]);

  const handleTimerComplete = useCallback(() => { setTimerDone(true); setCompletedTimerSlides((p) => new Set(p).add(currentSlide)); }, [currentSlide]);
  const handleKcAnswered = useCallback(() => { setKcAnswered(true); }, []);
  const handleSurveySubmitted = useCallback(() => { setCompletedSurveySlides((p) => new Set(p).add(currentSlide)); }, [currentSlide]);
  const handleSlideInteracted = useCallback(() => { setSlideInteracted(true); }, []);
  const handlePathSelected = useCallback((nextType: SlideType, nextContent: string) => { setPendingInjectedSlide({ type: nextType, content: nextContent }); }, []);
  const handlePracticeChunkSelect = useCallback((idx: number) => { setPracticeChunkSelections((p) => ({ ...p, [currentSlide]: idx })); }, [currentSlide]);
  const handleSaveSessionVar = useCallback((key: string, value: unknown) => { setSessionVars((p) => ({ ...p, [key]: value })); }, []);

  const handleQuizAnswer = useCallback((quizId: number, questionIndex: number, letter: string) => {
    setQuizAnswers((p) => ({ ...p, [quizId]: { ...(p[quizId] || {}), [questionIndex]: letter } }));
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      setDirection("forward");
      setCurrentSlide((p) => { if (p >= slides.length - 1) { setFlowState("complete"); return p; } return p + 1; });
      setAnimKey((p) => p + 1);
    }, 400);
  }, [slides.length]);

  // ── Flow states ──
  if (flowState === "loading") {
    return createPortal(
      <LessonLoadingScreen dayNumber={moduleNumber} theme={content.centralTheme} onComplete={() => setFlowState("slides")} />,
      document.body
    );
  }

  if (flowState === "complete") {
    return createPortal(
      <LessonCompletionScreen
        dayNumber={moduleNumber}
        theme={content.centralTheme}
        onContinue={onComplete}
        onBack={() => setFlowState("slides")}
      />,
      document.body
    );
  }

  if (slides.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 p-6 bg-[var(--surface-base)]">
        <p className="type-body-lg text-[var(--white-60)]">No content available for this module.</p>
        <button onClick={onExit} style={{ padding: "10px 20px", background: "var(--surface-float)", border: "none", borderRadius: 6, color: "white", cursor: "pointer" }}>Back</button>
      </div>,
      document.body
    );
  }

  const currentSlideData = slides[currentSlide];
  const effectiveSlideData = isShowingInjected && pendingInjectedSlide
    ? { ...pendingInjectedSlide, quizId: undefined, quizQuestionIndex: undefined, quizData: undefined }
    : currentSlideData;
  const isLastSlide = currentSlide === slides.length - 1;

  const isValidKc = effectiveSlideData.type === "knowledge_check" && (() => {
    try { const d = JSON.parse(effectiveSlideData.content); return Array.isArray(d.options) && d.options.length > 0; } catch { return false; }
  })();

  const INTERACTIVE_TYPES = new Set(["multi_select", "single_select", "text_input", "action", "mentor_message", "chat_flow", "path_selector", "story_choice", "knowledge_quiz", "confession_finder"]);
  const requiresInteraction = INTERACTIVE_TYPES.has(effectiveSlideData.type) && !slideInteracted;
  const surveyBlocked = effectiveSlideData.type === "survey" && !completedSurveySlides.has(currentSlide);
  const pathSelectorBlocked = effectiveSlideData.type === "path_selector" && !slideInteracted;
  const navBlocked = pathSelectorBlocked || (currentSlideData.type === "timer" && !timerDone) || (effectiveSlideData.type === "scripture_practice" && !timerDone) || (effectiveSlideData.type === "scene" && !timerDone) || isValidKc || requiresInteraction || surveyBlocked;

  const SELF_CTA_TYPES = new Set(["action", "text_input", "mentor_message", "knowledge_quiz"]);
  const hideFooter = (isValidKc && kcAnswered) || (requiresInteraction && SELF_CTA_TYPES.has(effectiveSlideData.type));

  // ── text_input: healing-aware renderer (saves to /api/healing/answers) ──
  const isTextInput = effectiveSlideData.type === "text_input";
  let textInputPrompt = "";
  if (isTextInput) {
    try {
      const parsed = JSON.parse(effectiveSlideData.content);
      textInputPrompt = parsed.prompt || parsed.label || parsed.title || parsed.placeholder || "";
    } catch {
      textInputPrompt = effectiveSlideData.content;
    }
  }

  const isChatFlow = effectiveSlideData.type === "chat_flow";

  // ── Slide content ──
  const lessonSlideEl = isTextInput ? (
    // Custom rendering for text_input — saves to healing endpoint, not Track A
    <div key={`slide-${animKey}`} className="space-y-4 p-2">
      {textInputPrompt && (
        <p className="type-body-xl leading-[1.4] text-[var(--white-80)]">{textInputPrompt}</p>
      )}
      <textarea
        value={journalDraft}
        onChange={(e) => { setJournalDraft(e.target.value); setJournalSaved(false); }}
        placeholder="Write your reflection here…"
        rows={6}
        style={{
          width: "100%", background: "var(--white-5)", border: "1px solid var(--white-10)",
          borderRadius: "8px", color: "white", padding: "14px", resize: "vertical",
          fontFamily: "inherit", fontSize: "15px", lineHeight: 1.65, boxSizing: "border-box",
          minHeight: "140px", outline: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          data-testid={`button-save-healing-text-input-${moduleNumber}`}
          onClick={() => {
            if (journalDraft.trim()) {
              healingAnswerMutation.mutate(journalDraft);
              handleSlideInteracted();
            }
          }}
          disabled={!journalDraft.trim() || healingAnswerMutation.isPending}
          className="type-caption-lg text-[#fafafa]"
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: journalSaved ? "var(--surface-float)" : "var(--brand, #8B7355)",
            borderRadius: "6px", paddingLeft: "16px", paddingRight: "16px",
            paddingTop: "12px", paddingBottom: "12px", border: "none", cursor: "pointer",
            opacity: !journalDraft.trim() ? 0.4 : 1,
          }}
        >
          {healingAnswerMutation.isPending ? "Saving…" : journalSaved ? "Saved ✓" : "Save & Continue"}
        </button>
      </div>
    </div>
  ) : (
    <LessonSlide
      key={`slide-${animKey}`}
      type={effectiveSlideData.type}
      content={effectiveSlideData.content}
      dayNumber={moduleNumber}
      direction={direction}
      onTimerComplete={["timer", "scripture_practice", "scene"].includes(effectiveSlideData.type) ? handleTimerComplete : undefined}
      timerAlreadyDone={["timer", "scripture_practice", "scene"].includes(effectiveSlideData.type) ? completedTimerSlides.has(currentSlide) : undefined}
      onKnowledgeCheckAnswered={effectiveSlideData.type === "knowledge_check" ? handleKcAnswered : undefined}
      onKnowledgeCheckNext={effectiveSlideData.type === "knowledge_check" ? handleNext : undefined}
      quizData={effectiveSlideData.quizData}
      quizQuestionIndex={effectiveSlideData.quizQuestionIndex}
      quizAnswers={effectiveSlideData.quizId !== undefined ? quizAnswers[effectiveSlideData.quizId] : undefined}
      onQuizAnswer={effectiveSlideData.quizId !== undefined && effectiveSlideData.quizQuestionIndex !== undefined
        ? (letter: string) => handleQuizAnswer(effectiveSlideData.quizId!, effectiveSlideData.quizQuestionIndex!, letter)
        : undefined}
      onInteracted={handleSlideInteracted}
      onSurveySubmitted={effectiveSlideData.type === "survey" ? handleSurveySubmitted : undefined}
      surveyAlreadySubmitted={effectiveSlideData.type === "survey" ? completedSurveySlides.has(currentSlide) : undefined}
      scenarioRevealCount={effectiveSlideData.type === "scenario" ? scenarioRevealCount : undefined}
      // ── Healing-scoped context key — prevents collision with Track A data ──
      chatFlowContextKey={effectiveSlideData.type === "chat_flow"
        ? `healing-module${moduleNumber}-slide${currentSlide}`
        : undefined}
      chatFlowTotalSlides={slides.length}
      chatFlowSlideIndex={currentSlide}
      onChatFlowComplete={effectiveSlideData.type === "chat_flow" ? handleNext : undefined}
      onChatFlowExit={effectiveSlideData.type === "chat_flow" ? onExit : undefined}
      onPathSelected={currentSlideData.type === "path_selector" && !isShowingInjected ? handlePathSelected : undefined}
      practiceChunkIndex={effectiveSlideData.type === "scripture_practice" ? (practiceChunkSelections[currentSlide] ?? undefined) : undefined}
      onPracticeChunkSelect={effectiveSlideData.type === "scripture_practice" ? handlePracticeChunkSelect : undefined}
      onKnowledgeQuizComplete={effectiveSlideData.type === "knowledge_quiz" ? handleNext : undefined}
      sessionVars={sessionVars}
      onSaveSessionVar={effectiveSlideData.type === "confession_finder" ? handleSaveSessionVar : undefined}
    />
  );

  // chat_flow takes full screen
  if (isChatFlow) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--surface-base)]" data-testid="healing-lesson-flow">
        {lessonSlideEl}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col" data-testid="healing-lesson-flow">
      {/* Background */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img src={slideBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 140% 80% at 50% 120%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.05) 100%)" }}
        />
      </div>

      {/* Header */}
      <div
        className="relative shrink-0 flex items-center justify-between"
        style={{
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          background: "var(--black-60)", borderBottom: "1px solid var(--white-5)",
          boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
          padding: "16px",
        }}
      >
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={handlePrev}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ width: "40px", height: "40px", background: "var(--surface-float)", backdropFilter: "blur(11px)", WebkitBackdropFilter: "blur(11px)", borderRadius: "20px", border: "none", cursor: "pointer" }}
            data-testid="button-lesson-header-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        <div
          className="flex items-center"
          style={{ background: "var(--surface-float)", borderRadius: "36px", paddingLeft: "16px", paddingRight: "16px", paddingTop: "12px", paddingBottom: "12px", maxHeight: "42px" }}
        >
          {content.centralTheme && (
            <span className="type-body-md font-medium whitespace-nowrap overflow-hidden" style={{ color: "#efefef", lineHeight: "18px", maxWidth: "132px", overflow: "hidden", textOverflow: "ellipsis" }}>
              {content.centralTheme}
            </span>
          )}
          <span className="type-body-sm whitespace-nowrap" style={{ color: "#8b8b8b", lineHeight: "18px", paddingLeft: "8px" }}>
            {currentSlide + 1} of {slides.length}
          </span>
        </div>

        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={onExit}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ width: "40px", height: "40px", background: "var(--surface-float)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderRadius: "20px", border: "none", cursor: "pointer" }}
            data-testid="button-lesson-exit"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div
        className="relative flex-1 min-h-0 flex flex-col items-center"
        style={{ paddingTop: effectiveSlideData.type === "story_choice" ? "8px" : "16px", paddingLeft: "16px", paddingRight: "16px" }}
      >
        <div
          className={cn(
            "relative flex-1 min-h-0 flex flex-col w-full max-w-[780px]",
            effectiveSlideData.type === "story_choice" ? "p-4 sm:p-6"
              : effectiveSlideData.type === "scripture_practice" ? "px-7 pb-7 pt-3 sm:px-12 sm:pb-12 sm:pt-4"
              : effectiveSlideData.type === "scene" ? "p-3 sm:p-4"
              : effectiveSlideData.type === "knowledge_quiz" ? "p-0"
              : "p-7 sm:p-12"
          )}
          style={{ background: "var(--surface-base)", border: "0.5px solid var(--white-5)", borderBottom: "none", borderRadius: "8px 8px 0 0" }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ borderRadius: "inherit", background: "radial-gradient(ellipse at 0% 0%, var(--white-4) 0%, transparent 60%)" }} />
          <div
            ref={scrollContentRef}
            onScroll={handleContentScroll}
            className="relative flex-1 min-h-0 overflow-y-auto"
            style={{ scrollbarGutter: "stable" }}
          >
            {lessonSlideEl}
          </div>

          {canScroll && !hasReachedBottom && !hideFooter && (
            <div
              className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-end"
              style={{ height: 100, background: "linear-gradient(to bottom, transparent 0%, var(--surface-base) 70%)", paddingBottom: 18, pointerEvents: "none" }}
            >
              <div
                className="flex items-center gap-1.5 px-4 py-2 rounded-full cursor-pointer"
                style={{ background: "var(--surface-float)", border: "1px solid var(--white-10)", animation: "bounce 1.6s ease-in-out infinite", pointerEvents: "auto" }}
                onClick={() => { const el = scrollContentRef.current; if (el) el.scrollBy({ top: el.clientHeight * 0.7, behavior: "smooth" }); }}
              >
                <ChevronDown className="w-4 h-4 text-white" />
                <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>
                  Scroll
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {!hideFooter && (
        <div
          key={animKey}
          className="relative z-10 shrink-0 flex flex-col items-center justify-center px-4 py-4 sm:px-8 lesson-footer-enter"
          style={{ background: "var(--surface-ground)", borderTop: "1px solid var(--white-5)" }}
        >
          <div className="max-w-[780px] w-full flex items-center justify-end">
            <button
              onClick={handleNext}
              disabled={navBlocked || (canScroll && !hasReachedBottom)}
              className={cn(
                "flex items-center gap-2 justify-center type-caption-lg text-[#fafafa] whitespace-nowrap",
                (navBlocked || (canScroll && !hasReachedBottom)) ? "opacity-40 cursor-not-allowed" : "opacity-100 hover:opacity-80"
              )}
              style={{ background: "var(--surface-float)", borderRadius: "6px", paddingLeft: "16px", paddingRight: "16px", paddingTop: "12px", paddingBottom: "12px", boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)", border: "none", cursor: navBlocked ? "not-allowed" : "pointer" }}
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
