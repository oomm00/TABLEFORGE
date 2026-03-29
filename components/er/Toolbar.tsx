"use client";

import React from "react";
import { LayoutGrid, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onAutoLayout: () => void;
  onFitView: () => void;
}

export function Toolbar({ onAutoLayout, onFitView }: ToolbarProps) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
      <button
        onClick={onAutoLayout}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          "bg-slate-900/90 border border-slate-700/60 text-slate-300",
          "hover:bg-slate-800 hover:text-white transition-colors shadow-lg backdrop-blur-sm"
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Auto Layout
      </button>
      <button
        onClick={onFitView}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          "bg-slate-900/90 border border-slate-700/60 text-slate-300",
          "hover:bg-slate-800 hover:text-white transition-colors shadow-lg backdrop-blur-sm"
        )}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        Fit View
      </button>
    </div>
  );
}
