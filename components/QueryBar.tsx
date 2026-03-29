"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, TerminalSquare, ArrowRight, Command, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryBarProps {
  onGenerate: (query: string, mode: 'nl' | 'sql') => void;
  isGenerating?: boolean;
  initialQuery?: string;
  loadingLabel?: string;
}

export function QueryBar({ onGenerate, isGenerating, initialQuery, loadingLabel = 'Generating SQL...' }: QueryBarProps) {
  const [query, setQuery] = useState(initialQuery || '');

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<'nl' | 'sql'>('nl'); // Natural language or SQL

  return (
    <div className="w-full relative group">
      {/* Background Glow Effect */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur opacity-20 transition duration-500",
        isFocused ? "opacity-100 duration-200" : "group-hover:opacity-75"
      )} />
      
      {/* Main Container */}
      <div className="relative flex flex-col w-full bg-zinc-950/85 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ring-1 ring-white/5 shadow-[0_14px_34px_rgba(0,0,0,0.35)] transition-all duration-300">
        
        {/* Toggle Mode Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.03]">
          <div className="flex items-center space-x-1 p-1 bg-black/40 rounded-lg border border-white/5">
            <button
              onClick={() => setMode('nl')}
              disabled={isGenerating}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                mode === 'nl' 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
                isGenerating && "opacity-60 cursor-not-allowed"
              )}
            >
              <Sparkles className={cn("w-3.5 h-3.5", mode === 'nl' && "text-blue-400")} />
              <span>Ask AI</span>
            </button>
            <button
              onClick={() => setMode('sql')}
              disabled={isGenerating}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                mode === 'sql' 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
                isGenerating && "opacity-60 cursor-not-allowed"
              )}
            >
              <TerminalSquare className={cn("w-3.5 h-3.5", mode === 'sql' && "text-purple-400")} />
              <span>Write SQL</span>
            </button>
          </div>

          <div className="flex items-center text-xs text-zinc-500 space-x-2 hidden sm:flex">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-300 flex items-center shadow-sm">
              <Command className="w-3 h-3 mr-1" />
              Enter
            </kbd>
            <span>to run</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative p-1.5">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              mode === 'nl' 
                ? "Ask a question about your data... (e.g., 'Show me users who churned last month')" 
                : "SELECT * FROM users WHERE status = 'churned'..."
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (query.trim() && !isGenerating) onGenerate(query, mode);
              }
            }}
            className="w-full min-h-[108px] bg-transparent text-zinc-100 placeholder-zinc-500 p-4 resize-none outline-none text-sm md:text-[15px] leading-relaxed"
            style={{ 
              fontFamily: mode === 'sql' ? "'JetBrains Mono', 'Fira Code', monospace" : "inherit"
            }}
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-3 bg-black/25 border-t border-white/5">
          <div className="flex items-center space-x-3 text-xs text-zinc-400 pl-2 transition-opacity duration-300">
            {isGenerating ? (
              <span className="flex items-center text-blue-300/90">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 animate-pulse" />
                AI is thinking...
              </span>
            ) : mode === 'nl' ? (
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
                AI will generate Postgres SQL
              </span>
            ) : (
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2" />
                Direct SQL execution
              </span>
            )}
          </div>
          
          <button 
            disabled={!query.trim() || isGenerating}
            onClick={() => onGenerate(query, mode)}
            className={cn(
              "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg",
              query.trim() && !isGenerating
                ? "bg-white text-black hover:bg-zinc-200 hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0" 
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>{loadingLabel}</span>
              </>
            ) : (
              <>
                <span>{mode === 'nl' ? 'Generate & Run' : 'Run Query'}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
