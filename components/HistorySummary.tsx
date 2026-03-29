"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertTriangle } from "lucide-react";

interface HistorySummaryProps {
  total: number;
  successful: number;
  risky: number;
}

export function HistorySummary({ total, successful, risky }: HistorySummaryProps) {
  const stats = [
    {
      label: "Total Queries",
      value: total,
      icon: Activity,
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Successful",
      value: successful,
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "High Risk",
      value: risky,
      icon: AlertTriangle,
      iconColor: "text-red-400",
      borderColor: "border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={`bg-card ${stat.borderColor}`}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100 tracking-tight">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
