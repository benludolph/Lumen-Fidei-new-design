import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Video } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TestimonyImageUpload } from "@/features/admin/testimonies/TestimonyImageUpload";
import type { AdminTestimony } from "@/features/admin/testimonies/types";
import { TestimonyRow } from "@/features/admin/testimonies/TestimonyRow";

export function TestimoniesAdminView() {
  const { toast } = useToast();
  const { data: testimonies = [], isLoading, refetch } = useQuery<AdminTestimony[]>({
    queryKey: ["/api/admin/testimonies"],
  });
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newFullVideoUrl, setNewFullVideoUrl] = useState("");
  const [newPosition, setNewPosition] = useState("");

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/testimonies", {
      position: parseInt(newPosition) || (testimonies.length + 1),
      personName: newName,
      description: newDescription,
      thumbnailUrl: newThumbnailUrl,
      fullVideoUrl: newFullVideoUrl,
    }),
    onSuccess: () => {
      toast({ title: "Testimony created" });
      setAddingNew(false); setNewName(""); setNewDescription(""); setNewThumbnailUrl(""); setNewFullVideoUrl(""); setNewPosition("");
      refetch();
    },
    onError: () => toast({ title: "Error creating testimony", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Testimonies</h2>
          <p className="text-sm text-muted-foreground">Manage participant testimonies and their unlock conditions</p>
        </div>
        <Button onClick={() => setAddingNew(a => !a)} data-testid="button-add-testimony"><Plus className="w-4 h-4 mr-2" /> Add Testimony</Button>
      </div>

      {addingNew && (
        <Card data-testid="form-new-testimony">
          <CardHeader><CardTitle className="text-base">New Testimony</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input type="number" placeholder="Position" value={newPosition} onChange={e => setNewPosition(e.target.value)} className="w-24" data-testid="input-new-testimony-position" />
              <Input placeholder="Person name" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1" data-testid="input-new-testimony-name" />
            </div>
            <Input placeholder="Description" value={newDescription} onChange={e => setNewDescription(e.target.value)} data-testid="input-new-testimony-description" />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Thumbnail Photo</p>
              <TestimonyImageUpload currentUrl={newThumbnailUrl} onUploaded={setNewThumbnailUrl} />
            </div>
            <Input placeholder="Full video URL (optional)" value={newFullVideoUrl} onChange={e => setNewFullVideoUrl(e.target.value)} data-testid="input-new-testimony-full-video" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setAddingNew(false)} data-testid="button-cancel-new-testimony">Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newName} data-testid="button-save-new-testimony">Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : testimonies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No testimonies yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonies.map(t => <TestimonyRow key={t.id} testimony={t} onSaved={refetch} />)}
        </div>
      )}
    </div>
  );
}
