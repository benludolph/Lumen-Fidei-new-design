import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus } from "lucide-react";
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
  | "concepts";

const SLIDE_TITLES: Record<SlideType, string> = {
  scripture: "Scripture",
  catechism: "Catechism",
  reflection: "Reflection",
  prayer: "Prayer",
  video: "Resource",
  song: "Song",
  journal: "Daily Response",
  concepts: "Key Concepts",
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
      className={cn("flex-1 overflow-y-auto px-4 sm:px-6 pb-24", animationClass)}
      data-testid={`lesson-slide-${type}`}
    >
      <div className="max-w-2xl mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Afacad',sans-serif] font-semibold text-lg sm:text-xl text-foreground">
            {SLIDE_TITLES[type]}
          </h2>
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
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
              className="h-7 w-7"
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
        ) : type === "scripture" ? (
          <Card data-testid="card-slide-scripture">
            <CardContent
              className={cn(
                "prose max-w-none text-muted-foreground leading-relaxed italic p-5 sm:p-8",
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
                "prose max-w-none text-muted-foreground leading-relaxed p-5 sm:p-8",
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
                "prose max-w-none text-muted-foreground leading-relaxed p-5 sm:p-8",
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
                "prose max-w-none text-muted-foreground p-5 sm:p-8",
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
                "prose max-w-none text-muted-foreground leading-relaxed p-5 sm:p-8",
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
      <CardHeader className="p-5 sm:p-8 pb-2">
        <CardTitle className="font-['Afacad',sans-serif] text-base sm:text-lg">
          Journal Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-8 pt-2">
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
          className="min-h-[150px] bg-white dark:bg-zinc-900 text-sm sm:text-base"
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
