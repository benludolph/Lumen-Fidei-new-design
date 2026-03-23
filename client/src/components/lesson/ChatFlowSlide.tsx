import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowLeft, X, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";

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

function MessageBubble({ role, text, isNew }: { role: "system" | "user"; text: string; isNew?: boolean }) {
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
        "flex",
        role === "system" ? "justify-start" : "justify-end",
        "transition-all duration-150 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
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
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When navigating back from summary, skip re-revealing messages (they're already shown)
  const skipRevealRef = useRef(false);

  const currentStep = flow.steps[currentStepIdx];

  // Load saved answers on mount
  useEffect(() => {
    apiRequest("GET", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`)
      .then(async (res) => {
        const data = await res.json();
        if (data && typeof data === "object") {
          setAnswers(data as Record<string, string>);
        }
        setLoadedFromServer(true);
      })
      .catch(() => setLoadedFromServer(true));
  }, [contextKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [renderedMessages, showTyping, inputReady]);

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

  // Reveal messages for a step sequentially with 300–800ms timing
  const revealMessagesForStep = useCallback((stepIdx: number, messageStartId: number) => {
    const step = flow.steps[stepIdx];
    if (!step) return;
    const messages = step.messages || [];

    const reveal = (msgIdx: number) => {
      if (msgIdx >= messages.length) {
        setShowTyping(false);
        setInputReady(true);
        return;
      }
      setShowTyping(true);
      // 300ms base + up to 500ms for longer messages = 300-800ms total
      const delay = 300 + Math.min(messages[msgIdx].length * 15, 500);
      revealTimer.current = setTimeout(() => {
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
        // Brief pause between messages (150ms) before starting next reveal
        revealTimer.current = setTimeout(() => reveal(msgIdx + 1), 150);
      }, delay);
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
   * Advance to the next step.
   * @param value - the canonical VALUE to store (option.value or trimmed text or "")
   * @param displayText - the human-readable text to show in the user bubble
   */
  const advanceToNext = useCallback(async (value: string, displayText: string) => {
    const step = currentStep;
    if (!step) return;

    // Save VALUE to answers/API
    if (step.variableName) {
      await saveAnswer(step.variableName, value);
    }

    // Show user bubble with display text (only if there's something to show)
    if (displayText) {
      setRenderedMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: displayText,
          stepId: step.id,
        },
      ]);
    }

    setInputReady(false);
    setSelectedOptions([]);
    setTextInput("");

    // Evaluate branches using canonical VALUES
    const updatedAnswers = step.variableName ? { ...answers, [step.variableName]: value } : answers;
    let nextIdx = currentStepIdx + 1;
    if (step.branches && step.branches.length > 0) {
      for (const branch of step.branches) {
        const varVal = branch.variableName === step.variableName ? value : (updatedAnswers[branch.variableName] || "");
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

    if (nextIdx >= flow.steps.length) {
      setFlowComplete(true);
      return;
    }

    setHistory(prev => [...prev, currentStepIdx]);
    setCurrentStepIdx(nextIdx);
  }, [currentStep, currentStepIdx, answers, flow.steps, saveAnswer]);

  // Handle message_only continue
  const handleMessageOnlyContinue = useCallback(() => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= flow.steps.length) {
      setFlowComplete(true);
      return;
    }
    setHistory(prev => [...prev, currentStepIdx]);
    setCurrentStepIdx(nextIdx);
  }, [currentStepIdx, flow.steps.length]);

  // Clear an answer both locally and on the server (used when navigating back)
  const clearAnswer = useCallback(async (variableName: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[variableName];
      return next;
    });
    // Persist the clear to the server so stale answers don't rehydrate on refresh
    try {
      await apiRequest("POST", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`, {
        variableName,
        answer: "",
      });
    } catch {
      // non-blocking
    }
  }, [contextKey]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    // Case 1: Navigating back from the summary card — re-show current step's input
    if (flowComplete) {
      skipRevealRef.current = true;
      setFlowComplete(false);
      // Clear current step's variable so user must re-answer
      if (currentStep?.variableName) {
        clearAnswer(currentStep.variableName);
      }
      // Remove any user bubble from the current step (the final answer bubble)
      setRenderedMessages(prev => prev.filter(m => m.stepId !== currentStep?.id || m.role !== "user"));
      return;
    }

    // Case 2: Normal back through history
    if (history.length === 0) return;
    const prevIdx = history[history.length - 1];
    const prevStep = flow.steps[prevIdx];
    // Clear variable for the previous step (user will re-answer it) and remove from server
    if (prevStep?.variableName) {
      clearAnswer(prevStep.variableName);
    }
    // Remove rendered messages for the previous and current steps
    setRenderedMessages(prev => prev.filter(m => m.stepId !== prevStep?.id && m.stepId !== currentStep?.id));
    setHistory(prev => prev.slice(0, -1));
    setCurrentStepIdx(prevIdx);
  }, [flowComplete, history, flow.steps, currentStep, clearAnswer]);

  const handleSingleSelect = useCallback((value: string) => {
    setSelectedOptions([value]);
  }, []);

  const handleMultiSelect = useCallback((value: string) => {
    setSelectedOptions(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  // Handle submit — separate VALUE (for storage/branching) from displayText (for bubble)
  const handleSubmit = useCallback(() => {
    if (!inputReady) return;
    const step = currentStep;
    if (!step) return;

    if (step.inputType === "message_only") {
      handleMessageOnlyContinue();
      return;
    }

    if (step.inputType === "text_input") {
      const val = textInput.trim();
      if (step.required && !val) return;
      // For optional empty: store "" (no API save), show nothing in bubble
      advanceToNext(val, val);
    } else if (step.inputType === "single_select") {
      if (step.required && selectedOptions.length === 0) return;
      const selectedValue = selectedOptions[0] || "";
      const opts = resolveOptions(step);
      const opt = opts.find(o => o.value === selectedValue);
      const displayText = opt ? opt.label : selectedValue;
      // Store canonical VALUE; display label in bubble
      advanceToNext(selectedValue, displayText);
    } else if (step.inputType === "multi_select") {
      if (step.required && selectedOptions.length === 0) return;
      const opts = resolveOptions(step);
      const selectedLabels = selectedOptions
        .map(v => opts.find(o => o.value === v)?.label || v)
        .filter(Boolean);
      // Store comma-joined VALUES for branching; display comma-joined LABELS in bubble
      advanceToNext(selectedOptions.join(","), selectedLabels.join(", "));
    }
  }, [inputReady, currentStep, textInput, selectedOptions, handleMessageOnlyContinue, advanceToNext, resolveOptions]);

  // Summary rendering using canonical values + label lookup
  const summaryText = useMemo(() => {
    const template = flow.summaryTemplate || "";
    if (!template) return "";
    return renderSummaryTemplate(template, answers, stepOptionsByVar);
  }, [flow.summaryTemplate, answers, stepOptionsByVar]);

  const isContinueDisabled = useMemo(() => {
    if (!inputReady) return true;
    if (!currentStep) return true;
    if (currentStep.inputType === "message_only" || !currentStep.inputType) return false;
    if (!currentStep.required) return false;
    if (currentStep.inputType === "text_input") return !textInput.trim();
    if (currentStep.inputType === "single_select") return selectedOptions.length === 0;
    if (currentStep.inputType === "multi_select") return selectedOptions.length === 0;
    return false;
  }, [inputReady, currentStep, textInput, selectedOptions]);

  const showSkip = useMemo(() => {
    if (!inputReady) return false;
    if (!currentStep || currentStep.required || !currentStep.inputType || currentStep.inputType === "message_only") return false;
    if (currentStep.inputType === "text_input" && !textInput.trim()) return true;
    if (currentStep.inputType === "single_select" && selectedOptions.length === 0) return true;
    if (currentStep.inputType === "multi_select" && selectedOptions.length === 0) return true;
    return false;
  }, [inputReady, currentStep, textInput, selectedOptions]);

  const stepNumber = currentStepIdx + 1;
  const totalSteps = flow.steps.length;

  if (!loadedFromServer) {
    return (
      <div className="flex-1 flex flex-col bg-[#111] pt-[24px]">
        <div className="flex-1 bg-[#010101] rounded-tl-[24px] rounded-tr-[24px] mt-[24px] flex items-center justify-center">
          <div className="text-[rgba(255,255,255,0.3)] text-sm font-['Afacad']">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#111] overflow-hidden" style={{ paddingTop: "24px" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0" style={{ paddingLeft: "24px", paddingRight: "24px", paddingBottom: "24px" }}>

        {/* Back button */}
        <div className="flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
          <button
            onClick={handleBack}
            disabled={!flowComplete && history.length === 0}
            className={cn(
              "flex items-center justify-center transition-colors",
              "rounded-[20px]",
              (!flowComplete && history.length === 0)
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-[rgba(40,40,40,0.85)]"
            )}
            style={{
              width: "40px",
              height: "40px",
              background: "rgba(30,30,30,0.72)",
              backdropFilter: "blur(11px)",
            }}
            data-testid="button-chat-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Center pill — "REFLECTION · N of N" */}
        <div
          className="flex items-center justify-center"
          style={{ width: "168px" }}
        >
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
            <span
              className="font-['Afacad'] font-normal whitespace-nowrap"
              style={{ fontSize: "13.9px", color: "#8b8b8b", lineHeight: "18px", paddingLeft: "8px" }}
            >
              {flowComplete ? "" : `${stepNumber} of ${totalSteps}`}
            </span>
          </div>
        </div>

        {/* Exit button */}
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

      {/* ── Content area — candle BG + centered card ── */}
      <div
        className="flex-1 relative flex flex-col overflow-hidden"
        style={{ background: "#010101", borderRadius: "24px 24px 0 0" }}
      >
        {/* Background image + gradient overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: "24px 24px 0 0", overflow: "hidden" }}
        >
          <img
            src={candleBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6, borderRadius: "24px 24px 0 0" }}
          />
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "24px 24px 0 0",
              background: "linear-gradient(89.999deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
            }}
          />
        </div>

        {/* Scrollable inner section — centers the card */}
        <div
          className="flex-1 overflow-auto flex flex-col items-center relative"
          style={{ paddingTop: "48px", paddingBottom: "80px", paddingLeft: "24px", paddingRight: "24px" }}
        >
          {/* Outer card — bg #0f1116, max-w 528px */}
          <div
            className="w-full relative overflow-hidden"
            style={{
              maxWidth: "528px",
              background: "#0f1116",
              border: "0.5px solid rgba(255,255,255,0.05)",
              borderRadius: "8px",
              paddingLeft: "48px",
              paddingRight: "48px",
              paddingTop: "31px",
              paddingBottom: "31px",
            }}
          >
            {/* Radial glow — top left */}
            <div
              className="absolute pointer-events-none mix-blend-lighten"
              style={{
                top: "-160.5px",
                left: "-133.5px",
                width: "310px",
                height: "310px",
                opacity: 0.04,
                background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 90%)",
              }}
            />

            {/* Inner chat card — bg #09090b, h-450px */}
            <div
              className="flex flex-col overflow-hidden relative"
              style={{
                background: "#09090b",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "6px",
                height: "450px",
                padding: "24px",
              }}
            >
              {/* Messages list (scrollable, grows from top) */}
              <div
                className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0"
                style={{ scrollbarWidth: "none" }}
              >
                {renderedMessages.map((msg, i) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    isNew={i === renderedMessages.length - 1}
                  />
                ))}

                {showTyping && (
                  <div className="flex justify-start">
                    <TypingIndicator />
                  </div>
                )}

                {/* Option buttons — appear inside chat after messages */}
                {inputReady && !flowComplete && currentStep &&
                  (currentStep.inputType === "single_select" || currentStep.inputType === "multi_select") && (
                  <div className="flex flex-col gap-2">
                    {resolveOptions(currentStep).map(opt => (
                      <OptionButton
                        key={opt.value}
                        label={opt.label}
                        selected={selectedOptions.includes(opt.value)}
                        onClick={() =>
                          currentStep.inputType === "multi_select"
                            ? handleMultiSelect(opt.value)
                            : handleSingleSelect(opt.value)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Summary card when flow complete */}
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
                      style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}
                    >
                      Your Reflection
                    </p>
                    {summaryText ? (
                      <p
                        className="font-['Afacad']"
                        style={{ fontSize: "15px", lineHeight: "22px", color: "rgba(255,255,255,0.85)" }}
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
                  </div>
                )}

                <div ref={chatEndRef} className="h-2 shrink-0" />
              </div>

              {/* Text input row — pinned to bottom of chat card */}
              {inputReady && !flowComplete && currentStep && currentStep.inputType === "text_input" && (
                <div className="flex gap-2 items-center shrink-0 pt-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isContinueDisabled && handleSubmit()}
                    placeholder="Type your answer here..."
                    className="flex-1 px-3 rounded-[6px] text-[14px] font-['Afacad'] bg-[#181818] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.9)] placeholder-[#71717a] outline-none focus:border-[rgba(255,255,255,0.15)] transition-colors"
                    style={{ height: "36px" }}
                    data-testid="input-chat-text"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={currentStep.required && !textInput.trim()}
                    className="flex items-center justify-center rounded-[6px] bg-[#18181b] border border-[rgba(255,255,255,0.05)] text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                    style={{ width: "36px", height: "36px" }}
                    data-testid="button-chat-send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="shrink-0 flex items-center justify-end gap-3"
        style={{
          background: "#0f1011",
          borderTop: "1px solid rgba(228,228,231,0.06)",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "32px",
          paddingBottom: "32px",
        }}
      >
        {showSkip && (
          <button
            onClick={() => {
              setSelectedOptions([]);
              setTextInput("");
              advanceToNext("", "");
            }}
            className="font-['Afacad'] text-[14px] text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.6)] transition-colors"
            data-testid="button-chat-skip"
          >
            Skip
          </button>
        )}

        {flowComplete ? (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#F07830] text-white font-['Afacad'] text-[14px] font-medium hover:bg-[#d96a28] transition-colors"
            data-testid="button-chat-done"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={
              inputReady
                ? (currentStep?.inputType === "message_only" || !currentStep?.inputType
                    ? handleMessageOnlyContinue
                    : handleSubmit)
                : undefined
            }
            disabled={isContinueDisabled}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[6px] font-['Afacad'] text-[14px] font-medium transition-colors",
              isContinueDisabled
                ? "bg-[#18181b] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] cursor-not-allowed opacity-50"
                : "bg-[#F07830] text-white hover:bg-[#d96a28]"
            )}
            data-testid="button-chat-continue"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
