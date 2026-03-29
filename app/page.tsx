"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QueryBar } from "@/components/QueryBar";
import { SqlPreviewCard } from "@/components/SqlPreviewCard";
import { LiveGrid } from "@/components/LiveGrid";
import { Sparkles, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
interface QueryResult {
  sql: string;
  explanation: string;
  risk: "low" | "medium" | "high";
  operation: string;
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

type PageStatus = "idle" | "thinking" | "preview" | "confirm" | "executing" | "done";

// ─── High-risk confirmation modal ────────────────────────────────
function RiskConfirmModal({
  sql,
  onConfirm,
  onCancel,
}: {
  sql: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-red-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100">High Risk Operation</h3>
            <p className="text-xs text-zinc-500">This query may modify or delete data.</p>
          </div>
        </div>
        <pre className="text-xs text-zinc-300 font-mono bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto mb-5 whitespace-pre-wrap">
          {sql}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors text-sm font-bold"
          >
            Run Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────────
function HomeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") ?? undefined;

  const [status, setStatus] = useState<PageStatus>("idle");
  const [naturalQuery, setNaturalQuery] = useState<string>("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Called when the user hits Generate & Run
  const handleGenerate = async (query: string, _mode: "nl" | "sql") => {
    setNaturalQuery(query);
    setError(null);
    setStatus("thinking");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json()) as QueryResult;
      setResult(data);
      setStatus("preview");
    } catch {
      setError("Failed to generate SQL. Please try again.");
      setStatus("idle");
    }
  };

  const handleRunQuery = () => {
    if (!result) return;
    if (result.risk === "high") {
      setStatus("confirm");
    } else {
      setStatus("executing");
      setTimeout(() => setStatus("done"), 900);
    }
  };

  const handleConfirmRun = () => {
    setStatus("executing");
    setTimeout(() => setStatus("done"), 900);
  };

  return (
    <DashboardLayout>
      {/* Confirm modal for high-risk queries */}
      {status === "confirm" && result && (
        <RiskConfirmModal
          sql={result.sql}
          onConfirm={handleConfirmRun}
          onCancel={() => setStatus("preview")}
        />
      )}

      <div className="flex-1 flex flex-col p-6 lg:p-8 w-full">
        {/* Header + query bar — constrained width */}
        <div className="max-w-5xl mx-auto w-full">
          <header className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Query Editor</h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[52px]">
              Ask questions in plain English or write SQL directly.
            </p>
          </header>

          <div className="w-full flex flex-col gap-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <QueryBar
              onGenerate={handleGenerate}
              isGenerating={status === "thinking"}
              initialQuery={initialQuery}
              loadingLabel="Thinking…"
            />

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {result && (status === "preview" || status === "confirm" || status === "executing") && (
              <div className="animate-fade-in">
                <SqlPreviewCard
                  sql={result.sql}
                  explanation={result.explanation}
                  risk={result.risk}
                  onRun={handleRunQuery}
                  isExecuting={status === "executing"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Results — full width so row-detail side panel has space */}
        {status === "executing" && (
          <div className="mt-6 w-full max-w-5xl mx-auto">
            <LiveGrid hasRunQuery={false} isExecuting={true} />
          </div>
        )}

        {status === "done" && result && (
          <div className="mt-6 w-full animate-fade-in">
            <LiveGrid
              hasRunQuery={true}
              isExecuting={false}
              externalRows={result.rows}
              externalColumns={result.columns}
              naturalQuery={naturalQuery}
            />
          </div>
        )}

        {status === "idle" && (
          <div
            className="flex flex-col items-center justify-center py-20 text-center animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-zinc-600" />
            </div>
            <h3 className="text-zinc-300 font-medium text-lg mb-2">Ready to query</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Type a natural language question above and press{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 text-xs border border-zinc-700 mx-0.5">
                ⌘ Enter
              </kbd>{" "}
              to generate SQL.
            </p>
          </div>
        )}

        {status === "thinking" && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-accent rounded-full animate-spin mb-5" />
            <p className="text-zinc-400 text-sm">Generating SQL for your question…</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
