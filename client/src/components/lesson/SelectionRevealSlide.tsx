import { useState, useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";

interface Verse {
  reference: string;
  text: string;
}

interface RevealOption {
  id: string;
  label: string;
  subtitle?: string;
  body?: string;
  examples?: string[];
  verses?: Verse[];
}

interface SelectionRevealContent {
  selectionHeadline?: string;
  selectionSubtext?: string;
  options: RevealOption[];
}

function parse(content: string): SelectionRevealContent {
  try {
    const p = JSON.parse(content);
    const options: RevealOption[] = Array.isArray(p.options)
      ? p.options.map((o: any, i: number) => ({
          id: o.id ?? String(i),
          label: typeof o.label === "string" ? o.label : "",
          subtitle: typeof o.subtitle === "string" ? o.subtitle : undefined,
          body: typeof o.body === "string" ? o.body : undefined,
          examples: Array.isArray(o.examples) ? o.examples.filter((e: unknown) => typeof e === "string") : undefined,
          verses: Array.isArray(o.verses)
            ? o.verses.filter((v: any) => v?.reference && v?.text)
            : undefined,
        }))
      : [];
    return {
      selectionHeadline: typeof p.selectionHeadline === "string" ? p.selectionHeadline : "What have you been involved with?",
      selectionSubtext: typeof p.selectionSubtext === "string" ? p.selectionSubtext : "Select everything that applies to you.",
      options,
    };
  } catch {
    return { options: [] };
  }
}

type Phase = "selection" | "reveal";

export function SelectionRevealSlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const { selectionHeadline, selectionSubtext, options } = parse(content);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("selection");
  const [cardIndex, setCardIndex] = useState(0);

  const selectedOptions = options.filter(o => selected.has(o.id));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    if (selectedOptions.length === 0) {
      onInteracted?.();
      return;
    }
    setCardIndex(0);
    setPhase("reveal");
  };

  const handleNext = () => {
    if (cardIndex < selectedOptions.length - 1) {
      setCardIndex(i => i + 1);
    } else {
      onInteracted?.();
    }
  };

  // Signal interacted if there are no options configured at all
  useEffect(() => {
    if (options.length === 0) onInteracted?.();
  }, []);

  if (phase === "selection") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 0, paddingBottom: 24 }}
        data-testid="slide-selection-reveal-selection"
      >
        {/* Header */}
        <div style={{ padding: "0 24px 20px" }}>
          <h2
            style={{
              fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 500,
              color: "rgba(255,255,255,0.95)",
              lineHeight: 1.25,
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
            }}
          >
            {selectionHeadline}
          </h2>
          {selectionSubtext && (
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
              {selectionSubtext}
            </p>
          )}
        </div>

        {/* Option chips */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 24px",
          }}
        >
          {options.map(opt => {
            const isOn = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`button-selection-option-${opt.id}`}
                onClick={() => toggle(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: isOn
                    ? "1px solid rgba(255,255,255,0.25)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: isOn ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {/* Checkbox */}
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    border: isOn ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                    background: isOn ? "rgba(255,255,255,0.9)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {isOn && <Check size={12} color="#000" strokeWidth={3} />}
                </span>

                <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: isOn ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
                      lineHeight: 1.3,
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.subtitle && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        lineHeight: 1.3,
                      }}
                    >
                      {opt.subtitle}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <div style={{ padding: "20px 24px 0" }}>
          <button
            type="button"
            data-testid="button-selection-continue"
            onClick={handleContinue}
            style={{
              width: "100%",
              padding: "13px 20px",
              borderRadius: 10,
              background: selected.size > 0 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
              color: selected.size > 0 ? "#000" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {selected.size === 0 ? "Nothing applies to me" : `Continue (${selected.size} selected)`}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Phase: reveal
  const card = selectedOptions[cardIndex];
  const isLast = cardIndex === selectedOptions.length - 1;
  const progressText = `${cardIndex + 1} of ${selectedOptions.length}`;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: 24 }}
      data-testid="slide-selection-reveal-card"
    >
      {/* Progress */}
      <div style={{ padding: "0 24px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {selectedOptions.map((_, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i <= cardIndex ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{progressText}</span>
      </div>

      {/* Card content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "0 24px" }}>
        {/* Category label */}
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {card.label}
          </span>
        </div>

        {/* Body */}
        {card.body && (
          <p
            className="type-body-xl"
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.82)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {card.body}
          </p>
        )}

        {/* Examples */}
        {card.examples && card.examples.length > 0 && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 10,
              padding: "12px 14px",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Examples
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {card.examples.map((ex, i) => (
                <p
                  key={i}
                  style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}
                >
                  • {ex}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Scripture verses */}
        {card.verses && card.verses.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {card.verses.map((v, i) => (
              <div
                key={i}
                style={{
                  borderLeft: "2px solid rgba(255,255,255,0.2)",
                  paddingLeft: 14,
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 13,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.5,
                  }}
                >
                  {v.text}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.04em",
                  }}
                >
                  — {v.reference}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next / Done button */}
      <div style={{ padding: "20px 24px 0" }}>
        <button
          type="button"
          data-testid={isLast ? "button-reveal-done" : "button-reveal-next"}
          onClick={handleNext}
          style={{
            width: "100%",
            padding: "13px 20px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.95)",
            color: "#000",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isLast ? "Done" : "Next"}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
