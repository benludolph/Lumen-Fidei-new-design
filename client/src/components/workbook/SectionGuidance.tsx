import type { CSSProperties } from "react";
import type { SectionDefinition } from "./section-definitions";
import { useWorkbookProfile } from "@/hooks/use-workbook-profile";
import { useWorkbookContent } from "@/components/workbook-admin/WorkbookContentProvider";
import { useWorkbookGeneral } from "@/components/workbook-admin/use-workbook-general";

const headingStyle: CSSProperties = { fontFamily: "'Afacad', sans-serif", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", margin: "0 0 6px" };
const bodyStyle: CSSProperties = { fontFamily: "'Afacad', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 };
function Block({ label, text }: { label: string; text: string }) {
  return <section style={{ marginTop: 20 }}><h2 style={headingStyle}>{label}</h2><p style={bodyStyle}>{text}</p></section>;
}
function CareLinks({ text }: { text: string }) {
  return <>{text.split(/(\b988\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b\d{3}[-.]\d{3}[-.]\d{4}\b)/g).map((part, index) =>
    part.includes("@") ? <a key={index} href={`mailto:${part}`}>{part}</a>
      : /^(988|\d{3}[-.]\d{3}[-.]\d{4})$/.test(part) ? <a key={index} href={`tel:${part.replace(/\D/g, "")}`}>{part}</a>
        : <span key={index}>{part}</span>,
  )}</>;
}
export default function SectionGuidance({ section }: { section: SectionDefinition }) {
  const { document, text } = useWorkbookContent();
  const { bringToTheLord: BRING_TO_THE_LORD } = useWorkbookGeneral();
  const guidanceKey = `guidance.${section.id}`;
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
        <p style={{ ...bodyStyle, marginTop: 10 }}>{Object.hasOwn(document.texts, guidanceKey) ? text(guidanceKey) : section.confession.replaceAll("Confession", "confession to God")}</p>
      </> : <p style={bodyStyle}>{section.confession}</p>}
    </section>}
    {section.extraNote && <Block label={section.extraNote.label} text={section.extraNote.text} />}
    {(section.id === 3 || section.id === 25) && <p style={{ ...bodyStyle, fontSize: "0.85rem", marginTop: 16 }}>
      <CareLinks text={text("general.careLine")} />
    </p>}
    {section.actionItem && <div style={{ marginTop: 20, padding: "16px 20px", borderLeft: "3px solid rgba(0,176,255,1)", backgroundColor: "rgba(0,176,255,0.2)", borderRadius: "0 8px 8px 0" }}>
      <h2 style={{ ...headingStyle, color: "rgba(0,176,255,1)" }}>Invitation</h2>
      <p style={{ ...bodyStyle, fontSize: "0.95rem", color: "rgba(0,176,255,0.55)" }}>{section.actionItem}</p>
    </div>}
  </>;
}
