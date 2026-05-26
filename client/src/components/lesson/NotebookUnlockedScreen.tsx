import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { BookOpen, ArrowRight } from "lucide-react";
import slideBg from "@assets/SlideBG_1774302310257.webp";
import crossDividerImg from "@assets/Cross_Divider_1774243395976.webp";

const CATEGORY_DESCRIPTOR: Record<string, string> = {
  "personal-sins": "Sins to bring before God in the Sacrament of Confession",
  "occult-dark-powers": "Occult involvement and dark power connections to renounce",
  "generational-lines": "Ancestral patterns and curses to break through prayer",
  "inner-vows": "Inner vows and promises made in pain that bind the heart",
  "wounds-forgiveness": "People and hurts to forgive and release in freedom",
};

interface NotebookUnlockedScreenProps {
  categoryName: string;
  categorySlug: string;
  onContinue: () => void;
  onOpenWorkbook: () => void;
}

export function NotebookUnlockedScreen({
  categoryName,
  categorySlug,
  onContinue,
  onOpenWorkbook,
}: NotebookUnlockedScreenProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [, navigate] = useLocation();

  useEffect(() => {
    localStorage.setItem(`lf_workbook_spotlight_seen_${categorySlug}`, "pending");
    const t1 = setTimeout(() => setStage(1), 80);
    const t2 = setTimeout(() => setStage(2), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [categorySlug]);

  const handleOpenWorkbook = () => {
    navigate("/workbook");
    onOpenWorkbook();
  };

  const handleBackToDashboard = () => {
    onContinue();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[221] flex flex-col"
      data-testid="notebook-unlocked-screen"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img src={slideBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 140% 80% at 50% 120%, rgba(0,0,0,0.95) 28%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "black",
          opacity: stage >= 1 ? 0 : 1,
          transition: "opacity 2000ms cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1,
        }}
      />

      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "var(--black-60)",
          borderBottom: "1px solid var(--white-5)",
          boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
          padding: "16px",
          zIndex: 2,
        }}
      >
        <div
          className="flex items-center"
          style={{
            background: "var(--surface-float)",
            borderRadius: "36px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            maxHeight: "42px",
          }}
        >
          <span
            className="type-caption-md whitespace-nowrap"
            style={{ color: "#efefef", lineHeight: "18px" }}
          >
            NOTEBOOK UNLOCKED
          </span>
        </div>
      </div>

      <div
        className="relative flex-1 min-h-0 flex flex-col items-center"
        style={{ paddingTop: "16px", paddingLeft: "16px", paddingRight: "16px", zIndex: 2 }}
      >
        <div
          className="relative flex-1 min-h-0 flex flex-col w-full max-w-[780px] p-7 sm:p-12 overflow-hidden"
          style={{
            background: "var(--surface-base)",
            border: "0.5px solid var(--white-5)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              background: "radial-gradient(ellipse at 0% 0%, var(--white-4) 0%, transparent 60%)",
            }}
          />

          <div
            className="relative flex-1 flex flex-col items-center justify-center"
            style={{ gap: "28px" }}
          >
            <div
              style={{
                width: "clamp(72px, 18vw, 96px)",
                height: "clamp(72px, 18vw, 96px)",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: stage >= 1 ? 1 : 0,
                transform: stage >= 1 ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
                transition: "opacity 1200ms ease, transform 1400ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <BookOpen
                style={{
                  width: "clamp(28px, 7vw, 38px)",
                  height: "clamp(28px, 7vw, 38px)",
                  color: "rgba(255,255,255,0.65)",
                }}
              />
            </div>

            <div
              className="flex flex-col items-center"
              style={{
                gap: "16px",
                opacity: stage >= 2 ? 1 : 0,
                transform: stage >= 2 ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 900ms ease, transform 900ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <p
                className="type-display-lg text-white text-center"
                style={{ letterSpacing: "-0.64px" }}
              >
                Your Notebook<br />Has Been Unlocked
              </p>

              <img
                src={crossDividerImg}
                alt=""
                style={{ width: "120px", height: "auto", opacity: 0.35 }}
              />

              <div
                className="flex flex-col items-center"
                style={{ gap: "8px", maxWidth: "380px" }}
              >
                <p
                  className="type-body-sm text-[var(--white-40)] text-center"
                  style={{ lineHeight: 1.6 }}
                >
                  <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                    {categoryName}
                  </span>{" "}
                  is now open in your Deliverance Workbook.
                </p>
                {CATEGORY_DESCRIPTOR[categorySlug] && (
                  <p
                    className="type-body-xs text-center"
                    style={{ color: "rgba(255,255,255,0.28)", lineHeight: 1.5, fontStyle: "italic" }}
                  >
                    {CATEGORY_DESCRIPTOR[categorySlug]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative shrink-0 flex flex-col items-center justify-center px-4 py-4 sm:px-8"
        style={{
          background: "var(--surface-ground)",
          borderTop: "1px solid var(--white-5)",
          zIndex: 2,
        }}
      >
        <div className="max-w-[780px] w-full flex items-center justify-between gap-3">
          <button
            onClick={handleBackToDashboard}
            className="type-caption-lg transition-opacity hover:opacity-70"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 0",
              color: "var(--white-40)",
            }}
            data-testid="button-notebook-back"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleOpenWorkbook}
            className="flex items-center gap-2 justify-center type-caption-lg text-[#fafafa] transition-opacity hover:opacity-80"
            style={{
              background: "var(--surface-float)",
              borderRadius: "6px",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "12px",
              paddingBottom: "12px",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)",
            }}
            data-testid="button-notebook-open-workbook"
          >
            Open Workbook
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
