import { BookOpen } from "lucide-react";

interface StickyWeekHeaderProps {
  weekNumber: number;
  weekTheme: string;
  onGuideClick?: () => void;
  inPrelimSection?: boolean;
}

export function StickyWeekHeader({ weekNumber, weekTheme, onGuideClick, inPrelimSection }: StickyWeekHeaderProps) {
  return (
    <div
      className="sticky top-0 z-20 bg-[#18181b] rounded-lg p-4 shadow-lg"
      data-testid="sticky-week-header"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-sans font-bold text-white/70 type-body-md leading-6">
            Initial 30 Days
          </p>
          <p className="font-sans font-bold text-white text-[18px] leading-7 truncate">
            {inPrelimSection ? "Getting Started" : `Week ${weekNumber}: ${weekTheme}`}
          </p>
        </div>
        {onGuideClick && (
          <button
            onClick={onGuideClick}
            className="flex items-center gap-2 shrink-0 mt-1 group"
            data-testid="button-overview-guide"
          >
            <BookOpen className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            <span className="font-sans font-bold text-white/80 type-caption-sm group-hover:text-white transition-colors">
              Overview & Guide
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
