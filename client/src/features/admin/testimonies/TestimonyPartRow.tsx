import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AdminTestimonyPart } from "@/features/admin/testimonies/types";

const UNLOCK_KEY_OPTIONS = [
  { value: "prelim", label: "Prelim — All Preliminary Modules" },
  { value: "week-1-first", label: "Week 1 — First lesson" },
  { value: "week-1-last", label: "Week 1 — Last lesson" },
  { value: "week-2-first", label: "Week 2 — First lesson" },
  { value: "week-2-last", label: "Week 2 — Last lesson" },
  { value: "week-3-first", label: "Week 3 — First lesson" },
  { value: "week-3-last", label: "Week 3 — Last lesson" },
  { value: "week-4-first", label: "Week 4 — First lesson" },
  { value: "week-4-last", label: "Week 4 — Last lesson" },
  { value: "week-5-first", label: "Week 5 — First lesson" },
  { value: "week-5-last", label: "Week 5 — Last lesson" },
];

export function TestimonyPartRow({
  part,
  testimonyId,
  onSaved,
}: {
  part?: AdminTestimonyPart;
  testimonyId: number;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isNew = !part;
  const [partNumber, setPartNumber] = useState(part?.partNumber?.toString() ?? "");
  const [title, setTitle] = useState(part?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(part?.videoUrl ?? "");
  const [unlockKey, setUnlockKey] = useState(part?.unlockKey ?? "prelim");
  const [editing, setEditing] = useState(isNew);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { partNumber: parseInt(partNumber), title, videoUrl, unlockKey };
      if (isNew) {
        await apiRequest("POST", `/api/admin/testimonies/${testimonyId}/parts`, body);
      } else {
        await apiRequest("PATCH", `/api/admin/testimonies/${testimonyId}/parts/${part!.id}`, body);
      }
    },
    onSuccess: () => {
      toast({ title: isNew ? "Part added" : "Part updated" });
      onSaved();
      if (isNew) { setPartNumber(""); setTitle(""); setVideoUrl(""); setUnlockKey("prelim"); }
      else setEditing(false);
    },
    onError: () => toast({ title: "Error saving part", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/testimonies/${testimonyId}/parts/${part!.id}`),
    onSuccess: () => { toast({ title: "Part deleted" }); onSaved(); },
    onError: () => toast({ title: "Error deleting part", variant: "destructive" }),
  });

  if (!isNew && !editing) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-muted/30" data-testid={`row-part-${part!.id}`}>
        <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium flex-shrink-0">Part {part!.partNumber}</span>
        <span className="text-sm text-muted-foreground flex-1 truncate">{part!.title || "(no title)"}</span>
        <Badge variant="outline" className="text-xs flex-shrink-0">{part!.unlockKey}</Badge>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} data-testid={`button-edit-part-${part!.id}`}><Edit2 className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid={`button-delete-part-${part!.id}`}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-background" data-testid={isNew ? "form-new-part" : `form-edit-part-${part?.id}`}>
      <div className="flex gap-2">
        <Input type="number" placeholder="Part #" value={partNumber} onChange={e => setPartNumber(e.target.value)} className="w-20" data-testid="input-part-number" />
        <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} className="flex-1" data-testid="input-part-title" />
      </div>
      <Input placeholder="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} data-testid="input-part-video-url" />
      <Select value={unlockKey} onValueChange={setUnlockKey}>
        <SelectTrigger data-testid="select-unlock-key"><SelectValue placeholder="Unlock key" /></SelectTrigger>
        <SelectContent>
          {UNLOCK_KEY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex gap-2 justify-end">
        {!isNew && <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-edit-part">Cancel</Button>}
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !partNumber} data-testid="button-save-part">
          {isNew ? "Add Part" : "Save"}
        </Button>
      </div>
    </div>
  );
}
