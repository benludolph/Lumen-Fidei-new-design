import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import PrayerRender from "@/components/workbook/PrayerRender";

function Breadcrumb() {
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
        <span
          data-testid="breadcrumb-current"
          className="type-body-lg"
          style={{ color: "var(--white-60)", whiteSpace: "nowrap" }}
        >
          Daily Renewal
        </span>
      </PageContainer>
    </div>
  );
}

export default function DailyRenewalResource() {
  const [, navigate] = useLocation();

  return (
    <DashboardLayout>
      <Breadcrumb />
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "685px",
        }}
      >
        <PrayerRender
          prayerId="prayer_3"
          onDone={() => navigate("/resources")}
        />
      </div>
    </DashboardLayout>
  );
}
