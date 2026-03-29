"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, ArrowRight } from "lucide-react";

interface SqlPreviewCardProps {
  sql: string;
  explanation: string;
  risk: "low" | "medium" | "high";
  onRun: () => void;
  isExecuting?: boolean;
}

export function SqlPreviewCard({ sql, explanation, risk, onRun, isExecuting }: SqlPreviewCardProps) {
  return (
    <Card className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden ring-1 ring-white/5 shadow-[0_12px_32px_rgba(2,6,23,0.28)] border-zinc-800/90">
      <CardHeader className="bg-zinc-900/60 py-4 border-b border-zinc-800/60 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2 text-zinc-300">
          <Code className="w-4 h-4 text-purple-400" />
          <CardTitle className="text-base font-medium">Generated SQL</CardTitle>
        </div>
        <Badge variant={risk} className="capitalize">{risk} Risk</Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="bg-[#0d1117] px-5 py-4 overflow-x-auto border-b border-zinc-800/50">
          <pre className="text-sm font-mono text-zinc-300 leading-relaxed tracking-tight">
            <code>{sql}</code>
          </pre>
        </div>
        
        <div className="px-5 py-4 bg-zinc-900/30 flex items-start space-x-3 text-sm">
          <div className="flex-1 text-zinc-400 leading-relaxed">
            <span className="font-medium text-zinc-300 block mb-1.5 text-xs uppercase tracking-wide">Explanation</span>
            {explanation}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-950 px-5 py-3 border-t border-zinc-800/50 flex justify-end">
        <Button 
          variant="primary" 
          onClick={onRun} 
          disabled={isExecuting}
          className="shadow-[0_0_15px_rgba(138,43,226,0.2)] hover:shadow-[0_0_20px_rgba(138,43,226,0.35)] transition-all duration-200"
        >
          {isExecuting ? "Executing..." : "Run Query"}
          {!isExecuting && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
