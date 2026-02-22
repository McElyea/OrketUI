# Orket Skills UI Plan

Last updated: 2026-02-21  
Status: Draft (execution-ready)  
Owners: Capabilities UI + API teams

## Goal
Make Skills a first-class, inspectable surface in Orket UI so users can understand declared contracts, effective runtime behavior, validation outcomes, and downstream execution impact.

## Why This Matters
1. Skills are contract carriers for entrypoints, permissions, and determinism assumptions.
2. Without a Skill section, capabilities are implicit and hard to audit.
3. The layered/object-centric UI requires Skills to anchor declared vs effective comparisons.

## Scope
1. New `v2` capability read models and endpoints.
2. Dedicated Capabilities layer UI for Skills/Entrypoints/ToolProfiles.
3. Right Inspector integration for full cross-layer drill-down.

## Phase 0: Domain and API Contract Freeze (`v2`, read-only)
### DTOs to Freeze
1. `Skill`
2. `Entrypoint`
3. `ToolProfile`
4. `ValidationResult`
5. `PendingGateRequest`
6. `Invocation`
7. `Artifact`
8. `TraceEvent`

### Minimum DTO Fields
1. `Skill`:
   - `id`, `version`, `description`, `contract_version`, `manifest_digest`, `entrypoint_ids`
2. `Entrypoint`:
   - `id`, `skill_id`, `runtime`, `command`, `working_directory`
   - `input_schema_ref`, `output_schema_ref`, `error_schema_ref`
   - `requested_permissions`, `required_permissions`
   - `tool_profile_id`, `tool_profile_version`
3. `ToolProfile`:
   - `id`, `version`, `declared_permissions`, `side_effect_categories`, `fingerprint_fields`
4. `ValidationResult`:
   - `id`, `subject_type`, `subject_id`, `contract_valid`, `determinism_eligible`
   - `permission_risk`, `side_effect_risk`, `fingerprint_completeness`, `trust_level`
   - `validation_policy_version`, `validation_timestamp`, `errors`

### Exit Criteria
1. Schema definitions are versioned and test-covered.
2. Read models are stable for frontend consumption.

## Phase 1: `v2` Capabilities Router
### Objective
Expose a stable capabilities API backed by existing skills/validation internals.

### Endpoints (read-only)
1. `GET /v2/capabilities/skills`
2. `GET /v2/capabilities/skills/{skill_id}`
3. `GET /v2/capabilities/entrypoints/{entrypoint_id}`
4. `GET /v2/capabilities/tool-profiles/{tool_profile_id}`
5. `GET /v2/capabilities/validations`
6. `GET /v2/pending-gates`

### Data Sources
1. Skill contracts and loader/validator services
2. Pending gate repository
3. Invocation/artifact/trace linkages from runtime observability

### Deliverables
1. Router implementations
2. DTO-backed OpenAPI docs
3. Contract tests and fixtures

### Exit Criteria
1. Capabilities endpoints return stable DTO payloads.
2. No `v1` behavior changes required.

## Phase 2: Capabilities Layer UI
### Objective
Deliver a dedicated Skills experience in the Capabilities layer.

### Components
1. `CapabilitiesView.vue`
2. `SkillList.vue`
3. `SkillDetail.vue`
4. `EntrypointDetail.vue`
5. `ToolProfileDetail.vue`
6. `ValidationSummary.vue`

### UI Behaviors
1. Browse installed skills and versions.
2. Inspect entrypoints and contract fields.
3. Compare requested vs required permissions.
4. Show validation status and risk metadata.
5. Navigate to related execution and trace entities.

### Exit Criteria
1. Users can inspect any installed Skill without using logs.
2. Skill contract and validation details are visible and searchable.

## Phase 3: Right Inspector Integration
### Objective
Enable object-centric Skill workflows across layers.

### Inspector Support
1. `InspectorSkill`
2. `InspectorEntrypoint`
3. `InspectorToolProfile`
4. `InspectorValidationResult` (capabilities-context aware)

### Required Sections
1. Overview
2. Declared contract
3. Effective values
4. Validation outcomes
5. Related invocations
6. Related artifacts
7. Related trace events

### Exit Criteria
1. Clicking Skills/Entrypoints/ToolProfiles opens rich inspector detail.
2. Cross-layer links are available from every capabilities object.

## Frontend Implementation Targets (`C:\Source\OrketUI\client`)
1. `src/views/CapabilitiesView.vue`
2. `src/components/capabilities/SkillList.vue`
3. `src/components/capabilities/SkillDetail.vue`
4. `src/components/capabilities/EntrypointDetail.vue`
5. `src/components/capabilities/ToolProfileDetail.vue`
6. `src/components/capabilities/ValidationSummary.vue`
7. `src/components/inspector/InspectorSkill.vue`
8. `src/components/inspector/InspectorEntrypoint.vue`
9. `src/components/inspector/InspectorToolProfile.vue`
10. `src/stores/capabilities.store.ts`
11. `src/api/capabilities.api.ts`
12. `src/types/capabilities.ts`

## Backend Implementation Targets (`C:\source\orket`)
1. `orket/interfaces/`:
   - `v2` capabilities DTO models
   - capabilities router
   - pending-gates router (if separated)
2. tests for capabilities contracts and endpoint responses
3. API contract documentation updates

## Testing Strategy
1. Backend:
   - DTO schema tests
   - endpoint contract tests
   - error/empty-state fixture tests
2. Frontend:
   - store mapping tests for DTO normalization
   - component rendering tests for detail panels
   - inspector navigation tests for cross-layer links
3. E2E:
   - installed Skill appears in list
   - Skill detail resolves entrypoints/tool profiles/validation
   - inspector links to related execution/trace objects

## Risks and Mitigations
1. Risk: inconsistent Skill identity/version mapping  
Mitigation: enforce stable keys (`skill_id`, `skill_version`) in DTO contracts.
2. Risk: incomplete linkage to runtime objects  
Mitigation: include explicit related IDs in capabilities responses.
3. Risk: overloading one page with dense contract fields  
Mitigation: split details into focused subcomponents and inspector tabs.

## Definition of Done
1. Skills are visible in a dedicated Capabilities section.
2. Entrypoints and ToolProfiles are directly inspectable.
3. Validation metadata is presented as first-class UI data.
4. Inspector supports full object-centric cross-layer navigation for capabilities objects.
