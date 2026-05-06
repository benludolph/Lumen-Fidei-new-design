import { useState } from "react";
import { Copy, Check, BookMarked } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useUserAnswers } from "@/hooks/use-answers";

interface CaptivityData {
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

function parseCaptivityContent(content: string): CaptivityData | null {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null && typeof parsed.prayer === "string" && parsed.prayer.trim()) {
      return parsed as CaptivityData;
    }
    return null;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PrayerCard({
  dayNumber,
  data,
  createdAt,
}: {
  dayNumber: number;
  data: CaptivityData;
  createdAt: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.prayer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const lines = data.prayer.split("\n");

  return (
    <div
      data-testid={`prayer-card-day-${dayNumber}`}
      style={{
        background: "var(--white-5)",
        border: "1px solid var(--white-8)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px 12px",
          borderBottom: "1px solid var(--white-6)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <p
            className="type-body-sm"
            style={{
              color: "var(--white-40)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: 0,
            }}
          >
            {dayNumber === 0 ? "Standalone Tool" : `Day ${dayNumber}`}
          </p>
          {data.spiritId && (
            <p
              className="type-body-sm"
              style={{ color: "var(--white-50)", margin: 0, fontStyle: "italic" }}
            >
              Against the spirit of{" "}
              <span style={{ color: "var(--white-70)", fontStyle: "normal" }}>
                {data.spiritId.charAt(0).toUpperCase() + data.spiritId.slice(1)}
              </span>
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <time
            className="type-body-sm"
            style={{ color: "var(--white-30)", whiteSpace: "nowrap" }}
          >
            {formatDate(createdAt)}
          </time>
          <button
            type="button"
            onClick={handleCopy}
            data-testid={`button-copy-prayer-${dayNumber}`}
            title="Copy prayer"
            style={{
              background: "none",
              border: "none",
              color: copied ? "var(--brand)" : "var(--white-40)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              if (!copied) e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              if (!copied) e.currentTarget.style.color = "var(--white-40)";
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Prayer text */}
      <div style={{ padding: "20px" }}>
        <div
          style={{
            fontFamily: "'IvyOra Display', serif",
            fontSize: "1.05rem",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.75,
          }}
        >
          {lines.map((line, i) => (
            <p key={i} style={{ margin: i > 0 ? "0.55em 0 0" : 0 }}>
              {line}
            </p>
          ))}
        </div>

        {/* Scripture reference */}
        {data.scriptureRef && (
          <p
            className="type-body-sm"
            style={{
              marginTop: "16px",
              color: "var(--white-35)",
              fontStyle: "italic",
            }}
          >
            {data.scriptureRef}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PrayerToolkit() {
  const { data: answers = [], isLoading } = useUserAnswers();

  const prayers = [...answers]
    .map((a) => ({
      dayNumber: a.dayNumber,
      createdAt: String(a.createdAt),
      data: parseCaptivityContent(a.content),
    }))
    .filter((a): a is { dayNumber: number; createdAt: string; data: CaptivityData } => a.data !== null)
    .sort((a, b) => {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return timeDiff !== 0 ? timeDiff : b.dayNumber - a.dayNumber;
    });

  return (
    <DashboardLayout>
      <PageContainer variant="narrow">
        <div style={{ paddingTop: "48px", paddingBottom: "80px" }}>
          {/* Header */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <BookMarked size={20} style={{ color: "var(--white-50)", flexShrink: 0 }} />
              <h1
                className="type-caption-xl"
                style={{ color: "white", margin: 0 }}
              >
                Prayer Toolkit
              </h1>
            </div>
            <p
              className="type-body-md"
              style={{ color: "var(--white-50)", margin: 0, paddingLeft: "32px" }}
            >
              Your saved rebuke prayers from the Breaking Lies tool.
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "160px",
                    background: "var(--white-4)",
                    border: "1px solid var(--white-6)",
                    borderRadius: "12px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : prayers.length === 0 ? (
            <div
              data-testid="toolkit-empty-state"
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "var(--white-4)",
                border: "1px solid var(--white-6)",
                borderRadius: "12px",
              }}
            >
              <BookMarked
                size={36}
                style={{ color: "var(--white-20)", margin: "0 auto 16px" }}
              />
              <p
                className="type-caption-lg"
                style={{ color: "var(--white-50)", margin: "0 0 8px" }}
              >
                No saved prayers yet
              </p>
              <p
                className="type-body-md"
                style={{ color: "var(--white-30)", margin: 0 }}
              >
                Complete the Breaking Lies exercise in a daily lesson to save your personalized rebuke prayer here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {prayers.map((p) => (
                <PrayerCard
                  key={p.dayNumber}
                  dayNumber={p.dayNumber}
                  data={p.data}
                  createdAt={p.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
