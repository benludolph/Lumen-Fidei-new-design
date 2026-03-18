import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, CheckSquare, Circle, CheckCircle2, Send, CheckCircle, ArrowRight, X as XIcon, ExternalLink, Play, Pause, Volume2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";
import { useSendMessage } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import DOMPurify from "dompurify";
import { playAnswerCorrect, playWrongAnswer, playTimerComplete, playSendMessage } from "@/lib/sounds";
import { HtmlContent } from "@/components/ui/html-content";

import audioDay0 from "@assets/Day_0_1772743901058.mp3";
import audioDay1 from "@assets/Day_1_1772743901058.mp3";
import audioDay2 from "@assets/Day_2_1772743901058.mp3";
import audioDay3 from "@assets/Day_3_1772743901058.mp3";
import audioDay4 from "@assets/Day_4_1772743901057.mp3";
import audioDay5 from "@assets/Day_5_1772743901057.mp3";
import audioDay6 from "@assets/Day_6_1772743901057.mp3";

const TIMER_AUDIO_FALLBACK: Record<number, string> = {
  0: audioDay0,
  1: audioDay1,
  2: audioDay2,
  3: audioDay3,
  4: audioDay4,
  5: audioDay5,
  6: audioDay6,
};

export type SlideType =
  | "text"
  | "multi_select"
  | "single_select"
  | "media"
  | "text_input"
  | "action"
  | "mentor_message"
  | "timer"
  | "quiz"
  | "quiz_result"
  | "knowledge_check"
  | "survey"
  | "scenario";

export interface QuizData {
  questions: { question: string; options: string[] }[];
  results: Record<string, { title: string; description: string }>;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function YouTubeEmbed({ videoId, originalUrl }: { videoId: string; originalUrl: string }) {
  const watchUrl = originalUrl.includes("youtube.com") || originalUrl.includes("youtu.be")
    ? originalUrl.split("&list=")[0].split("&start_radio")[0]
    : `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="space-y-2">
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full"
        />
      </div>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
        data-testid="link-youtube-external"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="font-['Afacad',sans-serif] text-xs">If video doesn't load, watch on YouTube</span>
      </a>
    </div>
  );
}

function MediaContent({ text }: { text: string }) {
  if (!text) return null;

  const youtubeId = extractYouTubeId(text.trim());
  if (youtubeId) {
    return <YouTubeEmbed videoId={youtubeId} originalUrl={text.trim()} />;
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("/api/images/") || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(trimmed)) {
    return (
      <img
        src={trimmed}
        alt=""
        className="w-full rounded-lg"
        data-testid="media-image"
      />
    );
  }

  if (trimmed.startsWith("http")) {
    if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(trimmed)) {
      return (
        <img
          src={trimmed}
          alt=""
          className="w-full rounded-lg"
          data-testid="media-image"
        />
      );
    }
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline break-all text-xl font-['Afacad',sans-serif]"
      >
        {trimmed}
      </a>
    );
  }

  return <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif]">{text}</p>;
}

function parseMediaContent(content: string): { url: string; text: string } {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.url === "string") {
      return { url: parsed.url, text: parsed.text || "" };
    }
  } catch {}
  return { url: content, text: "" };
}

function MediaSlide({ content }: { content: string }) {
  const { url, text } = useMemo(() => parseMediaContent(content), [content]);

  return (
    <div className="space-y-6" data-testid="slide-media">
      <MediaContent text={url} />
      {text && (
        isHtmlContent(text) ? (
          <HtmlContent content={text} className="slide-text-content space-y-5" />
        ) : (
          <div className="slide-text-content space-y-5">
            {text.split("\n").filter(Boolean).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function stripHtmlToLines(html: string): string[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const lines: string[] = [];
  div.querySelectorAll("h1, h2, h3, p, li").forEach((el) => {
    const text = (el.textContent || "").trim();
    if (text.length > 0) lines.push(text);
  });
  if (lines.length === 0) {
    const fallback = (div.textContent || "").trim();
    if (fallback) return fallback.split("\n").map(l => l.trim()).filter(Boolean);
  }
  return lines;
}

function parseOptions(content: string): { heading: string; options: string[] } {
  const lines = isHtmlContent(content) ? stripHtmlToLines(content) : content.split("\n");
  const headingLines: string[] = [];
  const options: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("\u2610") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      options.push(trimmed.replace(/^(\u2610|-|\*)\s*/, ""));
    } else if (trimmed.length > 0) {
      headingLines.push(trimmed);
    }
  }

  return { heading: headingLines.join("\n"), options };
}

function MultiSelectList({ content, onInteracted }: { content: string; onInteracted?: () => void }) {
  const { heading, options } = parseOptions(content);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const interactedRef = useRef(false);

  const toggle = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
    if (!interactedRef.current) {
      interactedRef.current = true;
      onInteracted?.();
    }
  };

  useEffect(() => {
    if (options.length === 0) onInteracted?.();
  }, []);

  if (options.length === 0) {
    return <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif]">{content}</p>;
  }

  return (
    <div className="space-y-5">
      {heading && (
        <p className="font-bold leading-[1.4] text-[32px] font-['Afacad',sans-serif]">{heading}</p>
      )}
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggle(idx)}
            className={cn(
              "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors",
              checked[idx]
                ? "bg-black/5 text-black"
                : "bg-transparent text-black hover:bg-black/[0.02]"
            )}
            data-testid={`checkbox-option-${idx}`}
          >
            {checked[idx] ? (
              <CheckSquare className="w-5 h-5 text-[#00b57a] shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 shrink-0 mt-0.5 text-black/40" />
            )}
            <span className="leading-[1.4] text-xl font-['Afacad',sans-serif]">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SingleSelectList({ content, onInteracted }: { content: string; onInteracted?: () => void }) {
  const { heading, options } = parseOptions(content);
  const [selected, setSelected] = useState<number | null>(null);
  const interactedRef = useRef(false);

  useEffect(() => {
    if (options.length === 0) onInteracted?.();
  }, []);

  if (options.length === 0) {
    return <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif]">{content}</p>;
  }

  return (
    <div className="space-y-5">
      {heading && (
        <p className="font-bold leading-[1.4] text-[32px] font-['Afacad',sans-serif]">{heading}</p>
      )}
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setSelected(idx);
              if (!interactedRef.current) {
                interactedRef.current = true;
                onInteracted?.();
              }
            }}
            className={cn(
              "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors",
              selected === idx
                ? "bg-black/5 text-black"
                : "bg-transparent text-black hover:bg-black/[0.02]"
            )}
            data-testid={`radio-option-${idx}`}
          >
            {selected === idx ? (
              <CheckCircle2 className="w-5 h-5 text-[#00b57a] shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 shrink-0 mt-0.5 text-black/40" />
            )}
            <span className="leading-[1.4] text-xl font-['Afacad',sans-serif]">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface LessonSlideProps {
  type: SlideType;
  content: string;
  dayNumber: number;
  existingAnswer?: string;
  onJournalChange?: (value: string) => void;
  direction: "forward" | "backward";
  mentorId?: number | null;
  onTimerComplete?: () => void;
  timerAlreadyDone?: boolean;
  onKnowledgeCheckAnswered?: () => void;
  onKnowledgeCheckNext?: () => void;
  quizData?: QuizData;
  quizQuestionIndex?: number;
  quizAnswers?: Record<number, string>;
  onQuizAnswer?: (letter: string) => void;
  onInteracted?: () => void;
  onSurveySubmitted?: () => void;
  surveyAlreadySubmitted?: boolean;
  scenarioRevealCount?: number;
}

export function LessonSlide({
  type,
  content,
  dayNumber,
  existingAnswer,
  onJournalChange,
  direction,
  mentorId,
  onTimerComplete,
  timerAlreadyDone,
  onKnowledgeCheckAnswered,
  onKnowledgeCheckNext,
  quizData,
  quizQuestionIndex,
  quizAnswers,
  onQuizAnswer,
  onInteracted,
  onSurveySubmitted,
  surveyAlreadySubmitted,
  scenarioRevealCount = 1,
}: LessonSlideProps) {
  const animationClass =
    direction === "forward"
      ? "lesson-slide-in-right"
      : "lesson-slide-in-left";

  return (
    <div
      className={cn("flex-1 overflow-y-auto pb-28 bg-white", animationClass)}
      data-testid={`lesson-slide-${type}`}
    >
      <div className="max-w-[540px] mx-auto px-6 py-8 flex flex-col justify-center min-h-full">
        {type === "text" ? (
          <TextSlide content={content} />
        ) : type === "multi_select" ? (
          <MultiSelectList content={content} onInteracted={onInteracted} />
        ) : type === "single_select" ? (
          <SingleSelectList content={content} onInteracted={onInteracted} />
        ) : type === "media" ? (
          <MediaSlide content={content} />
        ) : type === "text_input" ? (
          <TextInputSlide
            dayNumber={dayNumber}
            prompt={content}
            existingAnswer={existingAnswer}
            onJournalChange={onJournalChange}
            onInteracted={onInteracted}
          />
        ) : type === "action" ? (
          <ActionSlide content={content} onInteracted={onInteracted} />
        ) : type === "mentor_message" ? (
          <MentorMessageSlide content={content} mentorId={mentorId} onInteracted={onInteracted} />
        ) : type === "timer" ? (
          <TimerSlide content={content} dayNumber={dayNumber} onTimerComplete={onTimerComplete} alreadyDone={timerAlreadyDone} />
        ) : type === "knowledge_check" ? (
          <KnowledgeCheckSlide
            content={content}
            onAnswered={onKnowledgeCheckAnswered}
            onNext={onKnowledgeCheckNext}
          />
        ) : type === "quiz" && quizData && quizQuestionIndex !== undefined ? (
          <QuizQuestionSlide
            quizData={quizData}
            questionIndex={quizQuestionIndex}
            currentAnswer={quizAnswers?.[quizQuestionIndex] ?? null}
            onAnswer={onQuizAnswer}
          />
        ) : type === "quiz_result" && quizData && quizAnswers ? (
          <QuizResultSlide quizData={quizData} answers={quizAnswers} />
        ) : type === "survey" ? (
          <SurveySlide
            content={content}
            dayNumber={dayNumber}
            onSubmitted={onSurveySubmitted}
            alreadySubmitted={surveyAlreadySubmitted}
          />
        ) : type === "scenario" ? (
          <ScenarioSlide content={content} revealedCount={scenarioRevealCount} />
        ) : (
          <TextSlide content={content} />
        )}
      </div>
    </div>
  );
}

function RevealStep({ children, isNew }: { children: ReactNode; isNew: boolean }) {
  const [visible, setVisible] = useState(!isNew);
  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    }
  }, [isNew]);
  return (
    <div className={cn("transition-all duration-500", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {children}
    </div>
  );
}

function ScenarioSlide({ content, revealedCount }: { content: string; revealedCount: number }) {
  let parsed: { headline?: string; steps?: { imageUrl?: string; text?: string }[] } = {};
  try { parsed = JSON.parse(content); } catch {}
  const headline = parsed.headline ?? "";
  const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const shown = steps.slice(0, Math.max(1, revealedCount));

  return (
    <div className="flex flex-col gap-8">
      {headline && (
        <h1 className="font-['Afacad',sans-serif] font-bold text-[30px] text-black leading-[1.2]">
          {headline}
        </h1>
      )}
      <div className="flex flex-col">
        {shown.map((step, i) => (
          <div key={i}>
            <RevealStep isNew={i === shown.length - 1 && revealedCount > 1}>
              <div className="flex gap-3 items-start" data-testid={`scenario-step-${i}`}>
                {step.imageUrl ? (
                  <img
                    src={step.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                    data-testid={`scenario-step-img-${i}`}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 shrink-0 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
                <p className="font-['Afacad',sans-serif] font-medium text-[20px] text-black leading-[1.4] pt-2">
                  {step.text}
                </p>
              </div>
            </RevealStep>
            {i < shown.length - 1 && (
              <div className="flex flex-col items-start ml-5 py-2 gap-[5px]">
                <div className="w-[3px] h-[5px] rounded-full bg-zinc-300" />
                <div className="w-[3px] h-[5px] rounded-full bg-zinc-300" />
                <div className="w-[3px] h-[5px] rounded-full bg-zinc-300" />
                <div className="w-[3px] h-[5px] rounded-full bg-zinc-300" />
                <div className="w-[3px] h-[5px] rounded-full bg-zinc-300" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const HTML_TAG_REGEX = /<(p|h[1-3]|strong|b|em|i|u|ul|ol|li|blockquote|br)\b[^>]*>/i;

function isHtmlContent(content: string): boolean {
  return HTML_TAG_REGEX.test(content);
}

function TextSlide({ content }: { content: string }) {
  const html = useMemo(() => {
    if (isHtmlContent(content)) {
      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
      });
    }
    const lines = content.split("\n").filter(Boolean);
    return lines.map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join("");
  }, [content]);

  return (
    <div
      className="slide-text-content space-y-5"
      data-testid="slide-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ActionSlide({ content, onInteracted }: { content: string; onInteracted?: () => void }) {
  const [done, setDone] = useState(false);
  const isHtml = isHtmlContent(content);

  return (
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[200px]" data-testid="slide-action">
      {isHtml ? (
        <HtmlContent content={content} className="text-xl font-['Afacad',sans-serif] text-black text-center leading-[1.4]" />
      ) : (
        <p className="text-xl font-['Afacad',sans-serif] text-black text-center whitespace-pre-wrap leading-[1.4]">
          {content}
        </p>
      )}
      <Button
        variant={done ? "secondary" : "default"}
        size="lg"
        onClick={() => {
          setDone(!done);
          if (!done) onInteracted?.();
        }}
        className="gap-2"
        data-testid="button-action-done"
      >
        {done ? (
          <>
            <CheckSquare className="w-5 h-5" />
            Done
          </>
        ) : (
          "Mark as Done"
        )}
      </Button>
    </div>
  );
}

function TextInputSlide({
  dayNumber,
  prompt,
  existingAnswer,
  onJournalChange,
  onInteracted,
}: {
  dayNumber: number;
  prompt: string;
  existingAnswer?: string;
  onJournalChange?: (value: string) => void;
  onInteracted?: () => void;
}) {
  const { mutate, isPending } = useCreateAnswer();
  const [journalContent, setJournalContent] = useState(existingAnswer || "");
  const [saved, setSaved] = useState(!!existingAnswer);
  const lastSavedContent = useRef(existingAnswer || "");
  const interactedRef = useRef(!!existingAnswer);

  useEffect(() => {
    if (existingAnswer !== undefined && existingAnswer !== lastSavedContent.current) {
      setJournalContent(existingAnswer);
      lastSavedContent.current = existingAnswer;
      setSaved(true);
    }
  }, [existingAnswer]);

  useEffect(() => {
    if (existingAnswer && existingAnswer.trim()) {
      onInteracted?.();
    }
  }, []);

  const handleChange = (value: string) => {
    setJournalContent(value);
    setSaved(false);
    onJournalChange?.(value);
    if (value.trim() && !interactedRef.current) {
      interactedRef.current = true;
      onInteracted?.();
    }
  };

  const handleSave = () => {
    mutate(
      { dayNumber, content: journalContent },
      {
        onSuccess: () => {
          setSaved(true);
          lastSavedContent.current = journalContent;
        },
      }
    );
  };

  return (
    <div className="space-y-6" data-testid="slide-text-input">
      {isHtmlContent(prompt) ? (
        <HtmlContent content={prompt} className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black" />
      ) : (
        <p className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black">
          {prompt}
        </p>
      )}
      <Textarea
        value={journalContent}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your response here..."
        className="min-h-[150px] w-full bg-white border-black/10 text-base font-['Afacad',sans-serif]"
        data-testid="input-text-response"
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending || !journalContent.trim() || saved}
          data-testid="button-save-response"
        >
          {isPending ? "Saving..." : saved ? "Saved" : "Save Response"}
        </Button>
      </div>
    </div>
  );
}

function MentorMessageSlide({
  content,
  mentorId,
  onInteracted,
}: {
  content: string;
  mentorId?: number | null;
  onInteracted?: () => void;
}) {
  const { mutate, isPending } = useSendMessage();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!mentorId || !message.trim()) return;
    mutate(
      { receiverId: mentorId, content: message.trim() },
      { onSuccess: () => { playSendMessage(); setSent(true); onInteracted?.(); } }
    );
  };

  useEffect(() => {
    if (!mentorId) onInteracted?.();
  }, [mentorId, onInteracted]);

  if (!mentorId) {
    return (
      <div className="space-y-4" data-testid="slide-mentor-message">
        <div className="overflow-y-auto max-h-[50vh]" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
          {isHtmlContent(content) ? (
            <HtmlContent content={content} className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black break-words" />
          ) : (
            <p className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black break-words">{content}</p>
          )}
        </div>
        <p className="text-sm text-black/50 font-['Afacad',sans-serif]">No mentor assigned yet.</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4" data-testid="slide-mentor-message-sent">
        <div className="w-16 h-16 rounded-full bg-[#00b57a]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#00b57a]" />
        </div>
        <p className="text-[24px] font-bold font-['Afacad',sans-serif] text-black">Message Sent!</p>
        <p className="text-lg font-['Afacad',sans-serif] text-black/60">Your mentor will see it in your conversation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="slide-mentor-message">
      <div className="overflow-y-auto max-h-[40vh]" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
        {isHtmlContent(content) ? (
          <HtmlContent content={content} className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black break-words" />
        ) : (
          <p className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black break-words">{content}</p>
        )}
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message to your mentor..."
        className="min-h-[150px] w-full bg-white border-black/10 text-base font-['Afacad',sans-serif]"
        data-testid="input-mentor-message"
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={isPending || !message.trim()}
          className="gap-2"
          data-testid="button-send-mentor"
        >
          <Send className="w-4 h-4" />
          {isPending ? "Sending..." : "Send to Mentor"}
        </Button>
      </div>
    </div>
  );
}

function parseTimerContent(content: string): { duration: number; text: string; audioUrl?: string } {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.text === "string") {
      const dur = typeof parsed.duration === "number" ? parsed.duration : parseInt(parsed.duration) || 60;
      return { duration: Math.max(0, dur), text: parsed.text, audioUrl: typeof parsed.audioUrl === "string" ? parsed.audioUrl : undefined };
    }
  } catch {}
  return { duration: 60, text: content };
}

function TimerSlide({
  content,
  dayNumber,
  onTimerComplete,
  alreadyDone,
}: {
  content: string;
  dayNumber: number;
  onTimerComplete?: () => void;
  alreadyDone?: boolean;
}) {
  const { duration, text, audioUrl } = useMemo(() => parseTimerContent(content), [content]);
  const [remaining, setRemaining] = useState(alreadyDone ? 0 : duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(!!alreadyDone);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrc = audioUrl || TIMER_AUDIO_FALLBACK[dayNumber] || null;

  useEffect(() => {
    if (alreadyDone) {
      setRemaining(0);
      completedRef.current = true;
      return;
    }
    if (duration <= 0) {
      setRemaining(0);
      completedRef.current = true;
      onTimerComplete?.();
      return;
    }
    setRemaining(duration);
    completedRef.current = false;
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!completedRef.current) {
            completedRef.current = true;
            playTimerComplete();
            onTimerComplete?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration, onTimerComplete]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = useCallback(() => {
    if (!audioSrc) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioSrc, isPlaying]);

  const progress = duration > 0 ? (duration - remaining) / duration : 1;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference * (1 - progress);
  const done = remaining === 0;

  return (
    <div className="flex flex-col items-center space-y-8" data-testid="slide-timer">
      <div className="relative w-[140px] h-[140px] flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e4e4e7" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={done ? "#00b57a" : "#18181b"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <CheckCircle className="w-10 h-10 text-[#00b57a]" />
          ) : (
            <span className="text-[32px] font-bold font-['Afacad',sans-serif] text-black tabular-nums">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {!done && (
        <p className="text-[16px] text-black/70 font-['Afacad',sans-serif]">
          Take a moment to reflect on this passage
        </p>
      )}

      {audioSrc && (
        <button
          onClick={toggleAudio}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-['Afacad',sans-serif] text-[14px] font-medium",
            isPlaying
              ? "bg-zinc-900 text-white shadow-md"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          )}
          data-testid="button-audio-toggle"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause Audio
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              Listen to Scripture
            </>
          )}
        </button>
      )}

      <div className="w-full">
        {isHtmlContent(text) ? (
          <HtmlContent content={text} className="slide-text-content space-y-5" />
        ) : (
          <div className="slide-text-content space-y-5">
            {text.split("\n").filter(Boolean).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface KnowledgeCheckData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function parseKnowledgeCheckContent(content: string): KnowledgeCheckData {
  try {
    const parsed = JSON.parse(content);
    return {
      question: parsed.question || "",
      options: Array.isArray(parsed.options) ? parsed.options : [],
      correctIndex: typeof parsed.correctIndex === "number" ? parsed.correctIndex : 0,
      explanation: parsed.explanation || "",
    };
  } catch {
    return { question: content, options: [], correctIndex: 0, explanation: "" };
  }
}

function KnowledgeCheckSlide({
  content,
  onAnswered,
  onNext,
}: {
  content: string;
  onAnswered?: () => void;
  onNext?: () => void;
}) {
  const data = useMemo(() => parseKnowledgeCheckContent(content), [content]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const answeredRef = useRef(false);

  const isCorrect = selectedIndex !== null ? selectedIndex === data.correctIndex : null;

  const handleSelect = useCallback((idx: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
    if (idx === data.correctIndex && data.correctIndex !== undefined) {
      playAnswerCorrect();
    } else {
      playWrongAnswer();
    }
    if (!answeredRef.current) {
      answeredRef.current = true;
      onAnswered?.();
    }
  }, [selectedIndex, onAnswered, data.correctIndex]);

  if (data.options.length === 0) {
    return <div className="slide-text-content"><p>{data.question || "(No question configured)"}</p></div>;
  }

  return (
    <>
      <div className="space-y-6" data-testid="slide-knowledge-check">
        <p className="font-bold leading-[1.4] text-[28px] font-['Afacad',sans-serif] text-black">
          {data.question}
        </p>
        <div className="space-y-2">
          {data.options.map((option, idx) => {
            const answered = selectedIndex !== null;
            const isThis = selectedIndex === idx;
            const isCorrectOption = idx === data.correctIndex;

            let optionStyle = "bg-transparent hover:bg-black/[0.02]";
            let circleStyle = "bg-black/5 text-black/60 border-2 border-transparent";

            if (answered) {
              if (isThis && isCorrect) {
                optionStyle = "bg-[#00b57a]/10 ring-2 ring-[#00b57a]";
                circleStyle = "bg-[#00b57a] text-white border-2 border-[#00b57a]";
              } else if (isThis && !isCorrect) {
                optionStyle = "bg-[#ef4444]/10 ring-2 ring-[#ef4444]";
                circleStyle = "bg-[#ef4444] text-white border-2 border-[#ef4444]";
              } else if (isCorrectOption) {
                optionStyle = "bg-[#00b57a]/5 ring-1 ring-[#00b57a]/40";
                circleStyle = "bg-[#00b57a]/20 text-[#00b57a] border-2 border-[#00b57a]/40";
              } else {
                optionStyle = "bg-transparent opacity-50";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => handleSelect(idx)}
                className={cn(
                  "flex items-start gap-3 w-full text-left p-4 rounded-xl transition-all duration-200",
                  optionStyle,
                  answered && "cursor-default"
                )}
                data-testid={`kc-option-${idx}`}
              >
                <span className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  circleStyle
                )}>
                  {answered && isThis ? (
                    isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XIcon className="w-5 h-5" />
                  ) : answered && isCorrectOption ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </span>
                <span className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black pt-1">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedIndex !== null && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[60] border-t px-6 py-5 animate-in slide-in-from-bottom duration-300",
            isCorrect
              ? "bg-[#f0fdf4] border-[#00b57a]/30"
              : "bg-[#fef2f2] border-[#ef4444]/30"
          )}
          data-testid="kc-feedback-banner"
        >
          <div className="max-w-[540px] mx-auto flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-lg font-bold font-['Afacad',sans-serif] mb-1",
                isCorrect ? "text-[#00b57a]" : "text-[#ef4444]"
              )} data-testid="kc-feedback-title">
                {isCorrect ? "CORRECT!" : "INCORRECT"}
              </p>
              {!isCorrect && (
                <p className="text-sm font-medium font-['Afacad',sans-serif] text-[#ef4444]/80 mb-1" data-testid="kc-correct-answer">
                  Answer: {data.options[data.correctIndex]}
                </p>
              )}
              {data.explanation && (
                <div className="mt-1">
                  <p className={cn(
                    "text-xs font-semibold font-['Afacad',sans-serif] uppercase tracking-wide mb-0.5",
                    isCorrect ? "text-[#00b57a]/70" : "text-[#ef4444]/70"
                  )}>
                    Explanation:
                  </p>
                  {isHtmlContent(data.explanation) ? (
                    <HtmlContent content={data.explanation} className="text-sm font-['Afacad',sans-serif] text-black/80 leading-relaxed" />
                  ) : (
                    <p className="text-sm font-['Afacad',sans-serif] text-black/80 leading-relaxed" data-testid="kc-explanation">
                      {data.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={onNext}
              className={cn(
                "shrink-0 gap-2 text-white mt-1",
                isCorrect
                  ? "bg-[#00b57a] hover:bg-[#00a06a]"
                  : "bg-[#ef4444] hover:bg-[#dc2626]"
              )}
              data-testid="kc-continue-button"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Survey Slide
// ============================================================

interface SurveyQuestion {
  id: string;
  type: "single_select" | "multi_select" | "rating" | "text";
  label: string;
  options?: string[];
}

interface SurveyData {
  title?: string;
  description?: string;
  questions: SurveyQuestion[];
}

function parseSurveyContent(content: string): SurveyData {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.questions)) return parsed as SurveyData;
  } catch {}
  return { questions: [] };
}

function SurveySlide({
  content,
  dayNumber,
  onSubmitted,
  alreadySubmitted,
}: {
  content: string;
  dayNumber: number;
  onSubmitted?: () => void;
  alreadySubmitted?: boolean;
}) {
  const { user } = useAuth();
  const data = useMemo(() => parseSurveyContent(content), [content]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);
  const onSubmittedRef = useRef(onSubmitted);
  onSubmittedRef.current = onSubmitted;

  // Check server if already submitted (only if we don't already know)
  useEffect(() => {
    if (alreadySubmitted) {
      setSubmitted(true);
      setChecked(true);
      onSubmittedRef.current?.();
      return;
    }
    let cancelled = false;
    fetch(`/api/survey-responses/submitted?dayNumber=${dayNumber}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.submitted) {
          setSubmitted(true);
          onSubmittedRef.current?.();
        }
        setChecked(true);
      })
      .catch(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [dayNumber, alreadySubmitted]);

  const allAnswered = useMemo(() => {
    return data.questions.every(q => {
      const a = answers[q.id];
      if (q.type === "multi_select") return Array.isArray(a) && a.length > 0;
      return typeof a === "string" && a.trim().length > 0;
    });
  }, [answers, data.questions]);

  const toggleMulti = useCallback((qid: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[qid] as string[] | undefined) || [];
      const next = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [qid]: next };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!allAnswered || submitting || !user) return;
    setSubmitting(true);
    try {
      const responses = data.questions.map((q, idx) => {
        const raw = answers[q.id];
        const response = Array.isArray(raw) ? JSON.stringify(raw) : (raw as string) || "";
        return {
          questionIndex: idx,
          questionLabel: q.label,
          questionType: q.type,
          response,
        };
      });
      const res = await fetch("/api/survey-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          track: user.track || "A",
          dayNumber,
          responses,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onSubmittedRef.current?.();
      }
    } catch (e) {
      console.error("Survey submit error:", e);
    } finally {
      setSubmitting(false);
    }
  }, [allAnswered, submitting, user, data.questions, answers, dayNumber]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[200px]" data-testid="slide-survey-loading">
        <div className="w-6 h-6 border-2 border-[#00b57a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[260px]" data-testid="slide-survey-complete">
        <div className="w-16 h-16 rounded-full bg-[#00b57a]/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#00b57a]" />
        </div>
        <h3 className="text-2xl font-bold font-['Afacad',sans-serif] text-black">Response Received</h3>
        <p className="text-lg font-['Afacad',sans-serif] text-black/60 max-w-[320px]">
          Thank you for sharing your experience. You can continue.
        </p>
      </div>
    );
  }

  if (data.questions.length === 0) {
    return (
      <div className="slide-text-content" data-testid="slide-survey-empty">
        <p className="text-black/50 italic">Survey not configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="slide-survey">
      {/* Header */}
      {(data.title || data.description) && (
        <div className="space-y-2">
          {data.title && (
            <h2 className="font-bold text-[28px] font-['Afacad',sans-serif] text-black leading-tight">
              {data.title}
            </h2>
          )}
          {data.description && (
            <p className="text-lg font-['Afacad',sans-serif] text-black/60 leading-[1.4]">
              {data.description}
            </p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="space-y-3" data-testid={`survey-question-${idx}`}>
            <p className="font-semibold text-[18px] font-['Afacad',sans-serif] text-black leading-[1.3]">
              <span className="text-[#00b57a] mr-1.5">{idx + 1}.</span>
              {q.label}
            </p>

            {q.type === "single_select" && q.options && (
              <div className="space-y-2">
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={cn(
                        "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 font-['Afacad',sans-serif] text-[17px]",
                        selected
                          ? "border-[#00b57a] bg-[#00b57a]/5 text-black"
                          : "border-black/10 bg-transparent text-black/70 hover:border-black/25"
                      )}
                      data-testid={`survey-option-${idx}-${opt}`}
                    >
                      <span className={cn(
                        "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        selected ? "border-[#00b57a] bg-[#00b57a]" : "border-black/25"
                      )}>
                        {selected && <span className="w-2 h-2 rounded-full bg-white block" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "multi_select" && q.options && (
              <div className="space-y-2">
                <p className="text-sm text-black/40 font-['Afacad',sans-serif]">Select all that apply</p>
                {q.options.map(opt => {
                  const selected = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleMulti(q.id, opt)}
                      className={cn(
                        "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 font-['Afacad',sans-serif] text-[17px]",
                        selected
                          ? "border-[#00b57a] bg-[#00b57a]/5 text-black"
                          : "border-black/10 bg-transparent text-black/70 hover:border-black/25"
                      )}
                      data-testid={`survey-option-${idx}-${opt}`}
                    >
                      <span className={cn(
                        "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                        selected ? "border-[#00b57a] bg-[#00b57a]" : "border-black/25"
                      )}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "rating" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2" data-testid={`survey-rating-${idx}`}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const selected = answers[q.id] === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: String(n) }))}
                        className={cn(
                          "flex-1 h-12 rounded-xl border-2 font-bold text-lg font-['Afacad',sans-serif] transition-all duration-150",
                          selected
                            ? "border-[#00b57a] bg-[#00b57a] text-white shadow-sm"
                            : "border-black/10 bg-transparent text-black/50 hover:border-black/30 hover:text-black/70"
                        )}
                        data-testid={`survey-rating-${idx}-${n}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between px-0.5">
                  <span className="text-xs text-black/35 font-['Afacad',sans-serif]">Not at all</span>
                  <span className="text-xs text-black/35 font-['Afacad',sans-serif]">Very much</span>
                </div>
              </div>
            )}

            {q.type === "text" && (
              <Textarea
                value={(answers[q.id] as string) || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Write your response here..."
                rows={3}
                className="font-['Afacad',sans-serif] text-[17px] resize-none border-black/15 focus:border-[#00b57a] focus:ring-[#00b57a]/20"
                data-testid={`survey-text-${idx}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className={cn(
          "w-full h-12 text-[17px] font-semibold font-['Afacad',sans-serif] transition-all",
          allAnswered
            ? "bg-[#00b57a] hover:bg-[#00a06a] text-white"
            : "bg-black/10 text-black/30 cursor-not-allowed"
        )}
        data-testid="button-survey-submit"
      >
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </div>
  );
}

const QUIZ_LETTERS = ["A", "B", "C", "D"] as const;

function QuizQuestionSlide({
  quizData,
  questionIndex,
  currentAnswer,
  onAnswer,
}: {
  quizData: QuizData;
  questionIndex: number;
  currentAnswer: string | null;
  onAnswer?: (letter: string) => void;
}) {
  const q = quizData.questions[questionIndex];
  if (!q) return null;

  return (
    <div className="space-y-6" data-testid="slide-quiz-question">
      <p className="text-sm font-medium text-black/40 font-['Afacad',sans-serif]" data-testid="text-quiz-progress">
        Question {questionIndex + 1} of {quizData.questions.length}
      </p>
      <p className="font-bold leading-[1.4] text-[28px] font-['Afacad',sans-serif] text-black">
        {q.question}
      </p>
      <div className="space-y-2">
        {q.options.map((option, idx) => {
          const letter = QUIZ_LETTERS[idx] || String.fromCharCode(65 + idx);
          const isSelected = currentAnswer === letter;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswer?.(letter)}
              className={cn(
                "flex items-start gap-3 w-full text-left p-4 rounded-xl transition-all duration-200",
                isSelected
                  ? "bg-black/5 ring-2 ring-[#00b57a]"
                  : "bg-transparent hover:bg-black/[0.02]"
              )}
              data-testid={`quiz-option-${letter}`}
            >
              <span className={cn(
                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                isSelected
                  ? "bg-[#00b57a] text-white"
                  : "bg-black/5 text-black/60"
              )}>
                {letter}
              </span>
              <span className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black pt-1">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuizResultSlide({
  quizData,
  answers,
}: {
  quizData: QuizData;
  answers: Record<number, string>;
}) {
  const answered = Object.keys(answers).length;
  const total = quizData.questions.length;

  const counts: Record<string, number> = {};
  for (const letter of Object.values(answers)) {
    counts[letter] = (counts[letter] || 0) + 1;
  }

  let dominant: string | null = null;
  let maxCount = 0;
  for (const letter of QUIZ_LETTERS) {
    const count = counts[letter] || 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = letter;
    }
  }

  const result = dominant ? quizData.results[dominant] : null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]" data-testid="slide-quiz-result">
      <div className="w-16 h-16 rounded-full bg-[#00b57a]/10 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-[#00b57a]" />
      </div>
      {answered === 0 ? (
        <p className="text-xl font-['Afacad',sans-serif] text-black/70">
          Go back and answer the questions to see your result.
        </p>
      ) : result ? (
        <>
          <h2 className="text-[32px] font-bold font-['Afacad',sans-serif] text-black leading-tight">
            {result.title}
          </h2>
          <p className="text-xl leading-[1.5] font-['Afacad',sans-serif] text-black/70 max-w-[420px]">
            {result.description}
          </p>
        </>
      ) : (
        <p className="text-xl font-['Afacad',sans-serif] text-black/70">
          You answered {answered} of {total} questions.
        </p>
      )}
    </div>
  );
}
