import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link, useParams } from "wouter";
import { ChevronRight, BookOpen } from "lucide-react";
import WorkbookShell from "@/components/workbook/WorkbookShell";
import SectionView from "@/components/workbook/SectionView";
import { getSectionById } from "@/components/workbook/section-definitions";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

function Breadcrumb({ sectionName }: { sectionName?: string }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: "60px",
        display: "flex",
        alignItems: "center",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "var(--black-35)",
        borderBottom: "1px solid var(--white-8)",
        boxShadow: "0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)",
      }}
    >
      <PageContainer variant="full" className="flex items-center gap-2">
        <Link href="/resources">
          <span
            data-testid="breadcrumb-resources"
            className="type-body-lg"
            style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Resources
          </span>
        </Link>
        <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
          <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
        </div>
        {sectionName ? (
          <>
            <Link href="/resources/tools/freedom-workbook">
              <span
                className="type-body-lg"
                style={{ color: "var(--white-60)", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                The Deliverance Workbook
              </span>
            </Link>
            <div style={{ width: "12px", height: "12px", opacity: 0.5, flexShrink: 0 }}>
              <ChevronRight style={{ width: "12px", height: "12px", color: "white" }} />
            </div>
            <span
              data-testid="breadcrumb-current"
              className="type-body-lg"
              style={{ color: "var(--white-60)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}
            >
              {sectionName}
            </span>
          </>
        ) : (
          <span
            data-testid="breadcrumb-current"
            className="type-body-lg"
            style={{ color: "var(--white-60)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}
          >
            The Deliverance Workbook
          </span>
        )}
      </PageContainer>
    </div>
  );
}

function ExemptNotice() {
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
        Your guide has arranged a different approach for this step. Continue through your daily content as normal.
      </p>
    </div>
  );
}

function MentorNotAvailable() {
  return (
    <div
      data-testid="mentor-not-available"
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
        This is a participant tool
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
        The Deliverance Workbook is designed for participants in the program. As a mentor, your dashboard is the best place to support your participants.
      </p>
    </div>
  );
}

export default function FreedomWorkbookResource() {
  const { user } = useAuth();
  const params = useParams<{ sectionId?: string }>();
  const sectionId = params.sectionId ? Number(params.sectionId) : undefined;
  const section = sectionId ? getSectionById(sectionId) : undefined;

  const { data: unlockStatus } = useQuery<{ unlockedCategories: number[]; exempt?: boolean }>({
    queryKey: ["/api/workbook/unlock-status"],
  });
  const isExempt = unlockStatus?.exempt === true;

  return (
    <DashboardLayout>
      <Breadcrumb sectionName={section?.name} />
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "685px",
        }}
      >
        {user?.role === "mentor" ? (
          <MentorNotAvailable />
        ) : isExempt ? (
          <ExemptNotice />
        ) : sectionId ? (
          <SectionView sectionId={sectionId} />
        ) : (
          <WorkbookShell />
        )}
      </div>
    </DashboardLayout>
  );
}
