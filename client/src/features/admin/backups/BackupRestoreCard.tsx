import { useState, useRef } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Save, Download, Upload, Image as ImageIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { type ContentBackup } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function BackupRestoreCard() {
  const { toast } = useToast();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; content: ContentBackup } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/admin/backup', { credentials: 'include' });
      if (!response.ok) throw new Error('Backup failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `lumen-fidei-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Backup downloaded', description: 'Lesson content exported successfully.' });
    } catch {
      toast({ title: 'Backup failed', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed: unknown = JSON.parse(ev.target?.result as string);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('version' in parsed) ||
          !('data' in parsed) ||
          (parsed as { version: unknown }).version !== 1
        ) {
          toast({ title: 'Invalid backup file', description: 'This file does not appear to be a valid Lumen Fidei backup.', variant: 'destructive' });
          return;
        }
        setPendingFile({ name: file.name, content: parsed as ContentBackup });
        setShowRestoreDialog(true);
      } catch {
        toast({ title: 'Invalid file', description: 'Could not read the selected file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const restoreMutation = useMutation({
    mutationFn: async (backup: ContentBackup) => {
      const res = await apiRequest('POST', '/api/admin/restore', backup);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Restore failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: 'Restore complete', description: 'All lesson content has been restored from the backup.' });
      setShowRestoreDialog(false);
      setPendingFile(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Restore failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleConfirmRestore = () => {
    if (pendingFile) {
      restoreMutation.mutate(pendingFile.content);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="w-5 h-5" />
            Lesson Content Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all lesson content (modules, slides, resources, overlays, and settings) to a single JSON file. Use it to restore your content if something goes wrong, or to migrate content to another instance.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Uploaded images are not included in the backup and must be re-uploaded separately if needed.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              data-testid="button-backup-download"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Preparing...' : 'Download Backup'}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-backup-restore"
            >
              <Upload className="w-4 h-4 mr-2" />
              Restore from Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-backup-file"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Restore replaces all lesson content. User accounts and participation data are not affected.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Restore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                This will replace all current lesson content with the content from:
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 font-mono break-all">
                {pendingFile?.name}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This action will overwrite all prelim modules, track content, daily content, practice resources, and module overlays. Uploaded images are not affected. This cannot be undone. User accounts and progress data will not be affected.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowRestoreDialog(false); setPendingFile(null); }}
                className="flex-1"
                disabled={restoreMutation.isPending}
                data-testid="button-cancel-restore"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRestore}
                disabled={restoreMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-restore"
              >
                {restoreMutation.isPending ? 'Restoring...' : 'Yes, Restore Content'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
