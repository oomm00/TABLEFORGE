"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TerminalSquare, BookOpen, Clock, Network, Database, Zap, Sun, Moon } from "lucide-react";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

const sidebarItems = [
  { name: "Query", href: "/", icon: TerminalSquare, description: "AI-powered SQL" },
  { name: "Schema Story", href: "/schema", icon: BookOpen, description: "Table overview" },
  { name: "Query History", href: "/history", icon: Clock, description: "Past queries" },
  { name: "Relations", href: "/relations", icon: Network, description: "FK map" },
];

const tableItems = [
  { name: "users",         count: 124530  },
  { name: "orders",        count: 892310  },
  { name: "products",      count: 3480    },
  { name: "payments",      count: 785400  },
  { name: "subscriptions", count: 41200   },
  { name: "events",        count: 12450000},
  { name: "legacy_users",  count: 8920, isLegacy: true },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border transition-all duration-200 group bg-white/90 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 dark:bg-zinc-900/70 dark:border-zinc-800/60 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/70"
      aria-label="Toggle theme"
    >
      <span className="text-[11px] font-medium">{isDark ? "Dark mode" : "Light mode"}</span>
      {isDark
        ? <Moon className="w-3.5 h-3.5 text-accent group-hover:text-white transition-colors" />
        : <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:text-white transition-colors" />
      }
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r flex flex-col h-full sticky top-0 border-slate-200/80 bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-950/95 backdrop-blur-sm">
      {/* Brand */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-indigo-500/20 flex items-center justify-center border border-accent/20 shadow-[0_10px_20px_rgba(76,29,149,0.15)]">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <div>
          <span className="font-bold text-[15px] tracking-tight text-slate-900 dark:text-zinc-100 block leading-tight">TableForge</span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium tracking-wider uppercase">AI Assistant</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] text-slate-500 dark:text-zinc-600 uppercase tracking-widest font-semibold px-3 mb-3">Navigation</p>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-slate-200/90 text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)] dark:bg-zinc-800/80 dark:text-zinc-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/40"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full shadow-[0_0_8px_rgba(138,43,226,0.4)]" />
              )}
              <item.icon className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-accent" : "text-slate-500 group-hover:text-slate-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )} />
              <div className="flex-1 min-w-0">
                <span className="block">{item.name}</span>
                {isActive && (
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-normal">{item.description}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Tables list */}
      <div className="px-3 pb-3">
        <p className="text-[10px] text-slate-500 dark:text-zinc-600 uppercase tracking-widest font-semibold px-3 mb-2">Tables</p>
        <div className="space-y-1">
          {tableItems.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/30 group cursor-default transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {t.isLegacy ? (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                )}
                <span className="text-xs font-mono text-slate-500 group-hover:text-slate-800 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition-colors truncate">
                  {t.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-600 tabular-nums shrink-0 ml-1">
                {fmtCount(t.count)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-3 mt-auto flex flex-col gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        <div className="p-3 rounded-xl border bg-white/90 border-slate-200 shadow-sm dark:bg-zinc-900/70 dark:border-zinc-800/60 dark:shadow-none">
          <div className="flex items-center gap-2 mb-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-500" />
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Database</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse-dot" />
            <p className="text-xs text-emerald-400 font-medium">PostgreSQL · production</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
