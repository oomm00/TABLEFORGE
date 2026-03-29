"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RelationshipVisualizer } from "@/components/RelationshipVisualizer";
import { Network } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-800">
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
          <Network className="w-6 h-6 text-zinc-700" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-36 h-28 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-600 animate-pulse">Loading schema…</p>
      </div>
    </div>
  );
}

export default function RelationsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 w-full h-screen overflow-hidden">
        <header className="mb-4 shrink-0 animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Network className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Relations</h1>
          </div>
          <p className="text-zinc-400 text-sm ml-[52px]">
            Interactive ER diagram — drag nodes, draw connections, click edges to inspect.
          </p>
        </header>

        <div className="flex-1 min-h-0 w-full">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="h-full w-full animate-fade-in">
              <RelationshipVisualizer />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
