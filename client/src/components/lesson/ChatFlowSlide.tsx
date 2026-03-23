import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Send, RotateCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";
import bgMusicSrc from "@assets/BG_Msic_1774239770169.mp3";
import crossDividerImg from "@assets/Cross_Divider_1774243395976.webp";
import crossParticleImg from "@assets/Cross_Particle_1774243395977.webp";
import reflectionUnlockSound from "@assets/Reflection_Unlock_Sound_1774243654585.mp3";

// ============================================================
// Types
// ============================================================

export interface ChatFlowOption {
  label: string;
  value: string;
}

export interface ChatFlowBranchCondition {
  variableName: string;
  operator: "equals" | "contains" | "not_equals";
  value: string;
  targetStepId: string;
}

export interface ChatFlowStep {
  id: string;
  messages: string[];
  inputType?: "single_select" | "multi_select" | "text_input" | "message_only";
  options?: ChatFlowOption[];
  optionSetVar?: string;
  optionSetMap?: Record<string, string>;
  variableName?: string;
  required?: boolean;
  branches?: ChatFlowBranchCondition[];
}

export interface ChatFlowDefinition {
  steps: ChatFlowStep[];
  optionSets?: Record<string, ChatFlowOption[]>;
  summaryTemplate?: string;
}

interface RenderedMessage {
  id: string;
  role: "system" | "user";
  text: string;
  stepId: string;
}

interface ChatFlowSlideProps {
  content: string;
  contextKey: string;
  totalSlides: number;
  slideIndex: number;
  onComplete: () => void;
  onExit: () => void;
}

// ============================================================
// Summary helpers
// ============================================================

/**
 * Render the summary template using sentence-level clause hiding.
 *
 * Algorithm:
 * 1. Build a resolved display-value map: stored canonical values → human labels.
 *    - For option-backed variables (single/multi_select): look up label(s) from stepOptions.
 *    - For text_input variables: display value is the stored text directly.
 *    - Empty stored values stay empty ("").
 * 2. Split template into sentences at sentence-ending punctuation (. ! ?) boundaries.
 * 3. For each sentence, if ANY {{token}} in it resolves to empty → drop the entire sentence.
 * 4. For surviving sentences, replace tokens with display values and join with a space.
 */
function renderSummaryTemplate(
  template: string,
  answers: Record<string, string>,
  stepOptions: Record<string, ChatFlowOption[]>
): string {
  // Step 1: Build resolved display values from canonical stored values
  const resolved: Record<string, string> = {};
  for (const [varName, storedValue] of Object.entries(answers)) {
    if (!storedValue) {
      resolved[varName] = "";
      continue;
    }
    const opts = stepOptions[varName];
    if (opts && opts.length > 0) {
      // Multi-select: stored as comma-joined VALUES; map each to its LABEL
      const values = storedValue.split(",").map(v => v.trim()).filter(Boolean);
      const labels = values.map(v => {
        const found = opts.find(o => o.value === v);
        return found ? found.label : v;
      }).filter(Boolean);
      resolved[varName] = labels.join(", ");
    } else {
      // text_input: stored value IS the display value
      resolved[varName] = storedValue;
    }
  }

  // Step 2: Split template into sentences including their trailing punctuation.
  // The regex captures: any text that is NOT sentence-ending punctuation, optionally
  // followed by one or more sentence-ending punctuation characters.
  // Example: "Sentence one. Sentence two!" → ["Sentence one.", " Sentence two!"]
  const clauses = Array.from(template.matchAll(/[^.!?]+[.!?]*/g), m => m[0]);
  if (clauses.length === 0) return template; // No parseable clauses — return as-is

  // Step 3 & 4: For each clause, check tokens; drop if any is empty; otherwise replace.
  const outputClauses: string[] = [];
  for (const clause of clauses) {
    if (!clause.trim()) continue;
    const tokenNames = Array.from(clause.matchAll(/\{\{(\w+)\}\}/g), m => m[1]);
    // Drop this clause if any token resolves to empty (covers optional skipped fields)
    if (tokenNames.some(t => (resolved[t] ?? "") === "")) continue;
    // Replace tokens with their resolved display values
    const rendered = clause.replace(/\{\{(\w+)\}\}/g, (_, k) => resolved[k] ?? "");
    outputClauses.push(rendered.trim());
  }

  return outputClauses.join(" ").replace(/\s{2,}/g, " ").trim();
}

// ============================================================
// Timing helpers
// ============================================================

/** Random float in [min, max) — used to give each interaction a slightly
 *  different rhythm so the conversation never feels robotic. */
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ============================================================
// Typing indicator
// ============================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#181818] rounded-[6px] w-[52px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Message bubble
// ============================================================

function MessageBubble({
  role,
  text,
  isNew,
  onRewind,
}: {
  role: "system" | "user";
  text: string;
  isNew?: boolean;
  onRewind?: () => void;
}) {
  const [visible, setVisible] = useState(!isNew);
  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div
      className={cn(
        "flex items-center gap-[10px]",
        role === "system" ? "justify-start" : "justify-end",
        "transition-all ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[10px]"
      )}
      style={{ transitionDuration: "180ms" }}
    >
      {/* Rewind icon — left of user bubbles only */}
      {role === "user" && onRewind && (
        <button
          onClick={onRewind}
          className="shrink-0 text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.7)] transition-colors"
          data-testid="button-chat-rewind"
          title="Go back and change answer"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      )}
      <div
        className={cn(
          "px-3 py-2 rounded-[6px] text-[14px] leading-[20px] font-['Afacad'] text-[rgba(255,255,255,0.9)]",
          role === "system"
            ? "bg-[#181818] max-w-[210px]"
            : "bg-[#4c2913] max-w-[270px]"
        )}
      >
        {text}
      </div>
    </div>
  );
}

// ============================================================
// Option buttons
// ============================================================

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left px-3 py-2 rounded-[6px] text-[14px] leading-[20px] font-['Afacad'] border transition-colors",
        selected
          ? "bg-[#4c2913] border-[#4c2913] text-[rgba(255,255,255,0.95)]"
          : "bg-[#181818] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.9)]"
      )}
      data-testid={`button-chat-option-${label}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// Main ChatFlowSlide component
// ============================================================

export function ChatFlowSlide({ content, contextKey, totalSlides, slideIndex, onComplete, onExit }: ChatFlowSlideProps) {
  // ── Ambient background music ──
  useEffect(() => {
    const audio = new Audio(bgMusicSrc);
    audio.loop = true;
    audio.volume = 0.12;
    const playPromise = audio.play();
    return () => {
      if (playPromise !== undefined) {
        playPromise.then(() => audio.pause()).catch(() => audio.pause());
      } else {
        audio.pause();
      }
    };
  }, []);

  // Parse flow definition
  const flow = useMemo<ChatFlowDefinition>(() => {
    try {
      const p = JSON.parse(content || "{}");
      return {
        steps: Array.isArray(p.steps) ? p.steps : [],
        optionSets: p.optionSets || {},
        summaryTemplate: p.summaryTemplate || "",
      };
    } catch {
      return { steps: [], optionSets: {}, summaryTemplate: "" };
    }
  }, [content]);

  // Build a map of variableName → available options for that step (for summary label lookup)
  const stepOptionsByVar = useMemo<Record<string, ChatFlowOption[]>>(() => {
    const map: Record<string, ChatFlowOption[]> = {};
    for (const step of flow.steps) {
      if (!step.variableName) continue;
      if (step.options && step.options.length > 0) {
        map[step.variableName] = step.options;
      } else if (step.optionSetVar && step.optionSetMap) {
        // We can't know at definition time which set will be picked, so include all sets
        for (const setName of Object.values(step.optionSetMap)) {
          if (flow.optionSets?.[setName]) {
            map[step.variableName] = [...(map[step.variableName] || []), ...flow.optionSets[setName]];
          }
        }
      }
    }
    return map;
  }, [flow]);

  // Runtime state
  // answers maps variableName → stored canonical VALUE (option.value or trimmed text)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [renderedMessages, setRenderedMessages] = useState<RenderedMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [inputReady, setInputReady] = useState(false);
  // selectedOptions holds selected VALUES (not labels)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [flowComplete, setFlowComplete] = useState(false);
  // True when the completed flow was restored from the server (show review card, not animation)
  const [isRestoredFlow, setIsRestoredFlow] = useState(false);
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const [unlockPhase, setUnlockPhase] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True when flowComplete is restored from the server (skip animation, show overlay immediately)
  const restoredCompletionRef = useRef(false);
  // Set to true to cancel any in-flight reveal chain when the step changes or rewinds
  const revealCancelRef = useRef(false);
  // When navigating back from summary, skip re-revealing messages (they're already shown)
  const skipRevealRef = useRef(false);

  const currentStep = flow.steps[currentStepIdx];

  // Load saved answers on mount; if flow was previously completed, jump straight to summary
  useEffect(() => {
    apiRequest("GET", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`)
      .then(async (res) => {
        const data = await res.json();
        if (data && typeof data === "object") {
          setAnswers(data as Record<string, string>);
          if ((data as Record<string, string>).__flow_complete === "1") {
            restoredCompletionRef.current = true; // skip animation on restore
            setIsRestoredFlow(true);
            setFlowComplete(true);
          }
        }
        setLoadedFromServer(true);
      })
      .catch(() => setLoadedFromServer(true));
  }, [contextKey]);

  // Drive the sequential unlock animation when the flow completes
  useEffect(() => {
    if (!flowComplete) {
      setUnlockPhase(0);
      return;
    }
    // Restored from server → already showing review card, no animation needed
    if (restoredCompletionRef.current) {
      return;
    }
    // Fresh completion — play the unlock sound once, then stagger elements in
    // very slowly so it feels reverent and intentional
    const audio = new Audio(reflectionUnlockSound);
    audio.volume = 0.8;
    audio.play().catch(() => {}); // silently ignore autoplay policy blocks

    const timers = [
      setTimeout(() => setUnlockPhase(1), 400),    // icon entrance (700ms ease-out)
      setTimeout(() => setUnlockPhase(2), 2000),   // "REFLECTION UNLOCKED" — settle + 900ms wait
      setTimeout(() => setUnlockPhase(3), 2320),   // title (+320ms)
      setTimeout(() => setUnlockPhase(4), 2640),   // divider (+320ms)
      setTimeout(() => setUnlockPhase(5), 3000),   // subtitle (+360ms)
      setTimeout(() => setUnlockPhase(6), 3600),   // button + redo (+600ms)
    ];
    return () => timers.forEach(clearTimeout);
  }, [flowComplete]);

  // Auto-scroll to bottom — scroll the overflow container directly so nested flex
  // layouts don't confuse scrollIntoView (which targets the document viewport).
  // Uses rAF to wait for the DOM to finish painting the new content before measuring scrollHeight.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // First rAF: layout complete. Second rAF: paint complete — scrollHeight is reliable.
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [renderedMessages, showTyping, inputReady, flowComplete]);

  // Resolve the option list for a step (inline options take priority over optionSets)
  const resolveOptions = useCallback((step: ChatFlowStep): ChatFlowOption[] => {
    if (step.options && step.options.length > 0) return step.options;
    if (step.optionSetVar && step.optionSetMap) {
      // Look up stored VALUE of the referenced variable
      const storedVal = answers[step.optionSetVar] || "";
      const setName = step.optionSetMap[storedVal] || "";
      if (setName && flow.optionSets?.[setName]) {
        return flow.optionSets[setName];
      }
    }
    return [];
  }, [answers, flow.optionSets]);

  /**
   * Reveal messages for a step with natural conversational pacing:
   *  - Typing indicator:      700–1100ms (randomized per message)
   *  - Between messages:      300–500ms stagger
   *  - Input reveal delay:    300–500ms after final message
   *
   * Uses revealCancelRef so any stale chain is immediately abandoned when the
   * step changes (e.g. rewind or fast navigation).
   */
  const revealMessagesForStep = useCallback((stepIdx: number, messageStartId: number) => {
    const step = flow.steps[stepIdx];
    if (!step) return;
    const messages = step.messages || [];

    revealCancelRef.current = false;

    const schedule = (fn: () => void, ms: number) => {
      revealTimer.current = setTimeout(() => {
        if (revealCancelRef.current) return;
        fn();
      }, ms);
    };

    const reveal = (msgIdx: number) => {
      if (revealCancelRef.current) return;

      if (msgIdx >= messages.length) {
        // All messages shown — wait before revealing input controls
        schedule(() => {
          setShowTyping(false);
          setInputReady(true);
        }, rand(300, 500));
        return;
      }

      // Show typing indicator, then swap in the actual message
      setShowTyping(true);
      schedule(() => {
        setShowTyping(false);
        setRenderedMessages(prev => [
          ...prev,
          {
            id: `msg-${messageStartId + msgIdx}`,
            role: "system",
            text: messages[msgIdx],
            stepId: step.id,
          },
        ]);
        // Pause between consecutive messages before next typing indicator
        schedule(() => reveal(msgIdx + 1), rand(300, 500));
      }, rand(700, 1100));
    };

    reveal(0);
  }, [flow.steps]);

  // Start revealing step when loaded from server and step changes
  useEffect(() => {
    if (!loadedFromServer) return;
    if (!currentStep) return;
    if (flowComplete) return;

    if (revealTimer.current) clearTimeout(revealTimer.current);

    // When navigating back from summary, messages are already rendered — just show input
    if (skipRevealRef.current) {
      skipRevealRef.current = false;
      setInputReady(true);
      setShowTyping(false);
      return;
    }

    setInputReady(false);
    setShowTyping(false);

    // Pre-populate input with any previously saved answer (VALUE)
    const savedVal = currentStep.variableName ? (answers[currentStep.variableName] || "") : "";
    if (currentStep.inputType === "single_select" || currentStep.inputType === "multi_select") {
      setSelectedOptions(savedVal ? savedVal.split(",").map(v => v.trim()).filter(Boolean) : []);
    } else {
      setTextInput(savedVal);
    }

    const messageStartId = renderedMessages.length;
    revealMessagesForStep(currentStepIdx, messageStartId);

    return () => {
      revealCancelRef.current = true;
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIdx, loadedFromServer, flowComplete]);

  // Save a canonical VALUE answer to state and server
  const saveAnswer = useCallback(async (variableName: string, value: string) => {
    setAnswers(prev => ({ ...prev, [variableName]: value }));
    if (!value) return; // Don't persist empty (skipped optional) answers
    try {
      await apiRequest("POST", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`, {
        variableName,
        answer: value,
      });
    } catch {
      // non-blocking
    }
  }, [contextKey]);

  /**
   * Advance to the next step with natural conversational pacing:
   *  1. Hide input immediately (no lag after tap)
   *  2. 150–250ms  → render user bubble (fade-in)
   *  3. 400–700ms  → start the system response (typing indicator)
   *
   * @param value       - canonical VALUE to store (option.value / trimmed text / "")
   * @param displayText - human-readable label shown in the user bubble
   */
  const advanceToNext = useCallback((value: string, displayText: string) => {
    const step = currentStep;
    if (!step) return;

    // Fire-and-forget — don't await so delays below start immediately
    if (step.variableName) saveAnswer(step.variableName, value);

    // Lock input right away so the user can't double-submit
    setInputReady(false);
    setSelectedOptions([]);
    setTextInput("");

    // Evaluate branches synchronously before any async work
    const updatedAnswers = step.variableName
      ? { ...answers, [step.variableName]: value }
      : answers;
    let nextIdx = currentStepIdx + 1;
    if (step.branches && step.branches.length > 0) {
      for (const branch of step.branches) {
        const varVal =
          branch.variableName === step.variableName
            ? value
            : (updatedAnswers[branch.variableName] || "");
        let matches = false;
        if (branch.operator === "equals") matches = varVal === branch.value;
        else if (branch.operator === "not_equals") matches = varVal !== branch.value;
        else if (branch.operator === "contains") matches = varVal.includes(branch.value);
        if (matches) {
          const targetIdx = flow.steps.findIndex(s => s.id === branch.targetStepId);
          if (targetIdx !== -1) { nextIdx = targetIdx; break; }
        }
      }
    }

    const willComplete = nextIdx >= flow.steps.length;
    const capturedStepIdx = currentStepIdx;

    // Cancel any stale reveal chain before we start the timer sequence
    revealCancelRef.current = true;
    if (revealTimer.current) clearTimeout(revealTimer.current);

    const userBubbleDelay = rand(150, 250);
    const preResponseDelay = rand(400, 700);

    const doAdvance = () => {
      if (willComplete) {
        setFlowComplete(true);
        saveAnswer("__flow_complete", "1");
      } else {
        setHistory(prev => [...prev, capturedStepIdx]);
        setCurrentStepIdx(nextIdx);
      }
    };

    if (displayText) {
      // Step 1: show user bubble after short delay
      revealTimer.current = setTimeout(() => {
        setRenderedMessages(prev => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: "user",
            text: displayText,
            stepId: step.id,
          },
        ]);
        // Step 2: wait pre-response pause, then show system response
        revealTimer.current = setTimeout(doAdvance, preResponseDelay);
      }, userBubbleDelay);
    } else {
      // No bubble — just wait the pre-response pause
      revealTimer.current = setTimeout(doAdvance, preResponseDelay);
    }
  }, [currentStep, currentStepIdx, answers, flow.steps, saveAnswer]);

  // Handle message_only continue
  const handleMessageOnlyContinue = useCallback(() => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= flow.steps.length) {
      setFlowComplete(true);
      saveAnswer("__flow_complete", "1");
      return;
    }
    setHistory(prev => [...prev, currentStepIdx]);
    setCurrentStepIdx(nextIdx);
  }, [currentStepIdx, flow.steps.length, saveAnswer]);

  // Clear an answer both locally and on the server
  const clearAnswer = useCallback(async (variableName: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[variableName];
      return next;
    });
    try {
      await apiRequest("POST", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`, {
        variableName,
        answer: "",
      });
    } catch {
      // non-blocking
    }
  }, [contextKey]);

  // Reset to the beginning so the user can redo their reflection
  const handleRedo = useCallback(() => {
    saveAnswer("__flow_complete", "0"); // clear completion flag on server
    restoredCompletionRef.current = false; // next completion should animate
    setIsRestoredFlow(false);
    setFlowComplete(false);
    setCurrentStepIdx(0);
    setRenderedMessages([]);
    setHistory([]);
  }, [saveAnswer]);

  /**
   * Rewind to a specific step by stepId — triggered by the RotateCw icon on user bubbles.
   * Removes all messages from that step onward, clears those answers, updates history.
   */
  const handleRewind = useCallback((targetStepId: string) => {
    const targetIdx = flow.steps.findIndex(s => s.id === targetStepId);
    if (targetIdx === -1) return;

    // Find first rendered message belonging to this step
    const firstMsgIdx = renderedMessages.findIndex(m => m.stepId === targetStepId);
    const msgsToRemove = firstMsgIdx >= 0 ? renderedMessages.slice(firstMsgIdx) : renderedMessages;
    const affectedStepIds = new Set(msgsToRemove.map(m => m.stepId));

    // Clear answers for all affected steps (non-blocking)
    for (const sid of affectedStepIds) {
      const s = flow.steps.find(st => st.id === sid);
      if (s?.variableName) clearAnswer(s.variableName);
    }

    // Cancel any in-flight reveal / advance timers
    revealCancelRef.current = true;
    if (revealTimer.current) clearTimeout(revealTimer.current);

    // Truncate rendered messages
    setRenderedMessages(prev => firstMsgIdx >= 0 ? prev.slice(0, firstMsgIdx) : []);

    // Keep history only up to (not including) targetIdx
    setHistory(prev => {
      const cutoff = prev.indexOf(targetIdx);
      return cutoff >= 0 ? prev.slice(0, cutoff) : prev.filter(i => i < targetIdx);
    });

    setFlowComplete(false);
    setCurrentStepIdx(targetIdx);
    setSelectedOptions([]);
    setTextInput("");
    setInputReady(false);
    setShowTyping(false);
    skipRevealRef.current = false;
  }, [flow.steps, renderedMessages, clearAnswer]);

  const handleMultiSelect = useCallback((value: string) => {
    setSelectedOptions(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  /**
   * Single select: immediately advance on option tap — no separate Continue button.
   */
  const handleSingleSelectAndAdvance = useCallback((opt: ChatFlowOption) => {
    if (!inputReady || !currentStep) return;
    advanceToNext(opt.value, opt.label);
  }, [inputReady, currentStep, advanceToNext]);

  // Handle submit — for text_input, multi_select, message_only, and flowComplete Done
  const handleSubmit = useCallback(() => {
    if (flowComplete) {
      onComplete();
      return;
    }
    if (!inputReady) return;
    const step = currentStep;
    if (!step) return;

    if (step.inputType === "message_only" || !step.inputType) {
      handleMessageOnlyContinue();
      return;
    }

    if (step.inputType === "text_input") {
      const val = textInput.trim();
      if (step.required && !val) return;
      advanceToNext(val, val);
    } else if (step.inputType === "multi_select") {
      if (step.required && selectedOptions.length === 0) return;
      const opts = resolveOptions(step);
      const selectedLabels = selectedOptions
        .map(v => opts.find(o => o.value === v)?.label || v)
        .filter(Boolean);
      advanceToNext(selectedOptions.join(","), selectedLabels.join(", "));
    }
    // single_select is handled via handleSingleSelectAndAdvance (auto-advance on tap)
  }, [flowComplete, onComplete, inputReady, currentStep, textInput, selectedOptions, handleMessageOnlyContinue, advanceToNext, resolveOptions]);

  // Summary rendering using canonical values + label lookup
  const summaryText = useMemo(() => {
    const template = flow.summaryTemplate || "";
    if (!template) return "";
    return renderSummaryTemplate(template, answers, stepOptionsByVar);
  }, [flow.summaryTemplate, answers, stepOptionsByVar]);

  // Send button disabled state (no footer — send IS the advance/complete action)
  const isSendDisabled = useMemo(() => {
    if (flowComplete) return false;
    if (!inputReady) return true;
    if (!currentStep) return true;
    if (currentStep.inputType === "message_only" || !currentStep.inputType) return false;
    if (!currentStep.required) return false;
    if (currentStep.inputType === "text_input") return !textInput.trim();
    if (currentStep.inputType === "multi_select") return selectedOptions.length === 0;
    return false; // single_select is handled by auto-advance
  }, [flowComplete, inputReady, currentStep, textInput, selectedOptions]);

  // Whether to show the text input field (text_input steps only)
  const showTextInput = !flowComplete && !!currentStep && currentStep.inputType === "text_input";

  const stepNumber = currentStepIdx + 1;
  const totalSteps = flow.steps.length;

  if (!loadedFromServer) {
    return (
      <div className="flex-1 flex flex-col bg-[#111] overflow-hidden" style={{ paddingTop: "24px" }}>
        <div className="flex-1 relative overflow-hidden" style={{ background: "#010101", borderRadius: "24px 24px 0 0" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[rgba(255,255,255,0.3)] text-sm font-['Afacad']">Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#111] overflow-hidden" style={{ paddingTop: "24px" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ paddingLeft: "24px", paddingRight: "24px", paddingBottom: "24px" }}
      >
        {/* Left: empty placeholder (no back button per new Figma) */}
        <div style={{ width: "42px", height: "42px", flexShrink: 0 }} />

        {/* Center pill — "REFLECTION · N of N" */}
        <div className="flex items-center justify-center" style={{ width: "168px" }}>
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
              className="font-['Afacad'] font-medium whitespace-nowrap"
              style={{ fontSize: "14px", letterSpacing: "2.8px", color: "#efefef", lineHeight: "18px" }}
            >
              {flowComplete ? "COMPLETE" : "REFLECTION"}
            </span>
            {!flowComplete && (
              <span
                className="font-['Afacad'] font-normal whitespace-nowrap"
                style={{ fontSize: "13.9px", color: "#8b8b8b", lineHeight: "18px", paddingLeft: "8px" }}
              >
                {stepNumber} of {totalSteps}
              </span>
            )}
          </div>
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
            data-testid="button-chat-exit"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content area (bg image + card) — Figma: pt-16 px-16 ── */}
      <div
        className="flex-1 relative flex flex-col overflow-hidden"
      >
        {/* Background image + gradient overlay (absolute, fills content area) */}
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

        {/* Scrollable section — Figma: pt-16 px-16 */}
        <div
          className="flex-1 overflow-auto flex flex-col items-center relative"
          style={{ paddingTop: "16px", paddingLeft: "16px", paddingRight: "16px" }}
        >
          {/* Chat card — Figma: bg-[#09090b], border, rounded top only, p-24, fills height */}
          <div
            className="flex-1 flex flex-col overflow-hidden relative w-full"
            style={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "8px 8px 0 0",
              padding: "24px",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
            }}
          >
              {/* Messages list (scrollable, flex-1) */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0"
                style={{ scrollbarWidth: "none" }}
              >
                {renderedMessages.map((msg, i) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    isNew={i === renderedMessages.length - 1}
                    onRewind={
                      msg.role === "user"
                        ? () => handleRewind(msg.stepId)
                        : undefined
                    }
                  />
                ))}

                {showTyping && (
                  <div className="flex justify-start">
                    <TypingIndicator />
                  </div>
                )}

                {/* Option buttons — appear inside chat after messages reveal */}
                {inputReady && !flowComplete && currentStep &&
                  (currentStep.inputType === "single_select" ||
                    currentStep.inputType === "multi_select") && (
                  <div className="flex flex-col gap-2">
                    {resolveOptions(currentStep).map(opt => (
                      <OptionButton
                        key={opt.value}
                        label={opt.label}
                        selected={selectedOptions.includes(opt.value)}
                        onClick={() =>
                          currentStep.inputType === "multi_select"
                            ? handleMultiSelect(opt.value)
                            : handleSingleSelectAndAdvance(opt)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Summary card when flow is complete */}
                {flowComplete && (
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: "#0f1116",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      padding: "20px",
                    }}
                  >
                    <div
                      className="absolute pointer-events-none mix-blend-lighten"
                      style={{
                        top: "-48px",
                        left: "-48px",
                        width: "160px",
                        height: "160px",
                        opacity: 0.04,
                        background: "radial-gradient(circle, #F07830 0%, transparent 70%)",
                        borderRadius: "50%",
                      }}
                    />
                    <p
                      className="font-['Afacad'] uppercase mb-3"
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Your Reflection
                    </p>
                    {summaryText ? (
                      <p
                        className="font-['Afacad']"
                        style={{
                          fontSize: "15px",
                          lineHeight: "22px",
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        {summaryText}
                      </p>
                    ) : (
                      <p
                        className="font-['Afacad'] italic"
                        style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}
                      >
                        Your answers have been recorded.
                      </p>
                    )}

                    {/* Redo link — lets the user restart the reflection */}
                    <button
                      onClick={handleRedo}
                      className="mt-4 font-['Afacad'] transition-opacity hover:opacity-70"
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.35)",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                      data-testid="button-redo-reflection"
                    >
                      Redo this reflection
                    </button>
                  </div>
                )}

                <div ref={chatEndRef} className="h-8 shrink-0" />
              </div>

              {/* ── Input row — always at bottom of inner card ──
                   message_only + flowComplete → full-width Continue button.
                   text_input → text field + send button.
                   multi_select → send/done button.
                   single_select → hidden (auto-advances on option tap). */}
              {(flowComplete ||
                (inputReady &&
                  currentStep &&
                  currentStep.inputType !== "single_select")) && (
                <div className="shrink-0 pt-2">
                  {/* Full-width Continue — for message_only steps and after flow completes */}
                  {(flowComplete ||
                    currentStep?.inputType === "message_only" ||
                    !currentStep?.inputType) ? (
                    <button
                      onClick={handleSubmit}
                      className="w-full flex items-center justify-center gap-2 font-['Afacad'] font-medium text-[#fafafa] rounded-[6px] transition-opacity hover:opacity-90"
                      style={{
                        background: "#18181b",
                        height: "42px",
                        fontSize: "15px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.06)",
                      }}
                      data-testid="button-chat-continue"
                    >
                      Continue
                      <ArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  ) : (
                    /* Small send button — for text_input and multi_select */
                    <div className="flex gap-2 items-center">
                      {/* Text field — only for text_input steps */}
                      {showTextInput && (
                        <input
                          type="text"
                          value={textInput}
                          onChange={e => setTextInput(e.target.value)}
                          onKeyDown={e =>
                            e.key === "Enter" && !isSendDisabled && handleSubmit()
                          }
                          placeholder="Type your answer here..."
                          className="flex-1 px-3 rounded-[6px] text-[14px] font-['Afacad'] bg-[#181818] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.9)] placeholder-[#71717a] outline-none focus:border-[rgba(255,255,255,0.15)] transition-colors"
                          style={{ height: "36px" }}
                          data-testid="input-chat-text"
                        />
                      )}

                      {/* Spacer when no text field, to push send button right */}
                      {!showTextInput && <div className="flex-1" />}

                      {/* Send / Done button */}
                      <button
                        onClick={handleSubmit}
                        disabled={isSendDisabled}
                        className="flex items-center justify-center rounded-[6px] bg-[#18181b] border border-[rgba(255,255,255,0.05)] text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                        style={{ width: "36px", height: "36px" }}
                        data-testid="button-chat-send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* ── Reflection Review Card (return visit) — Figma node 3097:13688 ── */}
      {flowComplete && isRestoredFlow && (
        <div
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 500, background: "#111", animation: "rp-overlay-in 0.35s ease-out both" }}
        >
          {/* ── Top bar (Figma: 3097:13716) ── */}
          <div
            className="relative shrink-0 flex items-center justify-between w-full"
            style={{ padding: "24px 24px 24px", zIndex: 1 }}
          >
            {/* 42×42 spacer (matches Figma left rectangle placeholder) */}
            <div style={{ width: "42px", height: "42px" }} />

            {/* COMPLETE pill */}
            <div
              style={{
                background: "#202020",
                borderRadius: "36px",
                padding: "12px 16px",
                fontFamily: "Afacad",
                fontWeight: 500,
                fontSize: "14px",
                letterSpacing: "2.8px",
                lineHeight: "18px",
                color: "#efefef",
              }}
            >
              COMPLETE
            </div>

            {/* Close button — 42×42 container, 40×40 blur button */}
            <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
              <button
                onClick={onComplete}
                className="flex items-center justify-center"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "20px",
                  background: "rgba(42,42,42,0.5)",
                  backdropFilter: "blur(9px)",
                  border: "none",
                  cursor: "pointer",
                }}
                data-testid="button-review-close"
              >
                <X style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.7)" }} />
              </button>
            </div>
          </div>

          {/* ── Main card area (Figma: 3097:13727) ── bg-[#010101], rounded top ── */}
          <div
            className="relative flex-1 flex flex-col min-h-0 overflow-clip"
            style={{
              background: "#010101",
              borderRadius: "24px 24px 0 0",
            }}
          >
            {/* Oil painting bg (Figma: opacity-60) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "24px 24px 0 0" }}>
              <img
                src={candleBg}
                alt=""
                className="absolute w-full max-w-none"
                style={{ opacity: 0.6, top: "-8.53%", height: "117.06%", left: 0 }}
              />
            </div>
            {/* Left/right gradient (Figma: 3097:13730) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
              }}
            />

            {/* ── Content container — centers the 640px card ── */}
            <div
              className="relative flex-1 flex flex-col items-center overflow-y-auto"
              style={{ padding: "32px 24px 48px" }}
            >
              {/* ── Outer 640px card (Figma: 3097:13732) ── bg-[#0f1116], top-rounded ── */}
              <div
                className="relative w-full flex flex-col overflow-hidden"
                style={{
                  maxWidth: "640px",
                  background: "#0f1116",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "24px 24px 0 0",
                  padding: "32px 20px 1px",
                  flex: "1 0 auto",
                }}
              >
                {/* White radial gradient top-left (Figma: 3097:13733 — mix-blend-lighten, opacity ~4%) */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "-160px",
                    left: "-133px",
                    width: "310px",
                    height: "310px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 90%)",
                    mixBlendMode: "lighten",
                  }}
                />

                {/* ── Inner card (Figma: 3097:13734) ── bg-[#09090b], top-rounded ── */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "8px 8px 0 0",
                    boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                    padding: "25px",
                  }}
                >
                  {/* ── Reflection sub-card (Figma: 3097:13736) ── bg-[#0f1116], rounded ── */}
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      background: "#0f1116",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      padding: "21px 21px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Orange radial corner glow (Figma: 3097:13743 — mix-blend-lighten, opacity ~4%) */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        top: "-48px",
                        left: "-48px",
                        width: "160px",
                        height: "160px",
                        borderRadius: "80px",
                        background: "radial-gradient(circle, rgba(240,120,48,0.18) 0%, rgba(240,120,48,0) 70%)",
                        mixBlendMode: "lighten",
                      }}
                    />

                    {/* "Your Reflection" label */}
                    <p
                      style={{
                        fontFamily: "Afacad",
                        fontWeight: 400,
                        fontSize: "13px",
                        letterSpacing: "1.3px",
                        lineHeight: "19.5px",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.4)",
                        margin: 0,
                      }}
                    >
                      Your Reflection
                    </p>

                    {/* Summary text */}
                    {summaryText && (
                      <p
                        style={{
                          fontFamily: "Afacad",
                          fontWeight: 400,
                          fontSize: "15px",
                          lineHeight: "22px",
                          color: "rgba(255,255,255,0.85)",
                          margin: 0,
                        }}
                      >
                        {summaryText}
                      </p>
                    )}

                    {/* "Redo this reflection" */}
                    <div style={{ paddingTop: "3.75px" }}>
                      <button
                        onClick={handleRedo}
                        style={{
                          fontFamily: "Afacad",
                          fontWeight: 400,
                          fontSize: "13px",
                          lineHeight: "19.5px",
                          color: "rgba(255,255,255,0.35)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "block",
                          margin: "0 auto",
                          textAlign: "center",
                        }}
                        data-testid="button-redo-reflection"
                      >
                        Redo this reflection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar — Continue button (matches Figma completion screen) ── */}
          <div
            className="relative shrink-0 flex flex-col items-end justify-center w-full"
            style={{
              background: "#0f1116",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "32px",
              paddingBottom: "32px",
              paddingLeft: "53px",
              paddingRight: "53px",
              zIndex: 1,
            }}
          >
            <button
              onClick={onComplete}
              className="flex items-center justify-center font-['Afacad'] font-medium text-[#fafafa] transition-opacity hover:opacity-80"
              style={{
                background: "#18181b",
                height: "36px",
                gap: "8px",
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "8px",
                paddingBottom: "8px",
                borderRadius: "6px",
                fontSize: "14px",
                lineHeight: "20px",
                boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.06)",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
              }}
              data-testid="button-review-continue"
            >
              Continue
              <ArrowRight style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Reflection Unlock Overlay (first-time completion only) ──
          6 phases with very slow, reverent pacing. Never shown on return visits. */}
      {flowComplete && !isRestoredFlow && (
        <div
          className="fixed inset-0 flex flex-col"
          style={{
            zIndex: 500,
            background: "#0b0b0b",
            animation: "rp-overlay-in 0.5s ease-out both",
          }}
        >
          {/* Background texture — very subtle */}
          <img
            src={candleBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.06 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(11,11,11,0.05) 0%, rgba(11,11,11,0.75) 50%, #0b0b0b 100%)",
            }}
          />

          {/* ── Centre content ── */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-8">

            {/* Phase 1 — Cross-in-circle icon with layered white glow */}
            <div
              style={{
                position: "relative",
                marginBottom: "40px",
                opacity: unlockPhase >= 1 ? 1 : 0,
                transform: unlockPhase >= 1 ? "scale(1) translateY(0)" : "scale(0.8) translateY(14px)",
                transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
              }}
            >
              {/* Floating dust particles — shown once icon is visible */}
              {unlockPhase >= 1 && (
                <div style={{ position: "absolute", inset: "-60px", pointerEvents: "none" }}>
                  {[
                    { top: "18%", left: "8%",  size: 3, anim: "rp-float-1 7.2s ease-in-out infinite",  delay: "0s"   },
                    { top: "10%", left: "72%", size: 2, anim: "rp-float-2 8.5s ease-in-out infinite",  delay: "1.1s" },
                    { top: "72%", left: "15%", size: 3, anim: "rp-float-3 6.8s ease-in-out infinite",  delay: "0.4s" },
                    { top: "78%", left: "70%", size: 2, anim: "rp-float-4 9.1s ease-in-out infinite",  delay: "2.3s" },
                    { top: "5%",  left: "40%", size: 2, anim: "rp-float-5 7.6s ease-in-out infinite",  delay: "0.8s" },
                    { top: "88%", left: "45%", size: 3, anim: "rp-float-6 8.0s ease-in-out infinite",  delay: "1.7s" },
                    { top: "40%", left: "3%",  size: 2, anim: "rp-float-7 6.4s ease-in-out infinite",  delay: "3.0s" },
                    { top: "45%", left: "88%", size: 2, anim: "rp-float-8 7.9s ease-in-out infinite",  delay: "0.3s" },
                  ].map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: p.top,
                        left: p.left,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.9)",
                        animation: p.anim,
                        animationDelay: p.delay,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Circle with layered white glow — contains the cross image */}
              <div
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  boxShadow: [
                    "0 0 0 1px rgba(255,255,255,0.20)",
                    "0 0 12px 4px rgba(255,255,255,0.14)",
                    "0 0 30px 12px rgba(255,255,255,0.07)",
                    "0 0 60px 22px rgba(255,255,255,0.04)",
                  ].join(", "),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={crossParticleImg}
                  alt="Cross"
                  style={{ width: "88px", height: "88px", objectFit: "cover", borderRadius: "50%" }}
                />
              </div>
            </div>

            {/* Phase 2 — "REFLECTION UNLOCKED" label */}
            <p
              style={{
                opacity: unlockPhase >= 2 ? 1 : 0,
                transform: unlockPhase >= 2 ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.42s ease-out, transform 0.42s ease-out",
                fontFamily: "Afacad",
                fontSize: "11px",
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              Reflection Unlocked
            </p>

            {/* Phase 3 — Title */}
            <h2
              style={{
                opacity: unlockPhase >= 3 ? 1 : 0,
                transform: unlockPhase >= 3 ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.42s ease-out, transform 0.42s ease-out",
                fontFamily: "IvyOra Display",
                fontStyle: "normal",
                fontSize: "30px",
                lineHeight: "36px",
                color: "rgba(255,255,255,0.95)",
                marginBottom: "28px",
                textAlign: "center",
              }}
            >
              Your Reflection
            </h2>

            {/* Phase 4 — Cross divider image (full-width with cross in centre) */}
            <div
              style={{
                opacity: unlockPhase >= 4 ? 1 : 0,
                transform: unlockPhase >= 4 ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.42s ease-out, transform 0.42s ease-out",
                width: "100%",
                maxWidth: "296px",
                marginBottom: "22px",
              }}
            >
              <img
                src={crossDividerImg}
                alt=""
                style={{ width: "100%", height: "auto", display: "block", opacity: 0.55 }}
              />
            </div>

            {/* Phase 5 — Summary text */}
            {summaryText && (
              <p
                style={{
                  opacity: unlockPhase >= 5 ? 1 : 0,
                  transform: unlockPhase >= 5 ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 0.42s ease-out, transform 0.42s ease-out",
                  fontFamily: "Afacad",
                  fontSize: "15px",
                  lineHeight: "24px",
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                  maxWidth: "296px",
                }}
              >
                {summaryText}
              </p>
            )}

            {/* Phase 6 — Redo link */}
            <button
              onClick={handleRedo}
              style={{
                opacity: unlockPhase >= 6 ? 0.4 : 0,
                transition: "opacity 0.42s ease-out",
                marginTop: "28px",
                fontFamily: "Afacad",
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              data-testid="button-redo-reflection"
            >
              Redo this reflection
            </button>
          </div>

          {/* Phase 6 — Continue button — centred, content-width */}
          <div
            className="relative flex justify-center"
            style={{
              opacity: unlockPhase >= 6 ? 1 : 0,
              transform: unlockPhase >= 6 ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.42s ease-out, transform 0.42s ease-out",
              padding: "0 24px 52px",
              zIndex: 1,
            }}
          >
            <button
              onClick={onComplete}
              className="flex items-center justify-center gap-2 font-['Afacad'] font-medium text-[#fafafa] rounded-[6px] hover:opacity-90 transition-opacity"
              style={{
                background: "#18181b",
                height: "50px",
                fontSize: "16px",
                paddingLeft: "32px",
                paddingRight: "32px",
                minWidth: "200px",
                maxWidth: "296px",
                width: "100%",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
              }}
              data-testid="button-unlock-continue"
            >
              Continue
              <ArrowRight style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
