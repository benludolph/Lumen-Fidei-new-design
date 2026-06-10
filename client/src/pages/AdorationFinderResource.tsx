import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HealingLayout } from "@/components/layout/HealingLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ChevronRight, MapPin, Phone, Globe, ArrowLeft } from "lucide-react";
import heroImg from "@assets/Adoration_1781118881270.webp";

interface AdorationTime {
  dayOfWeek: string;
  timeStart: string;
  timeEnd?: string;
  comment?: string;
}

interface ParishResult {
  churchId: string;
  name: string;
  distance: number;
  address?: { street?: string; city?: string; state?: string; postalCode?: string };
  phone?: string;
  website?: string;
  adorationTimes: AdorationTime[];
}

type UIState = "intro" | "loading" | "results";

function formatAddress(addr?: ParishResult["address"]): string {
  if (!addr) return "";
  return [addr.street, addr.city, addr.state].filter(Boolean).join(", ");
}

function Breadcrumb({ isHealingTrack }: { isHealingTrack: boolean }) {
  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 40, height: "60px",
        display: "flex", alignItems: "center",
        backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)",
        background: "var(--black-35)", borderBottom: "1px solid var(--white-8)",
        boxShadow: "0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)",
      }}
    >
      <PageContainer variant="full" className="flex items-center gap-2">
        <Link href="/resources">
          <span data-testid="breadcrumb-resources" className="type-body-lg"
            style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}>
            Resources
          </span>
        </Link>
        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>
        <span data-testid="breadcrumb-current" className="type-body-lg"
          style={{ color: "var(--white-60)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}>
          Adoration Finder
        </span>
      </PageContainer>
    </div>
  );
}

function ParishCard({ parish }: { parish: ParishResult }) {
  const addr = formatAddress(parish.address);
  const hasTimes = parish.adorationTimes.length > 0;
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
      data-testid={`card-adoration-parish-${parish.churchId}`}>
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
            <a href={parish.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              <Globe className="w-3 h-3" />Website
            </a>
          )}
          {parish.phone && (
            <a href={`tel:${parish.phone}`}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              <Phone className="w-3 h-3" />Call
            </a>
          )}
        </div>
      </div>

      {hasTimes ? (
        <div className="px-4 py-3 space-y-2.5">
          {parish.adorationTimes.map((at, i) => (
            <div key={i}>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {at.dayOfWeek}{at.timeStart ? `, ${at.timeStart}${at.timeEnd ? ` – ${at.timeEnd}` : ""}` : ""}
              </p>
              {at.comment && (
                <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                  {at.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3">
          <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.83rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            Adoration times were not listed. Check the parish website or call the parish office.
          </p>
        </div>
      )}
    </div>
  );
}

function AdorationFinderUI() {
  const [uiState, setUiState] = useState<UIState>("intro");
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchedZip, setSearchedZip] = useState<string | null>(null);
  const [withTimes, setWithTimes] = useState<ParishResult[]>([]);
  const [withoutTimes, setWithoutTimes] = useState<ParishResult[]>([]);

  const inputCls = "w-full rounded-md px-3 py-2 bg-[var(--white-5)] border border-[var(--white-10)] text-white placeholder:text-[var(--white-30)] type-body-md focus:outline-none focus:border-[var(--white-20)] transition-colors";

  const handleSearch = async () => {
    const zip = zipCode.trim();
    setZipError(""); setSearchError("");
    if (!/^\d{5}$/.test(zip)) { setZipError("Please enter a valid 5-digit ZIP code."); return; }
    setUiState("loading");
    try {
      const res = await fetch("/api/adoration-finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ zipCode: zip }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.message || "Something went wrong while searching.");
        setUiState("intro");
        return;
      }
      setSearchedZip(zip);
      setWithTimes(data.resultsWithAdorationTimes || []);
      setWithoutTimes(data.nearbyParishesWithoutListedTimes || []);
      setUiState("results");
    } catch {
      setSearchError("Something went wrong while searching. Please try again.");
      setUiState("intro");
    }
  };

  if (uiState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3" data-testid="adoration-finder-loading">
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
      <div className="space-y-7" data-testid="adoration-finder-results">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setUiState("intro")}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}
            data-testid="button-adoration-back-search">
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
              No listed Adoration times were found nearby. This does not mean Adoration is unavailable — check a parish website or call the parish office directly.
            </p>
          </div>
        )}

        {withTimes.length > 0 && (
          <div className="space-y-3">
            <div>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}>
                Listed Adoration times found
              </p>
              <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.92rem", color: "rgba(147,197,253,0.9)", marginTop: "4px", lineHeight: 1.5 }}>
                Parish schedules can change — please verify on the parish website or by calling before you go.
              </p>
            </div>
            <div className="space-y-3">
              {withTimes.map(p => <ParishCard key={p.churchId} parish={p} />)}
            </div>
          </div>
        )}

        {withoutTimes.length > 0 && (
          <div className="space-y-3">
            <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)" }}>
              Nearby parishes without listed Adoration times
            </p>
            <div className="space-y-3">
              {withoutTimes.map(p => <ParishCard key={p.churchId} parish={p} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="adoration-finder-intro">
      <div className="space-y-2">
        <label style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "6px" }}>
          Enter your ZIP code
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={zipCode}
          onChange={e => { setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setZipError(""); setSearchError(""); }}
          onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
          placeholder="60611"
          maxLength={5}
          data-testid="input-adoration-zip"
          className={inputCls}
        />
        {zipError && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,120,120,0.9)" }}>{zipError}</p>}
        {searchError && <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "0.8rem", color: "rgba(255,120,120,0.9)" }}>{searchError}</p>}
      </div>
      <button
        type="button"
        onClick={handleSearch}
        disabled={zipCode.trim().length !== 5}
        data-testid="button-adoration-search"
        className="w-full rounded-md px-4 py-3 transition-colors disabled:opacity-40"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", fontFamily: "'Afacad', sans-serif", fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
        Find Adoration Times
      </button>
    </div>
  );
}

export default function AdorationFinderResource() {
  const { user } = useAuth();
  const isHealingTrack = user?.track === 'C';
  const Layout = isHealingTrack ? HealingLayout : DashboardLayout;

  return (
    <Layout>
      <Breadcrumb isHealingTrack={isHealingTrack} />
      <div style={{ backgroundColor: "var(--surface-ground)", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "685px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "40px", paddingBottom: "100px", paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
          <div data-testid="hero-card-resource"
            style={{ position: "relative", backgroundColor: "var(--surface-ground)", border: "1px solid var(--white-5)", borderRadius: "8px", overflow: "clip", paddingTop: "379.94px", maxWidth: "960px", width: "100%", display: "flex", alignItems: "flex-end", flexDirection: "column" }}>
            <div aria-hidden="true" style={{ position: "absolute", top: 0, left: "-3px", right: "-3px", height: "470px", overflow: "hidden", backgroundColor: "var(--surface-ground)" }}>
              <img src={heroImg} alt="Adoration Finder"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "99px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "335px", background: "linear-gradient(to bottom, transparent, var(--surface-ground))", pointerEvents: "none" }} />
            </div>
            <div className="px-5 sm:px-10"
              style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "9.25px", alignItems: "flex-start", width: "100%", paddingBottom: "40px" }}>
              <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0 }}>Tool · Sacramentals</p>
              <h1 data-testid="resource-title" className="font-serif"
                style={{ fontWeight: 500, fontSize: "clamp(36px, 6vw + 10px, 80.2px)", lineHeight: "1.01", color: "white", margin: 0 }}>
                Adoration Finder
              </h1>
              <p data-testid="resource-subtitle" className="type-body-lg" style={{ color: "var(--white-60)", margin: 0 }}>
                Find Eucharistic Adoration times at nearby parishes.
              </p>
            </div>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", boxShadow: "inset 0px 1px 0px 0px var(--white-10)" }} />
          </div>

          <div style={{ maxWidth: "960px", width: "100%", marginTop: "30px" }}>
            <AdorationFinderUI />
          </div>
        </div>
      </div>
    </Layout>
  );
}
