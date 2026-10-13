import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import PrayerRender from "./PrayerRender";
import type { PrayerId } from "@shared/schema";
import { useWorkbookContent } from "@/components/workbook-admin/WorkbookContentProvider";

interface PrayerSheetProps {
  prayerId: PrayerId;
  onClose: () => void;
  onDone: () => void;
}

export default function PrayerSheet({ prayerId, onClose, onDone }: PrayerSheetProps) {
  const { prayers } = useWorkbookContent();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);


  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          cursor: "pointer",
        }}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 34, stiffness: 320 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "92vh",
          background: "var(--surface-ground)",
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            padding: "10px 20px 14px",
            borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "3px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.15)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <p
              style={{
                fontFamily: "'Afacad', sans-serif",
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)",
                margin: 0,
              }}
            >
              {prayers[prayerId].title}
            </p>
            <button
              onClick={onClose}
              aria-label="Close"
              data-testid="button-close-prayer-sheet"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <PrayerRender prayerId={prayerId} onDone={onDone} />
        </div>
      </motion.div>
    </div>
  );
}
