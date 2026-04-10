import { Link } from "react-router-dom";

import { useCardsQuery, useRunsQuery, useSystemOverviewQuery } from "../api/queries";
import { StatusPill } from "../components/StatusPill";
import { SurfaceMessage } from "../components/SurfaceMessage";
import { CompactRail } from "../components/WorkspaceChrome";

const BOARD_COLUMNS = [
  { key: "intent", label: "Intent", note: "Shaping and exploratory definition work." },
  { key: "definition", label: "Definition", note: "Active requirements and implementation work." },
  { key: "critique", label: "Critique", note: "Blocked, failed, or review-heavy work." },
];

function columnKey(status: string, bucket: string): string {
  if (status === "failed" || status === "blocked" || bucket === "blocked") {
    return "critique";
  }
  if (status === "running" || bucket === "running" || bucket === "completed") {
    return "definition";
  }
  return "intent";
}

function toneFromStatus(status: string): "emerald" | "amber" | "rose" | "slate" {
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

export function BoardPage() {
  const cardsQuery = useCardsQuery(24);
  const runsQuery = useRunsQuery(6);
  const overviewQuery = useSystemOverviewQuery();
  const cards = cardsQuery.data?.cards.items ?? [];
  const runs = runsQuery.data?.runs.items ?? [];
  const activeRun = runs[0];
  const recentArtifacts = cards.slice(0, 3);
  const activeCards = cards.filter((card) => card.primary_status === "running").length;
  const blockedCards = cards.filter((card) => card.primary_status === "failed" || card.primary_status === "blocked").length;
  const nextCard = cards.find((card) => card.primary_status !== "completed");

  if (cardsQuery.isLoading || runsQuery.isLoading) {
    return <SurfaceMessage title="Loading board" body="Building the board view from admitted card and run read models." />;
  }

  return (
    <section className="mock-workspace">
      <CompactRail activeKey="flows" />

      <div className="mock-board-page">
        <section className="mock-board-main">
          <header className="mock-page-heading">
            <div>
              <h1>Flow Board</h1>
              <p>
                {activeRun
                  ? `Tracking ${activeRun.summary} through the admitted card and run surfaces.`
                  : `Showing ${cards.length} host-backed cards across the current board projection.`}
              </p>
            </div>
            <span className="mock-page-chip">{activeRun?.session_id ?? `${cards.length} cards`}</span>
          </header>

          <div className="mock-board-columns">
            {BOARD_COLUMNS.map((column) => {
              const items = cards.filter((card) => columnKey(card.primary_status, card.filter_bucket) === column.key);
              const featured = column.key === "definition" && items[0];
              const rest = column.key === "definition" ? items.slice(1) : items;

              return (
                <section key={column.key} className="mock-board-column">
                  <header className="mock-board-column-head">
                    <h2>{column.label}</h2>
                    <span>{String(items.length)}</span>
                  </header>
                  <p className="mock-board-column-note">{column.note}</p>

                  {featured && (
                    <Link className="mock-board-feature" to={`/cards/${featured.card_id}`}>
                      <div className="mock-board-feature-top">
                        <span className="mock-board-kicker">{featured.filter_bucket}</span>
                        <StatusPill tone={toneFromStatus(featured.primary_status)}>
                          {featured.primary_status === "running" ? "1 active" : featured.primary_status}
                        </StatusPill>
                      </div>
                      <h3>{featured.title}</h3>
                      <p>{featured.summary}</p>
                      <div className="mock-board-file-row">
                        <span className="material-symbols-outlined">description</span>
                        <span>{featured.card_id}.md</span>
                      </div>
                    </Link>
                  )}

                  <div className="mock-board-card-stack">
                    {rest.map((item) => (
                    <Link key={item.card_id} className="mock-board-card" to={`/cards/${item.card_id}`}>
                        <p className="mock-board-kicker">{item.filter_bucket || "draft"}</p>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <div className="mock-board-card-meta">
                          <span>{item.card_id}</span>
                          <span>{item.seat}</span>
                        </div>
                      </Link>
                    ))}
                    {items.length === 0 && <div className="mock-empty-card">No cards currently map to this board column.</div>}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <aside className="mock-board-sidebar">
          <section className="mock-sidebar-panel">
            <div className="mock-sidebar-panel-head">
              <div>
                <p className="mock-sidebar-kicker">Active run</p>
                <h2>{activeRun ? activeRun.summary : "No active run"}</h2>
              </div>
              <span className="mock-token">{activeRun ? activeRun.session_id : "idle"}</span>
            </div>

            {activeRun ? (
              <>
                <p className="mock-italic-line">{activeRun.session_id}</p>
                <div className="mock-run-focus-card">
                  <div className="mock-run-focus-icon">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div className="mock-run-focus-copy">
                    <p className="mock-sidebar-kicker">Phase</p>
                    <h3>{activeRun.lifecycle_category}</h3>
                  </div>
                </div>
                <div className="mock-run-progress-labels">
                  <span>Verification</span>
                  <span>{activeRun.verification_summary ?? activeRun.summary}</span>
                </div>
                <div className="mock-progress-track">
                  <span style={{ width: activeRun.primary_status === "running" ? "68%" : "100%" }} />
                </div>
                <Link className="mock-inline-link" to={`/runs/${activeRun.session_id}`}>
                  Open run detail
                </Link>
              </>
            ) : (
              <div className="mock-empty-card">The admitted run surface did not return a recent run to anchor the board sidebar.</div>
            )}
          </section>

          <section className="mock-sidebar-grid">
            <div className="mock-sidebar-mini">
              <p className="mock-sidebar-kicker">Previous</p>
              <span>{runs[1]?.session_id ?? "No prior run"}</span>
            </div>
            <div className="mock-sidebar-mini">
              <p className="mock-sidebar-kicker">Next</p>
              <span>{nextCard?.title ?? "No queued card"}</span>
            </div>
          </section>

          <section className="mock-sidebar-grid">
            <div className="mock-sidebar-mini">
              <p className="mock-sidebar-kicker">Active cards</p>
              <span>{String(activeCards)}</span>
            </div>
            <div className="mock-sidebar-mini">
              <p className="mock-sidebar-kicker">Blocked cards</p>
              <span>{String(blockedCards)}</span>
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <header className="mock-sidebar-section-head">
              <p className="mock-sidebar-kicker">Recent artifacts</p>
              <span className="material-symbols-outlined">open_in_new</span>
            </header>
            <div className="mock-recent-list">
              {recentArtifacts.map((item, index) => (
                <Link key={item.card_id} className="mock-recent-row" to={`/cards/${item.card_id}`}>
                  <span className="material-symbols-outlined">
                    {index === 0 ? "description" : index === 1 ? "rate_review" : "image"}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.card_id}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mock-board-summary">
            <p className="mock-sidebar-kicker">Run summary</p>
            <p>
              {String(
                overviewQuery.data?.data.health_view?.summary ??
                  "The board remains a projection over admitted card and run surfaces.",
              )}
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}
