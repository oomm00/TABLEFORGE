"use client";

import React, { useState, memo } from "react";
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import { X } from "lucide-react";

interface CustomEdgeData {
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
  onDelete: (id: string) => void;
}

function CustomEdgeComponent({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  style,
  selected,
  data,
}: EdgeProps<CustomEdgeData>) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 8,
  });

  const isActive = selected || hovered;
  const stroke = isActive
    ? (selected ? "#8b5cf6" : "#60a5fa")
    : (style?.stroke ?? "#3b82f6");

  return (
    <>
      {/* Wide invisible hit area for easier hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke,
          strokeWidth: isActive ? 2.5 : 1.5,
          filter: selected ? "drop-shadow(0 0 6px rgba(139,92,246,0.5))" : "none",
        }}
        markerEnd={`url(#arrowhead-${selected ? "active" : "default"})`}
        interactionWidth={0}
      />
      <EdgeLabelRenderer>
        {/* Tooltip on hover */}
        {hovered && data?.fromCol && (
          <div
            className="absolute pointer-events-none"
            style={{
              transform: `translate(-50%, -200%) translate(${labelX}px, ${labelY}px)`,
              zIndex: 10,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span className="block px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-[11px] text-slate-200 font-mono shadow-xl whitespace-nowrap">
              {data.from}.{data.fromCol} → {data.to}.{data.toCol}
            </span>
          </div>
        )}
        {/* Delete button on hover */}
        {hovered && (
          <div
            className="absolute pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              zIndex: 10,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                data?.onDelete?.(id);
              }}
              className="w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg border border-red-400/30 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
