import { useState } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings, Calendar, Archive } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CohortRecord } from "@/features/admin/types";
import type { ProgressData } from "@/features/admin/types";
import type { ReactNode } from "react";

export function CohortSettingsView({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [newCohortDate, setNewCohortDate] = useState("");
  const [newCohortName, setNewCohortName] = useState("");
  const [clearCompletions, setClearCompletions] = useState(true);
  const [showNewCohortDialog, setShowNewCohortDialog] = useState(false);
  
  const { data: cohortData, isLoading } = useQuery<{ startDate: string | null }>({
    queryKey: [api.admin.cohortSettings.get.path],
    queryFn: async () => {
      const res = await fetch(api.admin.cohortSettings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cohort settings");
      return res.json();
    },
  });

  const { data: cohortList } = useQuery<CohortRecord[]>({
    queryKey: [api.admin.listCohorts.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listCohorts.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cohorts");
      return res.json();
    },
  });

  const { data: progressData } = useQuery<ProgressData[]>({
    queryKey: [api.admin.progress.path],
    queryFn: async () => {
      const res = await fetch(api.admin.progress.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newStartDate: string) => {
      const res = await apiRequest("POST", api.admin.cohortSettings.update.path, { startDate: newStartDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.cohortSettings.get.path] });
      toast({ title: "Cohort start date updated" });
    },
    onError: () => {
      toast({ title: "Failed to update start date", variant: "destructive" });
    },
  });

  const startNewCohortMutation = useMutation({
    mutationFn: async (data: { name: string; startDate: string; clearCompletions: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/cohort/start-new", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.admin.cohortSettings.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.progress.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.listCohorts.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-completions"] });
      toast({ 
        title: "New cohort started", 
        description: data.completionsCleared > 0 ? `Cleared ${data.completionsCleared} prayer completions` : undefined
      });
      setShowNewCohortDialog(false);
      setNewCohortDate("");
      setNewCohortName("");
    },
    onError: () => {
      toast({ title: "Failed to start new cohort", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (startDate) {
      updateMutation.mutate(startDate);
    }
  };

  const handleStartNewCohort = () => {
    if (newCohortDate && newCohortName.trim()) {
      startNewCohortMutation.mutate({ name: newCohortName.trim(), startDate: newCohortDate, clearCompletions });
    }
  };

  const currentStartDate = cohortData?.startDate 
    ? format(new Date(cohortData.startDate), "yyyy-MM-dd")
    : "";

  const activeCohort = cohortList?.find(c => c.status === "active");
  const archivedCohorts = cohortList?.filter(c => c.status === "archived") ?? [];

  const cohortCurrentDay = progressData?.[0]?.currentDay || 0;
  const cohortComplete = cohortCurrentDay >= 30;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Current Cohort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <>
                {currentStartDate ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{activeCohort?.name ?? "Unnamed"}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(cohortData!.startDate!), "MMMM d, yyyy")}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Current Day</p>
                      <p className="font-medium">{cohortCurrentDay}/30{" "}
                        {cohortComplete ? (
                          <Badge variant="default" className="bg-green-600 ml-1">Completed</Badge>
                        ) : cohortCurrentDay === 0 ? (
                          <Badge variant="secondary" className="ml-1">Not Started</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-blue-600 ml-1">In Progress</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-md text-center">
                    <p className="text-muted-foreground">No cohort start date set</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {archivedCohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Past Cohorts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedCohorts.map(c => (
                  <TableRow key={c.id} data-testid={`row-past-cohort-${c.id}`}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{format(new Date(c.startDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{c.endDate ? format(new Date(c.endDate), "MMM d, yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cohort Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Adjust Start Date</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Change the program start date. This will recalculate the current day for all participants.
              </p>
            </div>
            
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1 max-w-xs">
                <Input 
                  type="date" 
                  value={startDate || currentStartDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-cohort-start-date"
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending || !startDate}
                data-testid="button-save-cohort-date"
              >
                {updateMutation.isPending ? "Saving..." : "Update Start Date"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="font-medium mb-2">Start New Cohort</h3>
              <p className="text-sm text-muted-foreground">
                End the current cohort and start a fresh one. This will archive the current cohort and optionally 
                clear all prayer completion records.
              </p>
            </div>
            
            <Dialog open={showNewCohortDialog} onOpenChange={setShowNewCohortDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-start-new-cohort">
                  Start New Cohort
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Cohort</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      This will archive the current cohort and start a new 30-day program. Current progress data 
                      can optionally be cleared.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cohort Name</label>
                    <Input 
                      placeholder="e.g. Summer 2026"
                      value={newCohortName}
                      onChange={(e) => setNewCohortName(e.target.value)}
                      data-testid="input-new-cohort-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Cohort Start Date</label>
                    <Input 
                      type="date" 
                      value={newCohortDate}
                      onChange={(e) => setNewCohortDate(e.target.value)}
                      data-testid="input-new-cohort-date"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="clearCompletions"
                      checked={clearCompletions}
                      onChange={(e) => setClearCompletions(e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-clear-completions"
                    />
                    <label htmlFor="clearCompletions" className="text-sm">
                      Clear all prayer completion records (recommended for fresh start)
                    </label>
                  </div>
                  
                  <Button 
                    onClick={handleStartNewCohort}
                    disabled={!newCohortDate || !newCohortName.trim() || startNewCohortMutation.isPending}
                    className="w-full"
                    data-testid="button-confirm-new-cohort"
                  >
                    {startNewCohortMutation.isPending ? "Starting..." : "Start New Cohort"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
