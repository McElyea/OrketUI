import { useDeferredValue, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useCardsQuery, useRunDetailQuery, useRunsQuery, useSystemOverviewQuery } from "../api/queries";
import { StatusPill } from "../components/StatusPill";
import { SurfaceMessage } from "../components/SurfaceMessage";
import { CompactRail } from "../components/WorkspaceChrome";
import { useUIStore } from "../state/uiStore";

function runTone(status: string): "emerald" | "amber" | "rose" | "slate" {
  if (status === "completed") {
    return "emerald";
  }
  if (status === "failed" || status === "blocked") {
    return "rose";
  }
  if (status === "unknown") {
    return "slate";
  }
  return "amber";
}

function statusVerb(status: string): string {
  if (status === "running") {
    return "Running";
  }
  if (status === "completed") {
    return "Completed";
  }
  if (status === "failed") {
    return "Failed";
  }
  return status;
}

export function RunsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const setSelectedRunId = useUIStore((state) => state.setSelectedRunId);
  const runsQuery = useRunsQuery(18);
  const cardsQuery = useCardsQuery(50);
  const detailQuery = useRunDetailQuery(sessionId);
  const overviewQuery = useSystemOverviewQuery();
  const runItems = runsQuery.data?.runs.items ?? [];
  const cardItems = cardsQuery.data?.cards.items ?? [];
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!sessionId && runItems[0]) {
      navigate(`/runs/${runItems[0].session_id}`, { replace: true });
    }
  }, [navigate, runItems, sessionId]);

  useEffect(() => {
    setSelectedRunId(sessionId);
  }, [sessionId, setSelectedRunId]);

  const filteredRuns = runItems.filter((item) => {
    if (!deferredSearch.trim()) {
      return true;
    }
    const haystack = `${item.session_id} ${item.summary} ${item.lifecycle_category}`.toLowerCase();
    return haystack.includes(deferredSearch.trim().toLowerCase());
  });

  if (runsQuery.isLoading) {
    return <SurfaceMessage title="Loading runs" body="Fetching the admitted run-history surface." />;
  }

  const completedCount = runItems.filter((item) => item.primary_status === "completed").length;
  const activeCount = runItems.filter((item) => item.primary_status === "running").length;
  const blockedCount = runItems.filter((item) => item.primary_status === "failed" || item.primary_status === "blocked").length;
  const verifiedCount = runItems.filter((item) => item.verification_status === "verified").length;
  const selectedView = detailQuery.data?.view as Record<string, unknown> | undefined;
  const highlightedRun = runItems.find((item) => item.session_id === sessionId) ?? runItems[0];
  const executionGraph = detailQuery.data?.execution_graph;
  const cardsBySessionId = cardItems.reduce((map, item) => {
    if (item.session_id && !map.has(item.session_id)) {
      map.set(item.session_id, item);
    }
    return map;
  }, new Map<string, (typeof cardItems)[number]>());
  const selectedCard = cardsBySessionId.get(sessionId ?? highlightedRun?.session_id ?? "");
  const selectedArtifactContract = selectedView?.artifact_contract as Record<string, unknown> | undefined;
  const selectedControlPlane = selectedView?.control_plane as Record<string, unknown> | undefined;

  return (
    <section className="mock-workspace">
      <CompactRail activeKey="history" />

      <div className="mock-runs-page">
        <header className="mock-page-heading mock-runs-heading">
          <div>
            <h1>Run History</h1>
            <p>
              Browse the admitted run-history surface and follow a selected `session_id` into Inspector.
            </p>
          </div>
          <div className="mock-runs-actions">
            {selectedCard && (
              <Link className="mock-secondary-button" to={`/cards/${selectedCard.card_id}`}>
                Open Card
              </Link>
            )}
            {sessionId ? (
              <Link className="mock-primary-button" to={`/inspector/run/${sessionId}`}>
                Open Inspector
              </Link>
            ) : (
              <button className="mock-primary-button" type="button" disabled>
                Select a Run
              </button>
            )}
          </div>
        </header>

        <div className="mock-runs-stats">
          <article className="mock-stat-card">
            <p>Total runs</p>
            <strong>{String(runItems.length)}</strong>
          </article>
          <article className="mock-stat-card">
            <p>Completed</p>
            <strong>{String(completedCount)}</strong>
          </article>
          <article className="mock-stat-card">
            <p>Blocked or failed</p>
            <strong>{String(blockedCount)}</strong>
          </article>
          <article className="mock-stat-card">
            <p>Verified</p>
            <strong>{String(verifiedCount)}</strong>
          </article>
        </div>

        <section className="mock-runs-table-shell">
          <div className="mock-runs-table-toolbar">
            <label className="mock-table-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="search"
                placeholder="Search runs by session id or lifecycle"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <table className="mock-runs-table">
            <thead>
              <tr>
                <th>Run id</th>
                <th>Summary</th>
                <th>Lifecycle</th>
                <th>Verification</th>
                <th>State</th>
                <th>Status</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map((item) => {
                const relatedCard = cardsBySessionId.get(item.session_id);
                return (
                  <tr key={item.session_id} className={item.session_id === sessionId ? "mock-runs-row-active" : ""}>
                    <td>
                      <Link className="mock-table-link" to={`/runs/${item.session_id}`}>
                        {item.session_id}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <strong>{item.summary}</strong>
                        {relatedCard && (
                          <p>
                            <Link className="mock-inline-link" to={`/cards/${relatedCard.card_id}`}>
                              {relatedCard.title} ({relatedCard.card_id})
                            </Link>
                          </p>
                        )}
                      </div>
                    </td>
                    <td>{item.lifecycle_category}</td>
                    <td>{item.verification_summary ?? item.stop_reason ?? "--"}</td>
                    <td>{statusVerb(item.primary_status)}</td>
                    <td>
                      <StatusPill tone={runTone(item.primary_status)}>{item.primary_status}</StatusPill>
                    </td>
                    <td>{String(item.issue_count)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mock-runs-pagination">
            <span>Showing {String(filteredRuns.length)} of {String(runItems.length)} admitted runs</span>
          </div>
        </section>

        <section className="mock-health-panel">
          <div>
            <p className="mock-sidebar-kicker">System health snapshot</p>
            <h2>{highlightedRun ? highlightedRun.summary : "No run selected"}</h2>
          </div>
          <div className="mock-health-copy">
            <p>{String(overviewQuery.data?.data.health_view?.summary ?? "System overview unavailable.")}</p>
            <p>
              {selectedView
                ? `${String(selectedView.summary ?? "Selected run detail is available.")} ${
                    executionGraph ? `Execution graph: ${executionGraph.node_count} nodes / ${executionGraph.edge_count} edges.` : ""
                  }`
                : "Select a run to inspect admitted detail and execution-graph context."}
            </p>
            {selectedCard && (
              <p>
                Related card:{" "}
                <Link className="mock-inline-link" to={`/cards/${selectedCard.card_id}`}>
                  {selectedCard.title} ({selectedCard.card_id})
                </Link>
              </p>
            )}
            {selectedView && (
              <p>
                Next action: {String(selectedView.next_action ?? "--")}
                {selectedArtifactContract?.primary_output
                  ? ` Primary output: ${String(selectedArtifactContract.primary_output)}.`
                  : ""}
                {selectedControlPlane?.run_id ? ` Control plane: ${String(selectedControlPlane.run_id)}.` : ""}
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
