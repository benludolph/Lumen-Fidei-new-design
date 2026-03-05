import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface HtmlContentProps {
  content: string;
  className?: string;
}

export function HtmlContent({ content, className }: HtmlContentProps) {
  const isHtml = content.includes('<') && content.includes('>');
  
  if (isHtml) {
    const sanitizedHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
    });
    
    return (
      <div 
        className={cn("prose-content", className)}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }
  
  return (
    <div className={className}>
      {content}
    </div>
  );
}
