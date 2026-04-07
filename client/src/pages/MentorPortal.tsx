import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MessageSquare, ArrowRight, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function MentorPortal() {
  const { user } = useAuth();
  const { data: allUsers } = useUsers("participant");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!user || (user.role !== 'mentor' && user.role !== 'admin')) return null;

  const myMentees = allUsers?.filter(u => u.mentorId === user.id) || [];

  const currentPhotoUrl = previewUrl || user.profilePhotoUrl || null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/mentor/upload-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setPreviewUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="type-display-lg font-serif font-bold text-primary mb-2">Mentorship Portal</h1>
        <p className="text-muted-foreground">Oversee your mentees' spiritual progress</p>
      </div>

      {/* Profile Photo Section */}
      <Card className="mb-8 border-primary/10">
        <CardHeader>
          <CardTitle className="text-base">Your Profile Photo</CardTitle>
          <CardDescription>This photo appears next to your messages and in participant lessons.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-secondary">
                {currentPhotoUrl && <AvatarImage src={currentPhotoUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary/5 text-primary text-2xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button
                data-testid="button-upload-photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                style={{ border: "none" }}
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <div>
              <p className="font-medium mb-1">{user.name}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {currentPhotoUrl ? "Photo uploaded" : "No photo uploaded yet"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-change-photo"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
                data-testid="input-photo-file"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myMentees.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
             <p>No mentees assigned yet.</p>
          </div>
        ) : (
          myMentees.map((mentee) => (
            <Card key={mentee.id} className="hover:shadow-lg transition-all duration-300 group border-primary/10">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12 border-2 border-secondary">
                  <AvatarFallback className="bg-primary/5 text-primary text-lg">
                    {mentee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="truncate">{mentee.name}</CardTitle>
                  <CardDescription className="truncate">{mentee.email}</CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono">Track {mentee.track}</Badge>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mt-4 gap-2">
                  <Button 
                    className="flex-1 gap-2" 
                    variant="outline"
                    onClick={() => setLocation(`/messages?user=${mentee.id}`)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Button>
                  <Button 
                    className="flex-1 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => setLocation(`/mentor/mentee/${mentee.id}`)}
                  >
                    View Progress
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Shell>
  );
}
