import { Sidebar } from "@/components/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white/80 to-slate-100/80 dark:from-slate-950 dark:to-slate-950">
        {children}
      </main>
    </div>
  );
}
