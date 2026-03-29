import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "low" | "medium" | "high";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-zinc-800 text-zinc-100": variant === "default",
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400": variant === "low",
          "border-amber-500/20 bg-amber-500/10 text-amber-400": variant === "medium",
          "border-red-500/20 bg-red-500/10 text-red-400": variant === "high",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
