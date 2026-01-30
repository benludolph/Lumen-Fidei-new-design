import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, BookOpen, Cross, Loader2 } from "lucide-react";
import { useState } from "react";
import type { PracticeResource } from "@shared/schema";

function PrayerCard({ resource }: { resource: PracticeResource }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatInlineStyles = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const italicMatch = remaining.match(/\*([^*]+)\*/);
      
      if (boldMatch && boldMatch.index !== undefined && 
          (!italicMatch || italicMatch.index === undefined || boldMatch.index <= italicMatch.index)) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    return parts;
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const result: JSX.Element[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Check for numbered list (consecutive lines starting with numbers)
      if (/^\d+\.\s/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+\.\s/, ''));
          i++;
        }
        result.push(
          <ol key={result.length} className="list-decimal list-inside my-2 space-y-1 ml-2">
            {listItems.map((item, idx) => (
              <li key={idx}>{formatInlineStyles(item)}</li>
            ))}
          </ol>
        );
        continue;
      }
      
      // Header line (starts and ends with **)
      if (line.startsWith('**') && line.endsWith('**')) {
        result.push(
          <h3 key={result.length} className="font-serif font-bold text-lg mt-4 mb-2 text-foreground">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
        i++;
        continue;
      }
      
      // Standalone italic line (starts and ends with single *)
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**') && line.length > 2) {
        const inner = line.slice(1, -1);
        if (!inner.includes('*')) {
          result.push(
            <p key={result.length} className="italic text-muted-foreground my-2">
              {inner}
            </p>
          );
          i++;
          continue;
        }
      }
      
      // Horizontal rule
      if (line.startsWith('---')) {
        result.push(<hr key={result.length} className="my-4 border-border" />);
        i++;
        continue;
      }
      
      // Empty line
      if (line.trim() === '') {
        result.push(<div key={result.length} className="h-2" />);
        i++;
        continue;
      }
      
      // Regular paragraph with inline formatting
      result.push(<p key={result.length} className="my-1">{formatInlineStyles(line)}</p>);
      i++;
    }
    
    return result;
  };

  return (
    <Card className="overflow-hidden" data-testid={`card-prayer-${resource.id}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-auto p-4 justify-between rounded-t-lg rounded-b-none"
            data-testid={`button-toggle-${resource.id}`}
          >
            <div className="flex items-center gap-3">
              <Cross className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-serif text-lg font-semibold text-left">{resource.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {resource.duration && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {resource.duration}
                </span>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6 text-foreground leading-relaxed">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {formatContent(resource.content)}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function Resources() {
  const { data: resources, isLoading } = useQuery<PracticeResource[]>({
    queryKey: ["/api/practice-resources"],
  });

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">Prayers &amp; Resources</h1>
        <p className="text-muted-foreground mt-1">Helpful prayers and guides for your spiritual journey</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl">
          {resources?.map((resource) => (
            <PrayerCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center text-muted-foreground text-sm">
        <p>Tap any prayer title to expand and view the full text.</p>
      </div>
    </Shell>
  );
}
