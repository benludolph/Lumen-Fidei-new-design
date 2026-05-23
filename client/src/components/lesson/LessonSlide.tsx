import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, CheckSquare, Circle, CheckCircle2, Send, CheckCircle, ArrowRight, X as XIcon, ExternalLink, Play, Pause, Volume2, User, Music, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";
import { useSendMessage } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import DOMPurify from "dompurify";
import { playAnswerCorrect, playWrongAnswer, playTimerComplete, playSendMessage } from "@/lib/sounds";
import { HtmlContent } from "@/components/ui/html-content";
import { ChatFlowSlide } from "./ChatFlowSlide";
import { CrossGridSlide } from "./CrossGridSlide";
import { StoryChoiceSlide } from "./StoryChoiceSlide";
import { ImageCarouselSlide } from "./ImageCarouselSlide";
import { BeforeAfterSlide } from "./BeforeAfterSlide";
import { PotBandageScene } from "./PotBandageScene";
import { CaptivityBuilderSlide } from "./CaptivityBuilderSlide";
import { ConfessionFinderSlide } from "./ConfessionFinderSlide";
import { GuidedPrayerProcessSlide } from "./GuidedPrayerProcessSlide";
import { getSectionById } from "@/components/workbook/section-definitions";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { WorkbookSummary, WorkbookStreakStatus, PrayerId } from "@shared/schema";
import WorkbookSectionSheet from "@/components/workbook/WorkbookSectionSheet";
import PrayerSheet from "@/components/workbook/PrayerSheet";

import folderImg from "@assets/Folder_1778623094806.png";

import answersImg from "@assets/Answers_desktop_1775146558812.webp";
import controlImg from "@assets/Control_desktop_1775146558812.webp";
import lovedImg from "@assets/Love_desktop_1775146558813.webp";

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
  | "scenario"
  | "chat_flow"
  | "path_selector"
  | "cross_grid"
  | "story_choice"
  | "image_carousel"
  | "before_after"
  | "scripture_practice"
  | "knowledge_quiz"
  | "scene"
  | "captivity_builder"
  | "confession_finder"
  | "pdf_download"
  | "guided_prayer_process"
  | "workbook_link"
  | "workbook_session"
  | "prayer_link";


export interface QuizData {
  questions: { question: string; options: string[] }[];
  results: Record<string, { title: string; description: string }>;
}

export interface KnowledgeQuizData {
  intro: { title: string; subtitle?: string };
  questions: { question: string; options: string[]; correctIndex: number }[];
  conclusion: string;
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

function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function VimeoEmbed({ videoId, originalUrl }: { videoId: string; originalUrl: string }) {
  return (
    <div className="space-y-2">
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
          title="Video"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      <a
        href={originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-[var(--white-50)] hover:text-[var(--white-80)] transition-colors"
        data-testid="link-vimeo-external"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="type-caption-sm">If video doesn't load, watch on Vimeo</span>
      </a>
    </div>
  );
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
        className="flex items-center justify-center gap-1.5 text-[var(--white-50)] hover:text-[var(--white-80)] transition-colors"
        data-testid="link-youtube-external"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="type-caption-sm">If video doesn't load, watch on YouTube</span>
      </a>
    </div>
  );
}

function MusicCard({ url, title }: { url: string; title?: string }) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = url.trim();

  const youtubeId = extractYouTubeId(trimmed);
  if (youtubeId) {
    const watchUrl = trimmed.includes("youtube.com") || trimmed.includes("youtu.be")
      ? trimmed.split("&list=")[0].split("&start_radio")[0]
      : `https://www.youtube.com/watch?v=${youtubeId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          data-testid="button-music-card"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: expanded ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "12px",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 150ms ease",
          }}
        >
          <div style={{
            position: "relative",
            flexShrink: 0,
            width: "76px",
            height: "76px",
            borderRadius: "8px",
            overflow: "hidden",
            background: "#111",
          }}>
            <img
              src={thumbnailUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.38)",
            }}>
              {expanded
                ? <Pause style={{ width: 22, height: 22, color: "#fff" }} />
                : <Play style={{ width: 22, height: 22, color: "#fff", fill: "#fff" }} />
              }
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div style={{
                fontFamily: "'IvyOra Display', serif",
                fontSize: "1.1rem",
                fontWeight: 400,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {title}
              </div>
            )}
            <div style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.38)",
              marginTop: "5px",
            }}>
              {expanded ? "Tap to collapse" : "Tap to expand"}
            </div>
          </div>
          <Music style={{ width: 17, height: 17, color: "rgba(255,255,255,0.28)", flexShrink: 0 }} />
        </button>

        {expanded && (
          <div style={{ marginTop: "12px" }}>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title="Music"
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
              className="flex items-center justify-center gap-1.5 text-[var(--white-50)] hover:text-[var(--white-80)] transition-colors mt-2"
              data-testid="link-youtube-music-external"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="type-caption-sm">Open in YouTube</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  if (/\.mp3(?:$|[?#])/i.test(trimmed)) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Music style={{ width: 20, height: 20, color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
          {title && (
            <div style={{
              fontFamily: "'IvyOra Display', serif",
              fontSize: "1.05rem",
              color: "rgba(255,255,255,0.9)",
            }}>
              {title}
            </div>
          )}
        </div>
        <audio
          controls
          src={trimmed}
          data-testid="audio-music-player"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      className="type-body-xl text-[#00b57a] underline break-all hover:text-[#00d490]"
    >
      {title || trimmed}
    </a>
  );
}

function MediaContent({ text, mediaType, title }: { text: string; mediaType?: string; title?: string }) {
  if (!text) return null;

  const trimmed = text.trim();

  if (mediaType === "music") {
    return <MusicCard url={trimmed} title={title} />;
  }

  const youtubeId = extractYouTubeId(trimmed);
  if (youtubeId) {
    return <YouTubeEmbed videoId={youtubeId} originalUrl={trimmed} />;
  }

  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return <VimeoEmbed videoId={vimeoId} originalUrl={trimmed} />;
  }

  const isVideoUrl = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(trimmed);
  if (isVideoUrl) {
    return (
      <div style={{ width: "100%", borderRadius: "10px", overflow: "hidden", background: "#000" }}>
        <video
          src={trimmed}
          autoPlay
          loop
          muted
          playsInline
          controls
          data-testid="media-video"
          style={{ width: "100%", display: "block", maxHeight: "55vh", objectFit: "contain" }}
        />
      </div>
    );
  }

  if (trimmed.startsWith("/api/images/") || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(trimmed)) {
    return (
      <div style={{ width: "100%", maxHeight: "35vh", borderRadius: "10px", overflow: "hidden" }}>
        <img
          src={trimmed}
          alt=""
          style={{ width: "100%", height: "100%", maxHeight: "35vh", objectFit: "cover", display: "block" }}
          data-testid="media-image"
        />
      </div>
    );
  }

  if (trimmed.startsWith("http")) {
    if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(trimmed)) {
      return (
        <div style={{ width: "100%", maxHeight: "35vh", borderRadius: "10px", overflow: "hidden" }}>
          <img
            src={trimmed}
            alt=""
            style={{ width: "100%", height: "100%", maxHeight: "35vh", objectFit: "cover", display: "block" }}
            data-testid="media-image"
          />
        </div>
      );
    }
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="type-body-xl text-[#00b57a] underline break-all hover:text-[#00d490]"
      >
        {trimmed}
      </a>
    );
  }

  return <p className="type-body-xl whitespace-pre-wrap text-[var(--white-80)]">{text}</p>;
}

function parseMediaContent(content: string): { url: string; text: string; mediaType?: string; title?: string } {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.url === "string") {
      return {
        url: parsed.url,
        text: parsed.text || "",
        mediaType: parsed.mediaType || undefined,
        title: parsed.title || undefined,
      };
    }
  } catch {}
  return { url: content, text: "" };
}

function MediaSlide({ content }: { content: string }) {
  const { url, text, mediaType, title } = useMemo(() => parseMediaContent(content), [content]);

  return (
    <div className="space-y-6" data-testid="slide-media">
      <MediaContent text={url} mediaType={mediaType} title={title} />
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
    return <p className="type-body-xl whitespace-pre-wrap text-[var(--white-80)]">{content}</p>;
  }

  return (
    <div className="space-y-5">
      {heading && (
        <p className="type-display-lg font-bold text-white">{heading}</p>
      )}
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggle(idx)}
            className={cn(
              "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors border",
              checked[idx]
                ? "bg-[var(--white-6)] border-[var(--white-10)] text-white"
                : "bg-transparent border-transparent text-[var(--white-70)] hover:bg-[var(--white-4)]"
            )}
            data-testid={`checkbox-option-${idx}`}
          >
            {checked[idx] ? (
              <CheckSquare className="w-5 h-5 text-[#00b57a] shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 shrink-0 mt-0.5 text-[var(--white-30)]" />
            )}
            <span className="type-body-xl leading-[1.4]">{option}</span>
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
    return <p className="type-body-xl whitespace-pre-wrap text-[var(--white-80)]">{content}</p>;
  }

  return (
    <div className="space-y-5">
      {heading && (
        <p className="type-display-lg font-bold text-white">{heading}</p>
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
              "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors border",
              selected === idx
                ? "bg-[var(--white-6)] border-[var(--white-10)] text-white"
                : "bg-transparent border-transparent text-[var(--white-70)] hover:bg-[var(--white-4)]"
            )}
            data-testid={`radio-option-${idx}`}
          >
            {selected === idx ? (
              <CheckCircle2 className="w-5 h-5 text-[#00b57a] shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--white-30)]" />
            )}
            <span className="type-body-xl leading-[1.4]">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const PATH_SELECTOR_ASSET_MAP: Record<string, string> = {
  answers: answersImg,
  control: controlImg,
  loved: lovedImg,
};

interface PathSelectorOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  nextContent: {
    type: string;
    content: string;
  };
}

interface PathSelectorData {
  headline: string;
  options: PathSelectorOption[];
}

function PathSelectorSlide({
  content,
  onPathSelected,
  onInteracted,
}: {
  content: string;
  onPathSelected?: (nextType: SlideType, nextContent: string) => void;
  onInteracted?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  let data: PathSelectorData = { headline: "", options: [] };
  try {
    data = JSON.parse(content);
  } catch {
    /* noop */
  }

  const handleSelect = (option: PathSelectorOption) => {
    setSelectedId(option.id);
    onInteracted?.();
    if (option.nextContent?.type && option.nextContent?.content) {
      onPathSelected?.(option.nextContent.type as SlideType, option.nextContent.content);
    }
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || data.options.length === 0) return;
    const cardWidth = el.scrollWidth / data.options.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIdx(Math.min(Math.max(idx, 0), data.options.length - 1));
  }, [data.options.length]);

  return (
    <div className="flex flex-col gap-5">
      {data.headline ? (
        <p className="type-display-md text-white" data-testid="path-selector-headline">
          {data.headline}
        </p>
      ) : null}

      {/* Mobile: peek-scroll carousel. Desktop: side-by-side flex. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        data-testid="path-selector-cards"
      >
        {data.options.map((option) => {
          const isSelected = selectedId === option.id;
          const imgSrc = option.imageUrl || PATH_SELECTOR_ASSET_MAP[option.id] || "";

          return (
            <button
              key={option.id}
              data-testid={`path-card-${option.id}`}
              onClick={() => handleSelect(option)}
              className={cn(
                "relative w-[85%] shrink-0 snap-start sm:w-auto sm:flex-1 sm:min-w-0 aspect-[200/232] cursor-pointer outline-none overflow-hidden",
                "transition-all duration-300 ease-out",
                isSelected
                  ? "grayscale-0"
                  : "grayscale hover:grayscale-0"
              )}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={option.label}
                  data-testid={`path-card-label-${option.id}`}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0f1011]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dot indicators — mobile only */}
      {data.options.length > 1 && (
        <div className="flex sm:hidden justify-center gap-2">
          {data.options.map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i === activeIdx
                  ? "w-4 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScripturePracticeSlide({
  content,
  onTimerComplete,
  alreadyDone,
  existingChunkIndex,
  onChunkSelect,
}: {
  content: string;
  onTimerComplete?: () => void;
  alreadyDone?: boolean;
  existingChunkIndex?: number;
  onChunkSelect?: (idx: number) => void;
}) {
  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return {
        duration: typeof parsed.duration === "number" ? parsed.duration : 180,
        text: typeof parsed.text === "string" ? parsed.text : "",
        audioUrl: typeof parsed.audioUrl === "string" && parsed.audioUrl ? parsed.audioUrl : undefined,
        reference: typeof parsed.reference === "string" ? parsed.reference : "",
        chunks: Array.isArray(parsed.chunks) && parsed.chunks.length > 0 ? parsed.chunks : [""],
        reflectionDuration: typeof parsed.reflectionDuration === "number" ? parsed.reflectionDuration : 120,
        reflectionTitle: typeof parsed.reflectionTitle === "string" && parsed.reflectionTitle
          ? parsed.reflectionTitle
          : "Stay with this and bring it to God.\nReflect on the thoughts that come up.",
      };
    } catch {
      return {
        duration: 180,
        text: "",
        audioUrl: undefined,
        reference: "",
        chunks: [""],
        reflectionDuration: 120,
        reflectionTitle: "Stay with this and bring it to God.\nExplore the thoughts that come up.",
      };
    }
  }, [content]);

  const initialTab: 0 | 1 | 2 = alreadyDone ? 2 : (existingChunkIndex !== undefined ? 2 : 0);
  const initialMaxUnlocked: 0 | 1 | 2 = alreadyDone ? 2 : (existingChunkIndex !== undefined ? 2 : 0);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(initialTab);
  const [maxUnlocked, setMaxUnlocked] = useState<0 | 1 | 2>(initialMaxUnlocked);

  const [tab1Remaining, setTab1Remaining] = useState(alreadyDone ? 0 : data.duration);
  const tab1TimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tab1CompletedRef = useRef(!!alreadyDone);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(existingChunkIndex ?? null);
  const [hoveredChunkIndex, setHoveredChunkIndex] = useState<number | null>(null);

  const [tab3Started, setTab3Started] = useState(!!alreadyDone);
  const [tab3Remaining, setTab3Remaining] = useState(alreadyDone ? 0 : data.reflectionDuration);
  const tab3TimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tab3CompletedRef = useRef(!!alreadyDone);

  useEffect(() => {
    if (alreadyDone) {
      setTab1Remaining(0);
      tab1CompletedRef.current = true;
      return;
    }
    if (data.duration <= 0) {
      setTab1Remaining(0);
      tab1CompletedRef.current = true;
      setMaxUnlocked((m) => Math.max(m, 1) as 0 | 1 | 2);
      setActiveTab(1);
      return;
    }
    tab1TimerRef.current = setInterval(() => {
      setTab1Remaining((prev: number) => {
        if (prev <= 1) {
          if (tab1TimerRef.current) clearInterval(tab1TimerRef.current);
          if (!tab1CompletedRef.current) {
            tab1CompletedRef.current = true;
            playTimerComplete();
            setMaxUnlocked((m: 0 | 1 | 2) => Math.max(m, 1) as 0 | 1 | 2);
            setActiveTab(1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tab1TimerRef.current) clearInterval(tab1TimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!tab3Started) return;
    if (alreadyDone) {
      setTab3Remaining(0);
      tab3CompletedRef.current = true;
      onTimerComplete?.();
      return;
    }
    if (data.reflectionDuration <= 0) {
      setTab3Remaining(0);
      tab3CompletedRef.current = true;
      onTimerComplete?.();
      return;
    }
    setTab3Remaining(data.reflectionDuration);
    tab3CompletedRef.current = false;
    tab3TimerRef.current = setInterval(() => {
      setTab3Remaining((prev: number) => {
        if (prev <= 1) {
          if (tab3TimerRef.current) clearInterval(tab3TimerRef.current);
          if (!tab3CompletedRef.current) {
            tab3CompletedRef.current = true;
            playTimerComplete();
            onTimerComplete?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tab3TimerRef.current) clearInterval(tab3TimerRef.current);
    };
  }, [tab3Started]);

  const toggleAudio = useCallback(() => {
    if (!data.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(data.audioUrl);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [data.audioUrl, isPlaying]);

  const handleChunkSelect = (idx: number) => {
    setSelectedChunkIndex(idx);
    onChunkSelect?.(idx);
    setMaxUnlocked(2);
    setActiveTab(2);
    setTab3Started(true);
  };

  const tab1Progress = data.duration > 0 ? (data.duration - tab1Remaining) / data.duration : 1;
  const tab1Minutes = Math.floor(tab1Remaining / 60);
  const tab1Seconds = tab1Remaining % 60;
  const tab1Circumference = 2 * Math.PI * 54;
  const tab1Offset = tab1Circumference * (1 - tab1Progress);
  const tab1Done = tab1Remaining === 0;

  const tab3Progress = data.reflectionDuration > 0 ? (data.reflectionDuration - tab3Remaining) / data.reflectionDuration : 1;
  const tab3Minutes = Math.floor(tab3Remaining / 60);
  const tab3Seconds = tab3Remaining % 60;
  const tab3Circumference = 2 * Math.PI * 54;
  const tab3Offset = tab3Circumference * (1 - tab3Progress);
  const tab3Done = tab3Remaining === 0;

  const reflectionTitleLines = data.reflectionTitle.split("\n");

  const TAB_LABELS = ["Read once", "What stands out", "Reflect"] as const;

  return (
    <div className="flex flex-col gap-0 w-full" data-testid="slide-scripture-practice">
      <div className="flex items-center w-full mb-5" style={{ gap: 0 }}>
        {TAB_LABELS.map((label, i) => {
          const unlocked = i <= maxUnlocked;
          const active = i === activeTab;
          return (
            <button
              key={i}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && setActiveTab(i as 0 | 1 | 2)}
              data-testid={`tab-scripture-practice-${i}`}
              style={{
                flex: 1,
                paddingBottom: "10px",
                paddingTop: "10px",
                fontSize: "clamp(0.72rem, 2.8vw, 0.875rem)",
                fontFamily: "'Afacad', sans-serif",
                fontWeight: active ? 600 : 400,
                color: active ? "rgba(255,255,255,1)" : unlocked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                borderBottom: active ? "2px solid rgba(255,255,255,0.9)" : "2px solid rgba(255,255,255,0.1)",
                background: "transparent",
                cursor: unlocked ? "pointer" : "not-allowed",
                transition: "color 200ms ease, border-color 200ms ease",
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Persistent 3-circle row ── */}
      <div className="flex items-center justify-around w-full mb-6">
        {/* Circle 1 — Tab 1 timer */}
        <div style={{ transition: "opacity 300ms ease", opacity: activeTab === 0 ? 1 : 0.28 }}>
          <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--white-10)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={tab1Done ? "#00b57a" : "var(--white-70)"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={tab1Circumference}
                strokeDashoffset={tab1Offset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {tab1Done
                ? <CheckCircle className="w-8 h-8 text-[#00b57a]" />
                : <span className="font-bold text-white tabular-nums" style={{ fontSize: "clamp(1rem, 4vw, 1.25rem)", fontFamily: "'Afacad', sans-serif" }}>
                    {tab1Minutes}:{tab1Seconds.toString().padStart(2, "0")}
                  </span>
              }
            </div>
          </div>
        </div>

        {/* Circle 2 — Select (tab 2 indicator) */}
        <div style={{ transition: "opacity 300ms ease", opacity: activeTab === 1 ? 1 : maxUnlocked >= 1 ? 0.28 : 0.18 }}>
          <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--white-10)" strokeWidth="6" />
              {selectedChunkIndex !== null && (
                <circle cx="60" cy="60" r="54" fill="none" stroke="#00b57a" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={tab1Circumference} strokeDashoffset={0} />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {selectedChunkIndex !== null
                ? <CheckCircle className="w-8 h-8 text-[#00b57a]" />
                : <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.75)" }}>
                    Select
                  </span>
              }
            </div>
          </div>
        </div>

        {/* Circle 3 — Tab 3 timer */}
        <div style={{ transition: "opacity 300ms ease", opacity: activeTab === 2 ? 1 : maxUnlocked >= 2 ? 0.28 : 0.18 }}>
          <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--white-10)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={tab3Done ? "#00b57a" : "var(--white-70)"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={tab3Circumference}
                strokeDashoffset={tab3Started ? tab3Offset : tab3Circumference}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {tab3Done
                ? <CheckCircle className="w-8 h-8 text-[#00b57a]" />
                : <span className="font-bold text-white tabular-nums" style={{ fontSize: "clamp(1rem, 4vw, 1.25rem)", fontFamily: "'Afacad', sans-serif" }}>
                    {tab3Minutes}:{tab3Seconds.toString().padStart(2, "0")}
                  </span>
              }
            </div>
          </div>
        </div>
      </div>

      {activeTab === 0 && (
        <div className="flex flex-col gap-5" data-testid="scripture-practice-tab-read">

          {data.text && (
            <div className="w-full">
              {isHtmlContent(data.text) ? (
                <HtmlContent content={data.text} className="slide-text-content space-y-5" />
              ) : (
                <div
                  style={{
                    borderLeft: "3px solid rgba(255,255,255,0.15)",
                    paddingLeft: "20px",
                    fontFamily: "'Afacad', sans-serif",
                    fontStyle: "italic",
                    fontSize: "1.25rem",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: "1.65",
                  }}
                >
                  {data.text.split("\n").filter(Boolean).map((line: string, i: number) => (
                    <p key={i} style={{ margin: 0 }}>{line}</p>
                  ))}
                  {data.reference && (
                    <div className="flex justify-end w-full mt-3">
                      <span
                        style={{
                          fontFamily: "'Afacad', sans-serif",
                          fontWeight: 700,
                          fontStyle: "normal",
                          fontSize: "1rem",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        — {data.reference}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {data.audioUrl && (
            <button
              onClick={toggleAudio}
              className={cn(
                "w-fit flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-sans type-body-md font-medium border",
                isPlaying
                  ? "bg-[var(--white-15)] text-white border-[var(--white-20)] shadow-md"
                  : "bg-[var(--white-5)] text-[var(--white-70)] border-[var(--white-10)] hover:bg-[var(--white-10)]"
              )}
              data-testid="button-practice-audio-toggle"
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
        </div>
      )}

      {activeTab === 1 && (
        <div className="flex flex-col gap-5" data-testid="scripture-practice-tab-select">
          <h2
            style={{
              fontFamily: "'IvyOra Display', serif",
              fontSize: "clamp(1.15rem, 4vw, 1.55rem)",
              fontWeight: 400,
              color: "rgba(255,255,255,0.88)",
              lineHeight: "1.35",
              margin: 0,
            }}
          >
            Now read it again. Notice if anything stands out, or evokes an emotion. Tap the word or phrase that stands out to you.
          </h2>
          <div
            style={{
              borderLeft: "3px solid rgba(255,255,255,0.15)",
              paddingLeft: "20px",
              fontFamily: "'Afacad', sans-serif",
              fontStyle: "italic",
              fontSize: "1.25rem",
              color: "rgba(255,255,255,0.8)",
              lineHeight: "1.65",
            }}
          >
            {data.chunks.map((chunk: string, i: number) => {
              const isSelected = selectedChunkIndex === i;
              const isHovered = hoveredChunkIndex === i && !isSelected;
              return (
                <span
                  key={i}
                  onClick={() => handleChunkSelect(i)}
                  onMouseEnter={() => setHoveredChunkIndex(i)}
                  onMouseLeave={() => setHoveredChunkIndex(null)}
                  data-testid={`scripture-practice-chunk-${i}`}
                  style={{
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(212, 175, 55, 0.22)"
                      : isHovered
                      ? "rgba(255,255,255,0.07)"
                      : "transparent",
                    color: isSelected ? "#e8d5a3" : "rgba(255,255,255,0.8)",
                    transition: "background 150ms ease, color 150ms ease",
                    borderRadius: "3px",
                    padding: "1px 3px",
                    textDecoration: isSelected ? "none" : "underline",
                    textDecorationStyle: isSelected ? undefined : "dotted",
                    textDecorationColor: isSelected ? undefined : "rgba(111,111,111,0.8)",
                    WebkitBoxDecorationBreak: "clone",
                    boxDecorationBreak: "clone" as React.CSSProperties["boxDecorationBreak"],
                  }}
                >
                  {chunk}
                </span>
              );
            })}
          </div>

          {data.reference && (
            <div className="flex justify-end w-full">
              <span
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.01em",
                }}
              >
                — {data.reference}
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="flex flex-col gap-6" data-testid="scripture-practice-tab-reflect">
          <div className="w-full flex flex-col gap-0">
            {reflectionTitleLines.map((line: string, i: number) => (
              <h2
                key={i}
                className="leading-[1.3] text-left"
                style={{
                  fontFamily: "'IvyOra Display', serif",
                  fontWeight: 500,
                  fontSize: "clamp(1.375rem, 4.5vw, 1.625rem)",
                  color: "rgba(255,255,255,1)",
                  margin: 0,
                }}
              >
                {line}
              </h2>
            ))}
          </div>

          {selectedChunkIndex !== null && (
            <div className="w-full flex flex-col gap-4">
              <div
                style={{
                  borderLeft: "3px solid rgba(255,255,255,0.15)",
                  paddingLeft: "20px",
                  fontFamily: "'Afacad', sans-serif",
                  fontStyle: "italic",
                  fontSize: "1.25rem",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: "1.65",
                }}
              >
                {data.chunks.map((chunk: string, i: number) => {
                  const isSelected = i === selectedChunkIndex;
                  return (
                    <span
                      key={i}
                      style={{
                        background: isSelected ? "rgba(212, 175, 55, 0.22)" : "transparent",
                        color: isSelected ? "#e8d5a3" : "rgba(255,255,255,0.8)",
                        borderRadius: "3px",
                        padding: "1px 3px",
                        textDecoration: isSelected ? "none" : "underline",
                        textDecorationStyle: isSelected ? undefined : "dotted",
                        textDecorationColor: isSelected ? undefined : "rgba(111,111,111,0.8)",
                        WebkitBoxDecorationBreak: "clone",
                        boxDecorationBreak: "clone" as React.CSSProperties["boxDecorationBreak"],
                      }}
                    >
                      {chunk}
                    </span>
                  );
                })}
              </div>

              {data.reference && (
                <div className="flex justify-end w-full">
                  <span
                    style={{
                      fontFamily: "'Afacad', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    — {data.reference}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
  mentorPhotoUrl?: string | null;
  mentorName?: string | null;
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
  // chat_flow specific
  chatFlowContextKey?: string;
  chatFlowTotalSlides?: number;
  chatFlowSlideIndex?: number;
  onChatFlowComplete?: () => void;
  onChatFlowExit?: () => void;
  // path_selector specific
  onPathSelected?: (nextType: SlideType, nextContent: string) => void;
  // scripture_practice specific
  practiceChunkIndex?: number;
  onPracticeChunkSelect?: (chunkIndex: number) => void;
  // knowledge_quiz specific
  onKnowledgeQuizComplete?: () => void;
  // confession_finder / session vars
  sessionVars?: Record<string, unknown>;
  onSaveSessionVar?: (key: string, value: unknown) => void;
  // guided_prayer_process specific
  guidedPrayerSlideIndex?: number;
}

export function LessonSlide({
  type,
  content,
  dayNumber,
  existingAnswer,
  onJournalChange,
  direction,
  mentorId,
  mentorPhotoUrl,
  mentorName,
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
  chatFlowContextKey,
  chatFlowTotalSlides = 1,
  chatFlowSlideIndex = 0,
  onChatFlowComplete,
  onChatFlowExit,
  onPathSelected,
  practiceChunkIndex,
  onPracticeChunkSelect,
  onKnowledgeQuizComplete,
  sessionVars = {},
  onSaveSessionVar,
  guidedPrayerSlideIndex,
}: LessonSlideProps) {

  function resolveVars(template: string, vars: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
      const parts = path.trim().split(".");
      let val: unknown = vars;
      for (const part of parts) {
        if (val == null || typeof val !== "object") return "";
        val = (val as Record<string, unknown>)[part];
      }
      return val != null ? String(val) : "";
    });
  }
  const animationClass =
    direction === "forward"
      ? "lesson-slide-in-right"
      : "lesson-slide-in-left";

  // knowledge_quiz renders inside the standard slide card with its own internal progress
  if (type === "knowledge_quiz") {
    return (
      <div
        className={cn("min-h-full flex flex-col", animationClass)}
        data-testid="lesson-slide-knowledge_quiz"
      >
        <KnowledgeQuizSlide
          content={content}
          onComplete={onKnowledgeQuizComplete || (() => {})}
        />
      </div>
    );
  }

  // scene takes over the entire slide area with its own interactive UI
  if (type === "scene") {
    return (
      <div
        className={cn("flex-1 flex flex-col overflow-hidden", animationClass)}
        data-testid="lesson-slide-scene"
      >
        <PotBandageScene onComplete={onTimerComplete} />
      </div>
    );
  }

  // chat_flow takes over the entire slide area with its own UI
  if (type === "chat_flow") {
    return (
      <div
        className={cn("flex-1 flex flex-col overflow-hidden", animationClass)}
        data-testid="lesson-slide-chat_flow"
      >
        <ChatFlowSlide
          content={resolveVars(content, sessionVars)}
          contextKey={chatFlowContextKey || `chat-flow-${dayNumber}`}
          totalSlides={chatFlowTotalSlides}
          slideIndex={chatFlowSlideIndex}
          mentorPhotoUrl={mentorPhotoUrl}
          mentorName={mentorName}
          onComplete={() => {
            onInteracted?.();
            onChatFlowComplete?.();
          }}
          onExit={onChatFlowExit || (() => {})}
        />
      </div>
    );
  }

  // guided_prayer_process takes over the full slide area with its own multi-step UI
  if (type === "guided_prayer_process") {
    return (
      <div
        className={cn("flex-1 flex flex-col overflow-hidden", animationClass)}
        data-testid="lesson-slide-guided_prayer_process"
      >
        <GuidedPrayerProcessSlide
          content={content}
          dayNumber={dayNumber}
          slideIndex={guidedPrayerSlideIndex ?? 0}
          onInteracted={onInteracted}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex-1", type === "before_after" ? "h-full" : "", type === "story_choice" ? "overflow-visible" : type === "image_carousel" ? "overflow-hidden" : "overflow-y-auto", animationClass)}
      data-testid={`lesson-slide-${type}`}
    >
      <div className={cn("flex flex-col", type === "before_after" ? "h-full" : "min-h-full", (type === "story_choice" || type === "before_after") ? "justify-start" : "justify-center")}>
        {type === "text" ? (
          <TextSlide content={resolveVars(content, sessionVars)} />
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
          <MentorMessageSlide content={resolveVars(content, sessionVars)} mentorId={mentorId} onInteracted={onInteracted} />
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
        ) : type === "path_selector" ? (
          <PathSelectorSlide
            content={content}
            onPathSelected={onPathSelected}
            onInteracted={onInteracted}
          />
        ) : type === "cross_grid" ? (
          <CrossGridSlide content={content} onInteracted={onInteracted} />
        ) : type === "story_choice" ? (
          <StoryChoiceSlide content={content} onInteracted={onInteracted} />
        ) : type === "image_carousel" ? (
          <ImageCarouselSlide content={content} onInteracted={onInteracted} />
        ) : type === "before_after" ? (
          <BeforeAfterSlide content={content} onInteracted={onInteracted} />
        ) : type === "scripture_practice" ? (
          <ScripturePracticeSlide
            content={content}
            onTimerComplete={onTimerComplete}
            alreadyDone={timerAlreadyDone}
            existingChunkIndex={practiceChunkIndex}
            onChunkSelect={onPracticeChunkSelect}
          />
        ) : type === "captivity_builder" ? (
          (() => {
            const intro = (() => { try { return JSON.parse(content).intro || ""; } catch { return ""; } })();
            return (
              <div className="space-y-6">
                {intro && (
                  <p className="type-body-xl leading-[1.4] text-[var(--white-80)]">{intro}</p>
                )}
                <CaptivityBuilderSlide
                  dayNumber={dayNumber}
                  existingAnswer={existingAnswer}
                  onInteracted={onInteracted}
                />
              </div>
            );
          })()
        ) : type === "confession_finder" ? (
          <ConfessionFinderSlide
            content={content}
            mentorId={mentorId}
            onSaveSessionVar={onSaveSessionVar}
            onInteracted={onInteracted}
          />
        ) : type === "pdf_download" ? (
          <PdfDownloadSlide content={content} onInteracted={onInteracted} />
        ) : type === "workbook_link" ? (
          <WorkbookLinkSlide
            content={content}
            dayNumber={dayNumber}
            onInteracted={onInteracted}
          />
        ) : type === "workbook_session" ? (
          <WorkbookSessionSlide
            content={content}
            onInteracted={onInteracted}
          />
        ) : type === "prayer_link" ? (
          <PrayerLinkSlide content={content} onInteracted={onInteracted} />
        ) : (
          <TextSlide content={content} />
        )}
      </div>
    </div>
  );
}

function RevealStep({ children, isNew }: { children: ReactNode; isNew: boolean }) {
  const [visible, setVisible] = useState(!isNew);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isNew) return;
    let scrollT: ReturnType<typeof setTimeout>;
    const t = setTimeout(() => {
      setVisible(true);
      scrollT = setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }, 30);
    return () => {
      clearTimeout(t);
      clearTimeout(scrollT);
    };
  }, [isNew]);
  return (
    <div ref={ref} className={cn("transition-all duration-500", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
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
        <h1 className="type-display-lg font-bold text-white">
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
                  <div className="w-12 h-12 rounded-xl bg-[var(--white-8)] shrink-0 flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--white-40)]" />
                  </div>
                )}
                <p className="type-body-xl font-medium text-[var(--white-80)] pt-2">
                  {step.text}
                </p>
              </div>
            </RevealStep>
            {i < shown.length - 1 && (
              <div className="flex flex-col items-start ml-5 py-2 gap-[5px]">
                <div className="w-[3px] h-[5px] rounded-full bg-[var(--white-20)]" />
                <div className="w-[3px] h-[5px] rounded-full bg-[var(--white-20)]" />
                <div className="w-[3px] h-[5px] rounded-full bg-[var(--white-20)]" />
                <div className="w-[3px] h-[5px] rounded-full bg-[var(--white-20)]" />
                <div className="w-[3px] h-[5px] rounded-full bg-[var(--white-20)]" />
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
    if (isHtmlContent(content)) return content;
    const lines = content.split("\n").filter(Boolean);
    return lines.map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join("");
  }, [content]);

  return (
    <HtmlContent
      content={html}
      className="slide-text-content space-y-5"
      data-testid="slide-text"
    />
  );
}

function ActionSlide({ content, onInteracted }: { content: string; onInteracted?: () => void }) {
  const [done, setDone] = useState(false);
  const isHtml = isHtmlContent(content);

  return (
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[200px]" data-testid="slide-action">
      {isHtml ? (
        <HtmlContent content={content} className="type-body-xl text-[var(--white-80)] text-center leading-[1.4]" />
      ) : (
        <p className="type-body-xl text-[var(--white-80)] text-center whitespace-pre-wrap leading-[1.4]">
          {content}
        </p>
      )}
      <Button
        size="lg"
        onClick={() => {
          setDone(!done);
          if (!done) onInteracted?.();
        }}
        className={cn(
          "gap-2 font-sans",
          done
            ? "bg-[#00b57a]/10 text-[#00b57a] border border-[#00b57a]/30 hover:bg-[#00b57a]/20"
            : "bg-[var(--surface-float)] text-white border border-[var(--white-10)] hover:bg-[var(--surface-raised)]"
        )}
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
  };

  const handleSave = () => {
    mutate(
      { dayNumber, content: journalContent },
      {
        onSuccess: () => {
          setSaved(true);
          lastSavedContent.current = journalContent;
          if (!interactedRef.current) {
            interactedRef.current = true;
            onInteracted?.();
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6" data-testid="slide-text-input">
      {isHtmlContent(prompt) ? (
        <HtmlContent content={prompt} className="type-body-xl leading-[1.4] text-[var(--white-80)]" />
      ) : (
        <p className="type-body-xl leading-[1.4] text-[var(--white-80)]">
          {prompt}
        </p>
      )}
      <Textarea
        value={journalContent}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your response here..."
        className="min-h-[150px] w-full bg-[var(--white-5)] border-[var(--white-10)] text-white placeholder:text-[var(--white-30)] type-body-lg focus:border-[var(--white-20)] focus-visible:ring-0 focus-visible:ring-offset-0"
        data-testid="input-text-response"
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending || !journalContent.trim() || saved}
          className="bg-[var(--surface-float)] text-white hover:bg-[var(--surface-raised)] border border-[var(--white-10)]"
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
            <HtmlContent content={content} className="type-body-xl leading-[1.4] text-[var(--white-80)] break-words" />
          ) : (
            <p className="type-body-xl leading-[1.4] text-[var(--white-80)] break-words">{content}</p>
          )}
        </div>
        <p className="type-body-sm text-[#6a6a6a]">No mentor assigned yet.</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4" data-testid="slide-mentor-message-sent">
        <div className="w-16 h-16 rounded-full bg-[#00b57a]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#00b57a]" />
        </div>
        <p className="type-display-md font-bold text-white">Message Sent!</p>
        <p className="type-body-lg text-[#6a6a6a]">Your mentor will see it in your conversation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="slide-mentor-message">
      <div className="overflow-y-auto max-h-[40vh]" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
        {isHtmlContent(content) ? (
          <HtmlContent content={content} className="type-body-xl leading-[1.4] text-[var(--white-80)] break-words" />
        ) : (
          <p className="type-body-xl leading-[1.4] text-[var(--white-80)] break-words">{content}</p>
        )}
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message to your mentor..."
        className="min-h-[150px] w-full bg-[var(--white-5)] border-[var(--white-10)] text-white placeholder:text-[var(--white-30)] type-body-lg focus:border-[var(--white-20)]"
        data-testid="input-mentor-message"
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={isPending || !message.trim()}
          className="gap-2 bg-[var(--surface-float)] text-white hover:bg-[var(--surface-raised)] border border-[var(--white-10)]"
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
      <div className="relative w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--white-10)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={done ? "#00b57a" : "var(--white-70)"}
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
            <span className="type-display-lg font-bold text-white tabular-nums">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {!done && (
        <p className="type-body-lg text-[#6a6a6a]">
          Take a moment to reflect on this passage
        </p>
      )}

      {audioSrc && (
        <button
          onClick={toggleAudio}
          className={cn(
            "w-fit flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-sans type-body-md font-medium border",
            isPlaying
              ? "bg-[var(--white-15)] text-white border-[var(--white-20)] shadow-md"
              : "bg-[var(--white-5)] text-[var(--white-70)] border-[var(--white-10)] hover:bg-[var(--white-10)]"
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
        <p className="type-display-lg font-bold text-white">
          {data.question}
        </p>
        <div className="space-y-2 px-0.5 py-0.5">
          {data.options.map((option, idx) => {
            const answered = selectedIndex !== null;
            const isThis = selectedIndex === idx;
            const isCorrectOption = idx === data.correctIndex;

            let optionStyle = "bg-transparent border border-[var(--white-8)] hover:bg-[var(--white-4)]";
            let circleStyle = "bg-[var(--white-8)] text-[var(--white-50)] border-2 border-transparent";

            if (answered) {
              if (isThis && isCorrect) {
                optionStyle = "bg-[#00b57a]/10 ring-2 ring-[#00b57a] border-transparent";
                circleStyle = "bg-[#00b57a] text-white border-2 border-[#00b57a]";
              } else if (isThis && !isCorrect) {
                optionStyle = "bg-[#ef4444]/10 ring-2 ring-[#ef4444] border-transparent";
                circleStyle = "bg-[#ef4444] text-white border-2 border-[#ef4444]";
              } else if (isCorrectOption) {
                optionStyle = "bg-[#00b57a]/5 ring-1 ring-[#00b57a]/40 border-transparent";
                circleStyle = "bg-[#00b57a]/20 text-[#00b57a] border-2 border-[#00b57a]/40";
              } else {
                optionStyle = "bg-transparent opacity-40 border border-[var(--white-8)]";
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
                <span className="type-body-xl leading-[1.4] text-[var(--white-80)] pt-1">
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
              ? "bg-[#0a1f17] border-[#00b57a]/30"
              : "bg-[#1f0a0a] border-[#ef4444]/30"
          )}
          data-testid="kc-feedback-banner"
        >
          <div className="max-w-[540px] mx-auto flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className={cn(
                "type-body-xl font-bold mb-1",
                isCorrect ? "text-[#00b57a]" : "text-[#ef4444]"
              )} data-testid="kc-feedback-title">
                {isCorrect ? "CORRECT!" : "INCORRECT"}
              </p>
              {!isCorrect && (
                <p className="type-body-sm font-medium text-[#ef4444]/80 mb-1" data-testid="kc-correct-answer">
                  Answer: {data.options[data.correctIndex]}
                </p>
              )}
              {data.explanation && (
                <div className="mt-1">
                  <p className={cn(
                    "type-caption-sm font-semibold mb-0.5",
                    isCorrect ? "text-[#00b57a]/70" : "text-[#ef4444]/70"
                  )}>
                    Explanation:
                  </p>
                  {isHtmlContent(data.explanation) ? (
                    <HtmlContent content={data.explanation} className="type-body-sm text-[var(--white-70)] leading-relaxed" />
                  ) : (
                    <p className="type-body-sm text-[var(--white-70)] leading-relaxed" data-testid="kc-explanation">
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
// Knowledge Quiz Slide
// ============================================================

function KnowledgeQuizSlide({ content, onComplete }: { content: string; onComplete: () => void }) {
  const data = useMemo<KnowledgeQuizData>(() => {
    try {
      const parsed = JSON.parse(content);
      return {
        intro: {
          title: parsed.intro?.title || "Test Your Knowledge",
          subtitle: parsed.intro?.subtitle || "",
        },
        questions: Array.isArray(parsed.questions) ? parsed.questions.map((q: any) => ({
          question: q.question || "",
          options: Array.isArray(q.options) ? q.options : [],
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        })) : [],
        conclusion: parsed.conclusion || "",
      };
    } catch {
      return { intro: { title: "Test Your Knowledge", subtitle: "" }, questions: [], conclusion: "" };
    }
  }, [content]);

  type Phase = "intro" | "question" | "results";
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedbackState, setFeedbackState] = useState<"none" | "correct" | "wrong">("none");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const totalQuestions = data.questions.length;
  const currentQuestion = data.questions[questionIndex];

  const handleAnswer = useCallback((idx: number) => {
    if (feedbackState !== "none") return;
    const isCorrect = idx === currentQuestion.correctIndex;
    setSelectedIndex(idx);
    if (isCorrect) {
      playAnswerCorrect();
      setFeedbackState("correct");
      setScore(s => s + 1);
    } else {
      playWrongAnswer();
      setFeedbackState("wrong");
      setShaking(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => setShaking(false), 500);
    }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setFeedbackState("none");
      setSelectedIndex(null);
      const nextIndex = questionIndex + 1;
      if (nextIndex >= totalQuestions) {
        setPhase("results");
      } else {
        setQuestionIndex(nextIndex);
      }
    }, 1000);
  }, [feedbackState, currentQuestion, questionIndex, totalQuestions]);

  if (phase === "intro") {
    return (
      <div
        className="min-h-full flex flex-col items-center justify-center px-6 py-10 gap-8"
        data-testid="kq-intro-screen"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="type-display-xl text-white text-center">
            {data.intro.title}
          </p>
          {data.intro.subtitle && (
            <p className="type-body-xl text-[var(--white-60)] text-center">
              {data.intro.subtitle}
            </p>
          )}
        </div>
        <Button
          onClick={() => setPhase("question")}
          className="bg-[#00b57a] hover:bg-[#00a06a] text-white px-8 py-2.5 rounded-xl uppercase tracking-widest text-sm font-normal shadow-sm"
          data-testid="button-kq-start"
        >
          Start
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (phase === "question" && currentQuestion) {
    const progress = ((questionIndex + 1) / totalQuestions) * 100;
    return (
      <div className="flex flex-col px-6 py-6 gap-6" data-testid="kq-question-screen">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="type-caption-sm text-[var(--white-50)]">
              {questionIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--white-8)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00b57a] transition-all duration-300"
              style={{ width: `${progress}%` }}
              data-testid="kq-progress-bar"
            />
          </div>
        </div>

        <p className="type-display-lg font-bold text-white leading-snug" data-testid="kq-question-text">
          {currentQuestion.question}
        </p>

        <div
          className={cn(
            "space-y-3 px-0.5 py-0.5 transition-transform",
            shaking && "animate-[shake_0.4s_ease]"
          )}
        >
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const answered = feedbackState !== "none";
            let optionStyle = "bg-transparent border border-[var(--white-8)] hover:bg-[var(--white-4)]";
            let circleStyle = "bg-[var(--white-8)] text-[var(--white-50)]";

            if (answered && isSelected) {
              if (feedbackState === "correct") {
                optionStyle = "bg-[#00b57a]/15 ring-2 ring-[#00b57a] border-transparent";
                circleStyle = "bg-[#00b57a] text-white";
              } else {
                optionStyle = "bg-[#ef4444]/15 ring-2 ring-[#ef4444] border-transparent";
                circleStyle = "bg-[#ef4444] text-white";
              }
            } else if (answered) {
              optionStyle = "bg-transparent opacity-40 border border-[var(--white-8)]";
            }

            const labels = ["A", "B", "C", "D"];
            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => handleAnswer(idx)}
                className={cn(
                  "flex items-center gap-3 w-full text-left p-4 rounded-xl transition-all duration-200",
                  optionStyle,
                  answered && "cursor-default"
                )}
                data-testid={`kq-option-${idx}`}
              >
                <span className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                  circleStyle
                )}>
                  {answered && isSelected && feedbackState === "correct" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : answered && isSelected && feedbackState === "wrong" ? (
                    <XIcon className="w-5 h-5" />
                  ) : (
                    labels[idx] || String(idx + 1)
                  )}
                </span>
                <span className="type-body-xl text-[var(--white-80)] leading-snug">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-6 py-10 text-center gap-8"
      data-testid="kq-results-screen"
    >
      <div className="space-y-4">
        <p className="type-display-xl font-bold text-white" data-testid="kq-score-text">
          You got {score} out of {totalQuestions}!
        </p>
        {data.conclusion && (
          <p className="type-body-xl text-[var(--white-60)] leading-relaxed" data-testid="kq-conclusion">
            {data.conclusion}
          </p>
        )}
      </div>
      <Button
        onClick={onComplete}
        className="bg-[#00b57a] hover:bg-[#00a06a] text-white px-8 py-3 text-base rounded-xl"
        data-testid="button-kq-continue"
      >
        Continue
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
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
        <h3 className="type-display-md font-bold text-white">Response Received</h3>
        <p className="type-body-lg text-[#6a6a6a] max-w-[320px]">
          Thank you for sharing your experience. You can continue.
        </p>
      </div>
    );
  }

  if (data.questions.length === 0) {
    return (
      <div className="slide-text-content" data-testid="slide-survey-empty">
        <p className="text-[var(--white-40)] italic">Survey not configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="slide-survey">
      {/* Header */}
      {(data.title || data.description) && (
        <div className="space-y-2">
          {data.title && (
            <h2 className="type-display-lg font-bold text-white leading-tight">
              {data.title}
            </h2>
          )}
          {data.description && (
            <p className="type-body-lg text-[#6a6a6a] leading-[1.4]">
              {data.description}
            </p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="space-y-3" data-testid={`survey-question-${idx}`}>
            <p className="type-body-xl font-semibold text-[var(--white-90)]">
              <span className="text-[#00b57a] mr-1.5">{idx + 1}.</span>
              {q.label}
            </p>

            {q.type === "single_select" && q.options && (
              <div className="grid grid-cols-2 gap-2">
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={cn(
                        "flex items-center justify-center w-full text-center px-3 py-4 min-h-[72px] rounded-xl border-2 transition-all duration-150 font-sans type-body-lg leading-snug",
                        selected
                          ? "border-[#00b57a] bg-[#00b57a]/10 text-white"
                          : "border-[var(--white-10)] bg-transparent text-[var(--white-70)] hover:border-[var(--white-20)]"
                      )}
                      data-testid={`survey-option-${idx}-${opt}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "multi_select" && q.options && (
              <div className="space-y-2">
                <p className="type-body-sm text-[#6a6a6a]">Select all that apply</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map(opt => {
                    const selected = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMulti(q.id, opt)}
                        className={cn(
                          "flex items-center justify-center w-full text-center px-3 py-4 min-h-[72px] rounded-xl border-2 transition-all duration-150 font-sans type-body-lg leading-snug",
                          selected
                            ? "border-[#00b57a] bg-[#00b57a]/10 text-white"
                            : "border-[var(--white-10)] bg-transparent text-[var(--white-70)] hover:border-[var(--white-20)]"
                        )}
                        data-testid={`survey-option-${idx}-${opt}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
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
                          "flex-1 h-12 rounded-xl border-2 font-bold font-sans type-body-lg transition-all duration-150",
                          selected
                            ? "border-[#00b57a] bg-[#00b57a] text-white shadow-sm"
                            : "border-[var(--white-10)] bg-transparent text-[var(--white-50)] hover:border-[var(--white-25)] hover:text-[var(--white-80)]"
                        )}
                        data-testid={`survey-rating-${idx}-${n}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between px-0.5">
                  <span className="type-caption-sm text-white">Not at all</span>
                  <span className="type-caption-sm text-white">Very much</span>
                </div>
              </div>
            )}

            {q.type === "text" && (
              <Textarea
                value={(answers[q.id] as string) || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Write your response here..."
                rows={3}
                className="font-sans type-body-lg resize-none bg-[var(--white-5)] border-[var(--white-10)] text-white placeholder:text-[var(--white-30)] focus:border-[#00b57a] focus:ring-[#00b57a]/20"
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
          "w-full h-12 font-sans font-semibold type-body-lg transition-all",
          allAnswered
            ? "bg-[#00b57a] hover:bg-[#00a06a] text-white"
            : "bg-[var(--white-5)] text-[var(--white-20)] cursor-not-allowed"
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
      <p className="type-body-sm font-medium text-[#6a6a6a]" data-testid="text-quiz-progress">
        Question {questionIndex + 1} of {quizData.questions.length}
      </p>
      <p className="type-display-lg font-bold text-white">
        {q.question}
      </p>
      <div className="space-y-2 px-0.5 py-0.5">
        {q.options.map((option, idx) => {
          const letter = QUIZ_LETTERS[idx] || String.fromCharCode(65 + idx);
          const isSelected = currentAnswer === letter;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswer?.(letter)}
              className={cn(
                "flex items-start gap-3 w-full text-left p-4 rounded-xl transition-all duration-200 border",
                isSelected
                  ? "bg-[var(--white-6)] border-[var(--white-10)] ring-2 ring-[#00b57a]"
                  : "bg-transparent border-[var(--white-8)] hover:bg-[var(--white-4)]"
              )}
              data-testid={`quiz-option-${letter}`}
            >
              <span className={cn(
                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                isSelected
                  ? "bg-[#00b57a] text-white"
                  : "bg-[var(--white-8)] text-[var(--white-50)]"
              )}>
                {letter}
              </span>
              <span className="type-body-xl leading-[1.4] text-[var(--white-80)] pt-1">
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
        <p className="type-body-xl text-[#6a6a6a]">
          Go back and answer the questions to see your result.
        </p>
      ) : result ? (
        <>
          <h2 className="type-display-lg font-bold text-white leading-tight">
            {result.title}
          </h2>
          <p className="type-body-xl leading-[1.5] text-[var(--white-70)] max-w-[420px]">
            {result.description}
          </p>
        </>
      ) : (
        <p className="type-body-xl text-[var(--white-70)]">
          You answered {answered} of {total} questions.
        </p>
      )}
    </div>
  );
}

function WorkbookLinkSlide({
  content,
  onInteracted,
}: {
  content: string;
  dayNumber: number;
  onInteracted?: () => void;
}) {
  let sectionId: number | undefined;
  let label: string | undefined;
  try {
    const parsed = JSON.parse(content || "{}");
    if (typeof parsed.sectionId === "number") sectionId = parsed.sectionId;
    if (typeof parsed.label === "string" && parsed.label.trim()) label = parsed.label.trim();
  } catch {
    /* use defaults */
  }

  const section = sectionId != null ? getSectionById(sectionId) : undefined;
  const displayName = section?.name ?? label ?? "The Deliverance Workbook";

  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: summary = {} } = useQuery<WorkbookSummary>({
    queryKey: ["/api/workbook/summary"],
  });

  const sec = sectionId != null ? (summary as WorkbookSummary)[sectionId] : undefined;
  const isComplete = sec ? (sec.attested || sec.count > 0) : false;
  const entryCount = sec?.count ?? 0;

  const handleClose = async () => {
    setSheetOpen(false);
    if (sectionId != null) {
      try {
        const fresh = await queryClient.fetchQuery<WorkbookSummary>({
          queryKey: ["/api/workbook/summary"],
        });
        const newSec = fresh[sectionId];
        if (newSec && (newSec.attested || newSec.count > 0)) {
          onInteracted?.();
        }
      } catch {
        /* ignore */
      }
    } else {
      onInteracted?.();
    }
  };

  return (
    <>
      <div
        style={{
          borderRadius: "10px",
          border: `0.5px solid ${isComplete ? "rgba(100,210,130,0.2)" : "rgba(255,255,255,0.1)"}`,
          background: isComplete ? "rgba(100,210,130,0.04)" : "rgba(255,255,255,0.03)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.35)",
                margin: 0,
              }}
            >
              The Deliverance Workbook
            </p>
            {isComplete && (
              <CheckCircle2
                style={{ width: "13px", height: "13px", color: "rgba(100,210,130,0.75)", flexShrink: 0 }}
              />
            )}
          </div>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              marginBottom: isComplete ? "3px" : 0,
            }}
          >
            {displayName}
          </p>
          {isComplete && (
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.72rem",
                color: "rgba(100,210,130,0.6)",
                margin: 0,
              }}
            >
              {sec?.attested ? "Marked complete" : `${entryCount} ${entryCount === 1 ? "entry" : "entries"} saved`}
            </p>
          )}
        </div>
        {sectionId != null ? (
          <button
            data-testid="button-open-workbook"
            onClick={() => setSheetOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: isComplete ? "rgba(100,210,130,0.1)" : "rgba(255,255,255,0.08)",
              border: `0.5px solid ${isComplete ? "rgba(100,210,130,0.25)" : "rgba(255,255,255,0.15)"}`,
              cursor: "pointer",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: isComplete ? "rgba(100,210,130,0.9)" : "white",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isComplete ? "Review" : "Open Section"}
          </button>
        ) : (
          <a
            href="/resources/tools/freedom-workbook"
            data-testid="button-open-workbook"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              textDecoration: "none",
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "white",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Open Workbook
          </a>
        )}
      </div>
      <AnimatePresence>
        {sheetOpen && sectionId != null && (
          <WorkbookSectionSheet sectionId={sectionId} onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}

function WorkbookSessionSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  let sectionIds: number[] = [];
  let heading = "Your open work";
  let subheading = "Work through what you can.";
  try {
    const parsed = JSON.parse(content || "{}");
    if (Array.isArray(parsed.sectionIds)) sectionIds = parsed.sectionIds.filter((x: unknown) => typeof x === "number");
    if (typeof parsed.heading === "string" && parsed.heading.trim()) heading = parsed.heading.trim();
    if (typeof parsed.subheading === "string" && parsed.subheading.trim()) subheading = parsed.subheading.trim();
  } catch { /* use defaults */ }

  const { data: summary = {} } = useQuery<WorkbookSummary>({ queryKey: ["/api/workbook/summary"] });
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const sections = sectionIds.map(id => {
    const def = getSectionById(id);
    const sec = (summary as WorkbookSummary)[id];
    const isComplete = sec ? (sec.attested || sec.count > 0) : false;
    return { id, name: def?.name ?? `Section ${id}`, isComplete };
  });

  const openSections = sections.filter(s => !s.isComplete);
  const doneCount = sections.filter(s => s.isComplete).length;
  const totalCount = sections.length;

  const handleSectionClose = async (id: number) => {
    setOpenSectionId(null);
    await queryClient.invalidateQueries({ queryKey: ["/api/workbook/summary"] });
  };

  const handleDoneForNow = () => {
    setDismissed(true);
    onInteracted?.();
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: "'Freight Display Pro', Georgia, serif", fontSize: "1.35rem", fontWeight: 500, color: "white", margin: 0, marginBottom: "4px" }}>{heading}</h2>
          {totalCount > 0 && (
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              {dismissed || openSections.length === 0
                ? doneCount === totalCount
                  ? `All ${totalCount} sections complete`
                  : `${doneCount} of ${totalCount} sections complete`
                : `${openSections.length} section${openSections.length === 1 ? "" : "s"} still open — ${subheading}`}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sections.map(sec => (
            <div
              key={sec.id}
              style={{
                borderRadius: "10px",
                border: `0.5px solid ${sec.isComplete ? "rgba(100,210,130,0.2)" : "rgba(255,255,255,0.1)"}`,
                background: sec.isComplete ? "rgba(100,210,130,0.04)" : "rgba(255,255,255,0.03)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: "2px" }}>
                  The Deliverance Workbook
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.85)", margin: 0 }}>{sec.name}</p>
                  {sec.isComplete && <CheckCircle2 style={{ width: "13px", height: "13px", color: "rgba(100,210,130,0.75)", flexShrink: 0 }} />}
                </div>
              </div>
              <button
                data-testid={`button-open-section-${sec.id}`}
                onClick={() => setOpenSectionId(sec.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  background: sec.isComplete ? "rgba(100,210,130,0.1)" : "rgba(255,255,255,0.08)",
                  border: `0.5px solid ${sec.isComplete ? "rgba(100,210,130,0.25)" : "rgba(255,255,255,0.15)"}`,
                  cursor: "pointer",
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: sec.isComplete ? "rgba(100,210,130,0.9)" : "white",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {sec.isComplete ? "Review" : "Open section"}
              </button>
            </div>
          ))}
        </div>

        {!dismissed && openSections.length > 0 && (
          <div style={{ textAlign: "center", paddingTop: "4px" }}>
            <button
              data-testid="button-done-for-now"
              onClick={handleDoneForNow}
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                padding: "4px 8px",
              }}
            >
              Done for now — continue
            </button>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", margin: "6px 0 0", lineHeight: 1.4 }}>
              You don't have to finish everything today — whatever's left will be waiting at your next work session.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {openSectionId != null && (
          <WorkbookSectionSheet sectionId={openSectionId} onClose={() => handleSectionClose(openSectionId)} />
        )}
      </AnimatePresence>
    </>
  );
}

function PrayerLinkSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  let prayerId: PrayerId = "prayer_1";
  let label: string | undefined;
  try {
    const parsed = JSON.parse(content || "{}");
    if (parsed.prayerId === "prayer_1" || parsed.prayerId === "prayer_2" || parsed.prayerId === "prayer_3") {
      prayerId = parsed.prayerId;
    }
    if (typeof parsed.label === "string" && parsed.label.trim()) label = parsed.label.trim();
  } catch {
    /* use defaults */
  }

  const PRAYER_NAMES: Record<PrayerId, string> = {
    prayer_1: "Personal Deliverance Prayer",
    prayer_2: "Generational Renunciation Prayer",
    prayer_3: "Daily Prayer",
  };
  const PRAYER_SUBTITLES: Record<PrayerId, string> = {
    prayer_1: "Pray once, with intention, after working through the Workbook",
    prayer_2: "3-day binding prayer for generational and ancestral sins",
    prayer_3: "Ongoing daily prayer — your living armor",
  };

  const displayName = label || PRAYER_NAMES[prayerId];
  const subtitle = PRAYER_SUBTITLES[prayerId];

  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: streak } = useQuery<WorkbookStreakStatus>({
    queryKey: [`/api/workbook/streak/${prayerId}`],
  });

  const streakCount = streak?.count ?? 0;
  const isStarted = streakCount > 0;
  const isComplete = prayerId === "prayer_1" ? isStarted : prayerId === "prayer_2" ? streakCount >= 3 : false;

  const handleDone = () => {
    setSheetOpen(false);
    onInteracted?.();
  };

  const buttonLabel = isComplete ? "Pray Again" : isStarted && prayerId !== "prayer_1" ? "Continue" : "Begin Prayer";
  const borderColor = isComplete ? "rgba(100,210,130,0.2)" : isStarted ? "rgba(240,120,48,0.2)" : "rgba(255,255,255,0.1)";
  const bgColor = isComplete ? "rgba(100,210,130,0.04)" : isStarted ? "rgba(240,120,48,0.04)" : "rgba(255,255,255,0.03)";
  const btnBg = isComplete ? "rgba(100,210,130,0.1)" : isStarted ? "rgba(240,120,48,0.1)" : "rgba(255,255,255,0.08)";
  const btnBorder = isComplete ? "rgba(100,210,130,0.25)" : isStarted ? "rgba(240,120,48,0.25)" : "rgba(255,255,255,0.15)";
  const btnColor = isComplete ? "rgba(100,210,130,0.9)" : isStarted ? "rgba(240,120,48,0.9)" : "white";

  return (
    <>
      <div
        style={{
          borderRadius: "10px",
          border: `0.5px solid ${borderColor}`,
          background: bgColor,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.35)",
                margin: 0,
              }}
            >
              The Deliverance Workbook
            </p>
            {isComplete && (
              <CheckCircle2 style={{ width: "13px", height: "13px", color: "rgba(100,210,130,0.75)", flexShrink: 0 }} />
            )}
          </div>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              marginBottom: "4px",
            }}
          >
            {displayName}
          </p>
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.35)",
              margin: 0,
              marginBottom: isStarted && prayerId === "prayer_2" ? "8px" : 0,
            }}
          >
            {subtitle}
          </p>
          {prayerId === "prayer_2" && isStarted && (
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: i < streakCount ? "#F07830" : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.65rem", color: "rgba(240,120,48,0.7)", marginLeft: "4px" }}>
                Day {streakCount} of 3
              </span>
            </div>
          )}
          {prayerId === "prayer_3" && streakCount > 0 && (
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", color: "rgba(240,120,48,0.7)", margin: 0 }}>
              {streakCount} day{streakCount === 1 ? "" : "s"} streak
            </p>
          )}
        </div>
        <button
          data-testid="button-open-prayer"
          onClick={() => setSheetOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "6px",
            background: btnBg,
            border: `0.5px solid ${btnBorder}`,
            cursor: "pointer",
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: btnColor,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {buttonLabel}
        </button>
      </div>
      <AnimatePresence>
        {sheetOpen && (
          <PrayerSheet prayerId={prayerId} onClose={() => setSheetOpen(false)} onDone={handleDone} />
        )}
      </AnimatePresence>
    </>
  );
}

function PdfDownloadSlide({ content, onInteracted }: { content: string; onInteracted?: () => void }) {
  let data: { url: string; label: string } = { url: "", label: "" };
  try {
    const parsed = JSON.parse(content || "{}");
    data = {
      url: typeof parsed.url === "string" ? parsed.url : "",
      label: typeof parsed.label === "string" ? parsed.label : "",
    };
  } catch {
    /* use defaults */
  }

  const handleDownload = () => {
    onInteracted?.();
    if (data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 text-center">
      <p className="type-display-sm font-normal text-white leading-snug" style={{ fontFamily: "'Afacad', sans-serif" }}>
        Download this{data.label ? ` ${data.label}` : ""} pdf
      </p>
      <img
        src={folderImg}
        alt="PDF folder"
        className="w-[200px] select-none"
        draggable={false}
      />
      <button
        onClick={handleDownload}
        disabled={!data.url}
        className="inline-flex items-center gap-2 rounded-lg px-4 h-9 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#18181b" }}
        data-testid="button-pdf-download"
      >
        <Download className="w-4 h-4" style={{ color: "#fafafa" }} />
        <span style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 500, fontSize: "14px", color: "#fafafa", letterSpacing: "0.04em" }}>
          DOWNLOAD
        </span>
      </button>
    </div>
  );
}
