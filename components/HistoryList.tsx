"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  status: "success" | "edited" | "failed";
  runCount: number;
  risk: "low" | "medium" | "high";
}

const mockHistory: HistoryItem[] = [
  {
    id: "q1",
    query: "SELECT * FROM users WHERE status = 'churned' AND created_at >= CURRENT_DATE - INTERVAL '1 month' ORDER BY revenue DESC",
    timestamp: "10 minutes ago",
    status: "success",
    runCount: 3,
    risk: "low",
  },
  {
    id: "q2",
    query: "Show me all orders with amount greater than $500 placed this week",
    timestamp: "1 hour ago",
    status: "success",
    runCount: 1,
    risk: "low",
  },
  {
    id: "q3",
    query: "DELETE FROM legacy_users WHERE last_login < '2023-01-01'",
    timestamp: "3 hours ago",
    status: "failed",
    runCount: 2,
    risk: "high",
  },
  {
    id: "q4",
    query: "UPDATE subscriptions SET plan = 'enterprise' WHERE company_id IN (SELECT id FROM companies WHERE revenue > 1000000)",
    timestamp: "Yesterday",
    status: "edited",
    runCount: 5,
    risk: "medium",
  },
  {
    id: "q5",
    query: "Which products have the highest return rate in the last quarter?",
    timestamp: "2 days ago",
    status: "success",
    runCount: 1,
    risk: "low",
  },
  {
    id: "q6",
    query: "SELECT u.name, COUNT(o.id) as order_count, SUM(o.amount) as total_spent FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.name ORDER BY total_spent DESC LIMIT 20",
    timestamp: "3 days ago",
    status: "success",
    runCount: 7,
    risk: "low",
  },
  {
    id: "q7",
    query: "DROP TABLE IF EXISTS temp_analytics_staging",
    timestamp: "1 week ago",
    status: "failed",
    runCount: 1,
    risk: "high",
  },
];

const statusConfig = {
  success: { label: "Success", badgeVariant: "low" as const, dotColor: "bg-emerald-500" },
  edited: { label: "Edited", badgeVariant: "medium" as const, dotColor: "bg-amber-500" },
  failed: { label: "Failed", badgeVariant: "high" as const, dotColor: "bg-red-500" },
};

type StatusFilter = "all" | "success" | "edited" | "failed";

export function HistoryList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return mockHistory.filter((item) => {
      const matchesSearch = item.query.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all" || item.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, activeFilter]);

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Success", value: "success" },
    { label: "Edited", value: "edited" },
    { label: "Failed", value: "failed" },
  ];

  const handleClick = (query: string) => {
    router.push(`/?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-900/50"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                activeFilter === f.value
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No queries match your search.
          </div>
        )}
        {filtered.map((item) => {
          const cfg = statusConfig[item.status];
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.query)}
              className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-card hover:bg-zinc-800/60 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-mono truncate group-hover:text-white transition-colors">
                    {item.query}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="w-3 h-3" />
                      {item.runCount} run{item.runCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                  <Play className="w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
