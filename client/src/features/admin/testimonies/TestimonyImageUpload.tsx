import { useState, useRef, useCallback } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";

export function TestimonyImageUpload({ currentUrl, onUploaded }: { currentUrl: string; onUploaded: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onUploaded(url);
    } catch (err) {
      console.error("Thumbnail upload error:", err instanceof Error ? err.message : err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploaded]);

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border">
          <img src={currentUrl} alt="Thumbnail" className="w-full h-full object-cover" data-testid="img-testimony-thumbnail-preview" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border" data-testid="placeholder-testimony-thumbnail">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} data-testid="input-testimony-thumbnail-file" />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} data-testid="button-upload-testimony-thumbnail">
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {uploading ? "Uploading..." : currentUrl ? "Change Photo" : "Upload Photo"}
      </Button>
    </div>
  );
}
