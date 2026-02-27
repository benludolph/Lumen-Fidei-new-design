import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, CheckSquare, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";
import DOMPurify from "dompurify";
import { HtmlContent } from "@/components/ui/html-content";

export type SlideType =
  | "text"
  | "multi_select"
  | "single_select"
  | "media"
  | "text_input"
  | "action"
  | "quiz"
  | "quiz_result";

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

function MediaContent({ text }: { text: string }) {
  if (!text) return null;

  const youtubeId = extractYouTubeId(text.trim());
  if (youtubeId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (text.trim().startsWith("http")) {
    if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(text.trim())) {
      return (
        <img
          src={text.trim()}
          alt=""
          className="w-full rounded-lg"
          data-testid="media-image"
        />
      );
    }
    return (
      <a
        href={text.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline break-all text-xl font-['Afacad',sans-serif]"
      >
        {text.trim()}
      </a>
    );
  }

  return <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif]">{text}</p>;
}

function parseOptions(content: string): { heading: string; options: string[] } {
  const lines = content.split("\n");
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

function MultiSelectList({ content }: { content: string }) {
  const { heading, options } = parseOptions(content);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

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

function SingleSelectList({ content }: { content: string }) {
  const { heading, options } = parseOptions(content);
  const [selected, setSelected] = useState<number | null>(null);

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
            onClick={() => setSelected(idx)}
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
  quizData?: QuizData;
  quizQuestionIndex?: number;
  quizAnswers?: Record<number, string>;
  onQuizAnswer?: (letter: string) => void;
}

export function LessonSlide({
  type,
  content,
  dayNumber,
  existingAnswer,
  onJournalChange,
  direction,
  quizData,
  quizQuestionIndex,
  quizAnswers,
  onQuizAnswer,
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
          <MultiSelectList content={content} />
        ) : type === "single_select" ? (
          <SingleSelectList content={content} />
        ) : type === "media" ? (
          <div data-testid="slide-media">
            <MediaContent text={content} />
          </div>
        ) : type === "text_input" ? (
          <TextInputSlide
            dayNumber={dayNumber}
            prompt={content}
            existingAnswer={existingAnswer}
            onJournalChange={onJournalChange}
          />
        ) : type === "action" ? (
          <ActionSlide content={content} />
        ) : type === "quiz" && quizData && quizQuestionIndex !== undefined ? (
          <QuizQuestionSlide
            quizData={quizData}
            questionIndex={quizQuestionIndex}
            currentAnswer={quizAnswers?.[quizQuestionIndex] ?? null}
            onAnswer={onQuizAnswer}
          />
        ) : type === "quiz_result" && quizData && quizAnswers ? (
          <QuizResultSlide quizData={quizData} answers={quizAnswers} />
        ) : (
          <TextSlide content={content} />
        )}
      </div>
    </div>
  );
}

const HTML_TAG_REGEX = /<(p|h[1-3]|strong|b|em|i|u|ul|ol|li|blockquote|br)\b[^>]*>/i;

function isHtmlContent(content: string): boolean {
  return HTML_TAG_REGEX.test(content);
}

interface CharToken {
  char: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

interface TextBlock {
  tag: "p" | "h1" | "h2" | "h3" | "blockquote" | "li";
  chars: CharToken[];
  listType?: "ul" | "ol";
  listIndex?: number;
}

function parseContentToBlocks(content: string): TextBlock[] {
  const isHtml = isHtmlContent(content);

  if (!isHtml) {
    const lines = content.split("\n").filter(Boolean);
    return lines.map((line) => ({
      tag: "p" as const,
      chars: Array.from(line).map((char) => ({ char })),
    }));
  }

  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });

  const container = document.createElement("div");
  container.innerHTML = sanitized;
  const blocks: TextBlock[] = [];

  function extractChars(node: Node, bold: boolean, italic: boolean, underline: boolean): CharToken[] {
    const tokens: CharToken[] = [];
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || "";
        for (const char of Array.from(text)) {
          tokens.push({ char, bold, italic, underline });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === "br") {
          tokens.push({ char: "\n" });
          continue;
        }
        const b = bold || tag === "strong" || tag === "b";
        const i = italic || tag === "em" || tag === "i";
        const u = underline || tag === "u";
        tokens.push(...extractChars(el, b, i, u));
      }
    }
    return tokens;
  }

  function processElement(el: Element) {
    const tag = el.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      let liIdx = 0;
      for (const li of Array.from(el.children)) {
        if (li.tagName.toLowerCase() === "li") {
          blocks.push({
            tag: "li",
            chars: extractChars(li, false, false, false),
            listType: tag as "ul" | "ol",
            listIndex: liIdx++,
          });
        }
      }
    } else if (["p", "h1", "h2", "h3", "blockquote"].includes(tag)) {
      const chars = extractChars(el, false, false, false);
      if (chars.length > 0) {
        blocks.push({ tag: tag as TextBlock["tag"], chars });
      }
    } else {
      const chars = extractChars(el, false, false, false);
      if (chars.length > 0) {
        blocks.push({ tag: "p", chars });
      }
    }
  }

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      processElement(child as Element);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text.trim().length > 0) {
        blocks.push({
          tag: "p",
          chars: Array.from(text).map((char) => ({ char })),
        });
      }
    }
  }

  return blocks;
}

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.3 },
  },
};

const revealChar = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween" as const,
      ease: [0.25, 1, 0.5, 1],
      duration: 0.8,
    },
  },
};

const blockStyles: Record<string, string> = {
  p: "leading-[1.4] text-xl font-['Afacad',sans-serif] text-black",
  h1: "leading-[1.2] text-[32px] font-bold font-['Afacad',sans-serif] text-black",
  h2: "leading-[1.3] text-[26px] font-bold font-['Afacad',sans-serif] text-black",
  h3: "leading-[1.3] text-[22px] font-semibold font-['Afacad',sans-serif] text-black",
  blockquote: "leading-[1.4] text-xl font-['Afacad',sans-serif] text-black/70 italic border-l-4 border-black/20 pl-4",
  li: "leading-[1.4] text-xl font-['Afacad',sans-serif] text-black",
};

function AnimatedChars({ chars }: { chars: CharToken[] }) {
  return (
    <>
      {chars.map((t, i) => (
        <motion.span
          key={i}
          variants={revealChar}
          style={{ display: "inline-block", overflow: "hidden" }}
          className={cn(
            t.bold && "font-bold",
            t.italic && "italic",
            t.underline && "underline",
          )}
        >
          {t.char === " " ? "\u00A0" : t.char}
        </motion.span>
      ))}
    </>
  );
}

function TextSlide({ content }: { content: string }) {
  const blocks = useMemo(() => parseContentToBlocks(content), [content]);

  const rendered: JSX.Element[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];

    if (block.tag === "li") {
      const listItems: TextBlock[] = [];
      const lt = block.listType;
      while (i < blocks.length && blocks[i].tag === "li" && blocks[i].listType === lt) {
        listItems.push(blocks[i]);
        i++;
      }
      const ListTag = lt === "ol" ? "ol" : "ul";
      rendered.push(
        <ListTag key={rendered.length} className="space-y-2 list-none">
          {listItems.map((b, liIdx) => (
            <motion.li key={liIdx} className={blockStyles.li} variants={revealContainer} initial="hidden" animate="visible" style={{ overflow: "hidden" }}>
              {b.listType === "ul" && <motion.span variants={revealChar} style={{ display: "inline-block" }}>•{"\u00A0"}</motion.span>}
              {b.listType === "ol" && <motion.span variants={revealChar} style={{ display: "inline-block" }}>{(b.listIndex ?? 0) + 1}.{"\u00A0"}</motion.span>}
              <AnimatedChars chars={b.chars} />
            </motion.li>
          ))}
        </ListTag>
      );
    } else {
      const Tag = block.tag === "blockquote" ? motion.blockquote
        : block.tag === "h1" ? motion.h1
        : block.tag === "h2" ? motion.h2
        : block.tag === "h3" ? motion.h3
        : motion.p;
      rendered.push(
        <Tag
          key={rendered.length}
          className={blockStyles[block.tag] || blockStyles.p}
          variants={revealContainer}
          initial="hidden"
          animate="visible"
          style={{ overflow: "hidden" }}
        >
          <AnimatedChars chars={block.chars} />
        </Tag>
      );
      i++;
    }
  }

  return (
    <div className={rendered.length > 1 ? "space-y-5" : undefined} data-testid="slide-text">
      {rendered}
    </div>
  );
}

function ActionSlide({ content }: { content: string }) {
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
        onClick={() => setDone(!done)}
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
}: {
  dayNumber: number;
  prompt: string;
  existingAnswer?: string;
  onJournalChange?: (value: string) => void;
}) {
  const { mutate, isPending } = useCreateAnswer();
  const [journalContent, setJournalContent] = useState(existingAnswer || "");
  const [saved, setSaved] = useState(!!existingAnswer);

  useEffect(() => {
    setJournalContent(existingAnswer || "");
    setSaved(!!existingAnswer);
  }, [existingAnswer]);

  const handleChange = (value: string) => {
    setJournalContent(value);
    setSaved(false);
    onJournalChange?.(value);
  };

  const handleSave = () => {
    mutate(
      { dayNumber, content: journalContent },
      { onSuccess: () => setSaved(true) }
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
