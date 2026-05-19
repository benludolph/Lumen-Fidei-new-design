import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link, useParams } from "wouter";
import { ChevronRight } from "lucide-react";
import WorkbookShell from "@/components/workbook/WorkbookShell";
import { getSectionById } from "@/components/workbook/section-definitions";

function Breadcrumb({ sectionName }: { sectionName?: string }) {
  return (
    <div
      style={{
        position: "sticky",
        top: "72px",
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
                Freedom Workbook
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
            Freedom Workbook
          </span>
        )}
      </PageContainer>
    </div>
  );
}

export default function FreedomWorkbookResource() {
  const params = useParams<{ sectionId?: string }>();
  const sectionId = params.sectionId ? Number(params.sectionId) : undefined;
  const section = sectionId ? getSectionById(sectionId) : undefined;

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
        <WorkbookShell />
      </div>
    </DashboardLayout>
  );
}
