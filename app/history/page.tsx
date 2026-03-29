"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Clock, Search, Play, CheckCircle2, XCircle,
  AlertTriangle, Filter, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────
type Risk      = "low" | "medium" | "high";
type Operation = "SELECT" | "UPDATE" | "DELETE" | "INSERT";
type Status    = "success" | "failed" | "edited";

interface HistoryItem {
  id: string;
  user: string;
  initials: string;
  naturalQuery: string;
  sql: string;
  risk: Risk;
  operation: Operation;
  status: Status;
  rowCount: number;
  timestamp: string;
  duration: string;
}

// ─── Mock history data ────────────────────────────────────────────
const HISTORY: HistoryItem[] = [
  {
    id: "h1", user: "Rahul S", initials: "RS",
    naturalQuery: "Show me all active users with their total revenue",
    sql: "SELECT u.id, u.name, SUM(o.amount) AS revenue FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.status = 'Active' GROUP BY u.id ORDER BY revenue DESC LIMIT 50",
    risk: "low", operation: "SELECT", status: "success", rowCount: 48, timestamp: "2025-01-29T14:32:00Z", duration: "124ms",
  },
  {
    id: "h2", user: "Priya M", initials: "PM",
    naturalQuery: "Find all pending orders from the last 30 days",
    sql: "SELECT * FROM orders WHERE status = 'pending' AND created_at >= CURRENT_DATE - INTERVAL '30 days' ORDER BY created_at DESC",
    risk: "low", operation: "SELECT", status: "success", rowCount: 312, timestamp: "2025-01-29T13:15:00Z", duration: "89ms",
  },
  {
    id: "h3", user: "Rahul S", initials: "RS",
    naturalQuery: "Mark inactive users as churned",
    sql: "UPDATE users SET status = 'Churned' WHERE last_login < NOW() - INTERVAL '90 days' AND status = 'Active'",
    risk: "high", operation: "UPDATE", status: "edited", rowCount: 247, timestamp: "2025-01-29T11:48:00Z", duration: "342ms",
  },
  {
    id: "h4", user: "Amit K", initials: "AK",
    naturalQuery: "List top selling products this month",
    sql: "SELECT p.name, COUNT(o.id) AS orders FROM products p JOIN orders o ON o.product_id = p.id WHERE o.created_at >= DATE_TRUNC('month', NOW()) GROUP BY p.id ORDER BY orders DESC",
    risk: "low", operation: "SELECT", status: "success", rowCount: 20, timestamp: "2025-01-29T10:05:00Z", duration: "201ms",
  },
  {
    id: "h5", user: "Priya M", initials: "PM",
    naturalQuery: "Get all expired subscriptions",
    sql: "SELECT * FROM subscriptions WHERE status = 'expired' AND expires_at < NOW() ORDER BY expires_at DESC",
    risk: "low", operation: "SELECT", status: "failed", rowCount: 0, timestamp: "2025-01-28T18:22:00Z", duration: "timeout",
  },
  {
    id: "h6", user: "Rahul S", initials: "RS",
    naturalQuery: "Show new user signups per day this week",
    sql: "SELECT DATE(created_at) AS day, COUNT(*) AS signups FROM users WHERE created_at >= CURRENT_DATE - 7 GROUP BY day ORDER BY day",
    risk: "low", operation: "SELECT", status: "success", rowCount: 7, timestamp: "2025-01-28T16:40:00Z", duration: "67ms",
  },
  {
    id: "h7", user: "Amit K", initials: "AK",
    naturalQuery: "Delete all events older than 1 year",
    sql: "DELETE FROM events WHERE created_at < NOW() - INTERVAL '1 year'",
    risk: "high", operation: "DELETE", status: "edited", rowCount: 4820000, timestamp: "2025-01-28T14:10:00Z", duration: "—",
  },
  {
    id: "h8", user: "Rahul S", initials: "RS",
    naturalQuery: "Show revenue breakdown by product category",
    sql: "SELECT p.category, SUM(o.amount) AS revenue FROM orders o JOIN products p ON p.id = o.product_id GROUP BY p.category ORDER BY revenue DESC",
    risk: "low", operation: "SELECT", status: "success", rowCount: 5, timestamp: "2025-01-28T09:55:00Z", duration: "155ms",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const RISK_BADGE: Record<Risk, string> = {
  low:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
};

const OP_BADGE: Record<Operation, string> = {
  SELECT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  INSERT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  UPDATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICON: Record<Status, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  failed:  <XCircle className="w-4 h-4 text-red-400" />,
  edited:  <AlertTriangle className="w-4 h-4 text-amber-400" />,
};

// ─── Stats summary ────────────────────────────────────────────────
function SummaryStats({ items }: { items: HistoryItem[] }) {
  const total   = items.length;
  const success = items.filter((i) => i.status === "success").length;
  const highRisk= items.filter((i) => i.risk === "high").length;
  const failed  = items.filter((i) => i.status === "failed").length;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Total Queries",   value: total,    color: "text-zinc-100" },
        { label: "Successful",      value: success,  color: "text-emerald-400" },
        { label: "High Risk",       value: highRisk, color: "text-red-400" },
        { label: "Failed",          value: failed,   color: "text-amber-400" },
      ].map(({ label, value, color }) => (
        <div key={label} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60 text-center">
          <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── History item card ────────────────────────────────────────────
function HistoryCard({ item, onReplay }: { item: HistoryItem; onReplay: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60 hover:border-zinc-700 transition-all duration-150 group">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] text-accent font-bold">{item.initials}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-zinc-400">{item.user}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">{relativeTime(item.timestamp)}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">{item.duration !== "—" && item.duration !== "timeout" ? item.duration : ""}</span>
          </div>

          <p className="text-sm font-medium text-zinc-200 mb-2 leading-snug">{item.naturalQuery}</p>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            {STATUS_ICON[item.status]}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RISK_BADGE[item.risk]}`}>{item.risk}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${OP_BADGE[item.operation]}`}>{item.operation}</span>
            {item.rowCount > 0 && (
              <span suppressHydrationWarning className="text-xs text-zinc-600">{item.rowCount.toLocaleString('en-US')} rows</span>
            )}
            {item.status === "failed" && <span className="text-xs text-red-400">Query failed</span>}
          </div>

          {/* SQL preview */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {expanded ? "▾ Hide SQL" : "▸ Show SQL"}
          </button>
          {expanded && (
            <pre className="mt-2 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
              {item.sql}
            </pre>
          )}
        </div>

        {/* Replay button */}
        <button
          onClick={onReplay}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 hover:border-zinc-600 transition-all opacity-0 group-hover:opacity-100"
        >
          <Play className="w-3 h-3" /> Replay
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const [search, setSearch]     = useState("");
  const [opFilter, setOpFilter] = useState<Operation | "ALL">("ALL");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return HISTORY.filter((h) =>
      (opFilter === "ALL" || h.operation === opFilter) &&
      (h.naturalQuery.toLowerCase().includes(s) || h.sql.toLowerCase().includes(s))
    );
  }, [search, opFilter]);

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Query History</h1>
          </div>
          <p className="text-zinc-400 text-sm ml-[52px]">
            Every query run by your team, with risk levels and replay capability.
          </p>
        </header>

        <SummaryStats items={HISTORY} />

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-5 animate-fade-in" style={{ animationDelay: "80ms" }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queries…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder-zinc-600 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            />
          </div>

          {/* Operation filter chips */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            {(["ALL", "SELECT", "UPDATE", "DELETE", "INSERT"] as const).map((op) => (
              <button
                key={op}
                onClick={() => setOpFilter(op)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                  opFilter === op
                    ? "bg-accent/10 text-accent border-accent/30"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                )}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* History list */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "140ms" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-400">No queries match your filter.</p>
            </div>
          ) : (
            filtered.map((item, i) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <HistoryCard
                  item={item}
                  onReplay={() => router.push(`/?query=${encodeURIComponent(item.naturalQuery)}`)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
