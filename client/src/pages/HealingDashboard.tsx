import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { HealingLayout } from "@/components/layout/HealingLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, Lock, Download, Play, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealingModule, HealingContent, HealingCompletion } from "@shared/schema";

const MODULE_TITLES = [
  "", // 0-indexed padding
  "Introduction",
  "Module 2",
  "Module 3",
  "Module 4",
  "Module 5",
  "Module 6",
  "Module 7",
  "Module 8",
  "Module 9",
  "Module 10",
  "Module 11",
  "Module 12",
  "Module 13",
  "Module 14",
  "Module 15",
  "Module 16",
  "Module 17",
  "Module 18",
  "Module 19",
  "Conclusion",
];

export default function HealingDashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [isCertLoading, setIsCertLoading] = useState(false);

  const { data: modules } = useQuery<HealingModule[]>({
    queryKey: ["/api/healing/modules"],
    enabled: !!user,
  });

  const { data: content } = useQuery<HealingContent[]>({
    queryKey: ["/api/healing/content"],
    enabled: !!user,
  });

  const { data: completions } = useQuery<HealingCompletion[]>({
    queryKey: ["/api/healing/completions"],
    enabled: !!user,
  });

  const completedModuleNumbers = new Set(completions?.map(c => c.moduleNumber) ?? []);

  // Sort modules by sortOrder for display; sequential unlock still follows moduleNumber chain
  const sortedModules = (modules ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const allComplete = sortedModules.length > 0 && sortedModules.every(m => completedModuleNumbers.has(m.moduleNumber));

  const isModuleUnlocked = (moduleNumber: number, idx: number) => {
    if (idx === 0) return true;
    const prevModule = sortedModules[idx - 1];
    return prevModule ? completedModuleNumbers.has(prevModule.moduleNumber) : false;
  };

  const handleModuleClick = (moduleNumber: number, idx: number) => {
    if (!isModuleUnlocked(moduleNumber, idx)) return;
    setLocation(`/healing/module/${moduleNumber}`);
  };

  const handleDownloadCertificate = async () => {
    setIsCertLoading(true);
    try {
      const res = await fetch("/api/healing/generate-certificate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        alert(err.message || "Failed to generate certificate");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "healing-certificate.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate certificate");
    } finally {
      setIsCertLoading(false);
    }
  };

  const totalModules = sortedModules.length || 20;

  if (!user) return null;

  return (
    <HealingLayout>
      <PageContainer variant="narrow" className="pt-[80px] pb-20 min-h-[calc(100vh-72px)]">
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <Heart className="w-5 h-5" style={{ color: "var(--brand)" }} />
              <span className="type-body-sm" style={{ color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Healing of Our Hearts
              </span>
            </div>
            <h1 className="type-display-xl" style={{ color: "white", margin: "0 0 8px" }}>
              Your Healing Journey
            </h1>
            <p className="type-body-md" style={{ color: "var(--white-50)", margin: 0 }}>
              {completedModuleNumbers.size} of {totalModules} modules complete
            </p>
          </div>

          <div
            style={{
              height: "4px", background: "var(--white-8)", borderRadius: "2px", overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(completedModuleNumbers.size / 20) * 100}%`,
                background: "var(--brand)",
                borderRadius: "2px",
                transition: "width 0.5s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "12px",
            }}
          >
            {sortedModules.map((mod, idx) => {
              const moduleNumber = mod.moduleNumber;
              const cont = content?.find(c => c.moduleNumber === moduleNumber);
              const unlocked = isModuleUnlocked(moduleNumber, idx);
              const completed = completedModuleNumbers.has(moduleNumber);
              const title = mod.title ?? MODULE_TITLES[moduleNumber] ?? `Module ${moduleNumber}`;
              const subtitle = mod.subtitle;
              const imageUrl = mod.imageUrl || cont?.imageUrl;

              return (
                <button
                  key={moduleNumber}
                  data-testid={`card-healing-module-${moduleNumber}`}
                  onClick={() => handleModuleClick(moduleNumber, idx)}
                  disabled={!unlocked}
                  style={{
                    position: "relative",
                    aspectRatio: "3/4",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: completed
                      ? "1px solid rgba(var(--brand-rgb, 180, 150, 100), 0.6)"
                      : unlocked
                      ? "1px solid var(--white-12)"
                      : "1px solid var(--white-5)",
                    background: imageUrl ? "transparent" : "var(--white-5)",
                    cursor: unlocked ? "pointer" : "default",
                    opacity: unlocked ? 1 : 0.45,
                    transition: "opacity 0.2s, transform 0.15s, border-color 0.2s",
                    textAlign: "left",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (unlocked) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        objectFit: "cover", opacity: 0.4,
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "relative", height: "100%",
                      display: "flex", flexDirection: "column",
                      justifyContent: "space-between", padding: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span
                        className="type-body-xs"
                        style={{
                          color: "var(--white-40)", textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {moduleNumber < 10 ? `0${moduleNumber}` : moduleNumber}
                      </span>
                      {completed ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "var(--brand)", flexShrink: 0 }} />
                      ) : !unlocked ? (
                        <Lock className="w-3.5 h-3.5" style={{ color: "var(--white-30)", flexShrink: 0 }} />
                      ) : (
                        <Play className="w-3.5 h-3.5" style={{ color: "var(--white-50)", flexShrink: 0 }} />
                      )}
                    </div>
                    <div>
                      <p className="type-caption-md" style={{ color: "white", margin: "0 0 2px", lineHeight: 1.3 }}>
                        {title}
                      </p>
                      {subtitle && (
                        <p className="type-body-xs" style={{ color: "var(--white-40)", margin: 0, lineHeight: 1.3 }}>
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {allComplete && (
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
                padding: "32px", background: "var(--white-5)", borderRadius: "12px",
                border: "1px solid var(--white-8)", textAlign: "center",
              }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: "var(--brand)" }} />
              <div>
                <p className="type-caption-lg" style={{ color: "white", margin: "0 0 4px" }}>
                  Program Complete!
                </p>
                <p className="type-body-md" style={{ color: "var(--white-50)", margin: 0 }}>
                  You have completed all 20 modules of Healing of Our Hearts.
                </p>
              </div>
              <button
                data-testid="button-download-certificate"
                onClick={handleDownloadCertificate}
                disabled={isCertLoading}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", background: "var(--brand, #8B7355)",
                  border: "none", borderRadius: "8px", color: "white",
                  cursor: isCertLoading ? "not-allowed" : "pointer",
                  opacity: isCertLoading ? 0.7 : 1,
                  fontSize: "14px", fontWeight: 600,
                }}
              >
                <Download className="w-4 h-4" />
                {isCertLoading ? "Generating..." : "Download Certificate"}
              </button>
            </div>
          )}
        </div>
      </PageContainer>
    </HealingLayout>
  );
}
