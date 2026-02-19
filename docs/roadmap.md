# Pipeline Session Fidelity Plan

## Execution Status
- Started: UI-side Phase 1 integration is in progress.
- Completed:
  - Added session execution-graph API contract/types in frontend.
  - Wired Pipeline panel to load `/v1/runs/{session_id}/execution-graph` first.
  - Added board fallback when session graph is empty/unavailable.
  - Added edge-kind-aware rendering hooks (`depends_on`, `handoff`, `spawn`, `parallel_chain`).
  - Added session graph enrichment from logs:
    - derives `handoff` edges from session turn flow.
    - adds synthetic `chain-*` nodes and `parallel_chain` edges for disconnected components.
  - Added pipeline legend and session mode indicator.
  - Added edge click metadata dialog.
  - Added node click navigation to card drawer.
  - Added feature flag gate: `VITE_PIPELINE_SESSION_GRAPH_V2`.
  - Backend execution graph endpoint now emits typed edges (`depends_on`, `spawn`, `handoff`).
  - Backend now persists per-session execution graph snapshots to:
    - `workspace/runs/{session_id}/agent_output/observability/execution_graph_snapshot.json`
- Remaining (backend authority):
  - None for core feature scope.

## Goal
Make the Pipeline view replay exactly what happened in a session, with explicit handoff lines between cards/issues and clear chains for unaffiliated work.

## Scope
- Persist a session-specific graph snapshot.
- Render handoff edges (issue-to-issue transitions).
- Support unrelated workstreams as separate chains/lanes.
- Keep existing UI working while adding richer graph behavior.

## Phase 1: Data Contract and Snapshot Source
1. Define graph schema for `nodes` and `edges`.
2. Add edge types:
   - `depends_on`
   - `handoff`
   - `spawn`
   - `parallel_chain`
3. Add metadata fields:
   - `session_id`
   - `timestamp`
   - `source_event`
   - `from_issue`
   - `to_issue`
4. Ensure API returns session-frozen graph:
   - Prefer `/v1/runs/{session_id}/execution-graph`.
   - Fallback: build from run backlog + logs for that session.

## Phase 2: Graph Construction Rules
1. Build node map from session backlog/issues.
2. Build dependency edges from `depends_on`.
3. Build handoff edges from log events (`tool_call_*`, state transitions, assignment changes).
4. Build chain nodes for unaffiliated clusters:
   - Create synthetic parent/group nodes per cluster.
   - Attach issue nodes under each synthetic chain.
5. Persist final graph snapshot per session for replay consistency.

## Phase 3: Layout and Rendering
1. Introduce `@dagrejs/dagre` layout for deterministic DAG positioning.
2. Update `PipelineDAGPanel.vue` to:
   - Render edge style by type (color + line style).
   - Show handoff direction with arrowheads.
   - Support chain/group visual blocks.
3. Keep ECharts graph renderer to avoid full UI rewrite.

## Phase 4: UX and Drilldown
1. Clicking a node opens Card Detail Drawer.
2. Clicking an edge opens edge metadata:
   - why edge exists
   - event source
   - timestamps
3. Add filters:
   - edge type
   - role
   - issue status
4. Add session mode toggle:
   - `Live`
   - `Session Replay`

## Phase 5: Validation and Rollout
1. Add tests:
   - schema validation
   - edge derivation correctness
   - deterministic layout snapshot tests
2. Add telemetry:
   - graph build time
   - node/edge counts
   - missing-link warnings
3. Ship behind a feature flag:
   - `PIPELINE_SESSION_GRAPH_V2=true`
4. Gradual rollout and compare old vs new graph.

## Recommended Packages
- `@dagrejs/dagre`: deterministic layered graph layout.
- Optional later:
  - `elkjs` for advanced routing on dense graphs.
  - `graphlib` for graph utility operations.

## Deliverables
1. Session graph schema + API contract.
2. Graph builder service with handoff/chain support.
3. Updated Pipeline panel rendering with edge types.
4. Tests + feature flag + rollout checklist.

## Acceptance Criteria
- Reopening a completed session shows the exact same graph every time.
- Handoff from one issue/card to another is visible as a directed edge.
- Unaffiliated work appears as separate chains, not collapsed/ambiguous nodes.
- Node and edge click actions resolve to usable details (card/edge metadata).
