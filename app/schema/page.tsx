"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BookOpen, Users, ShoppingCart, Package, CreditCard,
  Zap, AlertTriangle, Database, CheckCircle2, Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
interface Column { name: string; type: string; note?: string }
interface TableInfo {
  id: string;
  label: string;
  icon: React.ElementType;
  rowCount: number;
  rowCountLabel: string;
  description: string;
  columns: Column[];
  badge: "healthy" | "warning" | "legacy" | "high-volume";
  badgeLabel: string;
}

// ─── Mock data ────────────────────────────────────────────────────
const TABLES: TableInfo[] = [
  {
    id: "users",
    label: "users",
    icon: Users,
    rowCount: 124530,
    rowCountLabel: "124.5k",
    description: "Core user accounts table. Stores authentication info, plan type, onboarding status, and activity timestamps. The primary identity anchor across the entire schema.",
    badge: "healthy",
    badgeLabel: "Healthy",
    columns: [
      { name: "id",          type: "uuid",      note: "PK" },
      { name: "email",       type: "varchar",   note: "Unique" },
      { name: "name",        type: "varchar" },
      { name: "status",      type: "varchar",   note: "Active | Churned | Pending" },
      { name: "plan",        type: "varchar" },
      { name: "created_at",  type: "timestamp" },
      { name: "last_login",  type: "timestamp" },
    ],
  },
  {
    id: "orders",
    label: "orders",
    icon: ShoppingCart,
    rowCount: 892310,
    rowCountLabel: "892.3k",
    description: "Transactional records linking users to products. Tracks payment amounts, fulfillment status, and order timestamps. Central to revenue analytics.",
    badge: "healthy",
    badgeLabel: "Healthy",
    columns: [
      { name: "id",          type: "uuid",     note: "PK" },
      { name: "user_id",     type: "uuid",     note: "FK → users" },
      { name: "product_id",  type: "uuid",     note: "FK → products" },
      { name: "amount",      type: "numeric" },
      { name: "status",      type: "varchar",  note: "pending | paid | refunded" },
      { name: "created_at",  type: "timestamp" },
    ],
  },
  {
    id: "products",
    label: "products",
    icon: Package,
    rowCount: 3480,
    rowCountLabel: "3.5k",
    description: "Product catalog with pricing, category classification, and availability flags. Small, stable table — ideal for JOIN operations without cost concerns.",
    badge: "healthy",
    badgeLabel: "Healthy",
    columns: [
      { name: "id",          type: "uuid",    note: "PK" },
      { name: "name",        type: "varchar" },
      { name: "category",    type: "varchar" },
      { name: "price",       type: "numeric" },
      { name: "available",   type: "boolean" },
      { name: "created_at",  type: "timestamp" },
    ],
  },
  {
    id: "subscriptions",
    label: "subscriptions",
    icon: CreditCard,
    rowCount: 41200,
    rowCountLabel: "41.2k",
    description: "Billing and renewal records per user. Tracks plan tier, expiry date, and renewal status. Key for subscription health and churn analysis.",
    badge: "healthy",
    badgeLabel: "Healthy",
    columns: [
      { name: "id",          type: "uuid",     note: "PK" },
      { name: "user_id",     type: "uuid",     note: "FK → users" },
      { name: "plan",        type: "varchar" },
      { name: "status",      type: "varchar",  note: "active | expired | cancelled" },
      { name: "expires_at",  type: "timestamp" },
      { name: "created_at",  type: "timestamp" },
    ],
  },
  {
    id: "events",
    label: "events",
    icon: Zap,
    rowCount: 12450000,
    rowCountLabel: "12.4M",
    description: "High-volume behavioural tracking table. Logs every user action with a JSONB payload. Must be queried with care — always filter on created_at and use LIMIT.",
    badge: "high-volume",
    badgeLabel: "High Volume",
    columns: [
      { name: "id",           type: "bigint",   note: "PK" },
      { name: "user_id",      type: "uuid",     note: "FK → users" },
      { name: "event_type",   type: "varchar",  note: "Indexed" },
      { name: "payload",      type: "jsonb" },
      { name: "created_at",   type: "timestamp", note: "Indexed, always filter here" },
    ],
  },
  {
    id: "legacy_users",
    label: "legacy_users",
    icon: AlertTriangle,
    rowCount: 8920,
    rowCountLabel: "8.9k",
    description: "Deprecated v1 user table from before the 2023 migration. Still contains 8,920 active user records that have not been migrated. Do not write to this table.",
    badge: "legacy",
    badgeLabel: "Legacy — Deprecated",
    columns: [
      { name: "id",          type: "serial",   note: "PK (integer, not UUID)" },
      { name: "username",    type: "varchar" },
      { name: "email",       type: "varchar" },
      { name: "last_login",  type: "timestamp" },
    ],
  },
];

const BADGE_STYLES: Record<TableInfo["badge"], string> = {
  healthy:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "high-volume":"bg-blue-500/10 text-blue-400 border-blue-500/20",
  legacy:       "bg-red-500/10 text-red-400 border-red-500/20",
};

const ICON_BG: Record<TableInfo["badge"], string> = {
  healthy:       "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  warning:       "bg-amber-500/10 border-amber-500/20 text-amber-400",
  "high-volume": "bg-blue-500/10 border-blue-500/20 text-blue-400",
  legacy:        "bg-red-500/10 border-red-500/20 text-red-400",
};

const TOTAL_ROWS = TABLES.reduce((s, t) => s + t.rowCount, 0);

// ─── Table card ───────────────────────────────────────────────────
function TableCard({ table, visible }: { table: TableInfo; visible: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = table.icon;
  if (!visible) return null;

  return (
    <div
      className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 hover:border-zinc-700 
                 transition-all duration-200 overflow-hidden group"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border shrink-0 ${ICON_BG[table.badge]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-zinc-100 text-sm">{table.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${BADGE_STYLES[table.badge]}`}>
                {table.badgeLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">{table.description}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-zinc-100 tabular-nums">{table.rowCountLabel}</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">rows</p>
        </div>
      </div>

      {/* Columns */}
      <div className="border-t border-zinc-800/40 px-5 pb-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 pt-3 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span>{expanded ? "Hide" : "Show"} {table.columns.length} columns</span>
          <span className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {table.columns.map((col) => (
              <div
                key={col.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/30"
              >
                <span className="font-mono text-zinc-300 text-xs">{col.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-600 font-mono">{col.type}</span>
                  {col.note && (
                    <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                      {col.note}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function SchemaPage() {
  const [search, setSearch] = useState("");
  const lower = search.toLowerCase();
  const filtered = TABLES.filter(
    (t) => t.label.includes(lower) || t.description.toLowerCase().includes(lower)
  );

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Schema Story</h1>
          </div>
          <p className="text-zinc-400 text-sm ml-[52px]">
            An intelligent overview of your database structure, health, and relationships.
          </p>
        </header>

        {/* Summary card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "80ms" }}>
          {[
            { label: "Tables",       value: String(TABLES.length), icon: Database,      color: "text-accent" },
            { label: "Total Rows",   value: (TOTAL_ROWS / 1_000_000).toFixed(1) + "M", icon: Zap, color: "text-blue-400" },
            { label: "DB Engine",    value: "PostgreSQL 15",        icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Last Analyzed",value: "2 min ago",            icon: BookOpen,     color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60">
              <div className={`mb-2 ${color}`}><Icon className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-zinc-100">{value}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Anomaly / warnings */}
        <div className="space-y-2 mb-8 animate-fade-in" style={{ animationDelay: "120ms" }}>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-3">⚠ Anomalies</p>
          {[
            {
              icon: AlertTriangle,
              color: "text-red-400",
              bg: "bg-red-500/5 border-red-500/20",
              title: "legacy_users still has active records",
              body: "8,920 rows in legacy_users were not migrated. Some user IDs in events still reference this table. Plan migration before deprecation.",
            },
            {
              icon: Zap,
              color: "text-amber-400",
              bg: "bg-amber-500/5 border-amber-500/20",
              title: "events is a high-volume table (12.4M rows)",
              body: "Always include a created_at filter and LIMIT clause. Full scans on events will degrade production performance significantly.",
            },
          ].map(({ icon: Icon, color, bg, title, body }) => (
            <div key={title} className={`flex items-start gap-3 p-4 rounded-xl border ${bg}`}>
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
              <div>
                <p className={`text-sm font-semibold ${color}`}>{title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + table cards */}
        <div className="animate-fade-in" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold flex-1">Tables</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tables…"
                className="pl-8 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder-zinc-600 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 w-44"
              />
            </div>
          </div>

          <div className="space-y-3">
            {TABLES.map((t, i) => (
              <div
                key={t.id}
                className="animate-fade-in"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                <TableCard table={t} visible={filtered.some((f) => f.id === t.id)} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-400">No tables match &quot;{search}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
