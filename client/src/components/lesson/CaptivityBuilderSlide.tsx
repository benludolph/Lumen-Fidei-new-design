import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAnswer } from "@/hooks/use-answers";

const SPIRITS = [
  { id: 'destruction', name: 'Destruction', desc: 'You are broken, limited, your mind is not enough.', antonym: 'has made me wonderfully and knows me intimately', scriptures: [
    { ref: 'Psalm 139:13-14', text: 'For you formed my inward parts; you knitted me together in my mother\u2019s womb. I praise you, for I am fearfully and wonderfully made.' },
    { ref: 'Genesis 1:27', text: 'So God created man in his own image, in the image of God he created him.' },
  ]},
  { id: 'hopelessness', name: 'Hopelessness', desc: 'Nothing will change. It will not get better.', antonym: 'is my hope and does not abandon me', scriptures: [
    { ref: 'Romans 12:12', text: 'Rejoice in hope, be patient in tribulation, be constant in prayer.' },
    { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, plans for welfare and not for evil, to give you a future and a hope.' },
  ]},
  { id: 'weakness', name: 'Weakness', desc: 'You must hide what you cannot do alone.', antonym: 'is my strength in my weakness', scriptures: [
    { ref: '2 Corinthians 12:9', text: 'My grace is sufficient for you, for my power is made perfect in weakness.' },
    { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.' },
  ]},
  { id: 'condemnation', name: 'Condemnation', desc: 'You are worthless. You deserve to be hated.', antonym: 'absolves me of my sins through Christ', scriptures: [
    { ref: 'Romans 8:1', text: 'There is therefore now no condemnation for those who are in Christ Jesus.' },
    { ref: 'Psalm 103:12', text: 'As far as the east is from the west, so far does he remove our transgressions from us.' },
  ]},
  { id: 'fear', name: 'Fear', desc: 'You are not safe. Danger is everywhere.', antonym: 'is my courage and my refuge', scriptures: [
    { ref: '2 Timothy 1:7', text: 'God gave us a spirit not of fear but of power and love and self-control.' },
    { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear?' },
  ]},
  { id: 'rejection', name: 'Rejection', desc: 'You do not belong. No one wants you.', antonym: 'has chosen and adopted me as His own', scriptures: [
    { ref: 'Ephesians 1:5', text: 'He predestined us for adoption as sons through Jesus Christ.' },
    { ref: 'John 15:16', text: 'You did not choose me, but I chose you.' },
  ]},
  { id: 'shame', name: 'Shame', desc: 'You are what you have done. You are dirty.', antonym: 'covers me with His righteousness', scriptures: [
    { ref: 'Isaiah 61:7', text: 'Instead of your shame there shall be a double portion.' },
    { ref: 'Psalm 34:5', text: 'Those who look to him are radiant, and their faces shall never be ashamed.' },
  ]},
  { id: 'unworthiness', name: 'Unworthiness', desc: 'You do not deserve good things, or love.', antonym: 'calls me beloved and pursues me', scriptures: [
    { ref: '1 John 3:1', text: 'See what kind of love the Father has given to us, that we should be called children of God.' },
    { ref: 'Jeremiah 31:3', text: 'I have loved you with an everlasting love.' },
  ]},
  { id: 'isolation', name: 'Isolation', desc: 'You are alone. No one understands.', antonym: 'is with me always and never leaves me', scriptures: [
    { ref: 'Hebrews 13:5', text: 'I will never leave you nor forsake you.' },
    { ref: 'Matthew 28:20', text: 'Behold, I am with you always, to the end of the age.' },
  ]},
  { id: 'anxiety', name: 'Anxiety', desc: 'You must control everything. You cannot rest.', antonym: 'is my peace that surpasses understanding', scriptures: [
    { ref: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.' },
    { ref: '1 Peter 5:7', text: 'Cast all your anxieties on him, because he cares for you.' },
  ]},
  { id: 'self-hatred', name: 'Self-hatred', desc: 'You are your own enemy. You deserve punishment.', antonym: 'loves me as His own child', scriptures: [
    { ref: 'Romans 8:15', text: 'You have received the Spirit of adoption as sons, by whom we cry, \u201cAbba! Father!\u201d' },
    { ref: 'Galatians 2:20', text: 'It is no longer I who live, but Christ who lives in me.' },
  ]},
  { id: 'confusion', name: 'Confusion', desc: 'Nothing makes sense. You cannot trust your mind.', antonym: 'gives me wisdom and clarity', scriptures: [
    { ref: '1 Corinthians 14:33', text: 'For God is not a God of confusion but of peace.' },
    { ref: 'James 1:5', text: 'If any of you lacks wisdom, let him ask God, who gives generously to all.' },
  ]},
];

interface CaptivityBuilderSlideProps {
  dayNumber: number;
  existingAnswer?: string;
  onInteracted?: () => void;
}

interface SavedState {
  thought: string;
  spiritId: string;
  antonym: string;
  scriptureRef: string;
  scriptureText: string;
  from: string;
  to: string;
  now: string;
  prayer: string;
}

function assemblePrayer(
  spiritName: string,
  thought: string,
  now: string,
  antonym: string,
  scriptureRef: string,
  scriptureText: string,
): string {
  const t = thought.trim() || "___";
  const n = now.trim() || "___";
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [now, setNow] = useState("");

  useEffect(() => {
    if (!existingAnswer) return;
    try {
      const parsed: SavedState = JSON.parse(existingAnswer);
      setThought(parsed.thought ?? "");
      setSpiritId(parsed.spiritId ?? "");
      setAntonym(parsed.antonym ?? "");
      setScriptureRef(parsed.scriptureRef ?? "");
      setScriptureText(parsed.scriptureText ?? "");
      setFrom(parsed.from ?? "");
      setTo(parsed.to ?? "");
      setNow(parsed.now ?? "");
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
  const prayer = assemblePrayer(spiritNameForPrayer, thought, now, antonym, scriptureRef, scriptureText);

  const isEmpty = !thought.trim() && !spiritId && !from.trim() && !to.trim() && !now.trim();

  const handleSave = () => {
    const payload: SavedState = {
      thought, spiritId, antonym, scriptureRef, scriptureText, from, to, now, prayer,
    };
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
    setFrom("");
    setTo("");
    setNow("");
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

      {/* Field 3: Antonym + Scripture (gated on spirit selection) */}
      {selectedSpirit && (
        <div className="space-y-5 rounded-lg border border-[var(--white-8)] bg-[var(--white-4)] px-4 py-4">
          <div className="space-y-2">
            <label
              className="block"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}
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
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}
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
        </div>
      )}

      {/* Field 4: From / To / Now (always visible) */}
      <div className="space-y-3">
        <label
          className="block"
          style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}
        >
          Your testimony
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="type-body-md text-[var(--white-50)] shrink-0 w-20">I went from</span>
            <input
              type="text"
              value={from}
              onChange={e => { setFrom(e.target.value); markChanged(); }}
              placeholder="where you were"
              data-testid="input-captivity-from"
              className={cn(inputBase, "flex-1 min-w-0 type-body-md py-1")}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="type-body-md text-[var(--white-50)] shrink-0 w-20">to</span>
            <input
              type="text"
              value={to}
              onChange={e => { setTo(e.target.value); markChanged(); }}
              placeholder="what shifted"
              data-testid="input-captivity-to"
              className={cn(inputBase, "flex-1 min-w-0 type-body-md py-1")}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="type-body-md text-[var(--white-50)] shrink-0 w-20">and now I</span>
            <input
              type="text"
              value={now}
              onChange={e => { setNow(e.target.value); markChanged(); }}
              placeholder="what is true now"
              data-testid="input-captivity-now"
              className={cn(inputBase, "flex-1 min-w-0 type-body-md py-1")}
            />
          </div>
        </div>
      </div>

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
                <span style={{ color: now.trim() ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {blank(now)}
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
          disabled={isPending || saved || !selectedSpirit || isEmpty}
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
