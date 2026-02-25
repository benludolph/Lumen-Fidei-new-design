import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";

export type SlideType =
  | "scripture"
  | "catechism"
  | "reflection"
  | "prayer"
  | "video"
  | "song"
  | "journal"
  | "concepts"
  | "hook"
  | "teach"
  | "activity"
  | "practice"
  | "close";

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

  const youtubeId = extractYouTubeId(text);
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

  if (text.startsWith("http")) {
    return (
      <a
        href={text}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline break-all"
      >
        {text}
      </a>
    );
  }

  return <p className="whitespace-pre-wrap leading-[1.4]">{text}</p>;
}

function parseCheckboxContent(content: string): { heading: string; options: string[] } {
  const lines = content.split("\n");
  const headingLines: string[] = [];
  const options: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("\u2610")) {
      options.push(trimmed.replace(/^\u2610\s*/, ""));
    } else if (trimmed.length > 0) {
      headingLines.push(trimmed);
    }
  }

  return { heading: headingLines.join("\n"), options };
}

function CheckboxList({ content }: { content: string }) {
  const { heading, options } = parseCheckboxContent(content);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (options.length === 0) {
    return <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif]">{content}</p>;
  }

  return (
    <div className="space-y-4">
      {heading && (
        <p className="font-semibold leading-[1.4] text-xl font-['Afacad',sans-serif]">{heading}</p>
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
        {type === "journal" ? (
          <JournalSlide
            dayNumber={dayNumber}
            prompt={content}
            existingAnswer={existingAnswer}
            onJournalChange={onJournalChange}
          />
        ) : type === "hook" || type === "activity" ? (
          <CheckboxList content={content} />
        ) : type === "close" ? (
          <div className="flex items-center justify-center" data-testid="card-slide-close">
            <p className="italic text-black/60 leading-[1.4] text-2xl font-['Afacad',sans-serif] text-center whitespace-pre-wrap">
              {content}
            </p>
          </div>
        ) : type === "scripture" ? (
          <div data-testid="card-slide-scripture">
            <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif] italic text-black/70">
              {content}
            </p>
          </div>
        ) : type === "teach" ? (
          <div className="space-y-6" data-testid="card-slide-teach">
            {content.split("\n").filter(Boolean).map((paragraph, idx) => (
              <p key={idx} className="leading-[1.4] text-xl font-['Afacad',sans-serif] text-black">
                {paragraph}
              </p>
            ))}
          </div>
        ) : type === "video" || type === "prayer" || type === "song" || type === "catechism" || type === "reflection" ? (
          <div data-testid={`card-slide-${type}`}>
            <MediaContent text={content} />
          </div>
        ) : type === "concepts" ? (
          <div data-testid="card-slide-concepts">
            <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif] text-black font-bold">
              {content}
            </p>
          </div>
        ) : type === "practice" ? (
          <div data-testid="card-slide-practice">
            <p className="whitespace-pre-wrap leading-[1.4] text-xl font-['Afacad',sans-serif] text-black font-semibold">
              {content}
            </p>
          </div>
        ) : (
          <div data-testid={`card-slide-${type}`}>
            <MediaContent text={content} />
          </div>
        )}
      </div>
    </div>
  );
}

function JournalSlide({
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
    <div className="space-y-6" data-testid="card-slide-journal">
      <p className="italic text-black/60 leading-[1.4] text-xl font-['Afacad',sans-serif]">
        {prompt}
      </p>
      <Textarea
        value={journalContent}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your reflection here..."
        className="min-h-[150px] w-full bg-white border-black/10 text-base font-['Afacad',sans-serif]"
        data-testid="input-journal-slide"
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending || !journalContent.trim() || saved}
          data-testid="button-save-journal-slide"
        >
          {isPending ? "Saving..." : saved ? "Saved" : "Save Reflection"}
        </Button>
      </div>
    </div>
  );
}
