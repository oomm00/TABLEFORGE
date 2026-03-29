"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { TableDef } from "./erData";

function TableNodeComponent({ data, selected }: NodeProps<TableDef>) {
  const isLegacy = !!data.isLegacy;

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden shadow-xl border transition-all duration-200 min-w-[230px]",
        selected
          ? "border-accent ring-2 ring-accent/25"
          : "border-slate-700 dark:border-slate-700 hover:border-slate-500",
        "bg-slate-800 dark:bg-slate-800"
      )}
    >
      {/* ── Header ── */}
      <div
        className={cn(
          "px-4 py-2.5 flex items-center justify-between border-b border-slate-700/60",
          isLegacy
            ? "bg-amber-900/40 dark:bg-amber-900/40"
            : "bg-blue-900/40 dark:bg-blue-900/40"
        )}
      >
        <span className="font-mono font-bold text-sm text-slate-100 tracking-wide">
          {data.label}
        </span>
        <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
          {data.rowCount.toLocaleString('en-US')}
        </span>
      </div>

      {/* ── Columns ── */}
      {data.columns.map((col, i) => (
        <div
          key={col.name}
          className={cn(
            "relative flex items-center justify-between px-4 py-[6px] text-xs transition-colors",
            "hover:bg-slate-700/30",
            i < data.columns.length - 1 ? "border-b border-slate-700/20" : ""
          )}
        >
          {/* Left handle (target) */}
          <Handle
            type="target"
            position={Position.Left}
            id={`${data.label}-${col.name}-in`}
            style={{ left: -5, top: "50%", transform: "translateY(-50%)" }}
            className={cn(
              "!w-2.5 !h-2.5 !rounded-full !border-2 transition-colors",
              col.isFk
                ? "!bg-blue-500 !border-blue-400"
                : "!bg-slate-600 !border-slate-500"
            )}
          />

          {/* Column indicator dot */}
          <div className="flex items-center gap-2">
            {col.isPk ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            ) : col.isFk ? (
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
            )}
            <span
              className={cn(
                "font-mono",
                col.isPk ? "text-amber-300" : col.isFk ? "text-blue-300" : "text-slate-300"
              )}
            >
              {col.name}
            </span>
            {/* Constraint badges */}
            <span className="flex gap-1">
              {col.isPk && (
                <span className="text-[9px] font-bold text-amber-400/70 bg-amber-400/10 px-1 rounded">PK</span>
              )}
              {col.isFk && (
                <span className="text-[9px] font-bold text-blue-400/70 bg-blue-400/10 px-1 rounded">FK</span>
              )}
              {col.nullable === false && (
                <span className="text-[9px] font-bold text-red-400/60 bg-red-400/10 px-1 rounded">NN</span>
              )}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 ml-3 shrink-0">{col.type}</span>

          {/* Right handle (source) – connection drag point */}
          <Handle
            type="source"
            position={Position.Right}
            id={`${data.label}-${col.name}-out`}
            style={{ right: -5, top: "50%", transform: "translateY(-50%)" }}
            className={cn(
              "!w-2.5 !h-2.5 !rounded-full !border-2 transition-colors",
              col.isPk
                ? "!bg-amber-500 !border-amber-400"
                : "!bg-slate-600 !border-slate-500"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
