import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface HtmlContentProps {
  content: string;
  className?: string;
  "data-testid"?: string;
}

const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v)(\?[^\s"]*)?$/i;

function extractVideoUrl(pTag: string): string | null {
  const inner = pTag.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "").trim();
  if (VIDEO_URL_RE.test(inner) && /^https?:\/\//i.test(inner)) return inner;
  const aMatch = inner.match(/^<a[^>]+href="([^"]+)"[^>]*>[\s\S]*<\/a>$/i);
  if (aMatch && VIDEO_URL_RE.test(aMatch[1])) return aMatch[1];
  return null;
}

type Segment = { kind: "html"; html: string } | { kind: "video"; url: string };

function parseSegments(html: string): Segment[] {
  const segments: Segment[] = [];
  const pRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (before) segments.push({ kind: "html", html: before });

    const videoUrl = extractVideoUrl(match[0]);
    if (videoUrl) {
      segments.push({ kind: "video", url: videoUrl });
    } else {
      segments.push({ kind: "html", html: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex);
  if (tail) segments.push({ kind: "html", html: tail });

  return segments;
}

function InlineVideo({ url }: { url: string }) {
  return (
    <div style={{ width: "100%", borderRadius: "10px", overflow: "hidden", background: "#000", margin: "4px 0" }}>
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        controls
        data-testid="media-video-inline"
        style={{ width: "100%", display: "block", maxHeight: "55vh", objectFit: "contain" }}
      />
    </div>
  );
}

export function HtmlContent({ content, className, "data-testid": testId }: HtmlContentProps) {
  const isHtml = content.includes('<') && content.includes('>');

  if (isHtml) {
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'img'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'colspan', 'rowspan', 'src', 'alt', 'width', 'height']
    });

    const segments = parseSegments(sanitized);
    const hasVideo = segments.some(s => s.kind === "video");

    if (!hasVideo) {
      return (
        <div
          className={cn("prose-content", className)}
          data-testid={testId}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    return (
      <div className={cn("prose-content", className)} data-testid={testId}>
        {segments.map((seg, i) =>
          seg.kind === "video"
            ? <InlineVideo key={i} url={seg.url} />
            : seg.html
              ? <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
              : null
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}
