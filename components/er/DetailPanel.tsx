"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Database, ChevronRight, ArrowDown, Link2, Network,
  TerminalSquare, Trash2, AlertTriangle
} from "lucide-react";
import { RelationDef, TableDef } from "./erData";
import { cn } from "@/lib/utils";

// ── Panel state types ─────────────────────────────────────────────
export type PanelState =
  | { kind: "idle" }
  | { kind: "edge"; rel: RelationDef }
  | { kind: "node"; table: TableDef };

const REFERENTIAL_ACTIONS = ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"] as const;

// ── Shared panel wrapper ──────────────────────────────────────────
function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-72 shrink-0 border-l border-slate-700/60 bg-slate-900 flex flex-col overflow-y-auto transition-all duration-200">
      {children}
    </aside>
  );
}

function PanelHeader({ icon, title, onClose }: {
  icon: React.ReactNode;
  title: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0">
      <div className="flex items-center gap-2.5">
        {icon}
        <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Idle / Default panel ──────────────────────────────────────────
function IdlePanel({ tables, relations }: { tables: TableDef[]; relations: RelationDef[] }) {
  return (
    <PanelWrapper>
      <PanelHeader icon={<Network className="w-4 h-4 text-accent" />} title="Schema Overview" />
      <div className="p-5 space-y-5 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <p className="text-xl font-bold text-slate-100">{tables.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Tables</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <p className="text-xl font-bold text-slate-100">{relations.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Relations</p>
          </div>
        </div>

        {/* FK list */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3">
            Foreign Keys
          </p>
          <div className="space-y-1.5">
            {relations.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[12px] font-mono"
              >
                <span className="text-amber-400">{r.from}</span>
                <span className="text-slate-600">.</span>
                <span className="text-slate-300">{r.fromCol}</span>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="text-blue-400">{r.to}</span>
                <span className="text-slate-600">.</span>
                <span className="text-slate-300">{r.toCol}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600 text-center pt-2">
          Click a node or edge to inspect details.
        </p>
      </div>
    </PanelWrapper>
  );
}

// ── Edge panel ────────────────────────────────────────────────────
function EdgePanel({
  rel, onClose, onDelete, onChangeDelete, onChangeUpdate,
}: {
  rel: RelationDef;
  onClose: () => void;
  onDelete: () => void;
  onChangeDelete: (v: string) => void;
  onChangeUpdate: (v: string) => void;
}) {
  return (
    <PanelWrapper>
      <PanelHeader
        icon={<Link2 className="w-4 h-4 text-accent" />}
        title="Connection Details"
        onClose={onClose}
      />
      <div className="p-5 space-y-5 flex-1">
        {/* Key mapping */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/40 font-mono text-sm">
            <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-amber-300">{rel.from}</span>
            <span className="text-slate-500">.</span>
            <span className="text-slate-200">{rel.fromCol}</span>
          </div>
          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/40 font-mono text-sm">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-blue-300">{rel.to}</span>
            <span className="text-slate-500">.</span>
            <span className="text-slate-200">{rel.toCol}</span>
          </div>
        </div>

        {/* Type badge */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Type</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span>1</span>
            <span className="text-indigo-600">→</span>
            <span>N</span>
            <span className="ml-1">{rel.type}</span>
          </span>
        </div>

        {/* ON DELETE */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">On Delete</p>
          <select
            value={rel.onDelete}
            onChange={(e) => onChangeDelete(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-accent"
          >
            {REFERENTIAL_ACTIONS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>

        {/* ON UPDATE */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">On Update</p>
          <select
            value={rel.onUpdate}
            onChange={(e) => onChangeUpdate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-accent"
          >
            {REFERENTIAL_ACTIONS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700/60">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Connection
        </button>
      </div>
    </PanelWrapper>
  );
}

// ── Node panel ────────────────────────────────────────────────────
function NodePanel({ table, onClose }: { table: TableDef; onClose: () => void }) {
  const router = useRouter();

  return (
    <PanelWrapper>
      <PanelHeader
        icon={
          table.isLegacy
            ? <AlertTriangle className="w-4 h-4 text-amber-400" />
            : <Database className="w-4 h-4 text-accent" />
        }
        title={table.label}
        onClose={onClose}
      />
      <div className="p-5 space-y-5 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <p className="text-lg font-bold text-slate-100 tabular-nums">{table.rowCount.toLocaleString('en-US')}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Rows</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <p className="text-lg font-bold text-slate-100">{table.columns.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Columns</p>
          </div>
        </div>

        {table.isLegacy && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Legacy table — active records exist from v1. Migrate before deprecation.
          </div>
        )}

        {/* Column list */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Columns</p>
          <div className="space-y-0.5">
            {table.columns.map((col) => (
              <div key={col.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/40 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  {col.isPk
                    ? <span className="w-2 h-2 rounded-full bg-amber-400" />
                    : col.isFk
                    ? <span className="w-2 h-2 rounded-full bg-blue-400" />
                    : <span className="w-2 h-2 rounded-full bg-slate-600" />
                  }
                  <span className={cn(col.isPk ? "text-amber-300" : col.isFk ? "text-blue-300" : "text-slate-300")}>
                    {col.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-mono">{col.type}</span>
                  {col.isPk && <span className="text-[9px] text-amber-400/70 bg-amber-400/10 px-1 rounded font-bold">PK</span>}
                  {col.isFk && <span className="text-[9px] text-blue-400/70 bg-blue-400/10 px-1 rounded font-bold">FK</span>}
                  {col.nullable === false && <span className="text-[9px] text-red-400/60 bg-red-400/10 px-1 rounded font-bold">NN</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700/60">
        <button
          onClick={() => router.push(`/?query=${encodeURIComponent(`SELECT * FROM ${table.label} LIMIT 100`)}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 hover:text-teal-300 transition-colors"
        >
          <TerminalSquare className="w-4 h-4" /> Query this table
        </button>
      </div>
    </PanelWrapper>
  );
}

// ── Main export: renders the correct panel based on state ─────────
export function DetailPanel({
  state, tables, relations, onClose, onDelete, onChangeDelete, onChangeUpdate,
}: {
  state: PanelState;
  tables: TableDef[];
  relations: RelationDef[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onChangeDelete: (id: string, v: string) => void;
  onChangeUpdate: (id: string, v: string) => void;
}) {
  if (state.kind === "edge") {
    return (
      <EdgePanel
        rel={state.rel}
        onClose={onClose}
        onDelete={() => onDelete(state.rel.id)}
        onChangeDelete={(v) => onChangeDelete(state.rel.id, v)}
        onChangeUpdate={(v) => onChangeUpdate(state.rel.id, v)}
      />
    );
  }
  if (state.kind === "node") {
    return <NodePanel table={state.table} onClose={onClose} />;
  }
  return <IdlePanel tables={tables} relations={relations} />;
}
