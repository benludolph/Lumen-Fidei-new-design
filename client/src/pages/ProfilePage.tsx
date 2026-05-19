import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HealingLayout } from "@/components/layout/HealingLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/use-auth";
import UserProfileEditor from "@/components/workbook/UserProfileEditor";

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
          My Profile
        </span>
      </PageContainer>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const isHealingTrack = user?.track === "C";
  const Layout = isHealingTrack ? HealingLayout : DashboardLayout;

  return (
    <Layout>
      <Breadcrumb />
      <div
        style={{
          backgroundColor: "var(--surface-ground)",
          minHeight: "calc(100vh - 132px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PageContainer variant="narrow" className="pt-10 pb-16">
          <UserProfileEditor />
        </PageContainer>
      </div>
    </Layout>
  );
}
