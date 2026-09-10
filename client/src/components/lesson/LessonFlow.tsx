import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackAContent } from "@shared/schema";
import { LessonLoadingScreen } from "./LessonLoadingScreen";
import { LessonSlide, type SlideType, type QuizData } from "./LessonSlide";
import slideBg from "@assets/SlideBG_1774302310257.webp";
import { LessonCompletionScreen } from "./LessonCompletionScreen";
import { CompletionOverlay, type OverlayConfig } from "./CompletionOverlay";
import { playClickContinue } from "@/lib/sounds";
import { PrayerWrapScreen } from "./PrayerWrapScreen";
import { NotebookUnlockedScreen } from "./NotebookUnlockedScreen";

interface SlideData {
  type: SlideType;
  content: string;
  quizId?: number;
  quizQuestionIndex?: number;
  quizData?: QuizData;
}

export interface PrayerData {
  text: string;
  audioUrl?: string | null;
}

interface LessonFlowProps {
  content: TrackAContent;
  dayNumber: number;
  backgroundImage?: string;
  existingAnswer?: string;
  mentorId?: number | null;
  onExit: () => void;
  onComplete: () => void;
  onLessonFinished?: () => void;
  previewMode?: boolean;
  openingPrayer?: PrayerData | null;
  closingPrayer?: PrayerData | null;
  canSkipPrayer?: boolean;
  notebookUnlockCategory?: { name: string; slug: string } | null;
}

export function LessonFlow({
  content,
  dayNumber,
  backgroundImage,
  existingAnswer,
  mentorId,
  onExit,
  onComplete,
  onLessonFinished,
  previewMode = false,
  openingPrayer,
  closingPrayer,
  canSkipPrayer = false,
  notebookUnlockCategory,
}: LessonFlowProps) {
  const { data: mentorData } = useQuery<{ profilePhotoUrl?: string | null; name?: string | null }>({
    queryKey: ["/api/users", mentorId],
    queryFn: async () => {
      if (!mentorId) return null;
      const res = await fetch(`/api/users/${mentorId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!mentorId,
    staleTime: 60_000,
  });
  const mentorPhotoUrl = mentorData?.profilePhotoUrl ?? null;
  const mentorName = mentorData?.name ?? null;
  type FlowState = "loading" | "opening_prayer" | "slides" | "overlay" | "closing_prayer" | "complete" | "notebook_unlock";
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
  const [pendingInjectedSlide, setPendingInjectedSlide] = useState<{ type: SlideType; content: string } | null>(null);
  const [isShowingInjected, setIsShowingInjected] = useState(false);
  const [practiceChunkSelections, setPracticeChunkSelections] = useState<Record<number, number>>({});
  const [sessionVars, setSessionVars] = useState<Record<string, unknown>>({});
  const [selectionRevealHasSelection, setSelectionRevealHasSelection] = useState(false);
  const [bentoAllTapped, setBentoAllTapped] = useState(false);
  const [savedSlideIndex, setSavedSlideIndex] = useState<number | null>(null);
  const [resumeBannerDismissed, setResumeBannerDismissed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("lf_click_sound") !== "off");
  // Ref version so handleLoadingComplete can read it synchronously after the fetch resolves
  const savedProgressRef = useRef<number>(0);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(true);
  const activeInjectedSlideType = isShowingInjected ? pendingInjectedSlide?.type : undefined;

  useEffect(() => {
    setCanScroll(false);
    setHasReachedBottom(true);
    const el = scrollContentRef.current;
    if (!el) return;
    // Media slides embed iframes that intercept scroll events — the footer
    // would become permanently unreachable, so never gate them behind scroll.
    // Read type from the content prop directly to avoid a TDZ on `slides`, but
    // prefer an injected slide because it shares the selector's slide index.
    const rawSlides = (content.slides ?? []) as { type: string; content: string }[];
    const visibleSlideType = activeInjectedSlideType ?? rawSlides[currentSlide]?.type;
    if (visibleSlideType === "media") {
      el.scrollTop = 0;
      return;
    }

    const check = (resetScroll: boolean) => {
      if (resetScroll) el.scrollTop = 0;
      const scrollable = el.scrollHeight > el.clientHeight + 8;
      setCanScroll(scrollable);
      setHasReachedBottom(!scrollable);
    };

    // First pass at 80ms for desktop (fast layout)
    const t1 = setTimeout(() => check(true), 80);
    // Second pass at 500ms for mobile (slower CSS/image layout)
    const t2 = setTimeout(() => check(false), 500);

    // ResizeObserver catches dynamic content changes (images loading, etc.)
    const ro = new ResizeObserver(() => check(false));
    ro.observe(el);
    if (el.firstElementChild instanceof HTMLElement) {
      ro.observe(el.firstElementChild);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
    };
  }, [currentSlide, content.slides, isShowingInjected, activeInjectedSlideType]);

  // Track selection_reveal chip state so we can gate the main Continue button
  useEffect(() => {
    const handler = (e: Event) => {
      setSelectionRevealHasSelection((e as CustomEvent).detail?.hasSelection ?? false);
    };
    window.addEventListener("lf:sr-selection-update", handler);
    return () => window.removeEventListener("lf:sr-selection-update", handler);
  }, []);

  // Reset selection_reveal gate when the slide changes
  useEffect(() => {
    setSelectionRevealHasSelection(false);
  }, [currentSlide]);

  // Track bento_reveal tap state so we can gate the main Continue button
  useEffect(() => {
    const handler = (e: Event) => {
      setBentoAllTapped((e as CustomEvent).detail?.allTapped ?? false);
    };
    window.addEventListener("lf:bento-all-tapped", handler);
    return () => window.removeEventListener("lf:bento-all-tapped", handler);
  }, []);

  // Reset bento gate when the slide changes
  useEffect(() => {
    setBentoAllTapped(false);
  }, [currentSlide]);

  // Fetch saved progress on mount — write to both ref (for sync read in handleLoadingComplete)
  // and state (for the resume banner fallback if fetch resolves after loading completes)
  useEffect(() => {
    if (previewMode || dayNumber < 0) return;
    fetch(`/api/lesson-progress/${dayNumber}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: { slideIndex: number } | null) => {
        if (data && data.slideIndex > 0) {
          savedProgressRef.current = data.slideIndex;
          setSavedSlideIndex(data.slideIndex);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save current slide index as user progresses (debounced, skip slide 0)
  useEffect(() => {
    if (previewMode || flowState !== "slides" || dayNumber < 0 || currentSlide <= 0) return;
    const timer = setTimeout(() => {
      fetch(`/api/lesson-progress/${dayNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slideIndex: currentSlide }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [currentSlide, flowState, dayNumber, previewMode]);

  const handleContentScroll = useCallback(() => {
    const el = scrollContentRef.current;
    if (!el || hasReachedBottom) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    if (atBottom) setHasReachedBottom(true);
  }, [hasReachedBottom]);

  const handleScrollHintClick = useCallback(() => {
    const el = scrollContentRef.current;
    if (!el) return;

    const scrollable = el.scrollHeight > el.clientHeight + 8;
    if (!scrollable) {
      setCanScroll(false);
      setHasReachedBottom(true);
      return;
    }

    const nextTop = Math.min(
      el.scrollTop + el.clientHeight * 0.7,
      el.scrollHeight - el.clientHeight,
    );
    if (nextTop <= el.scrollTop + 1) {
      setHasReachedBottom(true);
      return;
    }

    el.scrollTo({ top: nextTop, behavior: "smooth" });
  }, []);

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
    const resumeSlide = savedProgressRef.current;
    if (resumeSlide > 0) {
      // Skip opening prayer entirely — jump straight to where they left off
      setCurrentSlide(resumeSlide);
      setResumeBannerDismissed(true);
      setFlowState("slides");
    } else if (openingPrayer && (openingPrayer.text || openingPrayer.audioUrl)) {
      setFlowState("opening_prayer");
    } else {
      setFlowState("slides");
    }
  }, [openingPrayer]);

  const handleNext = useCallback(() => {
    cancelAutoAdvance();
    // If currently on path_selector with a staged injected slide, show the injected slide
    if (!isShowingInjected && pendingInjectedSlide && slides[currentSlide]?.type === "path_selector") {
      if (soundEnabled) playClickContinue();
      setIsShowingInjected(true);
      setDirection("forward");
      setAnimKey((prev) => prev + 1);
      return;
    }
    if (isShowingInjected) {
      setIsShowingInjected(false);
      setPendingInjectedSlide(null);
      setSlideInteracted(false);
      if (currentSlide >= slides.length - 1) {
        setFlowState("complete");
      } else {
        if (soundEnabled) playClickContinue();
        const nextSlide = currentSlide + 1;
        setDirection("forward");
        setCurrentSlide(nextSlide);
        setAnimKey((prev) => prev + 1);
        setTimerDone(completedTimerSlides.has(nextSlide));
        setKcAnswered(false);
        setScenarioRevealCount(1);
      }
      return;
    }
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
      if (soundEnabled) playClickContinue();
      const nextSlide = currentSlide + 1;
      setDirection("forward");
      setCurrentSlide(nextSlide);
      setAnimKey((prev) => prev + 1);
      setTimerDone(completedTimerSlides.has(nextSlide));
      setKcAnswered(false);
      setSlideInteracted(false);
      setScenarioRevealCount(1);
    }
  }, [currentSlide, slides, cancelAutoAdvance, completedTimerSlides, scenarioRevealCount, isShowingInjected, pendingInjectedSlide]);

  const handlePrev = useCallback(() => {
    cancelAutoAdvance();
    if (isShowingInjected) {
      setIsShowingInjected(false);
      setPendingInjectedSlide(null);
      setSlideInteracted(false);
      setDirection("backward");
      setAnimKey((prev) => prev + 1);
      return;
    }
    // Clear any stale staged injected slide when navigating away from path_selector
    if (pendingInjectedSlide) setPendingInjectedSlide(null);
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
  }, [currentSlide, onExit, cancelAutoAdvance, completedTimerSlides, isShowingInjected, pendingInjectedSlide]);

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

  const handlePathSelected = useCallback((nextType: SlideType, nextContent: string) => {
    setPendingInjectedSlide({ type: nextType, content: nextContent });
    // Do NOT set isShowingInjected here — the user must press CONTINUE to proceed
  }, []);

  const handlePracticeChunkSelect = useCallback((chunkIndex: number) => {
    setPracticeChunkSelections((prev) => ({ ...prev, [currentSlide]: chunkIndex }));
  }, [currentSlide]);

  const handleSaveSessionVar = useCallback((key: string, value: unknown) => {
    setSessionVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fire completion recording as soon as the completion screen appears — don't wait for the button press
  useEffect(() => {
    if (flowState === "complete" && !previewMode) {
      onLessonFinished?.();
    }
  }, [flowState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinalComplete = useCallback(() => {
    // Clear saved progress when lesson finishes
    if (!previewMode && dayNumber >= 0) {
      fetch(`/api/lesson-progress/${dayNumber}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
    if (notebookUnlockCategory) {
      const seenKey = `lf_nb_unlock_shown_${notebookUnlockCategory.slug}`;
      if (!localStorage.getItem(seenKey)) {
        localStorage.setItem(seenKey, "true");
        setFlowState("notebook_unlock");
        return;
      }
    }
    onComplete();
  }, [notebookUnlockCategory, onComplete, previewMode, dayNumber]);

  const handleContinue = useCallback(() => {
    const alreadySeen = localStorage.getItem(`overlay-seen-${overlayContextKey}`) === "true";
    if (overlayConfig?.enabled && !overlayShownRef.current && !alreadySeen) {
      overlayShownRef.current = true;
      localStorage.setItem(`overlay-seen-${overlayContextKey}`, "true");
      setFlowState("overlay");
    } else if (closingPrayer && (closingPrayer.text || closingPrayer.audioUrl)) {
      setFlowState("closing_prayer");
    } else {
      handleFinalComplete();
    }
  }, [handleFinalComplete, overlayConfig, overlayContextKey, closingPrayer]);

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

  if (flowState === "opening_prayer" && openingPrayer) {
    return (
      <PrayerWrapScreen
        kind="opening"
        prayerText={openingPrayer.text}
        audioUrl={openingPrayer.audioUrl}
        canSkip={canSkipPrayer}
        onContinue={() => setFlowState("slides")}
        onExit={onExit}
        lessonTitle={content.centralTheme ?? undefined}
      />
    );
  }

  if (flowState === "overlay" && overlayConfig?.enabled) {
    return (
      <CompletionOverlay
        overlayConfig={overlayConfig}
        onDismiss={() => {
          if (closingPrayer && (closingPrayer.text || closingPrayer.audioUrl)) {
            setFlowState("closing_prayer");
          } else {
            handleFinalComplete();
          }
        }}
      />
    );
  }

  if (flowState === "closing_prayer" && closingPrayer) {
    return (
      <PrayerWrapScreen
        kind="closing"
        prayerText={closingPrayer.text}
        audioUrl={closingPrayer.audioUrl}
        canSkip={canSkipPrayer}
        onContinue={handleFinalComplete}
        onExit={onExit}
        lessonTitle={content.centralTheme ?? undefined}
      />
    );
  }

  if (flowState === "notebook_unlock" && notebookUnlockCategory) {
    return (
      <NotebookUnlockedScreen
        categoryName={notebookUnlockCategory.name}
        categorySlug={notebookUnlockCategory.slug}
        onContinue={onComplete}
        onOpenWorkbook={onComplete}
      />
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
  const effectiveSlideData = isShowingInjected && pendingInjectedSlide
    ? { ...pendingInjectedSlide, quizId: undefined, quizQuestionIndex: undefined, quizData: undefined }
    : currentSlideData;
  const isLastSlide = currentSlide === slides.length - 1;

  const isValidKc = effectiveSlideData.type === "knowledge_check" && (() => {
    try {
      const d = JSON.parse(effectiveSlideData.content);
      return Array.isArray(d.options) && d.options.length > 0;
    } catch { return false; }
  })();

  const INTERACTIVE_TYPES = new Set(["multi_select", "single_select", "text_input", "action", "mentor_message", "chat_flow", "path_selector", "story_choice", "knowledge_quiz", "confession_finder", "guided_prayer_process"]);
  const requiresInteraction = INTERACTIVE_TYPES.has(effectiveSlideData.type) && !slideInteracted;
  const surveyBlocked = effectiveSlideData.type === "survey" && !completedSurveySlides.has(currentSlide);
  const isChatFlow = effectiveSlideData.type === "chat_flow";

  const lessonSlideEl = (
    <LessonSlide
      key={`slide-${animKey}`}
      type={effectiveSlideData.type}
      content={effectiveSlideData.content}
      dayNumber={dayNumber}
      existingAnswer={effectiveSlideData.type === "text_input" ? journalDraft : undefined}
      onJournalChange={effectiveSlideData.type === "text_input" ? setJournalDraft : undefined}
      direction={direction}
      mentorId={mentorId}
      mentorPhotoUrl={mentorPhotoUrl}
      mentorName={mentorName}
      onTimerComplete={
        effectiveSlideData.type === "timer" || effectiveSlideData.type === "scripture_practice" || effectiveSlideData.type === "scene"
          ? handleTimerComplete
          : undefined
      }
      timerAlreadyDone={
        effectiveSlideData.type === "timer" || effectiveSlideData.type === "scripture_practice" || effectiveSlideData.type === "scene"
          ? completedTimerSlides.has(currentSlide)
          : undefined
      }
      onKnowledgeCheckAnswered={effectiveSlideData.type === "knowledge_check" ? handleKcAnswered : undefined}
      onKnowledgeCheckNext={effectiveSlideData.type === "knowledge_check" ? handleNext : undefined}
      quizData={effectiveSlideData.quizData}
      quizQuestionIndex={effectiveSlideData.quizQuestionIndex}
      quizAnswers={effectiveSlideData.quizId !== undefined ? quizAnswers[effectiveSlideData.quizId] : undefined}
      onQuizAnswer={effectiveSlideData.quizId !== undefined && effectiveSlideData.quizQuestionIndex !== undefined
        ? (letter: string) => handleQuizAnswer(effectiveSlideData.quizId!, effectiveSlideData.quizQuestionIndex!, letter)
        : undefined
      }
      onInteracted={handleSlideInteracted}
      onSurveySubmitted={effectiveSlideData.type === "survey" ? handleSurveySubmitted : undefined}
      surveyAlreadySubmitted={effectiveSlideData.type === "survey" ? completedSurveySlides.has(currentSlide) : undefined}
      scenarioRevealCount={effectiveSlideData.type === "scenario" ? scenarioRevealCount : undefined}
      chatFlowContextKey={effectiveSlideData.type === "chat_flow"
        ? (dayNumber < 0
            ? `prelim-module${Math.abs(dayNumber)}-slide${currentSlide}`
            : `track_a-day${dayNumber}-slide${currentSlide}`)
        : undefined}
      guidedPrayerSlideIndex={effectiveSlideData.type === "guided_prayer_process" ? currentSlide : undefined}
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
      onSelectionRevealComplete={effectiveSlideData.type === "selection_reveal" ? handleNext : undefined}
    />
  );

  if (isChatFlow) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--surface-base)]" data-testid="lesson-flow">
        {lessonSlideEl}
      </div>,
      document.body
    );
  }

  // path_selector always requires a selection — even in preview mode — because
  // without pendingInjectedSlide, Continue would skip the video slide entirely.
  const pathSelectorBlocked = effectiveSlideData.type === "path_selector" && !slideInteracted;

  // selection_reveal: main Continue is blocked until the user picks at least one chip
  const selectionRevealBlocked = effectiveSlideData.type === "selection_reveal" && !selectionRevealHasSelection;

  // bento_reveal: main Continue is blocked until every card has been tapped
  const bentoBlocked = effectiveSlideData.type === "bento_reveal" && !bentoAllTapped;

  const navBlocked = pathSelectorBlocked || selectionRevealBlocked || bentoBlocked || (!previewMode && (
    (currentSlideData.type === "timer" && !timerDone) ||
    (effectiveSlideData.type === "scripture_practice" && !timerDone) ||
    (effectiveSlideData.type === "scene" && !timerDone) ||
    isValidKc ||
    requiresInteraction ||
    surveyBlocked
  ));

  // Slides that have their own in-card CTA button — hide the footer CONTINUE
  // while they still need interaction (avoids two stacked buttons on mobile)
  const SELF_CTA_TYPES = new Set(["action", "text_input", "mentor_message", "knowledge_quiz", "guided_prayer_process"]);
  const hideFooter =
    (isValidKc && kcAnswered) ||
    (requiresInteraction && SELF_CTA_TYPES.has(effectiveSlideData.type));

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col"
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
          paddingTop: "16px",
          paddingBottom: "16px",
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

        {/* Right: Sound toggle + Exit button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem("lf_click_sound", next ? "on" : "off");
            }}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            title={soundEnabled ? "Mute slide sounds" : "Unmute slide sounds"}
            style={{
              width: "34px",
              height: "34px",
              background: "var(--surface-float)",
              backdropFilter: "blur(11px)",
              WebkitBackdropFilter: "blur(11px)",
              borderRadius: "17px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid="button-lesson-sound-toggle"
          >
            {soundEnabled
              ? <Volume2 className="w-3.5 h-3.5 text-white" />
              : <VolumeX className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
            }
          </button>
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
        className="relative flex-1 min-h-0 flex flex-col items-center"
        style={{
          paddingTop: effectiveSlideData.type === "story_choice" ? "8px" : "16px",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          if (effectiveSlideData.type !== "story_choice") return;
          window.dispatchEvent(new CustomEvent("lf:story-choice-bg-click", {
            detail: { clientX: e.clientX, screenW: window.innerWidth },
          }));
        }}
      >
        {/* Dark card — fills remaining height, top corners rounded */}
        <div
          className={cn(
            "relative flex-1 min-h-0 flex flex-col w-full max-w-[780px]",
            effectiveSlideData.type === "story_choice" ? "p-4 sm:p-6" : effectiveSlideData.type === "scripture_practice" ? "px-7 pb-7 pt-3 sm:px-12 sm:pb-12 sm:pt-4" : effectiveSlideData.type === "scene" ? "p-3 sm:p-4" : effectiveSlideData.type === "knowledge_quiz" ? "p-0" : "p-7 sm:p-12"
          )}
          style={{
            background: "var(--surface-base)",
            border: "0.5px solid var(--white-5)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
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
          <div
            ref={scrollContentRef}
            onScroll={handleContentScroll}
            className="relative flex-1 min-h-0 overflow-y-auto"
            style={{ scrollbarGutter: "stable" }}
          >
            {lessonSlideEl}
          </div>

          {/* Scroll hint — shown when content overflows and user hasn't reached bottom */}
          {canScroll && !hasReachedBottom && !hideFooter && (
            <div
              className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-end"
              style={{
                height: 100,
                background: "linear-gradient(to bottom, transparent 0%, var(--surface-base) 70%)",
                paddingBottom: 18,
                pointerEvents: "none",
              }}
            >
              <button
                type="button"
                aria-label="Scroll down to see more"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full cursor-pointer"
                style={{
                  background: "var(--surface-float)",
                  border: "1px solid var(--white-10)",
                  animation: "bounce 1.6s ease-in-out infinite",
                  pointerEvents: "auto",
                }}
                onClick={handleScrollHintClick}
                data-testid="button-scroll-lesson"
              >
                <ChevronDown className="w-4 h-4 text-white" />
                <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>
                  Scroll
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Resume banner — shown when returning to a partially-completed lesson ── */}
      {savedSlideIndex !== null && savedSlideIndex > 0 && !resumeBannerDismissed && currentSlide === 0 && (
        <div
          className="relative z-10 shrink-0 flex flex-col items-center px-4 pt-3"
          style={{ background: "var(--surface-ground)" }}
        >
          <div
            className="max-w-[780px] w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3"
            style={{ background: "var(--surface-float)", border: "1px solid var(--white-10)" }}
          >
            <p className="type-body-sm flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              You left off on slide {savedSlideIndex + 1} — pick up where you left off?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setResumeBannerDismissed(true);
                  setSavedSlideIndex(null);
                  fetch(`/api/lesson-progress/${dayNumber}`, { method: "DELETE", credentials: "include" }).catch(() => {});
                }}
                className="type-caption-lg transition-opacity hover:opacity-80 px-2 py-1"
                style={{ color: "rgba(255,255,255,0.45)" }}
                data-testid="button-lesson-start-over"
              >
                Start over
              </button>
              <button
                onClick={() => {
                  setCurrentSlide(savedSlideIndex);
                  setResumeBannerDismissed(true);
                }}
                className="type-caption-lg transition-opacity hover:opacity-80 px-3 py-1.5 rounded"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
                data-testid="button-resume-lesson"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer: black bar with right-aligned CONTINUE button ── */}
      {!hideFooter && (
        <div
          key={animKey}
          className="relative z-10 shrink-0 flex flex-col items-center justify-center px-4 py-4 sm:px-8 lesson-footer-enter"
          style={{
            background: "var(--surface-ground)",
            borderTop: "1px solid var(--white-5)",
          }}
        >
          <div className="max-w-[780px] w-full flex items-center justify-end">
            <button
              onClick={() => {
                // For selection_reveal, the main Continue button drives phase/card
                // transitions inside the component via a custom event rather than
                // advancing the lesson slide directly.
                if (effectiveSlideData.type === "selection_reveal") {
                  window.dispatchEvent(new CustomEvent("lf:sr-continue"));
                  // Reset scroll immediately — currentSlide won't change during
                  // phase/card transitions so the normal scroll-reset effect won't fire.
                  if (scrollContentRef.current) scrollContentRef.current.scrollTop = 0;
                  return;
                }
                handleNext();
              }}
              disabled={navBlocked || (!previewMode && canScroll && !hasReachedBottom)}
              className={cn(
                "flex items-center gap-2 justify-center type-caption-lg text-[#fafafa] whitespace-nowrap",
                (navBlocked || (!previewMode && canScroll && !hasReachedBottom)) ? "opacity-40 cursor-not-allowed" : "opacity-100 hover:opacity-80"
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
