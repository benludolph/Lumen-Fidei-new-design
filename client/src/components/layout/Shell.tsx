import { useState } from "react";
import { Sidebar, MobileHeader, MobileDrawer } from "./Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <Sidebar />
      <main className="md:ml-64 p-4 sm:p-8 pt-20 md:pt-8 min-h-screen">
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
