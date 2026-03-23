import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowLeft, X, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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
  summaryTemplate?: string;
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
// Interpolation helpers
// ============================================================

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

function hideSentenceIfEmpty(text: string): string {
  // Remove sentence fragments where all {{var}} resolved to empty string
  return text
    .replace(/[^.!?]*\{\{[^}]+\}\}[^.!?]*[.!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderSummaryTemplate(template: string, vars: Record<string, string>, options: Record<string, ChatFlowOption[]>): string {
  let result = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = vars[key];
    if (val && val.trim()) return val;
    // Look for option label fallback
    for (const opts of Object.values(options)) {
      const found = opts.find(o => o.value === val || o.value === key);
      if (found) return found.label;
    }
    return "";
  });
  // Clean up empty clause artifacts
  result = result.replace(/,\s*,/g, ",").replace(/\.\s*\./g, ".").replace(/\s{2,}/g, " ").trim();
  return result;
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

  // Runtime state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [history, setHistory] = useState<number[]>([]); // indices of visited steps
  const [renderedMessages, setRenderedMessages] = useState<RenderedMessage[]>([]);
  const [revealIndex, setRevealIndex] = useState(0); // which message within current step is being revealed
  const [showTyping, setShowTyping] = useState(false);
  const [inputReady, setInputReady] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [flowComplete, setFlowComplete] = useState(false);
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = flow.steps[currentStepIdx];
  const isLastStep = currentStepIdx >= flow.steps.length - 1;

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

  // Resolve dynamic option set for a step
  const resolveOptions = useCallback((step: ChatFlowStep): ChatFlowOption[] => {
    if (step.options && step.options.length > 0) return step.options;
    if (step.optionSetVar && step.optionSetMap) {
      const storedVal = answers[step.optionSetVar] || "";
      const setName = step.optionSetMap[storedVal] || "";
      if (setName && flow.optionSets?.[setName]) {
        return flow.optionSets[setName];
      }
    }
    return [];
  }, [answers, flow.optionSets]);

  // Reveal messages for a step sequentially
  const revealMessagesForStep = useCallback((stepIdx: number, messageStartId: number) => {
    const step = flow.steps[stepIdx];
    if (!step) return;
    const messages = step.messages || [];

    const reveal = (msgIdx: number) => {
      if (msgIdx >= messages.length) {
        // All messages shown — show input
        setShowTyping(false);
        setInputReady(true);
        return;
      }
      // Show typing before each message
      setShowTyping(true);
      const delay = 600 + Math.min(messages[msgIdx].length * 18, 800);
      revealTimer.current = setTimeout(() => {
        setShowTyping(false);
        setRenderedMessages(prev => [
          ...prev,
          {
            id: `msg-${messageStartId + msgIdx}`,
            role: "system",
            text: interpolate(messages[msgIdx], {}),
            stepId: step.id,
          },
        ]);
        setRevealIndex(msgIdx + 1);
        revealTimer.current = setTimeout(() => reveal(msgIdx + 1), 300);
      }, delay);
    };

    reveal(0);
  }, [flow.steps]);

  // Start revealing step when loaded from server and step changes
  useEffect(() => {
    if (!loadedFromServer) return;
    if (!currentStep) return;
    if (flowComplete) return;

    // Clear timers
    if (revealTimer.current) clearTimeout(revealTimer.current);

    setInputReady(false);
    setShowTyping(false);
    setSelectedOptions(currentStep.variableName && answers[currentStep.variableName]
      ? [answers[currentStep.variableName]]
      : []);
    setTextInput(currentStep.variableName && answers[currentStep.variableName]
      ? answers[currentStep.variableName]
      : "");

    const messageStartId = renderedMessages.length;
    revealMessagesForStep(currentStepIdx, messageStartId);

    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIdx, loadedFromServer, flowComplete]);

  // Evaluate branch conditions to determine next step index
  const evaluateNextStep = useCallback((step: ChatFlowStep, answer: string): number => {
    if (step.branches && step.branches.length > 0) {
      for (const branch of step.branches) {
        const varVal = branch.variableName === step.variableName ? answer : (answers[branch.variableName] || "");
        let matches = false;
        if (branch.operator === "equals") matches = varVal === branch.value;
        else if (branch.operator === "not_equals") matches = varVal !== branch.value;
        else if (branch.operator === "contains") matches = varVal.includes(branch.value);
        if (matches) {
          const targetIdx = flow.steps.findIndex(s => s.id === branch.targetStepId);
          if (targetIdx !== -1) return targetIdx;
        }
      }
    }
    return currentStepIdx + 1;
  }, [answers, currentStepIdx, flow.steps]);

  // Save an answer to the server
  const saveAnswer = useCallback(async (variableName: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [variableName]: answer }));
    try {
      await apiRequest("POST", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`, {
        variableName,
        answer,
      });
    } catch {
      // non-blocking
    }
  }, [contextKey]);

  // Advance to next step after user answers
  const advanceToNext = useCallback(async (answer: string) => {
    const step = currentStep;
    if (!step) return;

    // Save answer
    if (step.variableName) {
      await saveAnswer(step.variableName, answer);
    }

    // Append user bubble to rendered messages
    setRenderedMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: answer,
        stepId: step.id,
      },
    ]);

    setInputReady(false);
    setSelectedOptions([]);
    setTextInput("");

    // Determine next step
    const updatedAnswers = step.variableName ? { ...answers, [step.variableName]: answer } : answers;
    let nextIdx: number;
    if (step.branches && step.branches.length > 0) {
      // Re-evaluate with updated answers
      nextIdx = currentStepIdx + 1;
      for (const branch of step.branches) {
        const varVal = branch.variableName === step.variableName ? answer : (updatedAnswers[branch.variableName] || "");
        let matches = false;
        if (branch.operator === "equals") matches = varVal === branch.value;
        else if (branch.operator === "not_equals") matches = varVal !== branch.value;
        else if (branch.operator === "contains") matches = varVal.includes(branch.value);
        if (matches) {
          const targetIdx = flow.steps.findIndex(s => s.id === branch.targetStepId);
          if (targetIdx !== -1) { nextIdx = targetIdx; break; }
        }
      }
    } else {
      nextIdx = currentStepIdx + 1;
    }

    if (nextIdx >= flow.steps.length) {
      // Flow complete — show summary
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

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (history.length === 0) return;
    const prevIdx = history[history.length - 1];
    const prevStep = flow.steps[prevIdx];
    // Clear variable for the step we're going back to
    if (prevStep?.variableName) {
      setAnswers(prev => {
        const next = { ...prev };
        delete next[prevStep.variableName!];
        return next;
      });
    }
    // Remove last rendered messages up to before that step
    setRenderedMessages(prev => prev.filter(m => m.stepId !== prevStep?.id && m.stepId !== currentStep?.id));
    setHistory(prev => prev.slice(0, -1));
    setCurrentStepIdx(prevIdx);
  }, [history, flow.steps, currentStep]);

  // Handle single select
  const handleSingleSelect = useCallback((value: string) => {
    setSelectedOptions([value]);
  }, []);

  // Handle multi select
  const handleMultiSelect = useCallback((value: string) => {
    setSelectedOptions(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  // Handle submit
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
      advanceToNext(val || "(skipped)");
    } else if (step.inputType === "single_select") {
      if (step.required && selectedOptions.length === 0) return;
      const opt = resolveOptions(step).find(o => o.value === selectedOptions[0]);
      advanceToNext(opt ? opt.label : selectedOptions[0] || "(skipped)");
    } else if (step.inputType === "multi_select") {
      if (step.required && selectedOptions.length === 0) return;
      const opts = resolveOptions(step).filter(o => selectedOptions.includes(o.value));
      advanceToNext(opts.map(o => o.label).join(", ") || "(skipped)");
    }
  }, [inputReady, currentStep, textInput, selectedOptions, handleMessageOnlyContinue, advanceToNext, resolveOptions]);

  // Summary rendering
  const summaryText = useMemo(() => {
    const template = flow.summaryTemplate || "";
    if (!template) return "";
    return renderSummaryTemplate(template, answers, flow.optionSets || {});
  }, [flow.summaryTemplate, answers, flow.optionSets]);

  const isContinueDisabled = useMemo(() => {
    if (!inputReady) return true;
    if (!currentStep) return true;
    if (currentStep.inputType === "message_only") return false;
    if (!currentStep.required) return false;
    if (currentStep.inputType === "text_input") return !textInput.trim();
    if (currentStep.inputType === "single_select") return selectedOptions.length === 0;
    if (currentStep.inputType === "multi_select") return selectedOptions.length === 0;
    return false;
  }, [inputReady, currentStep, textInput, selectedOptions]);

  const showSkip = useMemo(() => {
    if (!inputReady) return false;
    if (!currentStep || currentStep.required) return false;
    if (currentStep.inputType === "text_input" && !textInput.trim()) return true;
    if (currentStep.inputType === "single_select" && selectedOptions.length === 0) return true;
    if (currentStep.inputType === "multi_select" && selectedOptions.length === 0) return true;
    return false;
  }, [inputReady, currentStep, textInput, selectedOptions]);

  const stepNumber = currentStepIdx + 1;
  const totalSteps = flow.steps.length;

  if (!loadedFromServer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#010101]">
        <div className="text-[rgba(255,255,255,0.3)] text-sm font-['Afacad']">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#010101] overflow-hidden rounded-tl-[24px] rounded-tr-[24px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            "bg-[rgba(30,30,30,0.72)] backdrop-blur-sm border border-[rgba(255,255,255,0.05)]",
            history.length === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-[rgba(40,40,40,0.8)]"
          )}
          data-testid="button-chat-back"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        <div className="bg-[#202020] px-4 py-[6px] rounded-[36px] flex items-center">
          <span className="font-['Afacad'] font-medium text-[14px] tracking-[2.8px] text-[rgba(255,255,255,0.7)] uppercase">
            {flowComplete ? "Complete" : `Reflection ${stepNumber} of ${totalSteps}`}
          </span>
        </div>

        <button
          onClick={onExit}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(30,30,30,0.72)] backdrop-blur-sm border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,40,0.8)] transition-colors"
          data-testid="button-chat-exit"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4 min-h-0">
        {/* Rendered messages */}
        {renderedMessages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            isNew={i === renderedMessages.length - 1}
          />
        ))}

        {/* Typing indicator */}
        {showTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}

        {/* Options after messages are revealed */}
        {inputReady && !flowComplete && currentStep && (
          <>
            {(currentStep.inputType === "single_select" || currentStep.inputType === "multi_select") && (
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

            {currentStep.inputType === "text_input" && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isContinueDisabled && handleSubmit()}
                  placeholder="Type your answer here..."
                  className="flex-1 h-9 px-3 rounded-[6px] text-[14px] font-['Afacad'] bg-[#181818] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.9)] placeholder-[#71717a] outline-none focus:border-[rgba(255,255,255,0.15)] transition-colors"
                  data-testid="input-chat-text"
                />
                <button
                  onClick={handleSubmit}
                  disabled={currentStep.required && !textInput.trim()}
                  className="w-9 h-9 rounded-[6px] flex items-center justify-center bg-[#18181b] border border-[rgba(255,255,255,0.05)] text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-chat-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Summary card when flow complete */}
        {flowComplete && (
          <div className="relative rounded-[8px] bg-[#09090b] border border-[rgba(255,255,255,0.05)] p-6 overflow-hidden">
            {/* Radial glow */}
            <div
              className="absolute -top-12 -left-12 w-40 h-40 rounded-full pointer-events-none mix-blend-lighten opacity-[0.04]"
              style={{ background: "radial-gradient(circle, #F07830 0%, transparent 70%)" }}
            />
            <p className="font-['Afacad'] text-[13px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-3">
              Your Reflection
            </p>
            {summaryText ? (
              <p className="font-['Afacad'] text-[15px] leading-[22px] text-[rgba(255,255,255,0.85)]">
                {summaryText}
              </p>
            ) : (
              <p className="font-['Afacad'] text-[14px] text-[rgba(255,255,255,0.5)] italic">
                Your answers have been recorded.
              </p>
            )}
          </div>
        )}

        <div ref={chatEndRef} className="h-2" />
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 bg-[#0f1011] border-t border-[rgba(228,228,231,0.06)] px-6 py-8 flex items-center justify-end gap-3">
        {showSkip && (
          <button
            onClick={() => {
              if (currentStep?.inputType === "text_input") setTextInput("");
              if (currentStep?.inputType === "single_select" || currentStep?.inputType === "multi_select") setSelectedOptions([]);
              advanceToNext("(skipped)");
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
                ? (currentStep?.inputType === "message_only" ? handleMessageOnlyContinue : handleSubmit)
                : undefined
            }
            disabled={isContinueDisabled}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[6px] font-['Afacad'] text-[14px] font-medium transition-colors",
              isContinueDisabled
                ? "bg-[#18181b] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] cursor-not-allowed"
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
