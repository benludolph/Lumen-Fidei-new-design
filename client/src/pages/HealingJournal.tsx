import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { HealingLayout } from "@/components/layout/HealingLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import type { HealingModule, HealingCompletion } from "@shared/schema";

interface Answer {
  id: number;
  userId: number;
  moduleNumber: number;
  content: string;
  createdAt: string;
}

export default function HealingJournal() {
  const { user } = useAuth();
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const { data: modules } = useQuery<HealingModule[]>({
    queryKey: ["/api/healing/modules"],
    enabled: !!user,
  });

  const { data: completions } = useQuery<HealingCompletion[]>({
    queryKey: ["/api/healing/completions"],
    enabled: !!user,
  });

  const { data: answers } = useQuery<Answer[]>({
    queryKey: ["/api/healing/answers"],
    enabled: !!user,
  });

  const journalMutation = useMutation({
    mutationFn: ({ moduleNumber, content }: { moduleNumber: number; content: string }) =>
      apiRequest("POST", "/api/healing/answers", { moduleNumber, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/healing/answers"] });
      setEditingModule(null);
    },
  });

  const completedSet = new Set(completions?.map(c => c.moduleNumber) ?? []);
  const answersMap = new Map(answers?.map(a => [a.moduleNumber, a]) ?? []);

  const getModuleTitle = (moduleNumber: number) => {
    const mod = modules?.find(m => m.moduleNumber === moduleNumber);
    return mod?.title ?? `Module ${moduleNumber}`;
  };

  const startEdit = (moduleNumber: number) => {
    setEditingModule(moduleNumber);
    setEditText(answersMap.get(moduleNumber)?.content ?? "");
    setExpandedModule(moduleNumber);
  };

  const saveEdit = () => {
    if (editingModule && editText.trim()) {
      journalMutation.mutate({ moduleNumber: editingModule, content: editText });
    }
  };

  const completedModuleNumbers = Array.from(completedSet).sort((a, b) => a - b);
  const withReflections = completedModuleNumbers.filter(n => answersMap.has(n));
  const withoutReflections = completedModuleNumbers.filter(n => !answersMap.has(n));

  if (!user) return null;

  return (
    <HealingLayout>
      <PageContainer variant="narrow" className="pt-[80px] pb-20 min-h-[calc(100vh-72px)]">
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <BookOpen className="w-5 h-5" style={{ color: "var(--brand)" }} />
              <span className="type-body-sm" style={{ color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                My Healing Journal
              </span>
            </div>
            <h1 className="type-display-xl" style={{ color: "white", margin: "0 0 8px" }}>
              Journal
            </h1>
            <p className="type-body-md" style={{ color: "var(--white-50)", margin: 0 }}>
              {withReflections.length} reflection{withReflections.length !== 1 ? "s" : ""} saved
            </p>
          </div>

          {completedModuleNumbers.length === 0 ? (
            <div
              style={{
                textAlign: "center", padding: "60px 24px",
                background: "var(--white-3)", borderRadius: "12px",
                border: "1px solid var(--white-6)",
              }}
            >
              <BookOpen className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--white-20)" }} />
              <p className="type-caption-md" style={{ color: "var(--white-40)", margin: "0 0 8px" }}>
                No entries yet
              </p>
              <p className="type-body-md" style={{ color: "var(--white-30)", margin: 0 }}>
                Complete a module and add a reflection to begin your journal.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {completedModuleNumbers.map((moduleNumber) => {
                const answer = answersMap.get(moduleNumber);
                const title = getModuleTitle(moduleNumber);
                const isExpanded = expandedModule === moduleNumber;
                const isEditing = editingModule === moduleNumber;

                return (
                  <div
                    key={moduleNumber}
                    data-testid={`journal-entry-${moduleNumber}`}
                    style={{
                      background: "var(--white-4)", borderRadius: "10px",
                      border: "1px solid var(--white-8)", overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <button
                      data-testid={`button-toggle-journal-${moduleNumber}`}
                      onClick={() => setExpandedModule(isExpanded ? null : moduleNumber)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "space-between", padding: "16px 20px",
                        background: "none", border: "none", cursor: "pointer",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <span
                          className="type-body-xs"
                          style={{
                            color: "var(--white-30)", fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {moduleNumber < 10 ? `0${moduleNumber}` : moduleNumber}
                        </span>
                        <p className="type-caption-md truncate" style={{ color: "white", margin: 0 }}>
                          {title}
                        </p>
                        {!answer && (
                          <span
                            className="type-body-xs"
                            style={{
                              color: "var(--white-30)", padding: "2px 8px",
                              background: "var(--white-4)", borderRadius: "4px",
                              flexShrink: 0,
                            }}
                          >
                            No reflection
                          </span>
                        )}
                      </div>
                      <div style={{ color: "var(--white-40)", flexShrink: 0 }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          padding: "0 20px 20px",
                          borderTop: "1px solid var(--white-6)",
                          paddingTop: "16px",
                        }}
                      >
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <textarea
                              data-testid={`textarea-edit-journal-${moduleNumber}`}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              placeholder="Write your reflection here…"
                              rows={5}
                              style={{
                                width: "100%", background: "var(--white-5)",
                                border: "1px solid var(--white-12)", borderRadius: "6px",
                                color: "white", padding: "12px", resize: "vertical",
                                outline: "none", fontFamily: "inherit",
                                fontSize: "14px", lineHeight: 1.6, boxSizing: "border-box",
                                minHeight: "120px",
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white-25)"; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--white-12)"; }}
                              autoFocus
                            />
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button
                                data-testid={`button-cancel-edit-journal-${moduleNumber}`}
                                onClick={() => setEditingModule(null)}
                                style={{
                                  padding: "8px 16px", background: "none",
                                  border: "1px solid var(--white-8)", borderRadius: "6px",
                                  color: "var(--white-50)", cursor: "pointer", fontSize: "13px",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                data-testid={`button-save-edit-journal-${moduleNumber}`}
                                onClick={saveEdit}
                                disabled={journalMutation.isPending || !editText.trim()}
                                style={{
                                  padding: "8px 16px", background: "var(--white-10)",
                                  border: "1px solid var(--white-15)", borderRadius: "6px",
                                  color: "white", cursor: "pointer", fontSize: "13px",
                                  opacity: journalMutation.isPending || !editText.trim() ? 0.5 : 1,
                                }}
                              >
                                {journalMutation.isPending ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {answer ? (
                              <>
                                <p
                                  className="type-body-xs"
                                  style={{ color: "var(--white-30)", margin: "0 0 6px" }}
                                  data-testid={`text-journal-date-${moduleNumber}`}
                                >
                                  {new Date(answer.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                </p>
                                <p
                                  className="type-body-md"
                                  style={{
                                    color: "var(--white-70)", margin: "0 0 12px",
                                    lineHeight: 1.7, whiteSpace: "pre-wrap",
                                  }}
                                  data-testid={`text-journal-content-${moduleNumber}`}
                                >
                                  {answer.content}
                                </p>
                              </>
                            ) : (
                              <p
                                className="type-body-md"
                                style={{ color: "var(--white-30)", margin: "0 0 12px", fontStyle: "italic" }}
                              >
                                No reflection written for this module yet.
                              </p>
                            )}
                            <button
                              data-testid={`button-edit-journal-${moduleNumber}`}
                              onClick={() => startEdit(moduleNumber)}
                              style={{
                                padding: "7px 14px", background: "var(--white-6)",
                                border: "1px solid var(--white-8)", borderRadius: "6px",
                                color: "var(--white-60)", cursor: "pointer", fontSize: "13px",
                              }}
                            >
                              {answer ? "Edit" : "Add Reflection"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </HealingLayout>
  );
}
