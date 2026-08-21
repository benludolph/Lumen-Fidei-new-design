import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LessonFlow } from "@/components/lesson/LessonFlow";
import { RecordData } from "./types";
import { X } from "lucide-react";

export function LessonPreview({ lesson, onClose }: { lesson: RecordData; onClose: () => void }) {
  const [width, setWidth] = useState<"phone" | "tablet" | "desktop">("desktop");
  const [day, setDay] = useState("1");
  const [prerequisites, setPrerequisites] = useState(true);
  const [exempt, setExempt] = useState(false);
  const frameWidth = width === "phone" ? "max-w-[390px]" : width === "tablet" ? "max-w-[768px]" : "max-w-full";
  const content = {
    id: 0, dayNumber: -1, weekNumber: 0, centralTheme: lesson.title,
    subtitle: lesson.subtitle || null, imageUrl: lesson.imageUrl || null,
    slides: (lesson.blocks || []).map((block: RecordData) => ({ type: block.type, content: block.content || "" })),
    completionMessage: lesson.completionMessage || null,
    openingPrayerText: lesson.openingPrayerText || null, openingPrayerAudio: lesson.openingPrayerAudio || null,
    closingPrayerText: lesson.closingPrayerText || null, closingPrayerAudio: lesson.closingPrayerAudio || null,
  };
  return (
    <div className="fixed inset-0 z-50 bg-[hsl(182_24%_18%/.7)] p-3 sm:p-8">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[hsl(42_32%_96%)]">
        <div className="flex items-center justify-between border-b px-4 py-3"><div><p className="text-xs uppercase tracking-[.2em] text-[hsl(24_67%_48%)]">Simulation only</p><p className="font-serif text-lg">{lesson.title}</p></div><Button size="icon" variant="ghost" onClick={onClose} aria-label="Close preview"><X size={18} /></Button></div>
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 text-xs">
          <label>Frame <select value={width} onChange={(e) => setWidth(e.target.value as typeof width)} className="ml-1 rounded border bg-background px-2 py-1"><option value="phone">Phone</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select></label>
          <label>Cohort day <input className="ml-1 w-14 rounded border bg-background px-2 py-1" type="number" min="1" value={day} onChange={(e) => setDay(e.target.value)} /></label>
          <label><input type="checkbox" checked={prerequisites} onChange={(e) => setPrerequisites(e.target.checked)} /> Prerequisites met</label>
          <label><input type="checkbox" checked={exempt} onChange={(e) => setExempt(e.target.checked)} /> Workbook exemption</label>
          <span className="ml-auto text-muted-foreground">{prerequisites ? `Available on day ${day}` : "Unavailable until prerequisites are met"}{exempt ? " · workbook exempt" : ""}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3"><div className={`mx-auto h-full overflow-hidden rounded-xl border bg-black ${frameWidth}`}><LessonFlow key={`${lesson.key}-${width}-${day}-${prerequisites}-${exempt}`} content={content as any} dayNumber={-1} previewMode onExit={onClose} onComplete={onClose} canSkipPrayer /></div></div>
      </div>
    </div>
  );
}