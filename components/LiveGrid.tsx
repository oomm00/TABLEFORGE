"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  VisibilityState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  ChevronLeft, ChevronRight, Database,
  X, Columns2, Link, ChevronDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Static mock row type ─────────────────────────────────────────
type MockRow = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Churned" | "Pending";
  lastLogin: string;
  revenue: number;
  user_id?: string | null;
  is_active?: boolean | null;
  deleted_at?: null;
};

const MOCK_ROWS: MockRow[] = [
  { id: "usr_9kx2", name: "Alice Freeman",  email: "alice@acme.co",       status: "Active",  lastLogin: "2025-01-29T14:32:00Z", revenue: 4500,  user_id: "org_42", is_active: true,  deleted_at: null },
  { id: "usr_2m5p", name: "Bob Smith",      email: "bsmith@globex.inc",   status: "Churned", lastLogin: "2024-11-14T09:11:00Z", revenue: 1200,  user_id: "org_17", is_active: false, deleted_at: null },
  { id: "usr_7x1z", name: "Carol Davis",    email: "carol.d@initrode.io", status: "Active",  lastLogin: "2025-01-29T13:00:00Z", revenue: 8900,  user_id: "org_42", is_active: true,  deleted_at: null },
  { id: "usr_4y9b", name: "Dave Wilson",    email: "dwilson@initech.com", status: "Pending", lastLogin: "2025-01-01T08:00:00Z", revenue: 0,     user_id: null,     is_active: null,  deleted_at: null },
  { id: "usr_1a8c", name: "Eve Xu",         email: "eve@soylent.corp",    status: "Active",  lastLogin: "2025-01-27T18:45:00Z", revenue: 15400, user_id: "org_91", is_active: true,  deleted_at: null },
  { id: "usr_6t3r", name: "Frank Miller",   email: "frank@massive.com",   status: "Churned", lastLogin: "2024-02-03T10:20:00Z", revenue: 300,   user_id: "org_17", is_active: false, deleted_at: null },
];

// ─── Helpers ──────────────────────────────────────────────────────
function isoLike(v: string) { return /^\d{4}-\d{2}-\d{2}T/.test(v); }

function formatDatetime(iso: string) {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) +
      " UTC"
    );
  } catch { return iso; }
}

// ─── Dynamic column builder for arbitrary rows ────────────────────
function buildDynamicColumns(columns: string[]): ColumnDef<Record<string, unknown>>[] {
  const helper = createColumnHelper<Record<string, unknown>>();
  return columns.map((col) =>
    helper.accessor(col, {
      id: col,
      header: col,
      cell: (info) => {
        const val = info.getValue();
        if (val === null || val === undefined)
          return <span className="italic text-zinc-600 text-xs">null</span>;
        if (typeof val === "boolean")
          return val
            ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">true</span>
            : <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">false</span>;
        if (typeof val === "string" && isoLike(val))
          return <span className="text-zinc-300 text-xs whitespace-nowrap">{formatDatetime(val)}</span>;
        if (col.endsWith("_id") && typeof val === "string")
          return <span className="flex items-center gap-1 text-blue-400 font-mono text-xs"><Link className="w-3 h-3 shrink-0" />{val}</span>;
        if (typeof val === "number")
          return <span className="font-mono text-zinc-300 text-sm">{val.toLocaleString('en-US')}</span>;
        return <span className="text-zinc-300 text-sm">{String(val)}</span>;
      },
    })
  );
}

// ─── Static mock columns ──────────────────────────────────────────
const mockHelper = createColumnHelper<MockRow>();
const STATIC_COLUMNS = [
  mockHelper.accessor("id",        { header: "ID",         cell: (i) => <span className="text-zinc-500 font-mono text-xs">{i.getValue()}</span> }),
  mockHelper.accessor("name",      { header: "Name",       cell: (i) => <span className="font-medium text-zinc-200">{i.getValue()}</span> }),
  mockHelper.accessor("email",     { header: "Email",      cell: (i) => <span className="text-zinc-400">{i.getValue()}</span> }),
  mockHelper.accessor("status",    {
    header: "Status",
    cell: (i) => {
      const s = i.getValue();
      return (
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border",
          s === "Active"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          s === "Churned" ? "bg-red-500/10 text-red-400 border-red-500/20" :
          "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>{s}</span>
      );
    },
  }),
  mockHelper.accessor("lastLogin", {
    header: "Last Login",
    cell: (i) => {
      const v = i.getValue();
      return <span className="text-zinc-400 text-sm whitespace-nowrap">{isoLike(v) ? formatDatetime(v) : v}</span>;
    },
  }),
  mockHelper.accessor("revenue",   { header: "Revenue",   cell: (i) => <span className="text-zinc-300 font-mono">${i.getValue().toLocaleString('en-US')}</span> }),
  mockHelper.accessor("user_id",   {
    header: "User ID",
    cell: (i) => {
      const v = i.getValue();
      if (!v) return <span className="italic text-zinc-600 text-xs">null</span>;
      return <span className="flex items-center gap-1 text-blue-400 font-mono text-xs"><Link className="w-3 h-3 shrink-0" />{v}</span>;
    },
  }),
  mockHelper.accessor("is_active", {
    header: "Active",
    cell: (i) => {
      const v = i.getValue();
      if (v === null || v === undefined)
        return <span className="italic text-zinc-600 text-xs">null</span>;
      return v
        ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">true</span>
        : <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">false</span>;
    },
  }),
];

// ─── Row detail panel ─────────────────────────────────────────────
function RowDetailPanel({
  row,
  onClose,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
}) {
  function renderValue(key: string, value: unknown) {
    if (value === null || value === undefined)
      return <span className="italic text-zinc-600 text-sm">null</span>;
    if (typeof value === "boolean")
      return value
        ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">true</span>
        : <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">false</span>;
    if (typeof value === "string" && isoLike(value))
      return <span className="text-sm text-zinc-200 font-medium">{formatDatetime(value)}</span>;
    if (key.endsWith("_id") && typeof value === "string")
      return (
        <span className="flex items-center gap-1.5 text-blue-400 text-sm font-medium">
          <Link className="w-3.5 h-3.5 shrink-0" />{value}
        </span>
      );
    if (typeof value === "number")
      return <span className="text-sm text-zinc-200 font-medium font-mono">{value.toLocaleString('en-US')}</span>;
    return <span className="text-sm text-zinc-200 font-medium">{String(value)}</span>;
  }

  const idVal = String(row.id ?? row[Object.keys(row)[0]] ?? "row");

  return (
    <div className="w-[300px] shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-950 animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 shrink-0">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Row Detail</p>
          <p className="font-mono font-bold text-sm text-zinc-100 mt-0.5">{idVal}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {Object.entries(row).map(([key, val]) => (
          <div key={key} className="px-3 py-2.5 rounded-lg hover:bg-zinc-900/60 transition-colors">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">{key}</p>
            {renderValue(key, val)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Column visibility dropdown ───────────────────────────────────
function ColumnVisibilityDropdown<TRow>({
  table,
}: {
  table: ReturnType<typeof useReactTable<TRow>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
      >
        <Columns2 className="w-3.5 h-3.5" />
        Columns
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-zinc-800/60">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Toggle Columns</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {table.getAllColumns().map((col) => {
              if (!col.getCanHide()) return null;
              const visible = col.getIsVisible();
              return (
                <button
                  key={col.id}
                  onClick={() => col.toggleVisibility(!visible)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="font-mono">{col.id}</span>
                  {visible && <Check className="w-3 h-3 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Author attribution ───────────────────────────────────────────
function AuthorRow({ rowCount, query }: { rowCount: number; query?: string }) {
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-emerald-400 font-medium">{rowCount} row{rowCount !== 1 ? "s" : ""}</span>
        <span className="text-zinc-600">returned</span>
        {query && <span className="text-zinc-700 truncate max-w-[200px]">· {query}</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>Run by</span>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-[9px] text-accent font-bold leading-none">RS</span>
          </div>
          <span className="text-zinc-400 font-medium">RS</span>
        </div>
        <span className="text-zinc-600">·</span>
        <span>just now</span>
      </div>
    </div>
  );
}

// ─── Table renderer — works for both static and dynamic rows ──────
function TableRenderer<TRow extends Record<string, unknown>>({
  table,
  selectedRow,
  onRowClick,
}: {
  table: ReturnType<typeof useReactTable<TRow>>;
  selectedRow: Record<string, unknown> | null;
  onRowClick: (row: TRow) => void;
}) {
  return (
    <div className="overflow-x-auto scrollbar-dark">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-zinc-900/50 border-b border-zinc-800/60 text-zinc-400 sticky top-0 z-10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-5 py-3 font-medium tracking-wide text-xs uppercase">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-800/40">
          {table.getRowModel().rows.map((row) => {
            const isSelected = selectedRow &&
              JSON.stringify(row.original) === JSON.stringify(selectedRow);
            return (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.original)}
                className={cn(
                  "transition-colors duration-150 cursor-pointer border-l-2",
                  isSelected
                    ? "bg-blue-500/5 border-l-blue-500"
                    : "hover:bg-white/[0.02] border-l-transparent"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-3.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────
export interface LiveGridProps {
  hasRunQuery?: boolean;
  isExecuting?: boolean;
  externalRows?: Record<string, unknown>[];
  externalColumns?: string[];
  naturalQuery?: string;
}

// ─── Main component ───────────────────────────────────────────────
export function LiveGrid({
  hasRunQuery = false,
  isExecuting = false,
  externalRows,
  externalColumns,
  naturalQuery,
}: LiveGridProps) {
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [colVisibility, setColVisibility] = useState<VisibilityState>({});

  // Dynamic table when external data provided
  const isDynamic = externalRows && externalColumns && externalRows.length > 0;
  const dynData = isDynamic ? externalRows : [];
  const dynCols = isDynamic ? buildDynamicColumns(externalColumns!) : [];

  const dynamicTable = useReactTable<Record<string, unknown>>({
    data: dynData,
    columns: dynCols as ColumnDef<Record<string, unknown>>[],
    state: { columnVisibility: colVisibility },
    onColumnVisibilityChange: setColVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  // Static mock table
  const [mockData] = useState(() => [...MOCK_ROWS]);
  const staticTable = useReactTable<MockRow>({
    data: mockData,
    columns: STATIC_COLUMNS,
    state: { columnVisibility: colVisibility },
    onColumnVisibilityChange: setColVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  if (isExecuting) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/30 min-h-[260px] animate-pulse">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-accent rounded-full animate-spin mb-5" />
        <h3 className="text-lg font-medium text-zinc-300">Running Query…</h3>
        <p className="text-sm mt-2 text-zinc-500">Fetching live data from the database.</p>
      </div>
    );
  }
  if (!hasRunQuery) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 min-h-[260px]">
        <Database className="w-10 h-10 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-300">No Results Yet</h3>
        <p className="text-sm mt-2 max-w-xs text-center text-zinc-500">Run a query above to see live results in the grid.</p>
      </div>
    );
  }

  const rowCount = isDynamic ? externalRows!.length : mockData.length;

  function renderFooter(canPrev: boolean, canNext: boolean, onPrev: () => void, onNext: () => void, pageIndex: number, pageCount: number) {
    return (
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 bg-zinc-950/50">
        <p className="text-xs text-zinc-600">Page {pageIndex + 1} of {pageCount}</p>
        <div className="flex items-center gap-1.5">
          <button onClick={onPrev} disabled={!canPrev} className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onNext} disabled={!canNext} className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 animate-fade-in">
      <AuthorRow rowCount={rowCount} query={naturalQuery} />
      <div className="flex w-full overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-900/30">
            <p className="text-[11px] text-zinc-600">Click a row to inspect details</p>
            {isDynamic
              ? <ColumnVisibilityDropdown table={dynamicTable} />
              : <ColumnVisibilityDropdown table={staticTable as ReturnType<typeof useReactTable<MockRow>>} />
            }
          </div>

          {isDynamic ? (
            <>
              <TableRenderer
                table={dynamicTable}
                selectedRow={selectedRow}
                onRowClick={(row) => setSelectedRow(
                  selectedRow && JSON.stringify(row) === JSON.stringify(selectedRow) ? null : row
                )}
              />
              {renderFooter(
                dynamicTable.getCanPreviousPage(), dynamicTable.getCanNextPage(),
                () => dynamicTable.previousPage(), () => dynamicTable.nextPage(),
                dynamicTable.getState().pagination.pageIndex,
                dynamicTable.getPageCount(),
              )}
            </>
          ) : (
            <>
              <TableRenderer
                table={staticTable}
                selectedRow={selectedRow}
                onRowClick={(row) => setSelectedRow(
                  selectedRow && JSON.stringify(row) === JSON.stringify(selectedRow) ? null : (row as unknown as Record<string, unknown>)
                )}
              />
              {renderFooter(
                staticTable.getCanPreviousPage(), staticTable.getCanNextPage(),
                () => staticTable.previousPage(), () => staticTable.nextPage(),
                staticTable.getState().pagination.pageIndex,
                staticTable.getPageCount(),
              )}
            </>
          )}
        </div>

        {/* Row detail panel — only mounted when a row is selected */}
        {selectedRow && (
          <RowDetailPanel
            row={selectedRow}
            onClose={() => setSelectedRow(null)}
          />
        )}
      </div>
    </div>
  );
}
