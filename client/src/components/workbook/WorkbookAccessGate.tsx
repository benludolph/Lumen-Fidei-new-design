import { useState, type ReactNode, type CSSProperties } from "react";
import { FAITH_OPTIONS, isFaithAnswered, useWorkbookProfile, useUpdateWorkbookProfile, type FaithTradition } from "@/hooks/use-workbook-profile";
import { WORKBOOK_INTRO, NON_CATHOLIC_INTRO_SECOND } from "@/data/workbook-revised";

const panelStyle: CSSProperties = {
  maxWidth: 680, width: "100%", margin: "0 auto", padding: "36px 24px",
  fontFamily: "'Afacad', sans-serif", color: "rgba(255,255,255,0.75)", lineHeight: 1.65,
};
const buttonStyle: CSSProperties = {
  padding: "10px 16px", borderRadius: 7, background: "rgba(255,255,255,0.08)",
  border: "0.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", cursor: "pointer",
};

export function FaithTraditionEditor() {
  const { data: profile, isLoading, isError, refetch } = useWorkbookProfile();
  const save = useUpdateWorkbookProfile();
  if (isLoading) return <p aria-busy="true">Loading faith preference…</p>;
  if (isError) return <div role="alert">Could not load your preference. <button type="button" style={buttonStyle} onClick={() => refetch()}>Try again</button></div>;
  return <fieldset disabled={save.isPending} style={{ border: 0, padding: 0, margin: "0 0 24px" }}>
    <legend style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", marginBottom: 12 }}>Are you Catholic?</legend>
    {FAITH_OPTIONS.map((option) => <label key={option} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
      <input type="radio" name="profile-faith-tradition" value={option} checked={profile?.faithTradition === option} onChange={() => save.mutate({ faithTradition: option })} />
      {option}
    </label>)}
    {save.isPending && <p role="status">Saving…</p>}
    {save.isError && <p role="alert">Could not save your preference. Please choose your answer again to retry.</p>}
  </fieldset>;
}

export default function WorkbookAccessGate({ children, categorySession = false, onDismiss, bypass = false }: { children: ReactNode; categorySession?: boolean; onDismiss?: () => void; bypass?: boolean }) {
  const { data: profile, isLoading, isError, refetch } = useWorkbookProfile();
  const save = useUpdateWorkbookProfile();
  const [answer, setAnswer] = useState<FaithTradition | null>(null);
  const answered = isFaithAnswered(profile?.faithTradition);
  const needsIntro = categorySession && answered && !profile?.workbookIntroAcknowledged;
  if (bypass || (!isLoading && !isError && answered && !needsIntro)) return <>{children}</>;
  return <div style={categorySession ? { position: "fixed", inset: 0, zIndex: 200, background: "var(--surface-ground)", overflowY: "auto" } : undefined}>
    <div style={panelStyle}>
      {onDismiss && <button type="button" style={buttonStyle} onClick={onDismiss}>Close</button>}
      {isLoading ? <div aria-busy="true" aria-label="Loading profile" style={{ marginTop: 24 }}>
        {[90, 70, 82].map((width) => <div key={width} style={{ width: `${width}%`, height: 18, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginBottom: 12 }} />)}
      </div> : isError ? <div role="alert"><p>Your profile could not be loaded.</p><button type="button" style={buttonStyle} onClick={() => refetch()}>Try again</button></div> : !answered ? <>
        <h1 className="font-serif" style={{ fontSize: "clamp(26px, 4vw, 40px)", margin: "20px 0" }}>Are you Catholic?</h1>
        <fieldset disabled={save.isPending} style={{ border: 0, padding: 0 }}>
          <legend className="sr-only">Are you Catholic?</legend>
          {FAITH_OPTIONS.map((option) => <label key={option} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8, borderRadius: 7, border: "0.5px solid rgba(255,255,255,0.15)", background: answer === option ? "rgba(255,255,255,0.08)" : "transparent", cursor: "pointer" }}>
            <input type="radio" name="workbook-faith-tradition" value={option} checked={answer === option} onChange={() => setAnswer(option)} />
            {option}
          </label>)}
        </fieldset>
        <button type="button" style={{ ...buttonStyle, marginTop: 16, opacity: !answer || save.isPending ? 0.5 : 1 }} disabled={!answer || save.isPending} onClick={() => answer && save.mutate({ faithTradition: answer })}>{save.isPending ? "Saving…" : "Continue"}</button>
      </> : <>
        <h1 className="font-serif" style={{ fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.15, margin: "20px 0 28px" }}>Three things every participant learns</h1>
        <ol style={{ paddingLeft: 22 }}>
          {WORKBOOK_INTRO.map((point, index) => <li key={index} style={{ marginBottom: 24 }}>{index === 1 && profile?.faithTradition !== "Yes" ? NON_CATHOLIC_INTRO_SECOND : point}</li>)}
        </ol>
        <button type="button" style={buttonStyle} disabled={save.isPending} onClick={() => save.mutate({ workbookIntroAcknowledged: true })}>{save.isPending ? "Saving…" : "Continue to session"}</button>
      </>}
      {save.isError && <p role="alert">Could not save. Please try again before continuing.</p>}
    </div>
  </div>;
}
