import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Lightbulb } from "lucide-react";

const WEEK_DESCRIPTIONS: Record<number, string> = {
  1: "This week focuses on building your foundation — understanding who God truly is and how He relates to you personally.",
  2: "This week explores the human condition — why we struggle with sin, wounds, and the need for healing.",
  3: "This week is about encountering Jesus — as healer, deliverer, friend, and king.",
  4: "This week focuses on conversion and change — choosing a new direction with God.",
  5: "This week explores living the faith — through Scripture, Sacraments, and the Church.",
};

interface OverviewGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekNumber: number;
  weekTheme: string;
}

export function OverviewGuideModal({
  open,
  onOpenChange,
  weekNumber,
  weekTheme,
}: OverviewGuideModalProps) {
  const description = WEEK_DESCRIPTIONS[weekNumber] || WEEK_DESCRIPTIONS[1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[var(--surface-float)] border-white/10 text-white font-sans max-w-md"
        data-testid="dialog-overview-guide"
      >
        <DialogHeader>
          <DialogTitle
            className="type-display-sm text-white font-bold"
            data-testid="text-overview-guide-title"
          >
            Week {weekNumber}: {weekTheme}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="flex items-start gap-3" data-testid="section-week-description">
            <BookOpen className="w-5 h-5 text-white/60 mt-0.5 shrink-0" />
            <p className="type-body-lg text-white/80">
              {description}
            </p>
          </div>

          <div className="border-t border-white/10" />

          <div className="flex items-start gap-3" data-testid="section-how-it-works">
            <Lightbulb className="w-5 h-5 text-white/60 mt-0.5 shrink-0" />
            <div>
              <p className="type-body-lg text-white font-bold mb-1">How It Works</p>
              <p className="type-body-md text-white/80">
                Each day has a short lesson. Tap a day to begin. You'll move
                through several screens — a question to reflect on, a short
                teaching, scripture, an activity, and a closing thought. Complete
                them at your own pace.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
