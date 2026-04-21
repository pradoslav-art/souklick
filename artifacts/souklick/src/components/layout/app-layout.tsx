import { useState } from "react";
import Sidebar from "./sidebar";
import InstallBanner from "@/components/install-banner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold text-xs"
              style={{ background: "linear-gradient(145deg, hsl(25,95%,58%), hsl(25,95%,46%))" }}
            >
              S
            </div>
            <span className="text-sm font-semibold tracking-tight">Souklick</span>
          </div>
        </div>

        <InstallBanner />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
