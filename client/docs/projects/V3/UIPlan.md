# Orket UI Implementation Plan

Last updated: 2026-02-21  
Status: Draft (execution-ready)  
Owners: UI + API teams

## Related Docs
1. `client/docs/SkillsUIPlan.md` - detailed implementation plan for Skills/Capabilities section.

## Goal
Deliver a layered, object-centric Orket UI that reflects architectural truth across Session, Workspace, Capabilities, Execution, Validation, and Trace, backed by stable `v2` read models.

## Guiding Principles
1. Contract-first: freeze `v2` DTOs before major UI migration.
2. Additive evolution: introduce `v2` without breaking `v1`.
3. Trace spine: all layers link through stable invocation/artifact/validation/trace IDs.
4. Incremental delivery: land shell and inspector early, then migrate layer-by-layer.

## Target UI Architecture
1. Global shell:
   - Left rail layer navigation
   - Main route view per layer
   - Right inspector (object-centric)
   - Effective State Strip (always visible)
2. Layer routes:
   - Session
   - Workspace
   - Capabilities
   - Execution
   - Validation
   - Trace
3. Shared selection model:
   - `selectedObject = { type, id, layer, metadata }`
   - All views emit selection updates
   - Inspector resolves and cross-links selection

## Phase 0: Domain and API Contract Freeze (`v2`, read-only)
### Objective
Define stable `v2` DTOs and read endpoints backed by existing Orket internals.

### DTOs to Freeze
1. `Invocation`
2. `Artifact`
3. `ValidationResult`
4. `TraceEvent`
5. `Skill`
6. `Entrypoint`
7. `ToolProfile`
8. `PendingGateRequest`

### `v2` Routers (read-only)
1. `/v2/session`
2. `/v2/workspace`
3. `/v2/capabilities`
4. `/v2/execution`
5. `/v2/validation`
6. `/v2/trace`
7. `/v2/pending-gates`

### Backend Sources to Reuse
1. Skill contracts and validation services
2. Pending gate repository
3. Runtime events and observability artifacts
4. Replay/checkpoint artifacts
5. Execution graph detailed edges and run/session ledgers

### Deliverables
1. `v2` Pydantic models and OpenAPI docs
2. Read-only router implementations
3. Contract tests for payload shape and required fields
4. Compatibility tests asserting `v1` behavior unchanged

### Exit Criteria
1. DTO schemas are versioned and test-covered.
2. `v2` endpoints are stable and documented.
3. No `v1` endpoint removals or behavior regressions.

## Phase 1: Shell, Routing, and Inspector Skeleton
### Objective
Replace fixed dashboard composition with layered shell and object-centric navigation.

### Frontend Work
1. Introduce shell layout:
   - `AppShell.vue`
   - `LeftRailNavigation.vue`
   - `RightInspector.vue`
2. Add route views:
   - `SessionView.vue`
   - `WorkspaceView.vue`
   - `CapabilitiesView.vue`
   - `ExecutionView.vue`
   - `ValidationView.vue`
   - `TraceView.vue`
3. Add selection store:
   - `useSelectionStore.ts`
   - `setSelectedObject`, `clearSelectedObject`
4. Wire existing panels to selection actions.
5. Keep mixed sourcing (`v1` fallback, `v2` where available).

### Deliverables
1. Layered shell active in app runtime
2. Navigation between six layers
3. Inspector rendering selected object basics

### Exit Criteria
1. Users can navigate layers without modal hopping.
2. Any clicked object can be selected and inspected.

## Phase 2: WebSocket and Semantic Trace Normalization
### Objective
Promote Trace to a first-class semantic timeline instead of raw log stream.

### Frontend Work
1. Expand websocket normalization to broader event taxonomy.
2. Normalize incoming runtime signals into `TraceEvent` records.
3. Build trace store around semantic event model.
4. Render `TraceView` and inspector from semantic trace data (not raw `/logs`).

### Deliverables
1. Updated websocket/composable normalization
2. Semantic trace store and type definitions
3. Trace UI with event detail and causal links

### Exit Criteria
1. Events are no longer silently dropped due to narrow event typing.
2. Trace view supports filtering, causal context, and related-object navigation.

## Phase 3: Effective State Strip and Session Truth
### Objective
Expose current effective orchestration state at all times.

### Frontend Work
1. Upgrade top strip to Effective State Strip:
   - session/run ID
   - active tool/entrypoint
   - skill version
   - validation status
   - determinism requested/effective
   - runtime pinning
   - snapshot mode
   - current phase/state
2. Back strip with `v2/session`, `v2/validation`, and `v2/trace` summaries.
3. Implement click-through from strip element to relevant layer/selection.

### Deliverables
1. Effective State Strip component
2. Session view driven by `Invocation` and `ValidationResult`

### Exit Criteria
1. UI always answers "what is happening now?" in one glance.
2. Strip values deep-link into corresponding layer objects.

## Phase 4: Layer-by-Layer Migration to `v2`
### Objective
Complete migration from panel-centric data usage to layer-aligned `v2` read models.

### Migration Order
1. Trace + Inspector (semantic spine)
2. Validation (contract truth)
3. Execution (actual runtime behavior)
4. Workspace (artifact graph)
5. Capabilities (declared surface)

### Required Enhancements per Layer
1. Declared vs effective comparisons where applicable
2. Cross-links across all related objects
3. Stable ID-based routing/selection state

### Exit Criteria
1. Core layer experiences read from `v2` models.
2. Cross-layer navigation is complete and reliable.

## Suggested File Touch Order
### Backend (`C:\source\orket`)
1. `orket/interfaces/`:
   - add `v2` DTO models module
   - add `v2` router modules per layer
   - mount routers in API entrypoint
2. add tests for schema and compatibility
3. add docs update for `v2` API contract

### Frontend (`C:\Source\OrketUI\client`)
1. add shell + route structure and layer views
2. add selection + trace normalization stores
3. add inspector components by object type
4. replace/upgrade top strip
5. migrate each layer to `v2` data adapters

## Test and Validation Strategy
1. Backend:
   - DTO schema tests
   - endpoint contract tests
   - `v1` compatibility regression tests
2. Frontend:
   - store normalization unit tests
   - router/selection integration tests
   - inspector cross-link behavior tests
3. End-to-end:
   - session run lifecycle
   - trace causality navigation
   - declared vs effective comparison checks

## Risks and Mitigations
1. Risk: DTO churn during migration  
Mitigation: freeze `v2` contracts before broad UI wiring.
2. Risk: event cardinality/volume issues in Trace  
Mitigation: normalize, paginate, and cap in-memory buffers with persisted fetch fallback.
3. Risk: breaking current dashboard workflows  
Mitigation: keep `v1` operational until phased cutover is complete.
4. Risk: weak cross-layer identity linkage  
Mitigation: require stable IDs and explicit `related_ids` in every `TraceEvent`.

## Definition of Done
1. Layered UI is the default user experience.
2. Inspector supports all core object types with cross-layer links.
3. Effective State Strip reflects real-time effective state.
4. Trace is semantic and causal, not raw-log-only.
5. `v2` read models are stable, documented, and test-covered.
6. `v1` remains available until explicit deprecation plan is approved.
