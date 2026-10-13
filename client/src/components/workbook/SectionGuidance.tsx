import type { CSSProperties } from "react";
import type { SectionDefinition } from "./section-definitions";
import { useWorkbookProfile } from "@/hooks/use-workbook-profile";
import { BRING_TO_THE_LORD, NON_CATHOLIC_GUIDANCE } from "@/data/workbook-revised";

const headingStyle: CSSProperties = { fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", margin: "0 0 6px" };
const bodyStyle: CSSProperties = { fontFamily: "'Afacad', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 };
function Block({ label, text }: { label: string; text: string }) {
  return <section style={{ marginTop: 20 }}><h2 style={headingStyle}>{label}</h2><p style={bodyStyle}>{text}</p></section>;
}
export default function SectionGuidance({ section }: { section: SectionDefinition }) {
  const { data: profile } = useWorkbookProfile();
  const nonCatholic = profile?.faithTradition === "No, I'm a Christian of another tradition" || profile?.faithTradition === "No, I'm exploring faith";
  return <>
    <Block label="Why it matters" text={section.description} />
    {section.teaching && <details key={section.id} style={{ marginTop: 20, padding: "14px 16px", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 7 }}>
      <summary style={{ ...headingStyle, cursor: "pointer", marginBottom: 0 }}>What the Catholic Church teaches</summary>
      <p style={{ ...bodyStyle, marginTop: 12 }}>{section.teaching}</p>
    </details>}
    {section.confession && <section style={{ marginTop: 20 }}>
      <h2 style={headingStyle}>{nonCatholic ? "Bring to the Lord" : "Bring to Confession"}</h2>
      {nonCatholic ? <>
        <p style={bodyStyle}>{BRING_TO_THE_LORD}</p>
        <p style={{ ...bodyStyle, marginTop: 10 }}>{NON_CATHOLIC_GUIDANCE[section.id] ?? section.confession.replaceAll("Confession", "confession to God")}</p>
      </> : <p style={bodyStyle}>{section.confession}</p>}
    </section>}
    {section.extraNote && <Block label={section.extraNote.label} text={section.extraNote.text} />}
    {(section.id === 3 || section.id === 25) && <p style={{ ...bodyStyle, fontSize: "0.85rem", marginTop: 16 }}>
      U.S. Suicide &amp; Crisis Lifeline: <a href="tel:988">988</a>. Ministry contact: Ben Ludolph, Spiritual Healing Ministry, <a href="mailto:bludolph@archchicago.org">bludolph@archchicago.org</a>, <a href="tel:7087350908">708-735-0908</a>.
    </p>}
    {section.actionItem && <div style={{ marginTop: 20, padding: "16px 20px", borderLeft: "3px solid rgba(0,176,255,1)", backgroundColor: "rgba(0,176,255,0.2)", borderRadius: "0 8px 8px 0" }}>
      <h2 style={{ ...headingStyle, color: "rgba(0,176,255,1)" }}>Invitation</h2>
      <p style={{ ...bodyStyle, fontSize: "0.95rem", color: "rgba(0,176,255,0.55)" }}>{section.actionItem}</p>
    </div>}
  </>;
}
