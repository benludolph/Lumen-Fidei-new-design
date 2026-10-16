import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Trash2, ChevronUp, ChevronDown, Edit2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TestimonyImageUpload } from "@/features/admin/testimonies/TestimonyImageUpload";
import type { AdminTestimony } from "@/features/admin/testimonies/types";
import { TestimonyPartRow } from "@/features/admin/testimonies/TestimonyPartRow";

export function TestimonyRow({ testimony, onSaved }: { testimony: AdminTestimony; onSaved: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [personName, setPersonName] = useState(testimony.personName);
  const [description, setDescription] = useState(testimony.description);
  const [thumbnailUrl, setThumbnailUrl] = useState(testimony.thumbnailUrl);
  const [fullVideoUrl, setFullVideoUrl] = useState(testimony.fullVideoUrl);
  const [position, setPosition] = useState(testimony.position.toString());

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/testimonies/${testimony.id}`, {
      position: parseInt(position), personName, description, thumbnailUrl, fullVideoUrl,
    }),
    onSuccess: () => { toast({ title: "Testimony updated" }); setEditing(false); onSaved(); },
    onError: () => toast({ title: "Error updating testimony", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/testimonies/${testimony.id}`),
    onSuccess: () => { toast({ title: "Testimony deleted" }); onSaved(); },
    onError: () => toast({ title: "Error deleting testimony", variant: "destructive" }),
  });

  return (
    <Card data-testid={`card-admin-testimony-${testimony.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input type="number" placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} className="w-20" data-testid="input-testimony-position" />
                  <Input placeholder="Person name" value={personName} onChange={e => setPersonName(e.target.value)} className="flex-1" data-testid="input-testimony-name" />
                </div>
                <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} data-testid="input-testimony-description" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Thumbnail Photo</p>
                  <TestimonyImageUpload currentUrl={thumbnailUrl} onUploaded={setThumbnailUrl} />
                </div>
                <Input placeholder="Full video URL (optional)" value={fullVideoUrl} onChange={e => setFullVideoUrl(e.target.value)} data-testid="input-testimony-full-video" />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-testimony">Cancel</Button>
                  <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-testimony">Save</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">#{testimony.position}</p>
                <h3 className="font-semibold text-base">{testimony.personName}</h3>
                {testimony.description && <p className="text-sm text-muted-foreground mt-0.5">{testimony.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{testimony.parts.length} part{testimony.parts.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
          {!editing && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)} data-testid={`button-expand-admin-testimony-${testimony.id}`}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} data-testid={`button-edit-testimony-${testimony.id}`}><Edit2 className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid={`button-delete-testimony-${testimony.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parts</p>
          {testimony.parts.map(part => (
            <TestimonyPartRow key={part.id} part={part} testimonyId={testimony.id} onSaved={onSaved} />
          ))}
          <TestimonyPartRow testimonyId={testimony.id} onSaved={onSaved} />
        </CardContent>
      )}
    </Card>
  );
}
