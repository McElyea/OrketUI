Orket UI specification
1. High-level goals
Make cross-layer behavior intelligible: Users can understand how Skills, Tools, Execution, Validation, and Artifacts interact.

Support object-centric investigation: Any important entity (invocation, artifact, validation result, fingerprint, side effect) can be inspected across layers.

Preserve architectural truth: Declared vs adapted vs validated vs effective values are visible and comparable.

Scale with complexity: Layers and inspectors, not flat tabs, are the primary organizing structure.

2. Global layout
Shell structure:

Left rail: Layer navigation

Main pane: Active layer view

Right inspector: Selected object details + cross-layer links

Top strip: Effective State Strip (always visible)

3. Layers (left rail)
Order and labels:

Session

Workspace

Capabilities (Skill/Tool Layer)

Execution

Validation

Trace

Each layer is a route/view with its own primary representation and filters.

4. Effective State Strip (top)
Always visible, minimal but dense:

Session ID / Run ID

Active tool / entrypoint

Skill ID / version

Validation status (OK / warnings / failed)

Determinism mode (requested / effective)

Runtime pinning state (pinned / unpinned)

Snapshot / visibility mode

Current phase/state (e.g., idle, running, waiting, failed)

Clicking any element focuses the relevant layer and selects the corresponding object in the inspector.

5. Session layer (main pane)
Purpose: Show current effective orchestration state.

Primary UI:

Current invocation card:

Tool ID, Skill ID, entrypoint

Arguments (normalized)

Effective determinism mode

Runtime pinning summary

Permissions in effect

Recent invocations list (last N):

Status (running, succeeded, failed)

Duration

Validation outcome

Clickable to inspect

Filters:

Status (running, completed, failed)

Tool / Skill / entrypoint

Time window

6. Workspace layer (main pane)
Purpose: Typed artifact graph, not a folder junk drawer.

Primary UI:

Artifact table / graph:

Artifact type (file, diff, structured output, error payload, fingerprint, side-effect trace)

Name / path / ID

Producing invocation

Timestamp

Status (latest, superseded, failed)

Type filters:

File

Diff

Structured output

Error payload

Fingerprint

Side-effect trace

Key behaviors:

Clicking an artifact:

Opens content preview (file/diff/JSON)

Highlights producing invocation

Links to Execution, Validation, Trace entries

7. Capabilities layer (Skill/Tool)
Purpose: Show declared capability surface.

Primary UI:

Skill list:

Skill ID, version, description

Contract version

Skill detail:

Entrypoints (ID, runtime, command, working directory)

Input/output/error schemas (links/refs)

Permissions (requested/required)

Side-effect categories

Fingerprint fields

Runtime pinning declarations

Tool profile linkage

Key behavior:

Show declared values side-by-side with:

Effective tool profile

Validation outcomes (if available)

Execution overrides (if any)

8. Execution layer
Purpose: Show what actually ran.

Primary UI:

Invocation list:

Tool ID, Skill ID, entrypoint

Status, duration, start time

Invocation detail:

Command, runtime, working directory

Environment summary (pinned vars, fingerprints)

Resource limits

Stdout/stderr (logs)

Structured output

Error payload (if any)

Key behavior:

Clear link to:

Declared entrypoint (Capabilities)

Validation result (Validation)

Produced artifacts (Workspace)

Trace events (Trace)

9. Validation layer
Purpose: Show contract compliance and policy decisions.

Primary UI:

Validation summary:

Overall status per Skill/Tool

Validation policy version

Validation detail:

contract_valid

determinism_eligible

side_effect_risk

fingerprint_completeness

permission_risk

trust_level

validation_policy_version

validation_timestamp

validation_result_id

Key behavior:

Side-by-side view:

Declared vs effective determinism

Declared vs effective permissions

Declared vs effective side-effect categories

10. Trace layer
Purpose: Semantic, causal history.

Primary UI:

Timeline / event list:

Tool invocations

Validation events

Policy decisions

Fingerprint deltas

Side-effect events

Snapshot transitions

Event detail:

Event type

Related invocation / artifact / validation

Before/after state (where applicable)

Policy version involved

Key behavior:

Clicking an event:

Focuses related invocation, artifact, or validation in inspector

Shows causal links (e.g., “this validation blocked determinism eligibility”)

11. Right inspector (object-centric)
Purpose: Cross-layer drill-down for a single entity.

Supported object types:

Tool invocation

Skill

Tool profile

Validation result

Artifact

Trace event

Fingerprint

Side-effect record

Inspector sections (depending on type):

Overview: ID, type, timestamps, status

Declared: Skill/Tool contract fields

Effective: Runtime/validation-resolved values

Validation: Policy decisions, reasons, versions

Execution: Command, runtime, environment, limits

Artifacts: Produced/consumed artifacts

Trace: Related events, causal links

Cross-layer links are explicit buttons:

“View in Capabilities”

“View in Execution”

“View in Validation”

“View in Trace”

“View in Workspace”

Vue component hierarchy
1. Top-level structure
text
AppRoot
 ├─ EffectiveStateStrip
 ├─ MainLayout
 │   ├─ LeftRailNavigation
 │   ├─ MainViewRouter
 │   └─ RightInspector
 └─ GlobalModals (optional)
2. Left rail
text
LeftRailNavigation
 ├─ NavItemSession
 ├─ NavItemWorkspace
 ├─ NavItemCapabilities
 ├─ NavItemExecution
 ├─ NavItemValidation
 └─ NavItemTrace
Each NavItem* routes to a main view and updates selected layer state.

3. Main views (per layer)
text
MainViewRouter
 ├─ SessionView
 ├─ WorkspaceView
 ├─ CapabilitiesView
 ├─ ExecutionView
 ├─ ValidationView
 └─ TraceView
4. SessionView
text
SessionView
 ├─ SessionCurrentInvocationCard
 ├─ SessionInvocationsList
 │   └─ SessionInvocationRow
5. WorkspaceView
text
WorkspaceView
 ├─ WorkspaceFilters
 ├─ WorkspaceArtifactTable
 │   └─ WorkspaceArtifactRow
 └─ WorkspaceArtifactPreview (inline or delegated to inspector)
6. CapabilitiesView
text
CapabilitiesView
 ├─ SkillList
 │   └─ SkillListItem
 └─ SkillDetailPanel
     ├─ SkillSummary
     ├─ SkillEntrypointsTable
     │   └─ SkillEntrypointRow
     ├─ SkillSchemasSection
     ├─ SkillPermissionsSection
     ├─ SkillSideEffectsSection
     ├─ SkillFingerprintSection
     └─ SkillToolProfileSection
7. ExecutionView
text
ExecutionView
 ├─ ExecutionFilters
 ├─ ExecutionInvocationTable
 │   └─ ExecutionInvocationRow
 └─ ExecutionInvocationDetail
     ├─ ExecutionSummary
     ├─ ExecutionCommandSection
     ├─ ExecutionEnvironmentSection
     ├─ ExecutionResourceLimitsSection
     ├─ ExecutionStdoutSection
     ├─ ExecutionStderrSection
     ├─ ExecutionStructuredOutputSection
     └─ ExecutionErrorPayloadSection
8. ValidationView
text
ValidationView
 ├─ ValidationSummaryTable
 │   └─ ValidationSummaryRow
 └─ ValidationDetailPanel
     ├─ ValidationStatusSection
     ├─ ValidationDeterminismSection
     ├─ ValidationPermissionsSection
     ├─ ValidationSideEffectsSection
     ├─ ValidationFingerprintSection
     └─ ValidationPolicyMetadataSection
9. TraceView
text
TraceView
 ├─ TraceFilters
 ├─ TraceTimeline
 │   └─ TraceEventRow
 └─ TraceEventDetail
     ├─ TraceEventSummary
     ├─ TraceCausalLinksSection
     ├─ TraceRelatedInvocationsSection
     ├─ TraceRelatedArtifactsSection
     └─ TracePolicyContextSection
10. RightInspector
text
RightInspector
 └─ InspectorContent (switches by selected object type)
     ├─ InspectorInvocation
     ├─ InspectorSkill
     ├─ InspectorToolProfile
     ├─ InspectorValidationResult
     ├─ InspectorArtifact
     ├─ InspectorTraceEvent
     ├─ InspectorFingerprint
     └─ InspectorSideEffect
Each Inspector* component:

Reads selected object from a central store (e.g., Pinia)

Renders:

Overview

Declared vs Effective

Validation

Execution

Artifacts

Trace links

Emits navigation actions (e.g., “viewInExecutionLayer”, “viewInWorkspaceLayer”).