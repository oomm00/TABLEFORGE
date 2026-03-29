"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  variant?: "success" | "error";
  onDone: () => void;
}

export function Toast({ message, variant = "success", onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl border",
        "text-sm font-medium animate-fade-in backdrop-blur-sm",
        variant === "success"
          ? "bg-emerald-950/90 border-emerald-700/40 text-emerald-300"
          : "bg-red-950/90 border-red-700/40 text-red-300"
      )}
    >
      {variant === "success"
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
      }
      {message}
    </div>
  );
}
