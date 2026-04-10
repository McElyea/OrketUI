import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Background,
  Controls,
  type Edge,
  type Connection,
  MiniMap,
  type Node,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import { getHttpErrorDetail, postJson, putJson } from "../api/client";
import { useCardDetailQuery, useCardsQuery, useFlowDetailQuery, useFlowsQuery } from "../api/queries";
import type {
  FlowDefinitionPayload,
  FlowDetailResponse,
  FlowRunAcceptedResponse,
  FlowValidationResponse,
  FlowWriteResponse,
} from "../api/types";
import { StatusPill } from "../components/StatusPill";
import { SurfaceMessage } from "../components/SurfaceMessage";
import { useUIStore } from "../state/uiStore";

function buildDraftGraph(cardId: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: "start",
      position: { x: 90, y: 270 },
      sourcePosition: Position.Right,
      data: { label: "Start" },
      type: "input",
    },
    {
      id: "card-1",
      position: { x: 430, y: 240 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { label: cardId, assignedCardId: cardId, notes: "" },
    },
    {
      id: "final",
      position: { x: 770, y: 290 },
      targetPosition: Position.Left,
      data: { label: "Final" },
      type: "output",
    },
  ];
  const flowIds = ["start", "card-1", "final"];
  const edges = flowIds.slice(0, -1).map((source, index) => ({
    id: `${source}-${flowIds[index + 1]}`,
    source,
    target: flowIds[index + 1],
    animated: index === 0,
  }));
  return { nodes, edges };
}

function nodePosition(kind: string, index: number): { x: number; y: number } {
  const x = 110 + index * 290;
  if (kind === "branch") {
    return { x, y: 170 };
  }
  if (kind === "merge") {
    return { x, y: 330 };
  }
  if (kind === "final") {
    return { x, y: 280 };
  }
  return { x, y: 240 };
}

function buildGraphFromFlowDetail(detail: FlowDetailResponse): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: detail.nodes.map((item, index) => {
      const kind = String(item.kind || "card");
      return {
        id: item.node_id,
        position: nodePosition(kind, index),
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: kind === "start" ? "input" : kind === "final" ? "output" : undefined,
        data: {
          label: item.label,
          assignedCardId: item.assigned_card_id,
          notes: item.notes,
        },
      };
    }),
    edges: detail.edges.map((edge) => ({
      id: edge.edge_id,
      source: edge.from_node_id,
      target: edge.to_node_id,
      label: edge.condition_label || undefined,
      animated: edge.from_node_id === "start",
    })),
  };
}

const PALETTE_ITEMS = [
  { id: "requirement", label: "Requirement", icon: "assignment" },
  { id: "code", label: "Code", icon: "code" },
  { id: "critique", label: "Critique", icon: "rate_review" },
  { id: "approval", label: "Approval", icon: "verified" },
  { id: "branch", label: "Branch", icon: "call_split" },
  { id: "merge", label: "Merge", icon: "call_merge" },
  { id: "start", label: "Start", icon: "play_circle" },
  { id: "final", label: "Final", icon: "stop_circle" },
];

function nodeKind(node: Node): string {
  if (node.id === "start" || node.type === "input") {
    return "start";
  }
  if (node.id === "final" || node.type === "output") {
    return "final";
  }
  return "card";
}

function buildFlowDefinition(name: string, description: string, nodes: Node[], edges: Edge[]): FlowDefinitionPayload {
  return {
    name: name.trim() || "Editorial flow",
    description: description.trim() || "Flow authored from the Sequencer draft surface.",
    nodes: nodes.map((node) => {
      const kind = nodeKind(node);
      const data = (node.data ?? {}) as { label?: string; assignedCardId?: string | null; notes?: string };
      return {
        node_id: node.id,
        kind,
        label: String(data.label ?? node.id),
        assigned_card_id: kind === "card" ? String(data.assignedCardId ?? "").trim() || node.id : null,
        notes: String(data.notes ?? ""),
      };
    }),
    edges: edges.map((edge) => ({
      edge_id: edge.id,
      from_node_id: edge.source,
      to_node_id: edge.target,
      condition_label: "",
    })),
  };
}

export function SequencerPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const cardsQuery = useCardsQuery(4);
  const flowsQuery = useFlowsQuery(16, 0);
  const activeFlowId = searchParams.get("flowId") ?? undefined;
  const flowDetailQuery = useFlowDetailQuery(activeFlowId);
  const selectedCardId = useUIStore((state) => state.selectedCardId);
  const setSelectedRunId = useUIStore((state) => state.setSelectedRunId);
  const selectedNodeId = useUIStore((state) => state.selectedSequencerNodeId);
  const setSelectedNodeId = useUIStore((state) => state.setSelectedSequencerNodeId);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [flowName, setFlowName] = useState("Project Alpha");
  const [flowDescription, setFlowDescription] = useState(
    "Architecture Flow. Bounded single-card flow slice authored from the Sequencer surface.",
  );
  const [savedFlowId, setSavedFlowId] = useState<string | undefined>(undefined);
  const [savedRevisionId, setSavedRevisionId] = useState<string | undefined>(undefined);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [statusNote, setStatusNote] = useState<string | undefined>(undefined);
  const [validationResult, setValidationResult] = useState<FlowValidationResponse | undefined>(undefined);
  const [lastRun, setLastRun] = useState<FlowRunAcceptedResponse | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loadedFlowKey, setLoadedFlowKey] = useState<string | undefined>(undefined);
  const cardItems = cardsQuery.data?.cards.items ?? [];
  const flowItems = flowsQuery.data?.items ?? [];
  const primaryCardId = selectedCardId ?? cardItems[0]?.card_id;
  const selectedCardDetailQuery = useCardDetailQuery(primaryCardId);
  const selectedCardTitle =
    String(selectedCardDetailQuery.data?.raw?.summary ?? "").trim() || primaryCardId || "selected card";
  const currentDefinition = buildFlowDefinition(flowName, flowDescription, nodes, edges);
  const currentSnapshot = JSON.stringify(currentDefinition);

  useEffect(() => {
    if (activeFlowId || !primaryCardId || nodes.length > 0) {
      return;
    }
    const graph = buildDraftGraph(primaryCardId);
    setNodes(graph.nodes);
    setEdges(graph.edges);
    if (!selectedNodeId) {
      setSelectedNodeId(graph.nodes[1]?.id ?? graph.nodes[0]?.id);
    }
  }, [activeFlowId, nodes.length, primaryCardId, selectedNodeId, setEdges, setNodes, setSelectedNodeId]);

  useEffect(() => {
    if (!activeFlowId || !flowDetailQuery.data) {
      return;
    }
    const loadedKey = `${flowDetailQuery.data.flow_id}:${flowDetailQuery.data.revision_id}`;
    if (loadedFlowKey === loadedKey) {
      return;
    }
    const graph = buildGraphFromFlowDetail(flowDetailQuery.data);
    const hostSnapshot = JSON.stringify({
      name: flowDetailQuery.data.name,
      description: flowDetailQuery.data.description,
      nodes: flowDetailQuery.data.nodes,
      edges: flowDetailQuery.data.edges,
    });
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setFlowName(flowDetailQuery.data.name);
    setFlowDescription(flowDetailQuery.data.description);
    setSavedFlowId(flowDetailQuery.data.flow_id);
    setSavedRevisionId(flowDetailQuery.data.revision_id);
    setSavedSnapshot(hostSnapshot);
    setLoadedFlowKey(loadedKey);
    setValidationResult(undefined);
    setLastRun(undefined);
    setStatusNote(`Loaded host-confirmed flow ${flowDetailQuery.data.flow_id}.`);
    setSelectedNodeId(graph.nodes.find((node) => nodeKind(node) === "card")?.id ?? graph.nodes[0]?.id);
  }, [activeFlowId, flowDetailQuery.data, loadedFlowKey, setEdges, setNodes, setSelectedNodeId]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedNodeData = (selectedNode?.data ?? {}) as { assignedCardId?: string | null };
  const draftDirty = savedSnapshot ? currentSnapshot !== savedSnapshot : true;
  const connections = useMemo(
    () => edges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId),
    [edges, selectedNodeId],
  );

  if (cardsQuery.isLoading || (activeFlowId && flowDetailQuery.isLoading && nodes.length === 0)) {
    return <SurfaceMessage title="Loading sequencer context" body="Building the local draft graph from admitted card views." />;
  }

  if (activeFlowId && flowDetailQuery.isError) {
    return (
      <SurfaceMessage
        title="Flow unavailable"
        body={`Saved flow ${activeFlowId} could not be loaded from the admitted host flow surface.`}
        tone="warning"
      />
    );
  }

  function startDraftFlow() {
    if (!primaryCardId) {
      setStatusNote("No selected card is available to seed a new flow draft.");
      return;
    }
    const graph = buildDraftGraph(primaryCardId);
    setSearchParams({});
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setFlowName(`${selectedCardTitle} Flow`);
    setFlowDescription("Bounded single-card flow slice authored from the Sequencer surface.");
    setSavedFlowId(undefined);
    setSavedRevisionId(undefined);
    setSavedSnapshot("");
    setLoadedFlowKey(undefined);
    setValidationResult(undefined);
    setLastRun(undefined);
    setStatusNote(`Started a new extension-local flow draft from ${selectedCardTitle}.`);
    setSelectedNodeId(graph.nodes[1]?.id ?? graph.nodes[0]?.id);
  }

  async function handleValidateFlow() {
    setIsValidating(true);
    try {
      const result = await postJson<FlowValidationResponse>("/api/flows/validate", {
        definition: currentDefinition,
      });
      setValidationResult(result);
      setStatusNote(result.summary);
    } catch (error) {
      setStatusNote(getHttpErrorDetail(error, "Flow validation failed."));
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSaveFlow() {
    setIsSaving(true);
    try {
      const result = savedFlowId
        ? await putJson<FlowWriteResponse>(`/api/flows/${savedFlowId}`, {
            definition: currentDefinition,
            expected_revision_id: savedRevisionId,
          })
        : await postJson<FlowWriteResponse>("/api/flows", {
            definition: currentDefinition,
          });
      setSavedFlowId(result.flow_id);
      setSavedRevisionId(result.revision_id);
      setSavedSnapshot(currentSnapshot);
      setLoadedFlowKey(`${result.flow_id}:${result.revision_id}`);
      setValidationResult(result.validation);
      setStatusNote(result.summary);
      setSearchParams({ flowId: result.flow_id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["flows"] }),
        queryClient.invalidateQueries({ queryKey: ["flow-detail", result.flow_id] }),
      ]);
    } catch (error) {
      setStatusNote(getHttpErrorDetail(error, "Flow save failed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRunFlow() {
    if (!savedFlowId || !savedRevisionId) {
      return;
    }
    setIsRunning(true);
    try {
      const result = await postJson<FlowRunAcceptedResponse>(`/api/flows/${savedFlowId}/runs`, {
        expected_revision_id: savedRevisionId,
      });
      setLastRun(result);
      setSelectedRunId(result.session_id);
      setStatusNote(result.summary);
    } catch (error) {
      setStatusNote(getHttpErrorDetail(error, "Flow run failed."));
    } finally {
      setIsRunning(false);
    }
  }

  function onConnect(connection: Connection) {
    setEdges((current) => addEdge({ ...connection, animated: false }, current));
  }

  return (
    <section className="mock-architect-layout">
      <aside className="mock-sequencer-sidebar">
        <section className="mock-atelier-card">
          <div className="mock-atelier-mark">
            <span className="material-symbols-outlined">account_tree</span>
          </div>
          <div>
            <h2>The Atelier</h2>
            <p>System Architect</p>
          </div>
        </section>

        <nav className="mock-architect-nav" aria-label="Workspace sections">
          <Link className="mock-architect-nav-active" to="/sequencer">
            <span className="material-symbols-outlined">account_tree</span>
            <span>Flows</span>
          </Link>
          <Link to="/board">
            <span className="material-symbols-outlined">auto_stories</span>
            <span>Epics</span>
          </Link>
          <Link to={lastRun?.session_id ? `/inspector/run/${lastRun.session_id}` : "/inspector"}>
            <span className="material-symbols-outlined">history_edu</span>
            <span>Artifacts</span>
          </Link>
          <Link to="/cards">
            <span className="material-symbols-outlined">shelves</span>
            <span>Library</span>
          </Link>
        </nav>

        <section className="mock-palette-panel">
          <p className="mock-sidebar-kicker">Palette</p>
          <div className="mock-palette-grid">
            {PALETTE_ITEMS.map((item) => (
              <div key={item.id} className="mock-palette-tile">
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mock-file-tree">
          <p className="mock-sidebar-kicker">Saved flows</p>
          {flowItems.length > 0 ? (
            flowItems.map((item) => (
              <Link
                key={item.flow_id}
                className={`mock-file-row ${item.flow_id === activeFlowId ? "mock-file-row-active" : ""}`}
                to={`/sequencer?flowId=${encodeURIComponent(item.flow_id)}`}
              >
                <span className="material-symbols-outlined">lan</span>
                <span>{item.name || item.flow_id}</span>
              </Link>
            ))
          ) : (
            <div className="mock-empty-card">No host-confirmed flows have been saved yet.</div>
          )}
        </section>

        <button className="mock-primary-sidebar-button" type="button" onClick={startDraftFlow}>
          Start New Draft
        </button>

        <div className="mock-architect-footer-icons">
          <span className="material-symbols-outlined">query_stats</span>
          <span className="material-symbols-outlined">database</span>
          <span className="material-symbols-outlined">grid_view</span>
        </div>
      </aside>

      <section className="mock-sequencer-canvas">
        <header className="mock-sequencer-canvas-head">
          <div>
            <h1>{flowName}</h1>
            <p>{flowDescription}</p>
          </div>
          <div className="mock-sequencer-tools">
            <button type="button">
              <span className="material-symbols-outlined">search</span>
              100%
            </button>
            <button type="button">
              <span className="material-symbols-outlined">layers</span>
              Layers
            </button>
          </div>
        </header>

        <div className="mock-sequencer-stage">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={24} size={1} />
          </ReactFlow>
        </div>

        <div className="mock-sequencer-toolbar">
          <button type="button" aria-label="Undo">
            <span className="material-symbols-outlined">undo</span>
          </button>
          <button type="button" aria-label="Redo">
            <span className="material-symbols-outlined">redo</span>
          </button>
          <button type="button" aria-label="Pan">
            <span className="material-symbols-outlined">pan_tool</span>
          </button>
          <button type="button" aria-label="Draw">
            <span className="material-symbols-outlined">near_me</span>
          </button>
          <button type="button" aria-label="Comment">
            <span className="material-symbols-outlined">add_comment</span>
          </button>
          <button type="button" aria-label="Fit">
            <span className="material-symbols-outlined">fit_screen</span>
          </button>
          <button type="button" aria-label="Grid">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </section>

      <aside className="mock-sequencer-inspector">
        <section className="mock-sidebar-panel">
          <div className="mock-sidebar-panel-head">
            <div>
              <p className="mock-sidebar-kicker">{nodeKind(selectedNode ?? ({ id: "card" } as Node))} node</p>
              <h2>{String(selectedNode?.data?.label ?? "No node selected")}</h2>
            </div>
          </div>

          <label className="mock-inline-field">
            <span>Flow name</span>
            <input type="text" value={flowName} onChange={(event) => setFlowName(event.target.value)} />
          </label>
          <label className="mock-inline-field">
            <span>Description</span>
            <textarea value={flowDescription} onChange={(event) => setFlowDescription(event.target.value)} />
          </label>
        </section>

        <section className="mock-sidebar-section">
          <p className="mock-sidebar-kicker">Assigned card</p>
          <div className="mock-sidebar-box">
            <strong>
              {selectedNode && nodeKind(selectedNode) === "card"
                ? String(selectedNodeData.assignedCardId ?? "No host-backed card")
                : "No host-backed card"}
            </strong>
            <p>Bounded run authority currently requires a single card node that resolves to a canonical issue target.</p>
          </div>
        </section>

        <section className="mock-sidebar-section">
          <p className="mock-sidebar-kicker">Flow persistence</p>
          <div className="mock-sidebar-box">
            <strong>{savedFlowId ?? "Unsaved draft"}</strong>
            <p>{savedRevisionId ? `Revision ${savedRevisionId}` : "Create or save the draft to get a host flow id."}</p>
          </div>
        </section>

        <section className="mock-sidebar-section">
          <p className="mock-sidebar-kicker">Connections</p>
          <div className="mock-connection-list">
            {connections.length > 0 ? (
              connections.map((edge) => (
                <div key={edge.id} className="mock-connection-row">
                  <span>{edge.source === selectedNodeId ? "Outgoing" : "Incoming"}</span>
                  <strong>{edge.source === selectedNodeId ? edge.target : edge.source}</strong>
                </div>
              ))
            ) : (
              <div className="mock-empty-card">No edges are attached to the selected node.</div>
            )}
          </div>
        </section>

        <section className="mock-sidebar-section">
          <p className="mock-sidebar-kicker">Validation</p>
          <div className="mock-validation-stack">
            <div className={`mock-validation-card ${validationResult?.is_valid ? "is-ok" : "is-muted"}`}>
              <strong>{validationResult?.is_valid ? "Flow Ready" : "Draft flow"}</strong>
              <p>{validationResult?.summary ?? "Validate the flow to refresh host-confirmed authoring checks."}</p>
            </div>
            {statusNote && (
              <div className="mock-validation-card is-warning">
                <strong>Status</strong>
                <p>{statusNote}</p>
              </div>
            )}
          </div>
        </section>

        <div className="mock-sequencer-actions">
          <button className="mock-secondary-button" type="button" onClick={handleValidateFlow} disabled={isValidating}>
            {isValidating ? "Validating..." : "Validate Flow"}
          </button>
          <div className="mock-split-actions">
            <button className="mock-secondary-button" type="button" onClick={handleSaveFlow} disabled={isSaving}>
              {isSaving ? "Saving..." : savedFlowId ? "Save Flow" : "Create Flow"}
            </button>
            <button
              className="mock-primary-button"
              type="button"
              onClick={handleRunFlow}
              disabled={!savedFlowId || !savedRevisionId || isRunning || draftDirty}
            >
              {isRunning ? "Running..." : "Run Flow"}
            </button>
          </div>
          {lastRun && (
            <div className="mock-run-acceptance">
              <StatusPill tone="emerald">accepted</StatusPill>
              <Link className="mock-inline-link" to={`/runs/${lastRun.session_id}`}>
                {lastRun.session_id}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
