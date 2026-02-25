import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNumber: number;
  dayTitle: string;
  morningCompleted: boolean;
  eveningCompleted: boolean;
  onSelect: (period: "morning" | "evening") => void;
}

export function PeriodSelectionDialog({
  open,
  onOpenChange,
  dayNumber,
  dayTitle,
  morningCompleted,
  eveningCompleted,
  onSelect,
}: PeriodSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-['Afacad',sans-serif] text-lg">
            Day {dayNumber}: {dayTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <button
            onClick={() => onSelect("morning")}
            data-testid="button-select-morning"
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
              "hover:bg-primary/5 hover:border-primary/30",
              morningCompleted && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
              morningCompleted ? "bg-green-100 dark:bg-green-900" : "bg-amber-50 dark:bg-amber-950"
            )}>
              <Sun className={cn("w-5 h-5", morningCompleted ? "text-green-600" : "text-amber-500")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Morning Meditation</p>
              <p className="text-xs text-muted-foreground">Scripture, meditation & prayer</p>
            </div>
            {morningCompleted && (
              <Check className="w-5 h-5 text-green-600 shrink-0" />
            )}
          </button>

          <button
            onClick={() => onSelect("evening")}
            data-testid="button-select-evening"
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
              "hover:bg-primary/5 hover:border-primary/30",
              eveningCompleted && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
              eveningCompleted ? "bg-green-100 dark:bg-green-900" : "bg-indigo-50 dark:bg-indigo-950"
            )}>
              <Moon className={cn("w-5 h-5", eveningCompleted ? "text-green-600" : "text-indigo-500")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Evening Meditation</p>
              <p className="text-xs text-muted-foreground">Catechism, reflection & examen</p>
            </div>
            {eveningCompleted && (
              <Check className="w-5 h-5 text-green-600 shrink-0" />
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
