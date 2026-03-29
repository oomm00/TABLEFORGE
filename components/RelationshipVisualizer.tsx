"use client";

import React, { useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeMouseHandler,
  EdgeMouseHandler,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { TableNode } from "./er/TableNode";
import { CustomEdge } from "./er/CustomEdge";
import { DetailPanel, PanelState } from "./er/DetailPanel";
import { Toolbar } from "./er/Toolbar";
import { Toast } from "./er/Toast";
import { TABLES, RELATIONS, RelationDef, TableDef } from "./er/erData";

// ── Register custom node / edge types ─────────────────────────────
const nodeTypes = { tableCard: TableNode };
const edgeTypes = { custom: CustomEdge };

// ── Build initial React Flow nodes from table data ─────────────────
function buildNodes(tables: TableDef[]): Node<TableDef>[] {
  return tables.map((t) => ({
    id: t.id,
    type: "tableCard",
    position: { x: t.x, y: t.y },
    data: t,
  }));
}

// ── Build initial React Flow edges from relation data ──────────────
function buildEdges(
  relations: RelationDef[],
  onDelete: (id: string) => void
): Edge[] {
  return relations.map((r) => ({
    id: r.id,
    source: r.from,
    target: r.to,
    sourceHandle: `${r.from}-${r.fromCol}-out`,
    targetHandle: `${r.to}-${r.toCol}-in`,
    type: "custom",
    animated: true,
    style: { stroke: "#3b82f6" },
    data: {
      from: r.from,
      fromCol: r.fromCol,
      to: r.to,
      toCol: r.toCol,
      onDelete,
    },
  }));
}

// ── Inner component (needs ReactFlowProvider context) ──────────────
function VisualizerInner() {
  const { fitView } = useReactFlow();
  const [relations, setRelations] = useState<RelationDef[]>([...RELATIONS]);
  const [panel, setPanel] = useState<PanelState>({ kind: "idle" });
  const [toast, setToast] = useState<{ msg: string; variant: "success" | "error" } | null>(null);

  // ── Delete edge handler (stable via setEdges in deps) ────────────
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setRelations((rels) => rels.filter((r) => r.id !== edgeId));
      setPanel({ kind: "idle" });
      setToast({ msg: "Connection removed", variant: "error" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, , onNodesChange] = useNodesState(buildNodes(TABLES));
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(RELATIONS, handleDeleteEdge)
  );

  // ── Connect handler ───────────────────────────────────────────────
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `new-${Date.now()}`,
        source: params.source ?? "",
        target: params.target ?? "",
        sourceHandle: params.sourceHandle ?? undefined,
        targetHandle: params.targetHandle ?? undefined,
        type: "custom",
        animated: true,
        style: { stroke: "#3b82f6" },
        data: {
          from: params.source ?? "",
          fromCol: params.sourceHandle?.split("-")[1] ?? "",
          to: params.target ?? "",
          toCol: params.targetHandle?.split("-")[1] ?? "",
          onDelete: handleDeleteEdge,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setToast({ msg: "Connection added", variant: "success" });
    },
    [setEdges, handleDeleteEdge]
  );

  // ── Edge click → edge panel ───────────────────────────────────────
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_evt, edge) => {
      const rel = relations.find((r) => r.id === edge.id);
      if (rel) {
        setPanel({ kind: "edge", rel });
        // Highlight selected edge
        setEdges((eds) =>
          eds.map((e) => ({
            ...e,
            style: { stroke: e.id === edge.id ? "#8b5cf6" : "#3b82f6" },
          }))
        );
      }
    },
    [relations, setEdges]
  );

  // ── Node click → node panel ───────────────────────────────────────
  const onNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setPanel({ kind: "node", table: node.data as TableDef });
  }, []);

  // ── Pane click → idle panel ───────────────────────────────────────
  const onPaneClick = useCallback(() => {
    setPanel({ kind: "idle" });
    setEdges((eds) => eds.map((e) => ({ ...e, style: { stroke: "#3b82f6" } })));
  }, [setEdges]);

  // ── Auto layout ───────────────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    const COLS = 3;
    const X_GAP = 380;
    const Y_GAP = 320;
    (window as Window & { __rfSetNodes?: (fn: (ns: Node[]) => Node[]) => void }).__rfSetNodes;
    // Use the setNodes returned from useNodesState
    onNodesChange(
      TABLES.map((t, i) => ({
        type: "position" as const,
        id: t.id,
        position: {
          x: (i % COLS) * X_GAP + 50,
          y: Math.floor(i / COLS) * Y_GAP + 50,
        },
        dragging: false,
      }))
    );
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [onNodesChange, fitView]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, duration: 400 });
  }, [fitView]);

  // ── Panel interaction handlers ────────────────────────────────────
  const handleDeleteRelation = useCallback(
    (id: string) => {
      handleDeleteEdge(id);
    },
    [handleDeleteEdge]
  );

  const handleChangeDelete = useCallback(
    (id: string, value: string) => {
      setRelations((rels) =>
        rels.map((r) => (r.id === id ? { ...r, onDelete: value } : r))
      );
      setPanel((prev) =>
        prev.kind === "edge" && prev.rel.id === id
          ? { kind: "edge", rel: { ...prev.rel, onDelete: value } }
          : prev
      );
    },
    []
  );

  const handleChangeUpdate = useCallback(
    (id: string, value: string) => {
      setRelations((rels) =>
        rels.map((r) => (r.id === id ? { ...r, onUpdate: value } : r))
      );
      setPanel((prev) =>
        prev.kind === "edge" && prev.rel.id === id
          ? { kind: "edge", rel: { ...prev.rel, onUpdate: value } }
          : prev
      );
    },
    []
  );

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-slate-700/60">
      {/* ── SVG marker defs for arrowheads ── */}
      <svg className="absolute w-0 h-0 overflow-hidden">
        <defs>
          <marker
            id="arrowhead-default"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth={8}
            markerHeight={8}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>
          <marker
            id="arrowhead-active"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth={8}
            markerHeight={8}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
          </marker>
        </defs>
      </svg>

      {/* ── Canvas ── */}
      <div className="flex-1 relative bg-[#0f172a]">
        <Toolbar onAutoLayout={handleAutoLayout} onFitView={handleFitView} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          connectionLineStyle={{ stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "5 3" }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="!bg-slate-900 !border-slate-700 !shadow-xl !rounded-lg" />
          <Background color="#1e293b" gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* ── Right detail panel ── */}
      <DetailPanel
        state={panel}
        tables={TABLES}
        relations={relations}
        onClose={() => {
          setPanel({ kind: "idle" });
          setEdges((eds) => eds.map((e) => ({ ...e, style: { stroke: "#3b82f6" } })));
        }}
        onDelete={handleDeleteRelation}
        onChangeDelete={handleChangeDelete}
        onChangeUpdate={handleChangeUpdate}
      />

      {/* ── Toast notifications ── */}
      {toast && (
        <Toast
          message={toast.msg}
          variant={toast.variant}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ── Exported component (wraps provider) ───────────────────────────
export function RelationshipVisualizer() {
  return (
    <ReactFlowProvider>
      <VisualizerInner />
    </ReactFlowProvider>
  );
}
