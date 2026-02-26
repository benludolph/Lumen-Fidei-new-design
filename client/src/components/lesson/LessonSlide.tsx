import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, CheckSquare, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";

export type SlideType =
  | "text"
  | "multi_select"
  | "single_select"
  | "media"
  | "text_input"
  | "action";

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
}

export function LessonSlide({
  type,
  content,
  dayNumber,
  existingAnswer,
  onJournalChange,
  direction,
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
        ) : (
          <TextSlide content={content} />
        )}
      </div>
    </div>
  );
}

function TextSlide({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);

  let wordIndex = 0;
  const paragraphs = lines.map((line) => {
    const tokens = line.split(" ").map((word) => ({
      word,
      idx: wordIndex++,
    }));
    return tokens;
  });

  return (
    <div className={lines.length > 1 ? "space-y-5" : undefined} data-testid="slide-text">
      {paragraphs.map((tokens, pIdx) => (
        <p key={pIdx} className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black flex flex-wrap">
          {tokens.map((t) => (
            <motion.span
              key={t.idx}
              className="inline-block mr-[0.3em]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: t.idx * 0.06,
                duration: 0.8,
                ease: [0.25, 0.4, 0.25, 1],
              }}
            >
              {t.word}
            </motion.span>
          ))}
        </p>
      ))}
    </div>
  );
}

function ActionSlide({ content }: { content: string }) {
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[200px]" data-testid="slide-action">
      <p className="text-xl font-['Afacad',sans-serif] text-black text-center whitespace-pre-wrap leading-[1.4]">
        {content}
      </p>
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
      <p className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black">
        {prompt}
      </p>
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
