import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Check, Plus, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type VarValue = string | string[];

interface InstructionStep {
  id: string;
  kind: "instruction";
  heading: string;
  body: string;
}

interface InputStep {
  id: string;
  kind: "input";
  heading: string;
  prompt: string;
  placeholder?: string;
  variable_name: string;
}

interface ListInputStep {
  id: string;
  kind: "list_input";
  heading: string;
  prompt: string;
  variable_name: string;
  add_button_label?: string;
  placeholder?: string;
  optional?: boolean;
}

interface ChoiceOption {
  label: string;
  next_step: string;
}

interface ChoiceStep {
  id: string;
  kind: "choice";
  heading: string;
  prompt: string;
  variable_name: string;
  options: ChoiceOption[];
}

interface PrayerStep {
  id: string;
  kind: "prayer";
  heading: string;
  instruction_above?: string;
  prayer_text: string;
  show_only_if?: string;
}

interface ReflectionStep {
  id: string;
  kind: "reflection";
  heading: string;
  prompt: string;
  variable_name: string;
  placeholder?: string;
}

type Step = InstructionStep | InputStep | ListInputStep | ChoiceStep | PrayerStep | ReflectionStep;

interface GuidedPrayerConfig {
  title?: string;
  subtitle?: string;
  steps: Step[];
}

interface SavedResponse {
  variables: Record<string, VarValue>;
  completedAt: string;
}

function evaluateCondition(condition: string, vars: Record<string, VarValue>): boolean {
  const m = condition.match(/^(\w+)\.length\s*>\s*(\d+)$/);
  if (m) {
    const [, varName, threshold] = m;
    const val = vars[varName];
    if (Array.isArray(val)) return val.length > parseInt(threshold, 10);
    if (typeof val === "string") return val.trim().length > parseInt(threshold, 10);
    return false;
  }
  return true;
}

function getNextStepId(
  currentId: string,
  steps: Step[],
  vars: Record<string, VarValue>
): string | null {
  const idx = steps.findIndex(s => s.id === currentId);
  if (idx === -1) return null;
  const current = steps[idx];

  if (current.kind === "choice") {
    const chosen = vars[current.variable_name] as string | undefined;
    const opt = current.options.find(o => o.label === chosen);
    if (opt) {
      const target = steps.find(s => s.id === opt.next_step);
      if (target) return target.id;
    }
  }

  let nextIdx = idx + 1;
  while (nextIdx < steps.length) {
    const next = steps[nextIdx];
    if (next.kind === "prayer" && next.show_only_if) {
      if (!evaluateCondition(next.show_only_if, vars)) {
        nextIdx++;
        continue;
      }
    }
    return next.id;
  }

  return null;
}

function formatListInline(items: string[]): string {
  if (items.length === 0) return "...";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

type Segment =
  | { type: "text"; content: string }
  | { type: "inline_var"; content: string }
  | { type: "block_var"; items: string[] };

function parsePrayerSegments(text: string, vars: Record<string, VarValue>): Segment[] {
  const parts = text.split(/({{[^}]+}})/);
  const segments: Segment[] = [];

  for (const part of parts) {
    const match = part.match(/^{{(\w+)}}$/);
    if (!match) {
      if (part) segments.push({ type: "text", content: part });
      continue;
    }
    const val = vars[match[1]];
    if (val == null || (Array.isArray(val) && val.length === 0) || val === "") {
      segments.push({ type: "text", content: "..." });
      continue;
    }
    if (Array.isArray(val) && val.length >= 4) {
      segments.push({ type: "block_var", items: val });
    } else if (Array.isArray(val)) {
      segments.push({ type: "inline_var", content: formatListInline(val) });
    } else {
      segments.push({ type: "inline_var", content: val as string });
    }
  }

  return segments;
}

function PrayerTextRenderer({ text, vars }: { text: string; vars: Record<string, VarValue> }) {
  const segs = parsePrayerSegments(text, vars);
  const hasBlock = segs.some(s => s.type === "block_var");
  const baseClass = "leading-relaxed text-white/90 whitespace-pre-wrap font-serif";

  if (!hasBlock) {
    return (
      <p className={baseClass}>
        {segs.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.content}</span>;
          return (
            <span key={i} className="text-amber-200/95 italic">
              {(seg as { type: "inline_var"; content: string }).content}
            </span>
          );
        })}
      </p>
    );
  }

  const lines: ReactNode[] = [];
  let inline: ReactNode[] = [];

  segs.forEach((seg, i) => {
    if (seg.type === "text") {
      inline.push(<span key={`t-${i}`}>{seg.content}</span>);
    } else if (seg.type === "inline_var") {
      inline.push(
        <span key={`iv-${i}`} className="text-amber-200/95 italic">
          {seg.content}
        </span>
      );
    } else if (seg.type === "block_var") {
      if (inline.length > 0) {
        lines.push(
          <p key={`l-${i}`} className={baseClass}>
            {inline}
          </p>
        );
        inline = [];
      }
      (seg as { type: "block_var"; items: string[] }).items.forEach((item, j) => {
        lines.push(
          <p key={`bi-${i}-${j}`} className={cn(baseClass, "pl-6 italic text-amber-200/90")}>
            {item}
          </p>
        );
      });
    }
  });

  if (inline.length > 0) {
    lines.push(
      <p key="last" className={baseClass}>
        {inline}
      </p>
    );
  }

  return <div className="space-y-1">{lines}</div>;
}

export interface GuidedPrayerProcessSlideProps {
  content: string;
  dayNumber: number;
  contextKey?: string;
  onInteracted?: () => void;
}

export function GuidedPrayerProcessSlide({
  content,
  dayNumber,
  contextKey,
  onInteracted,
}: GuidedPrayerProcessSlideProps) {
  const config = useMemo<GuidedPrayerConfig>(() => {
    try { return JSON.parse(content); } catch { return { steps: [] }; }
  }, [content]);

  const steps = config.steps ?? [];
  const resolvedContextKey = contextKey ?? `gpp-day-${dayNumber}`;

  const queryClient = useQueryClient();

  const { data: savedResponse, isLoading: loadingSaved } = useQuery<SavedResponse | null>({
    queryKey: ["/api/guided-prayer-responses", resolvedContextKey],
    queryFn: async () => {
      const res = await fetch(
        `/api/guided-prayer-responses?contextKey=${encodeURIComponent(resolvedContextKey)}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: (vars: Record<string, VarValue>) =>
      apiRequest("POST", "/api/guided-prayer-responses", {
        contextKey: resolvedContextKey,
        variables: vars,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/guided-prayer-responses", resolvedContextKey],
      });
    },
  });

  const [variables, setVariables] = useState<Record<string, VarValue>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [listItems, setListItems] = useState<string[]>([]);
  const [listInput, setListInput] = useState("");
  const [choiceVal, setChoiceVal] = useState("");
  const [prayerConfirmed, setPrayerConfirmed] = useState(false);

  useEffect(() => {
    if (initialized || loadingSaved) return;
    if (savedResponse?.variables && Object.keys(savedResponse.variables).length > 0) {
      setVariables(savedResponse.variables);
      setShowSummary(true);
      onInteracted?.();
    } else if (steps.length > 0) {
      setHistory([steps[0].id]);
    }
    setInitialized(true);
  }, [savedResponse, loadingSaved, initialized]);

  const currentStepId = history[history.length - 1] ?? "";
  const currentStep = steps.find(s => s.id === currentStepId);
  const currentStepNumber = history.length;
  const totalSteps = steps.length;

  useEffect(() => {
    if (!currentStep) return;
    setPrayerConfirmed(false);
    if (currentStep.kind === "input" || currentStep.kind === "reflection") {
      setTextInput((variables[currentStep.variable_name] as string) ?? "");
    } else if (currentStep.kind === "list_input") {
      setListItems((variables[currentStep.variable_name] as string[]) ?? []);
      setListInput("");
    } else if (currentStep.kind === "choice") {
      setChoiceVal((variables[currentStep.variable_name] as string) ?? "");
    }
  }, [currentStepId]);

  const canContinue = useCallback((): boolean => {
    if (!currentStep) return false;
    switch (currentStep.kind) {
      case "instruction": return true;
      case "input": return textInput.trim().length > 0;
      case "list_input": return currentStep.optional ? true : listItems.length > 0;
      case "choice": return choiceVal.length > 0;
      case "prayer": return prayerConfirmed;
      case "reflection": return textInput.trim().length > 0;
      default: return true;
    }
  }, [currentStep, textInput, listItems, choiceVal, prayerConfirmed]);

  const handleContinue = () => {
    if (!canContinue() || !currentStep) return;

    const newVars = { ...variables };
    if (currentStep.kind === "input" || currentStep.kind === "reflection") {
      if (textInput.trim()) newVars[currentStep.variable_name] = textInput.trim();
    } else if (currentStep.kind === "list_input") {
      newVars[currentStep.variable_name] = listItems;
    } else if (currentStep.kind === "choice") {
      newVars[currentStep.variable_name] = choiceVal;
    }

    setVariables(newVars);

    const nextId = getNextStepId(currentStepId, steps, newVars);
    if (nextId) {
      setHistory(prev => [...prev, nextId]);
    } else {
      setShowSummary(true);
      saveMutation.mutate(newVars);
      onInteracted?.();
    }
  };

  const handleBack = () => {
    if (history.length > 1) setHistory(prev => prev.slice(0, -1));
  };

  const handleRestart = () => {
    if (steps.length > 0) {
      setVariables({});
      setHistory([steps[0].id]);
      setShowSummary(false);
    }
  };

  const addListItem = () => {
    const trimmed = listInput.trim();
    if (!trimmed) return;
    setListItems(prev => [...prev, trimmed]);
    setListInput("");
  };

  const removeListItem = (i: number) => {
    setListItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const isLastStep = !getNextStepId(currentStepId, steps, variables);

  if (loadingSaved || !initialized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  if (showSummary) {
    const varEntries = Object.entries(variables).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0
    );
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 mb-2">
              <Check className="w-7 h-7 text-white" />
            </div>
            <h2 className="type-title text-white">Prayer Complete</h2>
            <p className="type-body text-white/60">
              {config.title ?? "Guided Prayer"} — your responses have been recorded.
            </p>
          </div>

          {varEntries.length > 0 && (
            <div className="space-y-3">
              {varEntries.map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-xl bg-white/10 border border-white/10 p-4 space-y-1"
                  data-testid={`gpp-summary-${key}`}
                >
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                    {key.replace(/_/g, " ")}
                  </p>
                  {Array.isArray(val) ? (
                    <ul className="space-y-0.5">
                      {val.map((item, i) => (
                        <li key={i} className="type-body text-white/80">• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="type-body text-white/80">{val}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full text-white/40 hover:text-white/70 text-sm"
            onClick={handleRestart}
            data-testid="button-gpp-restart"
          >
            Pray this again from the beginning
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStep || steps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <BookOpen className="w-10 h-10 text-white/30 mb-4" />
        <p className="type-body text-white/50">No steps configured for this prayer.</p>
      </div>
    );
  }

  const stepKindLabel =
    currentStep.kind === "prayer"
      ? "Pray"
      : currentStep.kind === "reflection"
      ? "Reflect"
      : currentStep.kind === "instruction"
      ? "Read"
      : currentStep.kind === "choice"
      ? "Choose"
      : "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="guided-prayer-process-slide">
      {/* Progress */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-white/35">
            Step {currentStepNumber} of {totalSteps}
          </span>
        </div>
        <div className="h-1 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/55 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, (currentStepNumber / totalSteps) * 100)}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-lg mx-auto space-y-5">
          <div>
            {stepKindLabel && (
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1">
                {stepKindLabel}
              </p>
            )}
            <h2 className="type-title text-white">{currentStep.heading}</h2>
          </div>

          {currentStep.kind === "instruction" && (
            <div className="type-body text-white/80 whitespace-pre-wrap leading-relaxed">
              {currentStep.body}
            </div>
          )}

          {(currentStep.kind === "input" || currentStep.kind === "reflection") && (
            <div className="space-y-3">
              <p className="type-body text-white/70 leading-relaxed">{currentStep.prompt}</p>
              <Textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={currentStep.placeholder ?? "Write here..."}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 min-h-[110px] resize-none focus-visible:ring-white/30"
                data-testid={`textarea-gpp-${currentStep.variable_name}`}
              />
            </div>
          )}

          {currentStep.kind === "list_input" && (
            <div className="space-y-3">
              <p className="type-body text-white/70 leading-relaxed">{currentStep.prompt}</p>
              {listItems.length > 0 && (
                <ul className="space-y-2">
                  {listItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg bg-white/10 border border-white/10 px-3 py-2.5"
                    >
                      <span className="flex-1 type-body text-white/80">{item}</span>
                      <button
                        onClick={() => removeListItem(i)}
                        className="text-white/35 hover:text-white/65 shrink-0 mt-0.5"
                        data-testid={`button-gpp-remove-${i}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={listInput}
                  onChange={e => setListInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); addListItem(); }
                  }}
                  placeholder={currentStep.placeholder ?? "Add an item..."}
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/25"
                  data-testid={`input-gpp-list-${currentStep.variable_name}`}
                />
                <button
                  onClick={addListItem}
                  disabled={!listInput.trim()}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-sm text-white font-medium transition-colors"
                  data-testid="button-gpp-add-item"
                >
                  <Plus className="w-4 h-4" />
                  {currentStep.add_button_label ?? "Add"}
                </button>
              </div>
              {currentStep.optional && listItems.length === 0 && (
                <p className="text-[12px] text-white/35 italic">
                  Optional — you may skip if this doesn't apply.
                </p>
              )}
            </div>
          )}

          {currentStep.kind === "choice" && (
            <div className="space-y-3">
              <p className="type-body text-white/70 leading-relaxed">{currentStep.prompt}</p>
              <div className="space-y-2">
                {currentStep.options.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setChoiceVal(opt.label)}
                    className={cn(
                      "w-full text-left rounded-xl px-4 py-3 type-body transition-all",
                      choiceVal === opt.label
                        ? "bg-white/25 text-white ring-2 ring-white/40"
                        : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                    )}
                    data-testid={`button-gpp-choice`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep.kind === "prayer" && (
            <div className="space-y-4">
              {currentStep.instruction_above && (
                <p className="text-[13px] italic text-white/50">
                  {currentStep.instruction_above}
                </p>
              )}
              <div className="rounded-xl bg-white/8 border border-white/15 p-5">
                <PrayerTextRenderer text={currentStep.prayer_text} vars={variables} />
              </div>
              <button
                onClick={() => setPrayerConfirmed(p => !p)}
                className={cn(
                  "flex items-center gap-2.5 text-[13px] font-medium transition-colors",
                  prayerConfirmed ? "text-emerald-300" : "text-white/45 hover:text-white/75"
                )}
                data-testid="button-gpp-prayer-confirm"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    prayerConfirmed
                      ? "border-emerald-400 bg-emerald-400/20"
                      : "border-white/30"
                  )}
                >
                  {prayerConfirmed && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                I have prayed this prayer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 pt-3 shrink-0 flex items-center gap-3">
        {history.length > 1 && (
          <Button
            variant="ghost"
            className="text-white/45 hover:text-white/75 hover:bg-white/10"
            onClick={handleBack}
            data-testid="button-gpp-back"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            Back
          </Button>
        )}
        <Button
          className={cn(
            "flex-1 h-12 font-medium transition-all",
            canContinue()
              ? "bg-white text-gray-900 hover:bg-white/90"
              : "bg-white/15 text-white/35 cursor-not-allowed"
          )}
          disabled={!canContinue()}
          onClick={handleContinue}
          data-testid="button-gpp-continue"
        >
          {isLastStep ? "Complete Prayer" : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
