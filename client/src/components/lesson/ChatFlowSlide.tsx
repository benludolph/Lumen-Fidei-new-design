import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Send, RotateCw, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import candleBg from "@assets/OilPaintingBG_1774227836014.webp";
import bgMusicSrc from "@assets/BG_Msic_1774239770169.mp3";

// ============================================================
// Schema Types
// ============================================================

/** Rich (new) schema — set via JSON with `type` on each step */
interface RichStepOption { id: string; text: string; }
type RichMessage = string | { text: string; audio?: string };
interface RichStep {
  id?: string;
  type?: "narrator" | "single_select" | "open_text" | "final";
  content?: string;
  messages?: RichMessage[];
  question?: string;
  questionAudio?: string;
  options?: RichStepOption[];
  allow_other?: boolean;
  other_placeholder?: string;
  variable?: string;
  required?: boolean;
  branch_reflections?: Record<string, string>;
  branches?: Record<string, RichStep[]>;
  dynamic_reflection?: { template: string; references?: string[] };
}

/** Legacy schema — existing format with inputType / variableName / etc. */
interface LegacyOption { label: string; value: string; }
interface LegacyBranchCond {
  variableName: string;
  operator: "equals" | "not_equals" | "contains";
  value: string;
  targetStepId: string;
}
interface LegacyStep {
  id?: string;
  messages?: string[];
  inputType?: "single_select" | "multi_select" | "text_input" | "message_only";
  options?: LegacyOption[];
  optionSetVar?: string;
  optionSetMap?: Record<string, string>;
  variableName?: string;
  required?: boolean;
  branches?: LegacyBranchCond[];
}

/** Normalized internal step — both schemas reduce to this */
interface NStep {
  id: string;
  messages: string[];
  messageAudios: (string | null)[];
  dynamicReflectionTemplate: string | null;
  inputType: "none" | "single_select" | "multi_select" | "text_input";
  options: Array<{ id: string; label: string; value: string }>;
  allowOther: boolean;
  otherPlaceholder: string;
  variable: string;
  required: boolean;
  /** Rich format: option value/id → array of NSteps to prepend when that option is chosen */
  branchSteps: Record<string, NStep[]>;
  /** Rich format: option value/id → reflection text to show after answer */
  branchReflections: Record<string, string>;
  /** Legacy format: evaluated in order; first match sets nextQueue from targetStepId */
  legacyBranches: LegacyBranchCond[];
  isFinal: boolean;
}

interface RenderedMessage {
  id: string;
  role: "system" | "user";
  text: string;
  stepId: string;
  isAfterUser: boolean;
}

/** Snapshot stored before each step's answer — used for rewind */
interface FlowSnapshot {
  queue: NStep[];
  renderedMessages: RenderedMessage[];
  answers: Record<string, string>;
}

interface ChatFlowSlideProps {
  content: string;
  contextKey: string;
  totalSlides: number;
  slideIndex: number;
  mentorPhotoUrl?: string | null;
  mentorName?: string | null;
  onComplete: () => void;
  onExit: () => void;
}

// ============================================================
// Normalization helpers
// ============================================================

let _idSeed = 0;
function uid() { return `__${++_idSeed}`; }
function slug(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || uid();
}

function normalizeRichStep(raw: RichStep, fallbackIdx: number): NStep {
  const id = raw.id || `step_${fallbackIdx + 1}`;
  const msgs: string[] = [];
  const msgAudios: (string | null)[] = [];

  if (raw.content) { msgs.push(raw.content); msgAudios.push(null); }
  if (Array.isArray(raw.messages)) {
    for (const m of raw.messages) {
      if (typeof m === "string") { msgs.push(m); msgAudios.push(null); }
      else { msgs.push(m.text || ""); msgAudios.push(m.audio || null); }
    }
  }
  if (raw.question && !msgs.includes(raw.question)) { msgs.push(raw.question); msgAudios.push(raw.questionAudio || null); }

  let inputType: NStep["inputType"] = "none";
  let options: NStep["options"] = [];

  if (raw.type === "single_select") {
    inputType = "single_select";
    options = (raw.options || []).map(o => ({
      id: o.id || slug(o.text || ""),
      label: o.text || o.id || "",
      value: o.id || slug(o.text || ""),
    }));
  } else if (raw.type === "open_text") {
    inputType = "text_input";
  }

  const branchSteps: NStep["branchSteps"] = {};
  if (raw.branches && typeof raw.branches === "object" && !Array.isArray(raw.branches)) {
    for (const [key, steps] of Object.entries(raw.branches)) {
      branchSteps[key] = (steps as RichStep[]).map((s, i) => normalizeRichStep(s, i));
    }
  }

  return {
    id,
    messages: msgs.length > 0 ? msgs : [""],
    messageAudios: msgs.length > 0 ? msgAudios : [null],
    dynamicReflectionTemplate: raw.dynamic_reflection?.template || null,
    inputType,
    options,
    allowOther: !!raw.allow_other,
    otherPlaceholder: raw.other_placeholder || "Type your response…",
    variable: raw.variable || "",
    required: raw.required !== false,
    branchSteps,
    branchReflections: raw.branch_reflections || {},
    legacyBranches: [],
    isFinal: raw.type === "final",
  };
}

function normalizeLegacyStep(raw: LegacyStep, idx: number): NStep {
  const msgs = Array.isArray(raw.messages) ? raw.messages.map(String) : [""];
  let inputType: NStep["inputType"] = "none";
  if (raw.inputType === "single_select") inputType = "single_select";
  else if (raw.inputType === "multi_select") inputType = "multi_select";
  else if (raw.inputType === "text_input") inputType = "text_input";

  const options: NStep["options"] = (raw.options || []).map(o => ({
    id: o.value, label: o.label, value: o.value,
  }));

  return {
    id: raw.id || `step_${idx + 1}`,
    messages: msgs.length > 0 ? msgs : [""],
    messageAudios: (msgs.length > 0 ? msgs : [""]).map(() => null),
    dynamicReflectionTemplate: null,
    inputType,
    options,
    allowOther: false,
    otherPlaceholder: "Type your response…",
    variable: raw.variableName || "",
    required: !!raw.required,
    branchSteps: {},
    branchReflections: {},
    legacyBranches: raw.branches || [],
    isFinal: false,
  };
}

/** Parse raw JSON content string → flat NStep[] (base list) and optionSets */
function parseFlow(content: string): {
  flatSteps: NStep[];
  optionSets: Record<string, LegacyOption[]>;
  summaryTemplate: string;
  isRich: boolean;
} {
  try {
    const p = JSON.parse(content || "{}");
    const rawSteps: any[] = Array.isArray(p.steps) ? p.steps : [];
    const isRich = rawSteps.some((s: any) => "type" in s || "content" in s || "question" in s);
    const flatSteps = isRich
      ? rawSteps.map((s, i) => normalizeRichStep(s, i))
      : rawSteps.map((s, i) => normalizeLegacyStep(s, i));
    return {
      flatSteps,
      optionSets: p.optionSets || {},
      summaryTemplate: p.summaryTemplate || "",
      isRich,
    };
  } catch {
    return { flatSteps: [], optionSets: {}, summaryTemplate: "", isRich: false };
  }
}

// ============================================================
// Template rendering: supports both {var} and {{var}} syntax
// ============================================================

function renderTemplate(template: string, answers: Record<string, string>): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, k) => answers[k] ?? "")
    .replace(/\{(\w+)\}/g, (_, k) => answers[k] ?? "");
}

function renderSummaryTemplate(
  template: string,
  answers: Record<string, string>,
  optionsByVar: Record<string, Array<{ label: string; value: string }>>,
): string {
  const resolved: Record<string, string> = {};
  for (const [varName, storedValue] of Object.entries(answers)) {
    if (!storedValue) { resolved[varName] = ""; continue; }
    const opts = optionsByVar[varName];
    if (opts?.length) {
      const values = storedValue.split(",").map(v => v.trim()).filter(Boolean);
      resolved[varName] = values.map(v => opts.find(o => o.value === v)?.label ?? v).join(", ");
    } else {
      resolved[varName] = storedValue;
    }
  }
  const clauses = Array.from(template.matchAll(/[^.!?]+[.!?]*/g), m => m[0]);
  if (!clauses.length) return template;
  return clauses
    .filter(c => c.trim())
    .filter(c => {
      const tokens = Array.from(c.matchAll(/\{\{?(\w+)\}?\}/g), m => m[1]);
      return !tokens.some(t => (resolved[t] ?? "") === "");
    })
    .map(c => c.replace(/\{\{?(\w+)\}?\}/g, (_, k) => resolved[k] ?? "").trim())
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ============================================================
// Timing helpers
// ============================================================

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ============================================================
// Typing indicator
// ============================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-[6px] w-[52px]" style={{ background: "var(--surface-float)" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--white-40)] animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Message bubble
// ============================================================

function MentorAvatar({ size = 28 }: { photoUrl?: string | null; name?: string | null; size?: number }) {
  const fontSize = Math.max(10, Math.round(size * 0.38));
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--surface-float)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize,
        fontWeight: 600,
        color: "var(--white-60, rgba(255,255,255,0.6))",
        letterSpacing: "0.02em",
      }}
    >
      M
    </div>
  );
}

function MessageBubble({
  role, text, isNew, onRewind, showAvatar, isCompact,
}: {
  role: "system" | "user";
  text: string;
  isNew?: boolean;
  onRewind?: () => void;
  showAvatar?: boolean;
  isCompact?: boolean;
}) {
  const [visible, setVisible] = useState(!isNew);
  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div
      className={cn(
        "flex items-end gap-[8px]",
        role === "system" ? "justify-start" : "justify-end",
        "transition-opacity ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        transitionDuration: "220ms",
        marginTop: isCompact ? "-12px" : undefined,
      }}
    >
      {role === "user" && onRewind && (
        <button
          onClick={onRewind}
          className="shrink-0 transition-colors"
          style={{ color: "var(--white-30)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--white-70)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--white-30)"}
          data-testid="button-chat-rewind"
          title="Go back and change answer"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      )}
      <div
        className={cn(
          "px-3 py-2 rounded-[6px] type-body-md leading-[20px]",
          role === "system" ? "max-w-[210px]" : "max-w-[270px]",
        )}
        style={{
          background: role === "system" ? "var(--surface-float)" : "#4c2913",
          color: "var(--white-90)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ============================================================
// Option button
// ============================================================

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-3 py-2 rounded-[6px] type-body-md leading-[20px] border transition-colors"
      style={selected ? {
        background: "#4c2913",
        borderColor: "#4c2913",
        color: "var(--white-90)",
      } : {
        background: "var(--surface-float)",
        borderColor: "var(--white-8)",
        color: "var(--white-70)",
      }}
      data-testid={`button-chat-option-${label}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// Main ChatFlowSlide component
// ============================================================

export function ChatFlowSlide({ content, contextKey, totalSlides, slideIndex, mentorPhotoUrl, mentorName, onComplete, onExit }: ChatFlowSlideProps) {

  // ── Parse & normalize flow definition ──
  const { flatSteps, optionSets, summaryTemplate, isRich } = useMemo(
    () => parseFlow(content),
    [content],
  );

  // Build optionsByVar for legacy summary label lookup
  const optionsByVar = useMemo<Record<string, LegacyOption[]>>(() => {
    const map: Record<string, LegacyOption[]> = {};
    for (const step of flatSteps) {
      if (!step.variable) continue;
      if (step.options.length > 0) {
        map[step.variable] = step.options.map(o => ({ label: o.label, value: o.value }));
      }
    }
    // Also include legacy optionSets
    for (const [, opts] of Object.entries(optionSets)) {
      // legacy only — variable association happens at step level above
    }
    return map;
  }, [flatSteps, optionSets]);

  // ── Video asset at top of chat card ──
  const videoUrl = useMemo(() => {
    try { return (JSON.parse(content || "{}") as { videoUrl?: string }).videoUrl || null; }
    catch { return null; }
  }, [content]);

  // ── Ambient music ──
  useEffect(() => {
    const audio = new Audio(bgMusicSrc);
    audio.loop = true;
    audio.volume = 0.12;
    const p = audio.play();
    return () => { p?.then(() => audio.pause()).catch(() => audio.pause()); };
  }, []);

  // ── Runtime state ──
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<NStep[]>([]);               // remaining steps (current = queue[0])
  const [historyStack, setHistoryStack] = useState<FlowSnapshot[]>([]); // for rewind
  const [renderedMessages, setRenderedMessages] = useState<RenderedMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [inputReady, setInputReady] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [otherText, setOtherText] = useState("");       // "Other" text when allowOther
  const [flowComplete, setFlowComplete] = useState(false);
  const [isRestoredFlow, setIsRestoredFlow] = useState(false);
  const [loadedFromServer, setLoadedFromServer] = useState(false);

  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredCompletionRef = useRef(false);
  const revealCancelRef = useRef(false);
  const skipRevealRef = useRef(false);
  const hasUserMessageRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  // Keep answers in a ref so reveal closures see the latest value
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const currentStep = queue[0] ?? null;

  // ── Load saved answers from server ──
  useEffect(() => {
    apiRequest("GET", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`)
      .then(async res => {
        const data = await res.json();
        if (data && typeof data === "object") {
          setAnswers(data as Record<string, string>);
          if ((data as Record<string, string>).__flow_complete === "1") {
            restoredCompletionRef.current = true;
            setIsRestoredFlow(true);
            setFlowComplete(true);
          }
        }
        setLoadedFromServer(true);
      })
      .catch(() => setLoadedFromServer(true));
  }, [contextKey]);

  // ── Initialize queue once server load is done ──
  useEffect(() => {
    if (!loadedFromServer || flowComplete) return;
    setQueue(flatSteps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedFromServer]);


  // ── Auto-scroll (messages / typing / input state) ──
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, [renderedMessages, showTyping, inputReady]);

  // ── Auto-scroll when flow completes (summary card needs extra time to lay out) ──
  useEffect(() => {
    if (!flowComplete) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const id = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 120);
    return () => clearTimeout(id);
  }, [flowComplete]);

  // ── Save answer to state + server ──
  const saveAnswer = useCallback(async (variableName: string, value: string) => {
    setAnswers(prev => ({ ...prev, [variableName]: value }));
    answersRef.current = { ...answersRef.current, [variableName]: value };
    if (!value) return;
    try {
      await apiRequest("POST", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`, {
        variableName,
        answer: value,
      });
    } catch { /* non-blocking */ }
  }, [contextKey]);

  const clearAnswer = useCallback(async (variableName: string) => {
    setAnswers(prev => { const n = { ...prev }; delete n[variableName]; return n; });
    try {
      await apiRequest("POST", `/api/chat-flow-responses/${encodeURIComponent(contextKey)}`, {
        variableName, answer: "",
      });
    } catch { /* non-blocking */ }
  }, [contextKey]);

  // ── Reveal messages for a given NStep ──
  const revealMessagesForStep = useCallback((step: NStep, msgStartId: number, narratorMode: boolean) => {
    revealCancelRef.current = false;

    const schedule = (fn: () => void, ms: number) => {
      revealTimer.current = setTimeout(() => {
        if (revealCancelRef.current) return;
        fn();
      }, ms);
    };

    // Build full message list: static messages + optional dynamic reflection
    const buildMessages = (): string[] => {
      const msgs = [...step.messages];
      if (step.dynamicReflectionTemplate) {
        const rendered = renderTemplate(step.dynamicReflectionTemplate, answersRef.current);
        msgs.push(rendered);
      }
      return msgs;
    };

    const reveal = (msgIdx: number, messages: string[]) => {
      if (revealCancelRef.current) return;
      if (msgIdx >= messages.length) {
        if (!narratorMode) setShowTyping(false);
        schedule(() => { setInputReady(true); }, narratorMode ? rand(200, 400) : rand(400, 600));
        return;
      }

      if (narratorMode) {
        // Narrator: no typing indicator — just show message, then play audio (or breath delay)
        schedule(() => {
          setRenderedMessages(prev => [
            ...prev,
            { id: `msg-${msgStartId + msgIdx}`, role: "system", text: messages[msgIdx], stepId: step.id, isAfterUser: false },
          ]);
          const audioUrl = step.messageAudios[msgIdx];
          if (audioUrl) {
            // Stop any previous clip
            if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
            const clip = new Audio(audioUrl);
            activeAudioRef.current = clip;
            clip.play().catch(() => {});
            const onEnd = () => {
              if (revealCancelRef.current) return;
              activeAudioRef.current = null;
              // Small breath after audio ends, then next
              schedule(() => reveal(msgIdx + 1, messages), rand(200, 400));
            };
            clip.addEventListener("ended", onEnd, { once: true });
          } else {
            schedule(() => reveal(msgIdx + 1, messages), rand(350, 550));
          }
        }, msgIdx === 0 ? rand(150, 300) : rand(350, 550));
      } else {
        // Mentor (post-answer): typing indicator then message; still plays audio if clip available
        setShowTyping(true);
        schedule(() => {
          setShowTyping(false);
          setRenderedMessages(prev => [
            ...prev,
            { id: `msg-${msgStartId + msgIdx}`, role: "system", text: messages[msgIdx], stepId: step.id, isAfterUser: true },
          ]);
          const audioUrl = step.messageAudios[msgIdx];
          if (audioUrl) {
            if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
            const clip = new Audio(audioUrl);
            activeAudioRef.current = clip;
            clip.play().catch(() => {});
            const onEnd = () => {
              if (revealCancelRef.current) return;
              activeAudioRef.current = null;
              schedule(() => reveal(msgIdx + 1, messages), rand(200, 400));
            };
            clip.addEventListener("ended", onEnd, { once: true });
          } else {
            schedule(() => reveal(msgIdx + 1, messages), rand(450, 700));
          }
        }, rand(850, 1200));
      }
    };

    reveal(0, buildMessages());
  }, []);

  // ── Start revealing when queue[0] changes ──
  useEffect(() => {
    if (!loadedFromServer) return;
    if (!currentStep) return;
    if (flowComplete) return;

    if (revealTimer.current) clearTimeout(revealTimer.current);

    if (skipRevealRef.current) {
      skipRevealRef.current = false;
      setInputReady(true);
      setShowTyping(false);
      return;
    }

    setInputReady(false);
    setShowTyping(false);

    // Pre-populate input with saved answer
    const saved = currentStep.variable ? (answers[currentStep.variable] || "") : "";
    if (currentStep.inputType === "single_select" || currentStep.inputType === "multi_select") {
      setSelectedOptions(saved ? saved.split(",").map(v => v.trim()).filter(Boolean) : []);
    } else {
      setTextInput(saved);
    }
    setOtherText("");

    const msgStartId = renderedMessages.length;
    const narratorMode = !hasUserMessageRef.current;
    revealMessagesForStep(currentStep, msgStartId, narratorMode);

    return () => {
      revealCancelRef.current = true;
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, loadedFromServer, flowComplete]);

  // ── Advance to next step ──
  const advanceToNext = useCallback((value: string, displayText: string) => {
    const step = currentStep;
    if (!step) return;

    if (step.variable) saveAnswer(step.variable, value);

    setInputReady(false);
    setSelectedOptions([]);
    setTextInput("");
    setOtherText("");

    // Snapshot BEFORE this answer (for rewind)
    const snapshot: FlowSnapshot = { queue: [...queue], renderedMessages, answers };

    // Compute next queue
    let nextQueue: NStep[] = queue.slice(1);

    if (isRich) {
      // Rich: check object-keyed branches
      const branchArr = step.branchSteps[value] || step.branchSteps["*"] || [];
      if (branchArr.length > 0) {
        nextQueue = [...branchArr, ...nextQueue];
      }
      // Check branch_reflections → inject narrator step
      const reflection = step.branchReflections[value] || step.branchReflections["*"] || "";
      if (reflection) {
        const reflStep: NStep = {
          id: `__refl_${Date.now()}`,
          messages: [reflection],
          dynamicReflectionTemplate: null,
          inputType: "none",
          options: [],
          allowOther: false,
          otherPlaceholder: "",
          variable: "",
          required: false,
          branchSteps: {},
          branchReflections: {},
          legacyBranches: [],
          isFinal: false,
        };
        nextQueue = [reflStep, ...nextQueue];
      }
    } else {
      // Legacy: evaluate linear branch conditions
      if (step.legacyBranches.length > 0) {
        const updatedAnswers = step.variable
          ? { ...answers, [step.variable]: value }
          : answers;
        for (const branch of step.legacyBranches) {
          const varVal = branch.variableName === step.variable
            ? value
            : (updatedAnswers[branch.variableName] || "");
          let matches = false;
          if (branch.operator === "equals") matches = varVal === branch.value;
          else if (branch.operator === "not_equals") matches = varVal !== branch.value;
          else if (branch.operator === "contains") matches = varVal.includes(branch.value);
          if (matches) {
            const targetIdx = flatSteps.findIndex(s => s.id === branch.targetStepId);
            if (targetIdx !== -1) {
              nextQueue = flatSteps.slice(targetIdx);
              break;
            }
          }
        }
      }
    }

    const willComplete = nextQueue.length === 0 || step.isFinal;
    const capturedSnapshot = snapshot;

    revealCancelRef.current = true;
    if (revealTimer.current) clearTimeout(revealTimer.current);

    const userBubbleDelay = rand(150, 250);
    const preResponseDelay = rand(400, 700);

    const doAdvance = () => {
      if (willComplete) {
        setFlowComplete(true);
        saveAnswer("__flow_complete", "1");
      } else {
        setHistoryStack(prev => [...prev, capturedSnapshot]);
        setQueue(nextQueue);
      }
    };

    if (displayText) {
      revealTimer.current = setTimeout(() => {
        hasUserMessageRef.current = true;
        setRenderedMessages(prev => [
          ...prev,
          { id: `user-${Date.now()}`, role: "user", text: displayText, stepId: step.id, isAfterUser: false },
        ]);
        revealTimer.current = setTimeout(doAdvance, preResponseDelay);
      }, userBubbleDelay);
    } else {
      revealTimer.current = setTimeout(doAdvance, preResponseDelay);
    }
  }, [currentStep, queue, renderedMessages, answers, flatSteps, isRich, saveAnswer]);

  // ── Message-only continue ──
  const handleMessageOnlyContinue = useCallback(() => {
    const step = currentStep;
    if (!step) return;
    if (step.isFinal || queue.slice(1).length === 0) {
      setFlowComplete(true);
      saveAnswer("__flow_complete", "1");
      return;
    }
    const snapshot: FlowSnapshot = { queue: [...queue], renderedMessages, answers };
    setHistoryStack(prev => [...prev, snapshot]);
    setQueue(queue.slice(1));
  }, [currentStep, queue, renderedMessages, answers, saveAnswer]);

  // ── Rewind via snapshot ──
  const handleRewind = useCallback((targetStepId: string) => {
    // Find the snapshot where queue[0].id === targetStepId
    const snapIdx = historyStack.findIndex(s => s.queue[0]?.id === targetStepId);
    if (snapIdx === -1) return;

    const snap = historyStack[snapIdx];

    // Clear server answers for variables answered after the snapshot
    const snapshotVars = new Set(Object.keys(snap.answers));
    const currentVars = Object.keys(answers);
    for (const v of currentVars) {
      if (!snapshotVars.has(v)) clearAnswer(v);
    }

    revealCancelRef.current = true;
    if (revealTimer.current) clearTimeout(revealTimer.current);

    hasUserMessageRef.current = snap.renderedMessages.some(m => m.role === "user");
    setAnswers(snap.answers);
    setRenderedMessages(snap.renderedMessages);
    setQueue(snap.queue);
    setHistoryStack(prev => prev.slice(0, snapIdx));
    setFlowComplete(false);
    setSelectedOptions([]);
    setTextInput("");
    setOtherText("");
    setInputReady(false);
    setShowTyping(false);
    skipRevealRef.current = true;
  }, [historyStack, answers, clearAnswer]);

  // ── Redo (restart flow) ──
  const handleRedo = useCallback(() => {
    saveAnswer("__flow_complete", "0");
    restoredCompletionRef.current = false;
    setIsRestoredFlow(false);
    setFlowComplete(false);
    setQueue(flatSteps);
    setHistoryStack([]);
    setRenderedMessages([]);
    setAnswers({});
    setSelectedOptions([]);
    setTextInput("");
    setOtherText("");
  }, [flatSteps, saveAnswer]);

  // ── Single select: tap → auto-advance ──
  const handleSingleSelectAndAdvance = useCallback((opt: { id: string; label: string; value: string }) => {
    if (!inputReady || !currentStep) return;
    advanceToNext(opt.value, opt.label);
  }, [inputReady, currentStep, advanceToNext]);

  const handleMultiSelect = useCallback((value: string) => {
    setSelectedOptions(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  }, []);

  // ── Submit (message_only / text_input / multi_select / flowComplete) ──
  const handleSubmit = useCallback(() => {
    if (flowComplete) { onComplete(); return; }
    if (!inputReady) return;
    const step = currentStep;
    if (!step) return;

    if (step.inputType === "none" || step.inputType === "text_input" && step.allowOther && otherText.trim()) {
      // message_only or "other" text submitted
      if (step.inputType === "none") {
        handleMessageOnlyContinue();
        return;
      }
    }

    if (step.allowOther && otherText.trim()) {
      // User typed in "Other" field
      advanceToNext(otherText.trim(), otherText.trim());
      return;
    }

    if (step.inputType === "text_input") {
      const val = textInput.trim();
      if (step.required && !val) return;
      advanceToNext(val, val);
    } else if (step.inputType === "multi_select") {
      if (step.required && selectedOptions.length === 0) return;
      const labels = selectedOptions
        .map(v => currentStep.options.find(o => o.value === v)?.label || v)
        .filter(Boolean);
      advanceToNext(selectedOptions.join(","), labels.join(", "));
    } else if (step.inputType === "none") {
      handleMessageOnlyContinue();
    }
  }, [flowComplete, onComplete, inputReady, currentStep, textInput, selectedOptions, otherText, handleMessageOnlyContinue, advanceToNext]);

  // ── Resolve options for legacy dynamic option sets ──
  const resolveOptions = useCallback((step: NStep) => {
    if (step.options.length > 0) return step.options;
    // Legacy: optionSetVar lookup — not stored in NStep, handled in legacy normalize
    return [];
  }, []);

  // ── Derived values ──
  const summaryText = useMemo(() => {
    if (!summaryTemplate) return "";
    return renderSummaryTemplate(summaryTemplate, answers, optionsByVar);
  }, [summaryTemplate, answers, optionsByVar]);

  const showOtherInput = inputReady && !!currentStep?.allowOther;
  const showTextInputField = inputReady && !flowComplete && currentStep?.inputType === "text_input" && !currentStep.allowOther;
  const showSendButton = (
    flowComplete ||
    (inputReady && currentStep && (
      currentStep.inputType === "text_input" ||
      currentStep.inputType === "multi_select" ||
      (currentStep.inputType === "none" && !flowComplete) ||
      currentStep.allowOther
    ))
  );
  const isSendDisabled = useMemo(() => {
    if (flowComplete) return false;
    if (!inputReady || !currentStep) return true;
    if (currentStep.inputType === "none") return false;
    if (!currentStep.required) return false;
    if (currentStep.allowOther) return !otherText.trim() && !selectedOptions.length;
    if (currentStep.inputType === "text_input") return !textInput.trim();
    if (currentStep.inputType === "multi_select") return selectedOptions.length === 0;
    return false;
  }, [flowComplete, inputReady, currentStep, textInput, selectedOptions, otherText]);

  const stepNumber = historyStack.length + 1;
  const totalSteps = flatSteps.length;

  // ── Loading state ──
  if (!loadedFromServer) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--surface-base)" }}>
        <div className="flex-1 relative overflow-hidden" style={{ background: "var(--surface-ground)", borderRadius: "24px 24px 0 0" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="type-body-sm" style={{ color: "var(--white-30)" }}>Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--surface-base)" }}>

      {/* ── Header ── */}
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
        <div className="w-[42px] h-[42px] shrink-0" />

        <div className="flex items-center justify-center" style={{ width: "168px" }}>
          <div
            className="flex items-center justify-center px-4 py-3"
            style={{
              background: "var(--surface-float)",
              borderRadius: "36px",
              maxHeight: "42px",
            }}
          >
            <span
              className="type-caption-md whitespace-nowrap"
              style={{ color: "#efefef", lineHeight: "18px" }}
            >
              {flowComplete ? "COMPLETE" : "REFLECTION"}
            </span>
            {!flowComplete && (
              <span
                className="type-body-sm whitespace-nowrap pl-2"
                style={{ color: "#8b8b8b", lineHeight: "18px" }}
              >
                {stepNumber} of {totalSteps}
              </span>
            )}
          </div>
        </div>

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

      {/* ── Content area ── */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <img src={candleBg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.6 }} />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 10.822%, rgb(0,0,0) 27.813%, rgb(0,0,0) 72.453%, rgba(0,0,0,0) 90.68%)",
            }}
          />
        </div>

        <div
          className="flex-1 overflow-auto flex flex-col items-center relative pt-4 px-4"
        >
          <div
            className="flex-1 flex flex-col overflow-hidden relative w-full"
            style={{
              maxWidth: "640px",
              background: "var(--surface-ground)",
              border: "1px solid var(--white-5)",
              borderRadius: "8px 8px 0 0",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
            }}
          >
            {/* ── Looping video asset at top ── */}
            {videoUrl && (
              <div className="shrink-0 relative overflow-hidden" style={{ aspectRatio: "590 / 181" }}>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  loop
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover block"
                />
                <button
                  onClick={() => setIsMuted(m => !m)}
                  className="absolute bottom-2 right-2 flex items-center justify-center rounded-full transition-opacity hover:opacity-100 opacity-60"
                  style={{
                    width: "28px", height: "28px",
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(6px)",
                    color: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  title={isMuted ? "Unmute video" : "Mute video"}
                  data-testid="button-chat-video-mute"
                >
                  {isMuted
                    ? <VolumeX className="w-3 h-3" />
                    : <Volume2 className="w-3 h-3" />
                  }
                </button>
              </div>
            )}

            {/* Messages list */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0"
              style={{ scrollbarWidth: "none", padding: "24px 24px 0" }}
            >
              {renderedMessages.map((msg, i) => {
                const prev = renderedMessages[i - 1];
                const isFirstInStep = !prev || prev.role !== "system" || prev.stepId !== msg.stepId;
                const showAvatar = msg.role === "system" && isFirstInStep && msg.isAfterUser;
                const isCompact = msg.role === "system" && !isFirstInStep;
                return (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    isNew={i === renderedMessages.length - 1}
                    showAvatar={showAvatar}
                    isCompact={isCompact}
                    onRewind={
                      msg.role === "user" && msg.stepId && !msg.stepId.startsWith("__refl")
                        ? () => handleRewind(msg.stepId)
                        : undefined
                    }
                  />
                );
              })}

              {showTyping && (
                <div className="flex items-end justify-start">
                  <TypingIndicator />
                </div>
              )}

              {/* Option buttons */}
              {inputReady && !flowComplete && currentStep &&
                (currentStep.inputType === "single_select" || currentStep.inputType === "multi_select") && (
                <div className="grid grid-cols-2 gap-2">
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
                  {/* allow_other text field */}
                  {showOtherInput && currentStep.inputType === "single_select" && (
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        type="text"
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && otherText.trim() && advanceToNext(otherText.trim(), otherText.trim())}
                        placeholder={currentStep.otherPlaceholder || "Or type your own…"}
                        className="flex-1 px-3 rounded-[6px] type-body-md outline-none transition-colors"
                        style={{ height: "36px", background: "var(--surface-float)", border: "1px solid var(--white-5)", color: "var(--white-90)" }}
                        data-testid="input-chat-other"
                      />
                      <button
                        onClick={() => otherText.trim() && advanceToNext(otherText.trim(), otherText.trim())}
                        disabled={!otherText.trim()}
                        className="flex items-center justify-center rounded-[6px] transition-colors shrink-0 disabled:opacity-30"
                        style={{ width: "36px", height: "36px", background: "var(--surface-float)", border: "1px solid var(--white-5)", color: "var(--white-70)" }}
                        data-testid="button-chat-other-send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Summary card when complete */}
              {flowComplete && (
                <div
                  className="relative overflow-hidden"
                  style={{
                    background: "var(--surface-base)",
                    border: "1px solid var(--white-5)",
                    borderRadius: "6px",
                    padding: "20px",
                  }}
                >
                  <div
                    className="absolute pointer-events-none mix-blend-lighten"
                    style={{
                      top: "-48px", left: "-48px",
                      width: "160px", height: "160px",
                      opacity: 0.04,
                      background: "radial-gradient(circle, #F07830 0%, transparent 70%)",
                      borderRadius: "50%",
                    }}
                  />
                  <p
                    className="type-caption-sm mb-3"
                    style={{ color: "var(--white-40)" }}
                  >
                    Your Reflection
                  </p>
                  {summaryText ? (
                    <p className="type-body-lg" style={{ lineHeight: "22px", color: "var(--white-85)" }}>
                      {summaryText}
                    </p>
                  ) : (
                    <p className="type-body-md italic" style={{ color: "var(--white-50)" }}>
                      Your answers have been recorded.
                    </p>
                  )}
                  <button
                    onClick={handleRedo}
                    className="mt-4 type-body-sm transition-opacity hover:opacity-70"
                    style={{ color: "var(--white-35)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    data-testid="button-redo-reflection"
                  >
                    Redo this reflection
                  </button>
                </div>
              )}

              <div ref={chatEndRef} className="h-16 shrink-0" />
            </div>

            {/* ── Input row ── */}
            {(flowComplete ||
              (inputReady && currentStep && currentStep.inputType !== "single_select")) && (
              <div className="shrink-0 pt-2 px-6">
                {flowComplete || currentStep?.inputType === "none" ? (
                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 type-body-lg font-medium text-white rounded-[6px] transition-opacity hover:opacity-90"
                    style={{
                      background: "var(--surface-float)",
                      height: "42px",
                      border: "1px solid var(--white-8)",
                      boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.06)",
                    }}
                    data-testid="button-chat-continue"
                  >
                    Continue
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    {showTextInputField && (
                      <input
                        type="text"
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !isSendDisabled && handleSubmit()}
                        placeholder="Type your answer here…"
                        className="flex-1 px-3 rounded-[6px] type-body-md outline-none transition-colors"
                        style={{ height: "36px", background: "var(--surface-float)", border: "1px solid var(--white-5)", color: "var(--white-90)" }}
                        data-testid="input-chat-text"
                      />
                    )}
                    {!showTextInputField && !showOtherInput && <div className="flex-1" />}
                    <button
                      onClick={handleSubmit}
                      disabled={isSendDisabled}
                      className="flex items-center justify-center rounded-[6px] transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ width: "36px", height: "36px", background: "var(--surface-float)", border: "1px solid var(--white-5)", color: "var(--white-70)" }}
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

      {/* ── Reflection Review Card (restored flow) ── */}
      {flowComplete && isRestoredFlow && (
        <div
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 500, background: "var(--surface-base)", animation: "rp-overlay-in 0.35s ease-out both" }}
        >
          <div
            className="relative shrink-0 flex items-center justify-between w-full"
            style={{ padding: "24px 24px 24px", zIndex: 1 }}
          >
            <div style={{ width: "42px", height: "42px" }} />
            <div
              className="type-caption-md"
              style={{
                background: "var(--surface-float)",
                borderRadius: "36px",
                padding: "12px 16px",
                color: "#efefef",
              }}
            >
              COMPLETE
            </div>
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
                <X style={{ width: "16px", height: "16px", color: "var(--white-70)" }} />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 flex flex-col min-h-0 overflow-clip"
            style={{ background: "var(--surface-ground)", borderRadius: "24px 24px 0 0" }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "24px 24px 0 0" }}>
              <img src={candleBg} alt="" className="absolute w-full max-w-none" style={{ opacity: 0.6, top: "-8.53%", height: "117.06%", left: 0 }} />
            </div>

            <div
              className="relative flex-1 flex flex-col min-h-0 overflow-y-auto items-center justify-start"
              style={{ padding: "32px 24px 32px", scrollbarWidth: "none", zIndex: 1 }}
            >
              <div className="w-full" style={{ maxWidth: "528px" }}>
                <div
                  className="relative overflow-hidden"
                  style={{
                    background: "rgba(15,17,22,0.85)",
                    borderRadius: "12px",
                    border: "0.5px solid var(--white-6)",
                    backdropFilter: "blur(16px)",
                    padding: "28px",
                  }}
                >
                  <p className="type-caption-sm mb-4" style={{ color: "var(--white-35)" }}>
                    Your Reflection
                  </p>
                  {summaryText ? (
                    <p className="type-display-sm" style={{ color: "var(--white-90)" }}>
                      {summaryText}
                    </p>
                  ) : (
                    <p className="type-body-md italic" style={{ color: "var(--white-50)" }}>
                      Your answers have been recorded.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={handleRedo}
                    className="type-body-sm transition-opacity hover:opacity-70"
                    style={{ color: "var(--white-35)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    data-testid="button-redo-reflection-review"
                  >
                    Redo this reflection
                  </button>
                  <button
                    onClick={onComplete}
                    className="flex items-center gap-2 type-body-md font-medium text-white transition-opacity hover:opacity-80 px-4 h-9"
                    style={{
                      background: "var(--surface-float)",
                      borderRadius: "6px",
                      border: "1px solid var(--white-8)",
                    }}
                    data-testid="button-review-continue"
                  >
                    Continue
                    <ArrowRight style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Keep old exported types for backward compatibility ──
export type { ChatFlowSlideProps };
export interface ChatFlowOption { label: string; value: string; }
export interface ChatFlowStep {
  id: string;
  messages: string[];
  inputType?: "single_select" | "multi_select" | "text_input" | "message_only";
  options?: ChatFlowOption[];
  variableName?: string;
  required?: boolean;
}
export interface ChatFlowDefinition {
  steps: ChatFlowStep[];
  optionSets?: Record<string, ChatFlowOption[]>;
  summaryTemplate?: string;
}
