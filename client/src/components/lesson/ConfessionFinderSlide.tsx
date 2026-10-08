import { useState } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { MapPin, Phone, Globe, Check, ArrowLeft, Edit3, CheckCircle2, Bell, Mail } from "lucide-react";
import { SiGooglecalendar, SiApple } from "react-icons/si";
import { cn } from "@/lib/utils";
import { useSendMessage } from "@/hooks/use-chat";

interface ConfessionTime {
  dayOfWeek: string;
  timeStart: string;
  timeEnd?: string;
  comment?: string;
}

interface ParishResult {
  churchId: string;
  name: string;
  distance: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  phone?: string;
  website?: string;
  confessionTimes: ConfessionTime[];
  source: string;
}

interface ConfessionPlan {
  status: "selected" | "needs_help";
  parishName?: string;
  address?: string;
  day?: string;
  time?: string;
  phone?: string;
  website?: string;
  needsConfirmation?: boolean;
  source: "MassTimes" | "user_manual" | "user_skipped";
  searchedZipCode: string | null;
  savedAt: string;
}

interface SlideContent {
  title?: string;
  subtitle?: string;
  introText?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  confirmationReminder?: string;
  emptyStateText?: string;
  manualEntryEnabled?: boolean;
  allowSkip?: boolean;
  skipText?: string;
  saveVariable?: string;
}

type UIState = "intro" | "loading" | "results" | "manual_entry" | "saved" | "confirmed";

export interface ConfessionFinderSlideProps {
  content: string;
  mentorId?: number | null;
  onSaveSessionVar?: (key: string, value: unknown) => void;
  onInteracted?: () => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function generateCalendarLink(plan: ConfessionPlan): string {
  const title = plan.parishName ? `Confession at ${plan.parishName}` : "Confession";
  const DAY_INDEX: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmtLocal = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  let startStr = "";
  let endStr = "";
  if (plan.day && plan.time && DAY_INDEX[plan.day] !== undefined) {
    const targetDay = DAY_INDEX[plan.day];
    const now = new Date();
    let daysUntil = (targetDay - now.getDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    const start = new Date(now);
    start.setDate(now.getDate() + daysUntil);
    const match = plan.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
      start.setHours(h, m, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    startStr = fmtLocal(start);
    endStr = fmtLocal(end);
  }

  const params = new URLSearchParams({ action: "TEMPLATE", text: title, details: "Scheduled via Lumen Fidei" });
  if (plan.address) params.set("location", plan.address);
  if (startStr && endStr) params.set("dates", `${startStr}/${endStr}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateOutlookLink(plan: ConfessionPlan): string {
  const title = plan.parishName ? `Confession at ${plan.parishName}` : "Confession";
  const DAY_INDEX: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmtISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  let startStr = "";
  let endStr = "";
  if (plan.day && plan.time && DAY_INDEX[plan.day] !== undefined) {
    const targetDay = DAY_INDEX[plan.day];
    const now = new Date();
    let daysUntil = (targetDay - now.getDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    const start = new Date(now);
    start.setDate(now.getDate() + daysUntil);
    const match = plan.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
      start.setHours(h, m, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    startStr = fmtISO(start);
    endStr = fmtISO(end);
  }

  const params = new URLSearchParams({ subject: title, body: "Scheduled via Lumen Fidei" });
  if (plan.address) params.set("location", plan.address);
  if (startStr) params.set("startdt", startStr);
  if (endStr) params.set("enddt", endStr);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function downloadAppleCalendar(plan: ConfessionPlan): void {
  const title = plan.parishName ? `Confession at ${plan.parishName}` : "Confession";
  const DAY_INDEX: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmtICS = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  let dtStart = "";
  let dtEnd = "";
  if (plan.day && plan.time && DAY_INDEX[plan.day] !== undefined) {
    const targetDay = DAY_INDEX[plan.day];
    const now = new Date();
    let daysUntil = (targetDay - now.getDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    const start = new Date(now);
    start.setDate(now.getDate() + daysUntil);
    const match = plan.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
      start.setHours(h, m, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    dtStart = fmtICS(start);
    dtEnd = fmtICS(end);
  }

  const uid = `${Date.now()}@lumenfidei`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lumen Fidei//Confession Finder//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SUMMARY:${title}`,
    ...(dtStart ? [`DTSTART:${dtStart}`] : []),
    ...(dtEnd ? [`DTEND:${dtEnd}`] : []),
    ...(plan.address ? [`LOCATION:${plan.address}`] : []),
    "DESCRIPTION:Scheduled via Lumen Fidei",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "confession.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatAddress(addr?: ParishResult["address"]): string {
  if (!addr) return "";
  return [addr.street, addr.city, addr.state].filter(Boolean).join(", ");
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Afacad', sans-serif",
  fontSize: "0.72rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  color: "rgba(255,255,255,0.45)",
  display: "block",
  marginBottom: "6px",
};

function ParishCard({
  parish,
  showTimes,
  onChooseTime,
}: {
  parish: ParishResult;
  showTimes: boolean;
  onChooseTime?: (ct: ConfessionTime) => void;
}) {
  const addr = formatAddress(parish.address);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
      data-testid={`card-confession-parish-${parish.churchId}`}
    >
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>
          {parish.name}
        </p>
        {typeof parish.distance === "number" && !isNaN(parish.distance) && (
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
            {parish.distance.toFixed(1)} mi away
          </p>
        )}
        {addr && (
          <div className="flex items-start gap-1.5 mt-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }} />
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
              {addr}
            </p>
          </div>
        )}
        <div className="flex items-center gap-4 mt-2.5">
          {parish.website && (
            <a
              href={parish.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}
            >
              <Globe className="w-3 h-3" />
              Website
            </a>
          )}
          {parish.phone && (
            <a
              href={`tel:${parish.phone}`}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
          )}
        </div>
      </div>

      {showTimes && parish.confessionTimes.length > 0 && (
        <div className="px-4 py-3 space-y-2.5">
          {parish.confessionTimes.map((ct, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div>
                <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  {ct.dayOfWeek}{ct.timeStart ? `, ${ct.timeStart}${ct.timeEnd ? ` – ${ct.timeEnd}` : ""}` : ""}
                </p>
                {ct.comment && (
                  <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                    {ct.comment}
                  </p>
                )}
              </div>
              {onChooseTime && (
                <button
                  type="button"
                  onClick={() => onChooseTime(ct)}
                  className="shrink-0 rounded-md px-3 py-1.5 transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}
                  data-testid={`button-confession-choose-${parish.churchId}-${i}`}
                >
                  Choose this time
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!showTimes && (
        <div className="px-4 py-3">
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.83rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            Confession times were not listed. Check the parish website or call the parish office.
          </p>
        </div>
      )}
    </div>
  );
}

export function ConfessionFinderSlide({ content, mentorId, onSaveSessionVar, onInteracted }: ConfessionFinderSlideProps) {
  const cfg: SlideContent = (() => { try { return JSON.parse(content); } catch { return {}; } })();
  const saveVariable = cfg.saveVariable || "confession_plan";
  const { mutate: sendMessage } = useSendMessage();

  const [uiState, setUiState] = useState<UIState>("intro");
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchedZip, setSearchedZip] = useState<string | null>(null);
  const [withTimes, setWithTimes] = useState<ParishResult[]>([]);
  const [withoutTimes, setWithoutTimes] = useState<ParishResult[]>([]);
  const [pendingPlan, setPendingPlan] = useState<ConfessionPlan | null>(null);

  const [manualParish, setManualParish] = useState("");
  const [manualDay, setManualDay] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualWebsite, setManualWebsite] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualNeedsConfirmation, setManualNeedsConfirmation] = useState(true);
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});

  const inputCls = "w-full rounded-md px-3 py-2 bg-[var(--white-5)] border border-[var(--white-10)] text-white placeholder:text-[var(--white-30)] type-body-md focus:outline-none focus:border-[var(--white-20)] transition-colors";

  const handleSearch = async () => {
    const zip = zipCode.trim();
    setZipError(""); setSearchError("");
    if (!/^\d{5}$/.test(zip)) { setZipError("Please enter a valid 5-digit ZIP code."); return; }
    setUiState("loading");
    try {
      const res = await fetch("/api/confession-finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ zipCode: zip }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.message || "Something went wrong while searching. You can still check a parish website or ask your mentor for help.");
        setUiState("intro");
        return;
      }
      setSearchedZip(zip);
      setWithTimes(data.resultsWithConfessionTimes || []);
      setWithoutTimes(data.nearbyParishesWithoutListedTimes || []);
      setUiState("results");
    } catch {
      setSearchError("Something went wrong while searching. You can still check a parish website or ask your mentor for help.");
      setUiState("intro");
    }
  };

  const handleChooseTime = (parish: ParishResult, ct: ConfessionTime) => {
    setPendingPlan({
      status: "selected",
      parishName: parish.name,
      address: formatAddress(parish.address) || undefined,
      day: ct.dayOfWeek,
      time: ct.timeStart + (ct.timeEnd ? ` – ${ct.timeEnd}` : ""),
      phone: parish.phone || undefined,
      website: parish.website || undefined,
      needsConfirmation: true,
      source: "MassTimes",
      searchedZipCode: searchedZip,
      savedAt: new Date().toISOString(),
    });
    setUiState("saved");
  };

  const handleSkip = () => {
    const plan: ConfessionPlan = { status: "needs_help", searchedZipCode: searchedZip, source: "user_skipped", savedAt: new Date().toISOString() };
    onSaveSessionVar?.(saveVariable, plan);
    if (mentorId) {
      sendMessage({ receiverId: mentorId, content: "I wasn't able to find a Confession time near me and may need some help finding one." });
    }
    onInteracted?.();
  };

  const handleSaveAndContinue = () => {
    if (!pendingPlan) return;
    onSaveSessionVar?.(saveVariable, { ...pendingPlan, savedAt: new Date().toISOString() });
    if (mentorId) {
      const locationPart = pendingPlan.parishName
        ? ` at ${pendingPlan.parishName}${pendingPlan.day ? ` on ${pendingPlan.day}` : ""}${pendingPlan.time ? ` at ${pendingPlan.time}` : ""}`
        : "";
      sendMessage({ receiverId: mentorId, content: `I've made a plan to go to Confession${locationPart}. Please check in with me afterward.` });
    }
    setUiState("confirmed");
  };

  const handleManualSave = () => {
    const errs: Record<string, string> = {};
    if (!manualParish.trim()) errs.parish = "Parish name is required.";
    if (!manualDay.trim()) errs.day = "Day is required.";
    if (!manualTime.trim()) errs.time = "Time is required.";
    if (Object.keys(errs).length > 0) { setManualErrors(errs); return; }
    setPendingPlan({
      status: "selected",
      parishName: manualParish.trim(),
      address: manualAddress.trim() || undefined,
      day: manualDay.trim(),
      time: manualTime.trim(),
      phone: manualPhone.trim() || undefined,
      website: manualWebsite.trim() || undefined,
      needsConfirmation: manualNeedsConfirmation,
      source: "user_manual",
      searchedZipCode: searchedZip,
      savedAt: new Date().toISOString(),
    });
    setUiState("saved");
    // Mentor message sent when they click "Save and continue" from the saved screen
  };

  const prefillManual = (plan: ConfessionPlan) => {
    setManualParish(plan.parishName || "");
    setManualDay(plan.day || "");
    setManualTime(plan.time || "");
    setManualAddress(plan.address || "");
    setManualWebsite(plan.website || "");
    setManualPhone(plan.phone || "");
    setManualNeedsConfirmation(plan.needsConfirmation ?? true);
    setManualErrors({});
  };

  const backState = withTimes.length > 0 || withoutTimes.length > 0 ? "results" : "intro";

  if (uiState === "intro") {
    return (
      <div className="space-y-6" data-testid="slide-confession-finder-intro">
        {cfg.title && (
          <h2 style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.5rem", color: "rgba(255,255,255,0.92)", lineHeight: 1.3 }}>
            {cfg.title}
          </h2>
        )}
        {cfg.subtitle && (
          <p className="type-body-xl" style={{ color: "rgba(255,255,255,0.7)" }}>{cfg.subtitle}</p>
        )}
        {cfg.introText && (
          <p className="type-body-lg" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>{cfg.introText}</p>
        )}

        <div className="space-y-2">
          <label style={LABEL_STYLE}>{cfg.searchLabel || "Enter your ZIP code"}</label>
          <input
            type="text"
            inputMode="numeric"
            value={zipCode}
            onChange={e => { setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setZipError(""); setSearchError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder={cfg.searchPlaceholder || "60611"}
            maxLength={5}
            data-testid="input-confession-zip"
            className={inputCls}
          />
          {zipError && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,120,120,0.9)" }}>{zipError}</p>}
          {searchError && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,120,120,0.9)" }}>{searchError}</p>}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSearch}
            disabled={zipCode.trim().length !== 5}
            data-testid="button-confession-search"
            className="w-full rounded-md px-4 py-3 transition-colors disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", fontFamily: "'Afacad', sans-serif", fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}
          >
            Find Confession Times
          </button>

          {cfg.allowSkip !== false && (
            <button
              type="button"
              onClick={handleSkip}
              data-testid="button-confession-skip"
              className="w-full rounded-md px-4 py-2.5 transition-colors"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.45)" }}
            >
              {cfg.skipText || "Skip this step"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (uiState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3" data-testid="slide-confession-finder-loading">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--white-20)] border-t-[var(--white-60)] animate-spin" />
        <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.5)" }}>
          Searching nearby parishes…
        </p>
      </div>
    );
  }

  if (uiState === "results") {
    const hasAny = withTimes.length > 0 || withoutTimes.length > 0;
    return (
      <div className="space-y-7" data-testid="slide-confession-finder-results">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setUiState("intro")}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}
            data-testid="button-confession-back-search"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Search again
          </button>
          {searchedZip && (
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.25)" }}>
              ZIP {searchedZip}
            </span>
          )}
        </div>

        {!hasAny && (
          <div className="rounded-xl px-5 py-6" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              {cfg.emptyStateText || "No listed Confession times were found nearby. This does not mean Confession is unavailable. Check a parish website, call the parish office, or ask your mentor for help."}
            </p>
          </div>
        )}

        {withTimes.length > 0 && (
          <div className="space-y-3">
            <div>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}>
                Listed Confession times found
              </p>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.92rem", color: "rgba(147,197,253,0.9)", marginTop: "4px", lineHeight: 1.5 }}>
                These are listed Confession times near you. Parish schedules can change — please verify on the parish website or by calling before you go.
              </p>
            </div>
            <div className="space-y-3">
              {withTimes.map(p => (
                <ParishCard key={p.churchId} parish={p} showTimes={true} onChooseTime={ct => handleChooseTime(p, ct)} />
              ))}
            </div>
          </div>
        )}

        {withoutTimes.length > 0 && (
          <div className="space-y-3">
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}>
              Nearby parishes without listed Confession times
            </p>
            <div className="space-y-3">
              {withoutTimes.map(p => (
                <ParishCard key={p.churchId} parish={p} showTimes={false} />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl px-4 py-3.5" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            <strong style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Going back to Confession after a long time?</strong>{" "}
            Consider emailing or calling the parish directly to schedule a time with a priest — many are happy to accommodate.
          </p>
        </div>

        {cfg.manualEntryEnabled !== false && (
          <button
            type="button"
            onClick={() => { setManualErrors({}); setUiState("manual_entry"); }}
            data-testid="button-confession-manual-entry"
            className="w-full rounded-md px-4 py-2.5 transition-colors"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}
          >
            Enter a time manually
          </button>
        )}

        {cfg.allowSkip !== false && (
          <button
            type="button"
            onClick={handleSkip}
            data-testid="button-confession-skip-results"
            className="w-full rounded-md px-4 py-2.5 transition-colors"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.35)" }}
          >
            {cfg.skipText || "Skip this step"}
          </button>
        )}
      </div>
    );
  }

  if (uiState === "manual_entry") {
    return (
      <div className="space-y-5" data-testid="slide-confession-finder-manual">
        <button
          type="button"
          onClick={() => setUiState(backState)}
          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}
          data-testid="button-confession-manual-back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div>
          <p style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.15rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>
            Enter a Confession time
          </p>
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
            Found a time on a parish website or by phone? Enter it here.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label style={LABEL_STYLE}>Parish name *</label>
            <input type="text" value={manualParish} onChange={e => { setManualParish(e.target.value); setManualErrors(p => ({ ...p, parish: "" })); }} placeholder="e.g. Holy Name Cathedral" data-testid="input-confession-manual-parish" className={inputCls} />
            {manualErrors.parish && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,120,120,0.9)", marginTop: "4px" }}>{manualErrors.parish}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={LABEL_STYLE}>Day *</label>
              <select value={manualDay} onChange={e => { setManualDay(e.target.value); setManualErrors(p => ({ ...p, day: "" })); }} data-testid="input-confession-manual-day" className={cn(inputCls, "cursor-pointer")} style={{ background: "rgba(255,255,255,0.05)" }}>
                <option value="">Select…</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {manualErrors.day && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,120,120,0.9)", marginTop: "4px" }}>{manualErrors.day}</p>}
            </div>
            <div>
              <label style={LABEL_STYLE}>Time *</label>
              <input type="text" value={manualTime} onChange={e => { setManualTime(e.target.value); setManualErrors(p => ({ ...p, time: "" })); }} placeholder="e.g. 3:00 PM" data-testid="input-confession-manual-time" className={inputCls} />
              {manualErrors.time && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.78rem", color: "rgba(255,120,120,0.9)", marginTop: "4px" }}>{manualErrors.time}</p>}
            </div>
          </div>

          <div>
            <label style={LABEL_STYLE}>Address (optional)</label>
            <input type="text" value={manualAddress} onChange={e => setManualAddress(e.target.value)} placeholder="e.g. 735 N State St, Chicago, IL" data-testid="input-confession-manual-address" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={LABEL_STYLE}>Website (optional)</label>
              <input type="url" value={manualWebsite} onChange={e => setManualWebsite(e.target.value)} placeholder="https://…" data-testid="input-confession-manual-website" className={inputCls} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phone (optional)</label>
              <input type="tel" value={manualPhone} onChange={e => setManualPhone(e.target.value)} placeholder="312-555-1234" data-testid="input-confession-manual-phone" className={inputCls} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManualNeedsConfirmation(v => !v)}
            data-testid="toggle-confession-manual-confirmation"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.3)", background: manualNeedsConfirmation ? "rgba(255,255,255,0.14)" : "transparent" }}
            >
              {manualNeedsConfirmation && <Check className="w-3 h-3 text-white" />}
            </div>
            <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.6)" }}>
              I need to confirm this time before going
            </span>
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setUiState(backState)}
            data-testid="button-confession-manual-cancel"
            className="flex-1 rounded-md px-4 py-2.5 transition-colors"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleManualSave}
            data-testid="button-confession-manual-save"
            className="flex-1 rounded-md px-4 py-2.5 transition-colors"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}
          >
            Save plan
          </button>
        </div>
      </div>
    );
  }

  if (uiState === "saved" && pendingPlan) {
    return (
      <div className="space-y-5" data-testid="slide-confession-finder-saved">
        <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}>
          Your Confession Plan
        </p>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}>
          <div className="px-5 py-5">
            <p style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.08rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.55 }}>
              I plan to go to Confession at{" "}
              <strong style={{ fontWeight: 600 }}>{pendingPlan.parishName}</strong>
              {" "}on{" "}
              <strong style={{ fontWeight: 600 }}>{pendingPlan.day}</strong>
              {" "}at{" "}
              <strong style={{ fontWeight: 600 }}>{pendingPlan.time}</strong>.
            </p>

            {(pendingPlan.address || pendingPlan.website || pendingPlan.phone) && (
              <div className="space-y-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {pendingPlan.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>{pendingPlan.address}</p>
                  </div>
                )}
                {pendingPlan.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <a href={pendingPlan.website} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }} className="hover:opacity-80 transition-opacity">
                      {pendingPlan.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {pendingPlan.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <a href={`tel:${pendingPlan.phone}`} style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }} className="hover:opacity-80 transition-opacity">
                      {pendingPlan.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {cfg.confirmationReminder && (
            <div className="px-5 pb-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.92rem", color: "rgba(147,197,253,0.9)", lineHeight: 1.55 }}>
                {cfg.confirmationReminder}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            data-testid="button-confession-save-continue"
            className="w-full rounded-md px-4 py-3 transition-colors"
            style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'Afacad', sans-serif", fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.95)" }}
          >
            Save and continue
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUiState(backState)}
              data-testid="button-confession-choose-different"
              className="flex-1 rounded-md px-3 py-2.5 transition-colors"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.45)" }}
            >
              Choose a different time
            </button>
            <button
              type="button"
              onClick={() => { prefillManual(pendingPlan); setUiState("manual_entry"); }}
              data-testid="button-confession-edit-manually"
              className="flex-1 rounded-md px-3 py-2.5 transition-colors flex items-center justify-center gap-1.5"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.45)" }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uiState === "confirmed" && pendingPlan) {
    const calendarUrl = generateCalendarLink(pendingPlan);
    return (
      <div className="space-y-6 py-4" data-testid="slide-confession-finder-confirmed">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />
          </div>
          <div>
            <p style={{ fontFamily: "'IvyOra Display', serif", fontSize: "1.35rem", color: "rgba(255,255,255,0.92)", lineHeight: 1.3 }}>
              Your plan is saved
            </p>
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", marginTop: "6px", lineHeight: 1.5 }}>
              {pendingPlan.parishName
                ? `${pendingPlan.parishName}${pendingPlan.day ? ` · ${pendingPlan.day}` : ""}${pendingPlan.time ? ` at ${pendingPlan.time}` : ""}`
                : "Confession plan recorded"}
            </p>
          </div>
        </div>

        {mentorId && (
          <div
            className="rounded-xl px-4 py-3.5 flex items-start gap-3"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
          >
            <Bell className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }} />
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
              Your mentor has been notified and will check in with you after your confession.
            </p>
          </div>
        )}

        <div>
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.35)", textAlign: "center", marginBottom: "16px" }}>
            Add to Calendar
          </p>
          <div className="flex items-center justify-center gap-8">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-confession-calendar-google"
              onClick={() => onInteracted?.()}
              className="flex flex-col items-center gap-2 group"
              style={{ textDecoration: "none" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <SiGooglecalendar className="w-5 h-5" style={{ color: "rgba(255,255,255,0.75)" }} />
              </div>
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Google</span>
            </a>

            <a
              href={generateOutlookLink(pendingPlan)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-confession-calendar-outlook"
              onClick={() => onInteracted?.()}
              className="flex flex-col items-center gap-2 group"
              style={{ textDecoration: "none" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <Mail className="w-5 h-5" style={{ color: "rgba(255,255,255,0.75)" }} />
              </div>
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Outlook</span>
            </a>

            <button
              type="button"
              data-testid="button-confession-calendar-apple"
              onClick={() => { downloadAppleCalendar(pendingPlan); onInteracted?.(); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <SiApple className="w-5 h-5" style={{ color: "rgba(255,255,255,0.75)" }} />
              </div>
              <span style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Apple</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  return null;
}
