import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Square, CheckSquare } from "lucide-react";
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

const SLIDE_TITLES: Record<SlideType, string> = {
  scripture: "Scripture",
  catechism: "Catechism",
  reflection: "Reflection",
  prayer: "Prayer",
  video: "Resource",
  song: "Song",
  journal: "Daily Response",
  concepts: "Key Concepts",
  hook: "Opening Question",
  teach: "Teaching",
  activity: "Activity",
  practice: "Practice",
  close: "Closing",
};

const FONT_SIZES = {
  small: { class: "text-sm", size: 14 },
  medium: { class: "text-base", size: 16 },
  large: { class: "text-lg", size: 18 },
  xlarge: { class: "text-xl", size: 20 },
};

type FontSizeKey = keyof typeof FONT_SIZES;

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
      <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
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

  return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
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

function CheckboxList({ content, fontSize }: { content: string; fontSize: FontSizeKey }) {
  const { heading, options } = parseCheckboxContent(content);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (options.length === 0) {
    return (
      <p className={cn("whitespace-pre-wrap leading-relaxed", FONT_SIZES[fontSize].class)}>
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {heading && (
        <p className={cn("font-semibold leading-relaxed", FONT_SIZES[fontSize].class)}>
          {heading}
        </p>
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
                ? "bg-primary/10 text-foreground"
                : "bg-muted/30 text-muted-foreground hover-elevate"
            )}
            data-testid={`checkbox-option-${idx}`}
          >
            {checked[idx] ? (
              <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className={cn("leading-relaxed", FONT_SIZES[fontSize].class)}>{option}</span>
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
  fontSize: FontSizeKey;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  direction: "forward" | "backward";
}

export function LessonSlide({
  type,
  content,
  dayNumber,
  existingAnswer,
  onJournalChange,
  fontSize,
  increaseFontSize,
  decreaseFontSize,
  direction,
}: LessonSlideProps) {
  const animationClass =
    direction === "forward"
      ? "lesson-slide-in-right"
      : "lesson-slide-in-left";

  return (
    <div
      className={cn("flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pb-28 sm:pb-24", animationClass)}
      data-testid={`lesson-slide-${type}`}
    >
      <div className="max-w-2xl mx-auto py-4 sm:py-6">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <h2 className="font-['Afacad',sans-serif] font-semibold text-base sm:text-lg md:text-xl text-foreground min-w-0 truncate">
            {SLIDE_TITLES[type]}
          </h2>
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={decreaseFontSize}
              disabled={fontSize === "small"}
              data-testid="button-font-decrease-slide"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-6 text-center">A</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={increaseFontSize}
              disabled={fontSize === "xlarge"}
              data-testid="button-font-increase-slide"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {type === "journal" ? (
          <JournalSlide
            dayNumber={dayNumber}
            prompt={content}
            existingAnswer={existingAnswer}
            onJournalChange={onJournalChange}
            fontSize={fontSize}
          />
        ) : type === "hook" ? (
          <Card
            className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30"
            data-testid="card-slide-hook"
          >
            <CardContent
              className={cn(
                "prose max-w-none leading-relaxed p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <CheckboxList content={content} fontSize={fontSize} />
            </CardContent>
          </Card>
        ) : type === "teach" ? (
          <Card data-testid="card-slide-teach">
            <CardContent
              className={cn(
                "prose max-w-none text-foreground leading-loose p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize === "small" ? "medium" : fontSize === "medium" ? "large" : fontSize === "large" ? "xlarge" : "xlarge"].class
              )}
            >
              {content.split("\n").filter(Boolean).map((paragraph, idx) => (
                <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
              ))}
            </CardContent>
          </Card>
        ) : type === "activity" ? (
          <Card
            className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30"
            data-testid="card-slide-activity"
          >
            <CardContent
              className={cn(
                "prose max-w-none leading-relaxed p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <CheckboxList content={content} fontSize={fontSize} />
            </CardContent>
          </Card>
        ) : type === "practice" ? (
          <Card data-testid="card-slide-practice">
            <CardContent className="p-4 sm:p-5 md:p-8">
              <div
                className={cn(
                  "border-l-4 border-primary bg-primary/5 rounded-r-lg p-4 sm:p-5",
                  FONT_SIZES[fontSize].class
                )}
              >
                <p className="font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : type === "close" ? (
          <div
            className="flex items-center justify-center min-h-[200px] py-8"
            data-testid="card-slide-close"
          >
            <div className="text-center max-w-lg px-6">
              <p
                className={cn(
                  "italic text-muted-foreground leading-relaxed whitespace-pre-wrap",
                  fontSize === "small" ? "text-lg" : fontSize === "medium" ? "text-xl" : fontSize === "large" ? "text-2xl" : "text-3xl"
                )}
              >
                {content}
              </p>
            </div>
          </div>
        ) : type === "scripture" ? (
          <Card data-testid="card-slide-scripture">
            <CardContent
              className={cn(
                "prose max-w-none text-muted-foreground leading-relaxed italic p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <p className="whitespace-pre-wrap">{content}</p>
            </CardContent>
          </Card>
        ) : type === "concepts" ? (
          <Card data-testid="card-slide-concepts">
            <CardContent
              className={cn(
                "prose max-w-none text-muted-foreground leading-relaxed p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <p className="whitespace-pre-wrap">{content}</p>
            </CardContent>
          </Card>
        ) : type === "prayer" ? (
          <Card
            className="bg-primary/5 border-primary/20"
            data-testid="card-slide-prayer"
          >
            <CardContent
              className={cn(
                "prose max-w-none text-muted-foreground leading-relaxed p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <MediaContent text={content} />
            </CardContent>
          </Card>
        ) : type === "song" ? (
          <Card
            className="bg-secondary/30"
            data-testid="card-slide-song"
          >
            <CardContent
              className={cn(
                "prose max-w-none text-muted-foreground p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <MediaContent text={content} />
            </CardContent>
          </Card>
        ) : (
          <Card data-testid={`card-slide-${type}`}>
            <CardContent
              className={cn(
                "prose max-w-none text-muted-foreground leading-relaxed p-4 sm:p-5 md:p-8",
                FONT_SIZES[fontSize].class
              )}
            >
              <MediaContent text={content} />
            </CardContent>
          </Card>
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
  fontSize,
}: {
  dayNumber: number;
  prompt: string;
  existingAnswer?: string;
  onJournalChange?: (value: string) => void;
  fontSize: FontSizeKey;
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
    <Card className="border-primary/20 bg-primary/5" data-testid="card-slide-journal">
      <CardHeader className="p-4 sm:p-5 md:p-8 pb-2">
        <CardTitle className="font-['Afacad',sans-serif] text-base sm:text-lg">
          Journal Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5 md:p-8 pt-2">
        <p
          className={cn(
            "italic text-muted-foreground",
            FONT_SIZES[fontSize].class
          )}
        >
          {prompt}
        </p>
        <Textarea
          value={journalContent}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your reflection here..."
          className="min-h-[120px] sm:min-h-[150px] w-full bg-white dark:bg-zinc-900 text-sm sm:text-base"
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
      </CardContent>
    </Card>
  );
}
