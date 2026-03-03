import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  onComplete?: () => void;
}

function splitIntoLines(text: string): string[] {
  if (text.includes("\n")) {
    return text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  const segments: string[] = [];
  const parts = text.split(/(?<=[.!?;—])\s+/);

  let current = "";
  for (const part of parts) {
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length > 60 && current) {
      segments.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) segments.push(current);

  return segments.length > 0 ? segments : [text];
}

export function TextReveal({ children, className, delay = 0, onComplete }: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const lines = splitIntoLines(children);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spans = container.querySelectorAll<HTMLSpanElement>("[data-reveal-span]");
    if (spans.length === 0) return;

    gsap.set(spans, { y: "100%", skewY: 7 });

    const tl = gsap.timeline({
      delay,
      onComplete,
    });

    tl.to(spans, {
      y: "0%",
      skewY: 0,
      duration: 1.8,
      ease: "power4.out",
      stagger: 0.3,
    });

    timelineRef.current = tl;

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [delay, onComplete, children]);

  return (
    <div ref={containerRef} className={className} data-testid="text-reveal">
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            overflow: "hidden",
            display: "block",
          }}
        >
          <span
            data-reveal-span
            style={{
              display: "inline-block",
              willChange: "transform",
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}
