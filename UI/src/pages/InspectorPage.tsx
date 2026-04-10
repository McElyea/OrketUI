import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { useCardDetailQuery, useRunDetailQuery } from "../api/queries";
import { JsonViewer } from "../components/JsonViewer";
import { SurfaceMessage } from "../components/SurfaceMessage";
import { useUIStore } from "../state/uiStore";

function InspectorSidebar({
  activeKind,
  activeId,
  hierarchy,
}: {
  activeKind: "card" | "run";
  activeId: string;
  hierarchy: string[];
}) {
  return (
    <aside className="mock-architect-sidebar">
      <section className="mock-atelier-card">
        <div className="mock-atelier-mark">
          <span className="material-symbols-outlined">architecture</span>
        </div>
        <div>
          <h2>The Atelier</h2>
          <p>System Architect</p>
        </div>
      </section>

      <button className="mock-primary-sidebar-button" type="button" disabled>
        New Artifact
      </button>

      <nav className="mock-architect-nav" aria-label="Workspace sections">
        <Link to="/sequencer" className={activeKind === "run" ? "" : ""}>
          <span className="material-symbols-outlined">account_tree</span>
          <span>Flows</span>
        </Link>
        <Link to="/board">
          <span className="material-symbols-outlined">auto_stories</span>
          <span>Epics</span>
        </Link>
        <Link to="/inspector" className="mock-architect-nav-active">
          <span className="material-symbols-outlined">history_edu</span>
          <span>Artifacts</span>
        </Link>
        <Link to="/cards">
          <span className="material-symbols-outlined">shelves</span>
          <span>Library</span>
        </Link>
      </nav>

      <section className="mock-file-tree">
        <p className="mock-sidebar-kicker">File hierarchy</p>
        {hierarchy.map((item, index) => (
          <div key={item} className={`mock-file-row ${index === 1 ? "mock-file-row-active" : ""}`}>
            <span className="material-symbols-outlined">{item.endsWith(".json") ? "description" : "folder"}</span>
            <span>{item}</span>
          </div>
        ))}
      </section>

      <div className="mock-architect-footer">
        <Link to="/board">
          <span className="material-symbols-outlined">query_stats</span>
          <span>Flow Status</span>
        </Link>
        <Link to="/runs">
          <span className="material-symbols-outlined">database</span>
          <span>Run History</span>
        </Link>
        <Link to="/prompt-reforger">
          <span className="material-symbols-outlined">grid_view</span>
          <span>Palette</span>
        </Link>
      </div>
    </aside>
  );
}

export function InspectorPage() {
  const params = useParams();
  const selectedCardId = useUIStore((state) => state.selectedCardId);
  const selectedRunId = useUIStore((state) => state.selectedRunId);
  const setSelectedInspectorTarget = useUIStore((state) => state.setSelectedInspectorTarget);
  const kind = params.kind;
  const id = params.id;
  const effectiveKind = kind ?? (selectedCardId ? "card" : selectedRunId ? "run" : undefined);
  const effectiveId = id ?? (effectiveKind === "card" ? selectedCardId : selectedRunId);
  const cardQuery = useCardDetailQuery(effectiveKind === "card" ? effectiveId : undefined);
  const runQuery = useRunDetailQuery(effectiveKind === "run" ? effectiveId : undefined);

  useEffect(() => {
    if (effectiveKind && effectiveId) {
      setSelectedInspectorTarget(`${effectiveKind}:${effectiveId}`);
    }
  }, [effectiveId, effectiveKind, setSelectedInspectorTarget]);

  if (!effectiveKind || !effectiveId) {
    return (
      <SurfaceMessage
        title="No inspector target"
        body="Select a card or run first. Inspector deep links resolve to `/inspector/card/:id` or `/inspector/run/:id`."
      />
    );
  }

  if (effectiveKind === "card") {
    if (cardQuery.isLoading) {
      return <SurfaceMessage title="Loading card inspection" body="Fetching the admitted card detail surfaces for Inspector." />;
    }
    if (!cardQuery.data) {
      return <SurfaceMessage title="No card data" body="The selected card could not be loaded." tone="warning" />;
    }

    const raw = cardQuery.data.raw;
    const paramsPayload = (raw?.params ?? {}) as Record<string, unknown>;
    const expectedOutputs = Array.isArray(paramsPayload.expected_outputs)
      ? paramsPayload.expected_outputs.map((item: unknown) => String(item))
      : [];
    const hierarchy = ["prompt_source.md", `${effectiveId}.prompt`, ...expectedOutputs.slice(0, 2), "raw_card.json"];

    return (
      <section className="mock-architect-layout">
        <InspectorSidebar activeKind="card" activeId={effectiveId} hierarchy={hierarchy} />

        <section className="mock-inspector-canvas">
          <header className="mock-inspector-canvas-header">
            <div>
              <h1>{String(raw?.summary ?? effectiveId)}</h1>
              <p>Inspecting admitted card detail and prompt-source context.</p>
            </div>
            <div className="mock-inspector-toggle-group">
              <button type="button" className="mock-inspector-toggle mock-inspector-toggle-active">
                Graph View
              </button>
              <button type="button" className="mock-inspector-toggle">
                JSON Schema
              </button>
            </div>
          </header>

          <div className="mock-inspector-breadcrumbs">
            <span>Root</span>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>{String(paramsPayload.display_category ?? "Card")}</span>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>Artifact Preview</span>
          </div>

          <div className="mock-inspector-stage">
            <article className="mock-stage-card mock-stage-card-soft">
              <p className="mock-sidebar-kicker">Entry point</p>
              <h2>{String(paramsPayload.card_kind ?? "Card")}</h2>
              <div className="mock-stage-progress">
                <span />
              </div>
            </article>

            <article className="mock-stage-card mock-stage-card-active">
              <p className="mock-sidebar-kicker">Active artifact</p>
              <h2>{String(raw?.summary ?? effectiveId)}</h2>
              <dl className="mock-stage-metrics">
                <div>
                  <dt>Provenance</dt>
                  <dd>{cardQuery.data.prompt_source.source_label}</dd>
                </div>
                <div>
                  <dt>Output</dt>
                  <dd>{expectedOutputs[0] ?? "unassigned"}</dd>
                </div>
              </dl>
            </article>

            <article className="mock-stage-card mock-stage-card-faded">
              <p className="mock-sidebar-kicker">Terminal</p>
              <h2>{String(paramsPayload.expected_output_type ?? "Output")}</h2>
            </article>
          </div>

          <div className="mock-inspector-zoom">
            <button type="button" aria-label="Zoom in">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <button type="button" aria-label="Zoom out">
              <span className="material-symbols-outlined">zoom_out</span>
            </button>
            <button type="button" aria-label="Fit canvas">
              <span className="material-symbols-outlined">fit_screen</span>
            </button>
          </div>
        </section>

        <aside className="mock-inspector-sidebar">
          <header className="mock-sidebar-panel-head">
            <div>
              <h2>Metadata Inspector</h2>
              <p>Inspecting selected card detail for {effectiveId}</p>
            </div>
          </header>

          <section className="mock-sidebar-section">
            <p className="mock-sidebar-kicker">Identity</p>
            <dl className="mock-sidebar-definition-list">
              <div>
                <dt>Name</dt>
                <dd>{String(raw?.summary ?? effectiveId)}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{String(paramsPayload.card_kind ?? "card")}</dd>
              </div>
            </dl>
          </section>

          <section className="mock-sidebar-section">
            <p className="mock-sidebar-kicker">Relationships</p>
            <div className="mock-sidebar-box">
              <strong>Prompt source</strong>
              <p>{cardQuery.data.prompt_source.source_label}</p>
            </div>
            <div className="mock-sidebar-box">
              <strong>Expected output</strong>
              <p>{expectedOutputs.join(", ") || "No expected outputs declared."}</p>
            </div>
          </section>

          <section className="mock-sidebar-section">
            <p className="mock-sidebar-kicker">Provenance data</p>
            <JsonViewer title="Raw card payload" value={raw ?? {}} />
          </section>

          <section className="mock-sidebar-section">
            <p className="mock-sidebar-kicker">Output preview</p>
            <div className="mock-output-preview">
              <CodeMirror
                value={cardQuery.data.prompt_source.source_text || "No prompt source available."}
                editable={false}
                extensions={[markdown()]}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false,
                }}
              />
            </div>
          </section>
        </aside>
      </section>
    );
  }

  if (runQuery.isLoading) {
    return <SurfaceMessage title="Loading run inspection" body="Fetching the admitted run detail surfaces for Inspector." />;
  }
  if (!runQuery.data) {
    return <SurfaceMessage title="No run data" body="The selected run could not be loaded." tone="warning" />;
  }

  const executionGraph = runQuery.data.execution_graph ?? {
    session_id: effectiveId,
    node_count: 0,
    edge_count: 0,
    nodes: [],
    edges: [],
  };
  const runView = (runQuery.data.view ?? {}) as Record<string, unknown>;
  const runGraphNodes = Array.isArray(executionGraph.nodes) ? executionGraph.nodes : [];
  const hierarchy = ["execution_graph.json", `${effectiveId}.run`, "detail_view.json"];
  const stageNodes = runGraphNodes.slice(0, 3).map((node, index) => {
    const record = (node ?? {}) as Record<string, unknown>;
    return {
      key: String(record.id ?? record.node_id ?? `node-${index}`),
      label: String(record.label ?? record.title ?? record.name ?? record.id ?? `Node ${index + 1}`),
      kind: String(record.kind ?? "graph node"),
    };
  });

  return (
    <section className="mock-architect-layout">
      <InspectorSidebar activeKind="run" activeId={effectiveId} hierarchy={hierarchy} />

      <section className="mock-inspector-canvas">
        <header className="mock-inspector-canvas-header">
          <div>
            <h1>Run {effectiveId}</h1>
            <p>Inspecting admitted run detail and execution graph context.</p>
          </div>
          <div className="mock-inspector-toggle-group">
            <button type="button" className="mock-inspector-toggle mock-inspector-toggle-active">
              Graph View
            </button>
            <button type="button" className="mock-inspector-toggle">
              JSON Schema
            </button>
          </div>
        </header>

        <div className="mock-inspector-breadcrumbs">
          <span>Root</span>
          <span className="material-symbols-outlined">chevron_right</span>
          <span>Run</span>
          <span className="material-symbols-outlined">chevron_right</span>
          <span>Artifact Preview</span>
        </div>

        <div className="mock-run-stage">
          {stageNodes.length > 0 ? (
            stageNodes.map((node, index) => (
              <article
                key={node.key}
                className={`mock-stage-card ${
                  index === 1 ? "mock-stage-card-active" : index === 0 ? "mock-stage-card-soft" : "mock-stage-card-faded"
                }`}
              >
                <p className="mock-sidebar-kicker">{index === 0 ? "Execution graph" : index === 1 ? "Active node" : "Related node"}</p>
                <h2>{node.label}</h2>
                <dl className="mock-stage-metrics">
                  <div>
                    <dt>Kind</dt>
                    <dd>{node.kind}</dd>
                  </div>
                  <div>
                    <dt>Run</dt>
                    <dd>{effectiveId}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <>
              <article className="mock-stage-card mock-stage-card-soft">
                <p className="mock-sidebar-kicker">Execution graph</p>
                <h2>{String(executionGraph.node_count ?? 0)} nodes</h2>
              </article>
              <article className="mock-stage-card mock-stage-card-active">
                <p className="mock-sidebar-kicker">Active run</p>
                <h2>{effectiveId}</h2>
                <dl className="mock-stage-metrics">
                  <div>
                    <dt>Nodes</dt>
                    <dd>{String(executionGraph.node_count ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Edges</dt>
                    <dd>{String(executionGraph.edge_count ?? 0)}</dd>
                  </div>
                </dl>
              </article>
              <article className="mock-stage-card mock-stage-card-faded">
                <p className="mock-sidebar-kicker">Detail view</p>
                <h2>{String(runView.summary ?? "Run detail")}</h2>
              </article>
            </>
          )}
        </div>
      </section>

      <aside className="mock-inspector-sidebar">
        <header className="mock-sidebar-panel-head">
          <div>
            <h2>Metadata Inspector</h2>
            <p>Inspecting selected run detail for {effectiveId}</p>
          </div>
        </header>

        <section className="mock-sidebar-section">
          <p className="mock-sidebar-kicker">Run detail</p>
          <JsonViewer title="Run detail view" value={runQuery.data.view ?? {}} />
        </section>

        <section className="mock-sidebar-section">
          <p className="mock-sidebar-kicker">Execution graph</p>
          <JsonViewer title="Execution graph" value={executionGraph} />
        </section>
      </aside>
    </section>
  );
}
