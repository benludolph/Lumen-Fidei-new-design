import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateTrack, useTracks, useUpdateTrack } from "@/hooks/use-tracks";
import { getSelectedTrackId, setSelectedTrackId } from "@/lib/track-context";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save } from "lucide-react";

export function TrackManagement({ children }: { children: (trackId: string) => React.ReactNode }) {
  const { user } = useAuth();
  const tracks = useTracks();
  const create = useCreateTrack();
  const update = useUpdateTrack();
  const { toast } = useToast();
  const [selected, setSelected] = useState(getSelectedTrackId);
  const [name, setName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const track = tracks.data?.find(item => item.id === selected);

  const selectTrack = (id: string) => {
    if (id === selected) return;
    setSelectedTrackId(id);
    // Remove all previous curriculum data before the editor mounts again.
    queryClient.clear();
    queryClient.setQueryData(["/api/user"], user);
    if (tracks.data) queryClient.setQueryData(["/api/tracks"], tracks.data);
    setSelected(id);
  };

  useEffect(() => {
    setName(track?.name || "");
  }, [track?.id, track?.name]);

  useEffect(() => {
    if (tracks.data?.length && !tracks.data.some(item => item.id === selected)) {
      selectTrack(tracks.data[0].id);
    }
  }, [tracks.data, selected]);

  const showError = (error: unknown) => toast({
    title: "Track could not be saved",
    description: error instanceof Error ? error.message : "Please try again.",
    variant: "destructive",
  });

  if (tracks.isLoading) return <Skeleton className="h-28 w-full rounded-lg" />;
  if (tracks.isError) return <Card><CardContent className="p-5 space-y-3">
    <p>Tracks could not be loaded.</p>
    <Button variant="outline" onClick={() => tracks.refetch()}>Try again</Button>
  </CardContent></Card>;

  return <div className="space-y-5">
    <Card><CardContent className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={track?.id} onValueChange={selectTrack}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-content-track"><SelectValue placeholder="Choose a track" /></SelectTrigger>
          <SelectContent>{tracks.data?.map(item =>
            <SelectItem key={item.id} value={item.id}>{item.name} — {item.status}</SelectItem>)}</SelectContent>
        </Select>
        {track && <Badge variant={track.status === "published" ? "default" : "secondary"}>{track.status === "published" ? "Published" : "Draft"}</Badge>}
        <Button variant="outline" onClick={() => setCreateOpen(true)} data-testid="button-create-track"><Plus className="w-4 h-4 mr-2" />New track</Button>
      </div>
      {track ? <div className="flex flex-wrap gap-2">
        <Input aria-label="Track name" value={name} onChange={event => setName(event.target.value)} className="w-full sm:w-64" />
        <Button variant="outline" disabled={update.isPending || !name.trim() || name.trim() === track.name}
          onClick={() => update.mutate({ id: track.id, name: name.trim() }, { onError: showError })}>
          <Save className="w-4 h-4 mr-2" />Save name
        </Button>
        <Button disabled={update.isPending} onClick={() => update.mutate({
          id: track.id, status: track.status === "draft" ? "published" : "draft",
        }, { onError: showError })} data-testid="button-publish-track">
          {update.isPending ? "Saving…" : track.status === "draft" ? "Publish track" : "Return to draft"}
        </Button>
        <p className="w-full text-xs text-muted-foreground">Only published tracks can be assigned. Add modules and lessons, then configure the cohort start date in Settings before publishing.</p>
      </div> : <p className="text-sm text-muted-foreground">No tracks yet. Create a draft to start building its curriculum.</p>}
    </CardContent></Card>
    {track && <div key={selected}>{children(selected)}</div>}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent><DialogHeader><DialogTitle>Create a track</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async event => {
          event.preventDefault();
          try {
            const created = await create.mutateAsync(newName.trim());
            const nextTracks = [...(tracks.data || []), created];
            setSelectedTrackId(created.id);
            queryClient.clear();
            queryClient.setQueryData(["/api/user"], user);
            queryClient.setQueryData(["/api/tracks"], nextTracks);
            setSelected(created.id);
            setCreateOpen(false);
            setNewName("");
          } catch (error) { showError(error); }
        }}>
          <Input autoFocus aria-label="New track name" placeholder="Track name" value={newName} onChange={event => setNewName(event.target.value)} />
          <p className="text-sm text-muted-foreground">Your new track starts as a draft with an empty curriculum.</p>
          <Button type="submit" disabled={!newName.trim() || create.isPending}>{create.isPending ? "Creating…" : "Create draft"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}

export function TrackAssignment({ value, onChange, disabled = false }: {
  value?: string | null; onChange: (id: string) => void; disabled?: boolean;
}) {
  const tracks = useTracks();
  const published = tracks.data?.filter(track => track.status === "published") || [];
  const assigned = tracks.data?.find(track => track.id === value);
  return <div className="space-y-1">
    <Select value={value || ""} onValueChange={onChange} disabled={disabled || tracks.isLoading || tracks.isError || !published.length}>
      <SelectTrigger className="min-w-[130px]" aria-label="Assign track">
        <SelectValue placeholder={tracks.isLoading ? "Loading tracks…" : published.length ? "Choose track" : "No published tracks"} />
      </SelectTrigger>
      <SelectContent>
        {assigned?.status === "draft" && <SelectItem value={assigned.id} disabled>{assigned.name} (draft)</SelectItem>}
        {published.map(track => <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>)}
      </SelectContent>
    </Select>
    {tracks.isError && <Button size="sm" variant="ghost" onClick={() => tracks.refetch()}>Retry tracks</Button>}
  </div>;
}
