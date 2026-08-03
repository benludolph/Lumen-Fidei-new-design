import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useCohortStartDate } from "@/hooks/use-cohort";
import { SECTION_CATEGORIES, getSectionsByCategory } from "@/components/workbook/section-definitions";
import CategorySession from "@/components/workbook/CategorySession";
import { Lock, ChevronRight, BookOpen } from "lucide-react";
import type { WorkbookSummary } from "@shared/schema";

const CATEGORY_UNLOCK_DAY: Record<number, number> = {
  1: 7, 2: 9, 3: 11, 4: 12, 5: 15,
};

function LockedCategoryCard({ categoryId, name }: { categoryId: number; name: string }) {
  const unlockDay = CATEGORY_UNLOCK_DAY[categoryId];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "20px 20px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.01)",
        border: "0.5px solid rgba(255,255,255,0.05)",
        width: "100%",
        opacity: 0.45,
        cursor: "not-allowed",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Lock style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.25)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            margin: "0 0 2px",
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.2)",
            margin: 0,
          }}
        >
          {unlockDay ? `Available after Day ${unlockDay}` : "Complete the corresponding lesson to unlock"}
        </p>
      </div>
    </div>
  );
}

function CategoryCard({
  categoryId,
  name,
  description,
  summary,
  onClick,
}: {
  categoryId: number;
  name: string;
  description: string;
  summary: WorkbookSummary;
  onClick: () => void;
}) {
  const subsections = getSectionsByCategory(categoryId);
  const total = subsections.length;
  const filled = subsections.filter((s) => {
    const sec = summary[s.id];
    return sec && (sec.attested || sec.count > 0);
  }).length;
  const allDone = filled === total && total > 0;

  return (
    <button
      type="button"
      data-testid={`card-category-${categoryId}`}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "20px 20px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.02)",
        border: `0.5px solid ${allDone ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)"}`,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
        (e.currentTarget as HTMLElement).style.borderColor = allDone ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)";
      }}
    >
      {/* Number bubble */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: allDone ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
          border: `0.5px solid ${allDone ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: allDone ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)",
          }}
        >
          {categoryId}
        </span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="type-body-md"
          style={{
            color: allDone ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.85)",
            margin: "0 0 4px",
            fontWeight: 500,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.3)",
            margin: 0,
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {description}
        </p>
      </div>

      {/* Progress + arrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: allDone ? "rgba(100,210,130,0.55)" : filled > 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {allDone ? "✓ complete" : `${filled} of ${total}`}
        </span>
        <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.2)" }} />
      </div>
    </button>
  );
}

function ExemptState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <BookOpen style={{ width: "20px", height: "20px", color: "rgba(255,255,255,0.3)" }} />
      </div>
      <p
        className="font-serif"
        style={{
          fontSize: "clamp(1.2rem, 2vw + 0.5rem, 1.6rem)",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.45,
          margin: "0 0 12px",
          fontWeight: 500,
        }}
      >
        An alternative path has been set
      </p>
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.25)",
          maxWidth: "380px",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Your guide has arranged a different approach for this step of the program. Continue through your daily content as normal.
      </p>
    </div>
  );
}

function LockedState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Lock style={{ width: "20px", height: "20px", color: "rgba(255,255,255,0.3)" }} />
      </div>
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.25)",
          marginBottom: "10px",
        }}
      >
        Not yet available
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: "clamp(1.2rem, 2vw + 0.5rem, 1.6rem)",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.45,
          margin: "0 0 10px",
          fontWeight: 500,
        }}
      >
        Available after Week 2
      </p>
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.25)",
          maxWidth: "380px",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        The Deliverance Workbook unlocks when you begin Week 2 of the program. Continue through your daily content and check back then.
      </p>
    </div>
  );
}

export default function WorkbookPage() {
  const { data: cohortData, isLoading: cohortLoading } = useCohortStartDate();
  const { data: summary = {}, isLoading: summaryLoading } = useQuery<WorkbookSummary>({
    queryKey: ["/api/workbook/summary"],
  });

  const { data: unlockStatus, isLoading: unlockLoading } = useQuery<{ unlockedCategories: number[]; exempt?: boolean }>({
    queryKey: ["/api/workbook/unlock-status"],
  });

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const unlockedCategories = unlockStatus?.unlockedCategories ?? [];
  const isExempt = unlockStatus?.exempt === true;
  const isLocked = !isExempt && unlockedCategories.length === 0 && !unlockLoading;
  const isLoading = cohortLoading || summaryLoading || unlockLoading;

  const totalSectionsWithContent = Object.values(summary).filter(
    (s) => s && (s.attested || s.count > 0)
  ).length;

  if (activeCategoryId !== null) {
    return (
      <CategorySession
        categoryId={activeCategoryId}
        summary={summary}
        onDismiss={() => setActiveCategoryId(null)}
      />
    );
  }

  return (
    <DashboardLayout>
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          minHeight: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "48px",
            paddingBottom: "100px",
            paddingLeft: "20px",
            paddingRight: "20px",
          }}
        >
          <div style={{ maxWidth: "680px", width: "100%" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <BookOpen style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.3)" }} />
                <p className="type-caption-md" style={{ color: "#d0d6e0", margin: 0 }}>
                  Tool · Spiritual Freedom
                </p>
              </div>
              <h1
                className="font-serif"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(28px, 5vw + 8px, 56px)",
                  lineHeight: 1.05,
                  color: "white",
                  margin: "0 0 12px",
                }}
              >
                The Deliverance Workbook
              </h1>
              <p className="type-body-lg" style={{ color: "var(--white-60)", margin: 0 }}>
                A spiritual inventory to prepare for a long-form renunciation prayer. Work through each category at your own pace.
              </p>
            </div>

            {/* How It Works Video */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <p className="type-caption-md" style={{ color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  How It Works
                </p>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube-nocookie.com/embed/tz64CQS2l2o?rel=0&modestbranding=1"
                  title="How to Use the Deliverance Workbook"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ minHeight: "360px" }}
                />
              </div>
            </div>

            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "80px 0",
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "2px solid var(--white-10)",
                    borderTopColor: "var(--white-50)",
                    borderRadius: "50%",
                  }}
                />
              </div>
            ) : isExempt ? (
              <ExemptState />
            ) : isLocked ? (
              <LockedState />
            ) : (
              <>
                {/* Overall progress */}
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Afacad', sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Progress
                    </span>
                    <span
                      style={{
                        fontFamily: "'Afacad', sans-serif",
                        fontSize: "0.72rem",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {totalSectionsWithContent} sections filled
                    </span>
                  </div>
                  <div
                    style={{
                      height: "3px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    {totalSectionsWithContent > 0 && (
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.25)",
                          width: `${Math.min((totalSectionsWithContent / 20) * 100, 100)}%`,
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Category cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {SECTION_CATEGORIES.map((cat) => {
                    const catUnlocked = unlockedCategories.includes(cat.id);
                    if (!catUnlocked) {
                      return <LockedCategoryCard key={cat.id} categoryId={cat.id} name={cat.name} />;
                    }
                    return (
                      <CategoryCard
                        key={cat.id}
                        categoryId={cat.id}
                        name={cat.name}
                        description={cat.description}
                        summary={summary}
                        onClick={() => setActiveCategoryId(cat.id)}
                      />
                    );
                  })}
                </div>

                {/* Hint */}
                <p
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "0.82rem",
                    color: "rgba(255,255,255,0.2)",
                    textAlign: "center",
                    margin: "28px 0 0",
                    lineHeight: 1.6,
                  }}
                >
                  Each category opens a guided session — opening prayer, subsections in order, closing prayer. Exit at any time and your progress is saved.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
