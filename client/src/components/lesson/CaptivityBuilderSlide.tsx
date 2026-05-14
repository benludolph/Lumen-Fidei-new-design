import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";
import { SPIRITS, type SavedState } from "./captivity-builder-data";

interface CaptivityBuilderSlideProps {
  dayNumber: number;
  existingAnswer?: string;
  onInteracted?: () => void;
  onSavePrayer?: (data: SavedState) => void;
}

function assemblePrayer(
  spiritName: string,
  thought: string,
  truth: string,
  antonym: string,
  scriptureRef: string,
  scriptureText: string,
): string {
  const t = thought.trim() || "___";
  const n = truth.trim() || "___";
  const a = antonym.trim() || "___";
  const sRef = scriptureRef.trim() || "___";
  const sTxt = scriptureText.trim() || "___";
  return `${spiritName}, I rebuke you in the name of Jesus.\nWhere you try to tell me \u201c${t}\u201d, the Lord reminds me ${n}. I declare that the Lord ${a}.\n${sRef} says, \u201c${sTxt}\u201d`;
}

function blank(val: string): string {
  return val.trim() || "___";
}

export function CaptivityBuilderSlide({
  dayNumber,
  existingAnswer,
  onInteracted,
  onSavePrayer,
}: CaptivityBuilderSlideProps) {
  const { mutate, isPending } = useCreateAnswer();
  const interactedRef = useRef(!!existingAnswer);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!existingAnswer) return false;
    try {
      const p: SavedState = JSON.parse(existingAnswer);
      return !!(p?.prayer?.trim());
    } catch { return false; }
  });

  const [thought, setThought] = useState("");
  const [spiritId, setSpiritId] = useState("");
  const [antonym, setAntonym] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
  const [scriptureText, setScriptureText] = useState("");
  const [truth, setTruth] = useState("");

  useEffect(() => {
    if (!existingAnswer) return;
    try {
      const parsed: SavedState = JSON.parse(existingAnswer);
      setThought(parsed.thought ?? "");
      setSpiritId(parsed.spiritId ?? "");
      setAntonym(parsed.antonym ?? "");
      setScriptureRef(parsed.scriptureRef ?? "");
      setScriptureText(parsed.scriptureText ?? "");
      setTruth(parsed.truth ?? "");
      if (parsed.spiritId) {
        interactedRef.current = true;
      }
      if (parsed.prayer?.trim()) {
        setIsCollapsed(true);
      }
    } catch {}
  }, [existingAnswer]);

  useEffect(() => {
    if (existingAnswer && interactedRef.current) {
      onInteracted?.();
    }
  }, []);

  const selectedSpirit = SPIRITS.find(s => s.id === spiritId) ?? null;

  const handleSpiritSelect = (id: string) => {
    if (id === spiritId) return;
    const spirit = SPIRITS.find(s => s.id === id);
    if (!spirit) return;
    setSpiritId(id);
    setAntonym(spirit.antonym);
    setScriptureRef(spirit.scriptures[0].ref);
    setScriptureText(spirit.scriptures[0].text);
    setSaved(false);
  };

  const handleScriptureSelect = (ref: string) => {
    const spirit = selectedSpirit;
    if (!spirit) return;
    const s = spirit.scriptures.find(sc => sc.ref === ref);
    if (!s) return;
    setScriptureRef(s.ref);
    setScriptureText(s.text);
    setSaved(false);
  };

  const spiritNameForPrayer = selectedSpirit ? selectedSpirit.name : "___";
  const prayer = assemblePrayer(spiritNameForPrayer, thought, truth, antonym, scriptureRef, scriptureText);

  const isEmpty = !thought.trim() && !spiritId && !truth.trim();

  const handleSave = () => {
    const payload: SavedState = {
      thought, spiritId, antonym, scriptureRef, scriptureText, truth, prayer,
    };
    if (onSavePrayer) {
      onSavePrayer(payload);
      handleReset();
      return;
    }
    mutate(
      { dayNumber, content: JSON.stringify(payload) },
      {
        onSuccess: () => {
          setSaved(true);
          setIsCollapsed(true);
          if (!interactedRef.current) {
            interactedRef.current = true;
            onInteracted?.();
          }
        },
      }
    );
  };

  const handleReset = () => {
    setThought("");
    setSpiritId("");
    setAntonym("");
    setScriptureRef("");
    setScriptureText("");
    setTruth("");
    setSaved(false);
    setIsCollapsed(false);
  };

  const handleCopy = async () => {
    if (!prayer) return;
    try {
      await navigator.clipboard.writeText(prayer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const markChanged = () => { setSaved(false); };

  const inputBase =
    "bg-transparent border-b border-[var(--white-20)] text-white placeholder:text-[var(--white-30)] focus:outline-none focus:border-[var(--white-50)] transition-colors";

  if (isCollapsed) {
    const prayerLines = prayer.split("\n");
    return (
      <div className="space-y-6" data-testid="slide-captivity-builder">
        {/* Saved prayer card */}
        <div
          className="relative rounded-xl border overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-5 pt-4 pb-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex flex-col gap-0.5">
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
                Your saved prayer
              </span>
              {selectedSpirit && (
                <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                  Against the spirit of{" "}
                  <span style={{ color: "rgba(255,255,255,0.7)", fontStyle: "normal" }}>{selectedSpirit.name}</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!prayer}
              data-testid="button-captivity-copy"
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: "rgba(255,255,255,0.4)", background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              title="Copy prayer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {/* Prayer text */}
          <div className="px-5 py-5">
            <div style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.75 }}>
              {prayerLines.map((line, i) => (
                <p key={i} style={{ margin: i > 0 ? "0.55em 0 0" : 0 }}>
                  {line || "\u00a0"}
                </p>
              ))}
            </div>
            {scriptureRef && (
              <p className="type-body-sm" style={{ marginTop: "16px", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                {scriptureRef}
              </p>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            data-testid="button-captivity-reset"
            className="type-body-sm text-[var(--white-30)] hover:text-[var(--white-60)] transition-colors"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            data-testid="button-captivity-edit"
            className="bg-[var(--surface-float)] text-white hover:bg-[var(--surface-raised)] border border-[var(--white-10)] rounded-md px-4 py-2 type-body-md transition-colors"
          >
            Edit prayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="slide-captivity-builder">
      {/* Field 1: Thought */}
      <div className="space-y-2">
        <label
          className="block"
          style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}
        >
          What thought is hooking you?
        </label>
        <textarea
          value={thought}
          onChange={e => { setThought(e.target.value); markChanged(); }}
          placeholder="Write it out plainly..."
          rows={3}
          data-testid="input-captivity-thought"
          className="w-full resize-none rounded-md px-3 py-2 bg-[var(--white-5)] border border-[var(--white-10)] text-white placeholder:text-[var(--white-30)] type-body-lg focus:outline-none focus:border-[var(--white-20)] transition-colors"
          style={{ lineHeight: 1.5 }}
        />
      </div>

      {/* Field 2: Spirit grid */}
      <div className="space-y-3">
        <label
          className="block"
          style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}
        >
          Which lying spirit is behind this thought?
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SPIRITS.map(spirit => {
            const isSelected = spirit.id === spiritId;
            return (
              <button
                key={spirit.id}
                type="button"
                onClick={() => { handleSpiritSelect(spirit.id); markChanged(); }}
                data-testid={`button-spirit-${spirit.id}`}
                className={cn(
                  "flex flex-col items-start rounded-lg px-3 py-2.5 border text-left transition-colors",
                  isSelected
                    ? "border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.1)]"
                    : "border-[var(--white-8)] bg-[var(--white-4)] hover:bg-[var(--white-6)] hover:border-[var(--white-15)]"
                )}
                title={spirit.desc}
              >
                <span
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: isSelected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
                    lineHeight: 1.3,
                  }}
                >
                  {spirit.name}
                </span>
                <span
                  className="mt-0.5 hidden sm:block"
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.35)",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {spirit.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Field 3: The truth — Antonym + Scripture + "The Lord reminds me" (gated on spirit selection) */}
      {selectedSpirit && (
        <div className="space-y-5 rounded-lg border border-[var(--white-8)] bg-[var(--white-4)] px-4 py-4">
          <div>
            <span
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}
            >
              The truth
            </span>
          </div>

          <div className="space-y-2">
            <label
              className="block"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.35)" }}
            >
              The Lord…
            </label>
            <input
              type="text"
              value={antonym}
              onChange={e => { setAntonym(e.target.value); markChanged(); }}
              data-testid="input-captivity-antonym"
              className={cn(inputBase, "w-full type-body-lg py-1")}
              placeholder="Edit this declaration..."
            />
            <p
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}
            >
              You can edit this — it will appear in your prayer.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="block"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.35)" }}
            >
              Choose a scripture
            </label>
            <div className="space-y-2">
              {selectedSpirit.scriptures.map(sc => {
                const isSelected = sc.ref === scriptureRef;
                return (
                  <button
                    key={sc.ref}
                    type="button"
                    onClick={() => { handleScriptureSelect(sc.ref); markChanged(); }}
                    data-testid={`button-scripture-${sc.ref}`}
                    className={cn(
                      "w-full text-left rounded-md border px-3 py-2.5 transition-colors",
                      isSelected
                        ? "border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.07)]"
                        : "border-[var(--white-8)] bg-transparent hover:bg-[var(--white-4)]"
                    )}
                  >
                    <div
                      style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: isSelected ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", marginBottom: "3px", letterSpacing: "0.04em" }}
                    >
                      {sc.ref}
                    </div>
                    <div style={{ fontFamily: "'IvyOra Display', serif", fontSize: "0.92rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.45 }}>
                      {sc.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="block"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.35)" }}
            >
              The Lord reminds me
            </label>
            <input
              type="text"
              value={truth}
              onChange={e => { setTruth(e.target.value); markChanged(); }}
              placeholder="What truth does He speak over you?"
              data-testid="input-captivity-truth"
              className={cn(inputBase, "w-full type-body-lg py-1")}
            />
          </div>
        </div>
      )}

      {/* Prayer card */}
      <div
        className="relative rounded-xl border border-[rgba(255,255,255,0.12)] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <div className="px-5 pt-4 pb-1">
          <span
            style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}
          >
            Your prayer
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={isEmpty}
          data-testid="button-captivity-copy"
          className="absolute top-3 right-3 p-1.5 rounded-md transition-colors disabled:opacity-30"
          style={{ color: "rgba(255,255,255,0.4)", background: "transparent" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          title="Copy prayer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>

        <div className="px-5 pb-5 pt-2 min-h-[100px]">
          {isEmpty ? (
            <p
              style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.7, fontStyle: "italic" }}
            >
              Fill in the fields above and your prayer will appear here.
            </p>
          ) : (
            <div style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.75 }}>
              <p>
                <strong style={{ fontWeight: 600, color: selectedSpirit ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)" }}>
                  {selectedSpirit ? selectedSpirit.name : "___"}
                </strong>
                {", I rebuke you in the name of Jesus."}
              </p>
              <p style={{ marginTop: "0.6em" }}>
                {"Where you try to tell me \u201c"}
                <span style={{ color: thought.trim() ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {blank(thought)}
                </span>
                {"\u201d, the Lord reminds me "}
                <span style={{ color: truth.trim() ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {blank(truth)}
                </span>
                {". I declare that the Lord "}
                <span style={{ color: antonym.trim() ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {blank(antonym)}
                </span>
                {"."}
              </p>
              <p style={{ marginTop: "0.6em" }}>
                <span style={{ color: scriptureRef.trim() ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {blank(scriptureRef)}
                </span>
                {" says, \u201c"}
                <span style={{ color: scriptureText.trim() ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {blank(scriptureText)}
                </span>
                {"\u201d"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save + Reset */}
      <div className="flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || saved || !thought.trim() || !selectedSpirit || !truth.trim()}
          data-testid="button-captivity-save"
          className="bg-[var(--surface-float)] text-white hover:bg-[var(--surface-raised)] border border-[var(--white-10)] rounded-md px-4 py-2 type-body-md disabled:opacity-40 transition-colors"
        >
          {isPending ? "Saving..." : saved ? "Saved" : "Save prayer"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          data-testid="button-captivity-reset"
          className="type-body-sm text-[var(--white-30)] hover:text-[var(--white-60)] transition-colors"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
