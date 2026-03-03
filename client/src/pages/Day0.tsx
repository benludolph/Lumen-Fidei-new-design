import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shell } from "@/components/layout/Shell";
import { Loader2, Play, CheckCircle2 } from "lucide-react";

interface Day0Data {
  introVideoUrl: string | null;
  agreementText: string | null;
  agreementSigned: boolean;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export default function Day0() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [agreed, setAgreed] = useState(false);

  const { data, isLoading } = useQuery<Day0Data>({
    queryKey: ["/api/day0"],
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/day0/sign-agreement");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day0"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/dashboard");
    },
  });

  // Redirect to dashboard if agreement already signed
  useEffect(() => {
    if (!isLoading && data?.agreementSigned) {
      setLocation("/dashboard");
    }
  }, [isLoading, data?.agreementSigned, setLocation]);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  // If agreement already signed, don't render (redirect will happen)
  if (data?.agreementSigned) {
    return null;
  }

  const videoId = data?.introVideoUrl ? extractYouTubeId(data.introVideoUrl) : null;

  const defaultAgreementText = `I commit to participating fully in this 30-day spiritual journey.

I will:
• Complete the daily morning and evening prayers and reflections
• Be honest and open in my submissions
• Reach out to my mentor if I have questions or struggles
• Give my best effort each day, trusting in God's blessings and grace`;

  const agreementText = data?.agreementText || defaultAgreementText;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-black mb-2">Welcome to <span className="uppercase tracking-[0.15em]">Lumen Fidei</span></h1>
          <p className="text-muted-foreground">Your 30-Day Spiritual Journey Begins Here</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Introduction Video
            </CardTitle>
            <CardDescription>
              Watch this video to understand the program, expectations, and how to make the most of your journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {videoId ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Introduction Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Introduction video will be available soon</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Participant Agreement
            </CardTitle>
            <CardDescription>
              Please read and accept the following commitment before beginning your journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {agreementText}
              </pre>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="agreement" 
                checked={agreed} 
                onCheckedChange={(checked) => setAgreed(checked === true)}
                data-testid="checkbox-agreement"
              />
              <Label htmlFor="agreement" className="text-sm leading-relaxed cursor-pointer">
                I have watched the introduction video, read and understood the commitment above, and agree to participate fully in the Lumen Fidei 30-day spiritual program.
              </Label>
            </div>
          </CardContent>
          <CardFooter className="pt-6 pb-8">
            <Button
              className="w-full"
              size="lg"
              disabled={!agreed || signMutation.isPending}
              onClick={() => signMutation.mutate()}
              data-testid="button-sign-agreement"
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                "Sign Agreement & Begin Journey"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Shell>
  );
}
