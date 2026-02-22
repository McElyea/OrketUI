What the Plan Does Well
Clear phase sequencing with contract-first discipline
Guiding principles are genuinely architectural, not just aspirational
Exit criteria per phase are specific enough to be testable
Risks section addresses real problems (DTO churn, event volume, identity linkage)
Gaps and Improvement Areas
1. No migration map for the 12 existing panels
The plan introduces 6 new layer views but never says what happens to the 12 existing panels (CardFlowPanel, GuardReviewPanel, LogConsolePanel, PipelineDAGPanel, RunHistoryPanel, SandboxMonitorPanel, TurnReplayPanel, etc.). Which panels get retired? Which get absorbed into a layer? Which become inspector sub-panels? Without this, Phase 1 devs have no guidance on what to preserve vs discard.

Fix: Add a "Panel Migration Map" table in Phase 1 — old panel → target layer + fate (retain, migrate, retire).

2. Vue Router is not called out as a prerequisite
The app currently has no router at all — App.vue uses conditional rendering with no vue-router. Phase 1 assumes layered navigation exists, but installing and configuring the router is a non-trivial bootstrap step that isn't listed anywhere.

Fix: Add a Phase 1 setup step: install vue-router, define route structure, replace the conditional render in App.vue.

3. 10 existing stores are unaccounted for
There are 10 active Pinia stores (board, cards, chat, events, logs, metrics, sandboxes, session, settings, auth). The plan introduces new stores (useSelectionStore, trace store, layer-specific stores) but doesn't say how the old ones relate — are they wrapped? deprecated? replaced?

Fix: Add a "Store Migration Plan" section that maps each existing store to its v2 fate.

4. Phase numbering collision with SkillsUIPlan.md
Both plans have their own Phase 0–3 sequences. When executing in parallel, it's ambiguous which phases are synchronized. A dev working on SkillsUIPlan.md Phase 2 might not realize it depends on UIPlan.md Phase 1 being done first.

Fix: Either number the child plan's phases relative to the parent (e.g., Phase 1a, 1b) or add an explicit "Dependencies on UIPlan.md" section to SkillsUIPlan.md with phase-level locks.

5. Phase 4 migration order is incomplete
The migration order in Phase 4 lists: Trace → Validation → Execution → Workspace → Capabilities — but Session is missing. The plan has a Session layer and a v2/session endpoint but it drops out of Phase 4 entirely.

Fix: Add Session to the Phase 4 migration order, likely first since it anchors the Effective State Strip.

6. Phase 0 has no parallel frontend work
Phase 0 is backend-only. That means frontend devs are blocked during contract freeze. Given that Phase 1 is mostly frontend, there's likely meaningful frontend work that can happen in parallel during Phase 0 (router setup, shell scaffolding, mock data, selection store).

Fix: Add a "Frontend work during Phase 0" subsection — list scaffolding tasks that don't require live v2 endpoints (use mock fixtures).

7. WebSocket / real-time strategy underspecified
Phase 2 mentions "expand websocket normalization" but the existing events.store.ts and composables already handle some WebSocket logic. There's no description of what the current taxonomy is, what's missing, or what the event taxonomy target looks like.

Fix: Add an appendix or Phase 2 sub-section listing the current event types handled, the target taxonomy, and the normalization contract between backend events and TraceEvent.

8. No error/loading/empty state guidance
The plan defines what happy-path data looks like but never addresses error states, loading skeletons, or empty states — all of which need design decisions (especially for the Inspector, which resolves objects that may fail to load).

Fix: Add a "UI State Contract" section (even just a short list): loading, error, empty, partial-data states per layer.

9. Windows absolute paths in "Suggested File Touch Order"

C:\source\orket
C:\Source\OrketUI\client
These are environment-specific and will break for any developer not using this exact machine layout.

Fix: Use repo-relative paths (orket/ and client/).

10. Definition of Done is for the product, not the plan
The DoD at the bottom reads like release criteria, not a plan-level checklist. There's no criterion for "plan is complete" or "plan has been reviewed by both UI and API teams."

Fix: Rename to "Release Definition of Done" and add a separate "Plan Sign-off Criteria" (e.g., API team has approved DTO schemas, Phase 0 test suite exists, both teams have walked Phase 1 scope).

Summary Priority
Priority	Gap
Critical	Panel migration map — without it Phase 1 scope is ambiguous
Critical	Vue Router bootstrap step is missing from Phase 1
High	Store migration plan — 10 orphaned stores
High	Phase numbering alignment between the two plans
High	Session missing from Phase 4 migration order
Medium	Parallel frontend work during Phase 0
Medium	WebSocket taxonomy specifics
Low	Error/loading/empty state guidance
Low	Repo-relative paths
Low	DoD clarification
