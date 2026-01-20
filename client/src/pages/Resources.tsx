import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Link2, Headphones } from "lucide-react";

export default function Resources() {
  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">Resources</h1>
        <p className="text-muted-foreground">Helpful materials for your spiritual journey</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              Prayer Texts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Complete prayer texts including the Prayer Against Retaliation, Miracle Prayer, and daily prayers.</p>
            <p className="text-sm italic mt-4">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Catechism References
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Links to the Catechism of the Catholic Church sections referenced in the program.</p>
            <p className="text-sm italic mt-4">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Headphones className="w-5 h-5 text-primary" />
              Audio Guides
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Guided meditations and audio resources for Lectio Divina and the Examen.</p>
            <p className="text-sm italic mt-4">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="w-5 h-5 text-primary" />
              External Links
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Recommended websites, apps, and additional reading materials.</p>
            <p className="text-sm italic mt-4">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
