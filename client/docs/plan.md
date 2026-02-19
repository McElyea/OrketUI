OrketUI Implementation Plan
Context
Orket is an AI orchestration engine that manages multi-role agent teams working through hierarchical work items (Rock > Epic > Issue > Turn). Today all output goes to SQLite databases and log files — there's no way to see the system work. OrketUI is a mission-control dashboard that makes every aspect of orchestration visible in real-time: what's being worked on, which models are executing which roles, guard decisions, hardware utilization, and agent reasoning — all on a single fixed-viewport "wall" designed to demo the system to the world.

Stack: Vue 3 + Vite + TypeScript + PrimeVue + Apache ECharts
Architecture: Monorepo — Express BFF on :3001 (holds API key, proxies to Orket on :8082) + Vue SPA
Layout: Fixed viewport, no scrolling, resizable panels via PrimeVue Splitter
Theme: Dark mission-control — neon accents, monospace data, dense panels

Project Structure

C:\Source\OrketUI\
├── package.json                    # npm workspaces root
├── tsconfig.base.json
├── .env.example
├── .gitignore
│
├── server/                         # BFF — Express.js
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Express bootstrap
│       ├── config.ts               # Env vars, defaults
│       ├── middleware/
│       │   ├── auth.ts             # Session validation
│       │   └── session.ts          # express-session setup
│       ├── routes/
│       │   └── auth.routes.ts      # POST /bff/login, /bff/logout, GET /bff/me
│       └── proxy/
│           ├── http-proxy.ts       # Proxies /v1/* to Orket, injects X-API-Key
│           └── ws-proxy.ts         # WS upgrade handler, proxies /ws/events
│
├── client/                         # Vue 3 SPA
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts              # Dev proxy to BFF on :3001
│   ├── index.html
│   └── src/
│       ├── main.ts                 # App entry, PrimeVue + Pinia + ECharts registration
│       ├── App.vue                 # Auth gate → CommandCenter
│       │
│       ├── assets/styles/
│       │   ├── _variables.css      # CSS custom properties (full color system)
│       │   ├── _reset.css
│       │   ├── _layout.css         # Fixed viewport utilities
│       │   ├── _typography.css     # JetBrains Mono + Inter
│       │   ├── theme-preset.ts     # PrimeVue Aura dark overrides
│       │   └── main.css
│       │
│       ├── types/                  # TypeScript interfaces from Orket models
│       │   ├── cards.ts            # CardType, CardStatus, WaitReason, Card, CardHistory
│       │   ├── sessions.ts         # Run, RunMetrics, ReplayTurn, ToolCall
│       │   ├── system.ts           # HardwareMetrics, Board, RuntimePolicy, Alert
│       │   ├── websocket.ts        # RuntimeEvent, RuntimeEventType
│       │   ├── guard.ts            # GuardContract, GuardDecision, GuardViolation
│       │   └── settings.ts         # Settings, Sandbox types
│       │
│       ├── api/                    # Typed API client modules
│       │   ├── client.ts           # Base fetch wrapper (credentials: include, error handling)
│       │   ├── system.api.ts       # /health, /metrics, /board, /chat-driver, /run-active
│       │   ├── sessions.api.ts     # /runs, /sessions/:id/replay, /sessions/:id/snapshot
│       │   ├── cards.api.ts        # /cards, /cards/:id/history, /cards/:id/comments
│       │   ├── logs.api.ts         # /logs with filters
│       │   ├── sandboxes.api.ts    # /sandboxes, stop, logs
│       │   └── settings.api.ts     # /runtime-policy, /settings
│       │
│       ├── composables/
│       │   ├── useWebSocket.ts     # WS connection, reconnect (exp backoff), event dispatch
│       │   ├── usePolling.ts       # Interval polling with auto-cleanup
│       │   └── useResizeObserver.ts
│       │
│       ├── stores/                 # Pinia stores
│       │   ├── auth.store.ts       # Login state
│       │   ├── board.store.ts      # Board hierarchy (rocks/epics/issues/alerts)
│       │   ├── session.store.ts    # Active session, run history
│       │   ├── metrics.store.ts    # Hardware metrics time-series, token throughput
│       │   ├── events.store.ts     # WebSocket event ring buffer (500 entries)
│       │   ├── cards.store.ts      # Card detail cache
│       │   ├── logs.store.ts       # Log ring buffer (1000 entries)
│       │   ├── sandboxes.store.ts  # Active sandboxes
│       │   ├── settings.store.ts   # Runtime policy + user settings
│       │   └── chat.store.ts       # Chat message history
│       │
│       ├── layout/
│       │   ├── CommandCenter.vue   # THE fixed-viewport shell — nested Splitters
│       │   ├── TopBar.vue          # Logo, run controls, history/settings buttons
│       │   ├── StatusBar.vue       # WS status, heartbeat, clock
│       │   └── PanelHeader.vue     # Reusable panel title with live dot
│       │
│       ├── views/                  # 12 panel views
│       │   ├── LoginScreen.vue
│       │   ├── CardFlowPanel.vue       # Kanban board
│       │   ├── PipelineDAGPanel.vue    # Dependency graph (ECharts graph)
│       │   ├── TurnReplayPanel.vue     # Turn-by-turn agent timeline
│       │   ├── ModelRosterPanel.vue    # Role → model mapping grid
│       │   ├── GuardReviewPanel.vue    # Guard decisions feed
│       │   ├── MetricsStripPanel.vue   # GPU/CPU/RAM gauges + token chart
│       │   ├── LogConsolePanel.vue     # Streaming filtered logs
│       │   ├── OperatorConsole.vue      # Interactive CLI to operator/driver
│       │   ├── RunHistoryPanel.vue     # Modal — past runs DataTable
│       │   ├── SettingsPanel.vue       # Modal — runtime policy editor
│       │   └── SandboxMonitorPanel.vue # Sandbox list + logs
│       │
│       ├── components/             # Reusable sub-components
│       │   ├── cards/              # CardColumn, CardTile, CardDetailDrawer, StatusBadge
│       │   ├── dag/                # DAGCanvas (ECharts graph renderer)
│       │   ├── replay/             # TurnTimeline, TurnDetail, TokenBadge
│       │   ├── metrics/            # GaugeChart, ThroughputChart, MetricCard
│       │   ├── guard/              # GuardDecisionCard, ViolationList
│       │   ├── console/             # OperatorTerminal, CommandInput, ResponseBlock
│       │   ├── logs/               # LogEntry, LogFilter
│       │   ├── roster/             # RoleCard, SeatGrid
│       │   ├── sandbox/            # SandboxCard, SandboxLogViewer
│       │   ├── settings/           # PolicyForm, SettingRow
│       │   └── shared/             # LiveDot, TimeAgo, Sparkline, EmptyState
│       │
│       └── utils/
│           ├── colors.ts           # Status → color mapping
│           ├── formatters.ts       # Duration, bytes, token formatting
│           ├── dag-layout.ts       # Topological sort + coordinate computation
│           ├── echarts-theme.ts    # Custom ECharts 'orket-dark' theme
│           └── constants.ts        # Polling intervals, buffer sizes
BFF Design
Purpose: Thin proxy that keeps ORKET_API_KEY server-side. Browser authenticates to BFF via session cookie.

Routes
POST /bff/login — validates demo password, sets session
POST /bff/logout — destroys session
GET /bff/me — returns auth status
ALL /v1/* — proxied to Orket at ORKET_API_URL with X-API-Key header injected (requires authenticated session)
WebSocket Proxy
On upgrade to /ws/events, BFF opens upstream WS to Orket /ws/events with API key header
Pipes messages bidirectionally between browser client and Orket
Browser never sees the API key
Dependencies
express, express-session, http-proxy-middleware, ws, tsx (dev)
Layout — Fixed Viewport Mission Control Wall
No Vue Router. Single viewport. Modals for secondary views.


+-----------------------------------------------------------+
|  TopBar: [Logo] [Run #id ●] [▶ Start] [■ Stop] [History] [Settings] [● Connected]
+-----------------------------------------------------------+
|  Card Flow   |  Pipeline DAG          |  Model Roster      |
|  (kanban     |  (ECharts graph)       |  (role grid)       |
|   columns)   |------------------------+--------------------+
|              |  Turn Replay           |  Guard Review      |
|              |  (timeline + detail)   |  (decision feed)   |
|              |                        +--------------------+
|              |                        |  Sandbox Monitor   |
+--------------+------------------------+--------------------+
|  Metrics Strip   |  Log Console              |  Operator    |
|  (gauges+chart)  |  (streaming, filtered)    |  Console     |
+-----------------------------------------------------------+
|  StatusBar: [WS: ●] [Heartbeat: 3 tasks] [API: :8082] [14:23:07]
+-----------------------------------------------------------+
Implemented with nested PrimeVue <Splitter> components:

Outer vertical splitter: top row (70%) / bottom row (30%)
Top row horizontal: Card Flow (25%) / Center (45%) / Right (30%)
Center vertical: Pipeline DAG (55%) / Turn Replay (45%)
Right vertical: Model Roster (40%) / Guard Review (35%) / Sandbox (25%)
Bottom row horizontal: Metrics (20%) / Logs (50%) / Chat (30%)
All panels resizable via drag handles. Min-size constraints prevent collapse.

Run History and Settings are PrimeVue Dialog modals opened from TopBar — they don't need permanent wall space.

Data Flow Architecture
WebSocket + Polling Hybrid

Orket API (:8082)
    │
    ├── WS /ws/events ──→ BFF ws-proxy ──→ Browser WebSocket
    │                                          │
    │                                     events.store (ring buffer)
    │                                          │
    │                                     dispatch by event type:
    │                                       session_start/end → session.store.refresh()
    │                                       turn_complete → board.store.refresh()
    │                                       guard_* → shown in guard panel
    │
    ├── REST /v1/* ──→ BFF http-proxy ──→ API client modules
    │                                          │
    │                                     Pinia stores (single source of truth)
    │
    └── Polling:
         metrics.store polls /system/metrics every 3s
         board.store polls /system/board every 10s (+ WS-triggered refresh)
         logs.store polls /logs every 2s
         sandboxes.store polls /sandboxes every 5s
WS events trigger targeted REST re-fetches rather than updating stores directly from event payloads. This keeps stores consistent and resilient to WS disconnections.

Store → Panel Mapping
Store	Polls	WS-Triggered	Panels Fed
board.store	10s	turn_complete, session_end	CardFlow, PipelineDAG
session.store	—	session_start, session_end	TopBar, TurnReplay, RunHistory
metrics.store	3s	turn_complete (token throughput)	MetricsStrip
events.store	—	all events	ModelRoster, GuardReview, StatusBar
logs.store	2s	—	LogConsole
sandboxes.store	5s	—	SandboxMonitor
cards.store	—	on-demand (card click)	CardDetailDrawer
chat.store	—	user-driven	OperatorConsole
settings.store	—	on-demand (settings open)	SettingsPanel
Color System — Mission Control Dark

Base:    #0a0e14 (deepest bg) → #111620 (panel) → #1a1f2e (surface) → #232a3b (elevated)
Border:  #2a3245 (default) / #3a4560 (active)
Text:    #e8eaf0 (primary) / #8892a4 (secondary) / #4a5568 (muted)

Accents:
  Cyan    #00d4ff  — primary accent, active indicators, links
  Green   #00ff88  — success, pass, done
  Amber   #ffaa00  — warning, retry, in-progress
  Red     #ff4455  — error, failure, blocked
  Purple  #b388ff  — guard-related states
  Blue    #448aff  — info, ready state

Glow effects on live elements: box-shadow 0 0 8px rgba(accent, 0.3)
Fonts: JetBrains Mono (data/code) + Inter (labels/UI)
PrimeVue Aura preset overridden with these colors. Custom ECharts orket-dark theme registered to match.

TypeScript Interfaces (mapped from Orket Pydantic models)
Key types derived from orket/schema.py, orket/core/domain/guard_contract.py, orket/hardware.py:

Enums: CardType, CardStatus (13 values), WaitReason, RuntimeEventType (8 values), GuardAction, GuardSeverity
Cards: Card, CardHistory, CardComment — from /cards endpoints
Board: Board, RockConfig, EpicConfig, IssueConfig, Alert — from /system/board
Sessions: Run, RunMetrics, SessionDetails, ReplayTurn, ToolCall, BacklogItem
System: HardwareMetrics, RuntimePolicy, HeartbeatResponse
Guard: GuardContract, GuardViolation, GuardDecision
WebSocket: RuntimeEvent — the unified event schema from /ws/events
All interfaces will be defined in client/src/types/ and imported throughout.

The 12 Views
1. CardFlowPanel (Kanban)
Source: board.store — flatten rocks[].epics[].issues[] into flat list
Display: Columns grouped by status: Ready | In Progress | Blocked/Waiting | Review | Done
Interaction: Click card → CardDetailDrawer (PrimeVue Drawer) showing full detail, history, comments
Components: CardColumn, CardTile, StatusBadge, CardDetailDrawer
2. PipelineDAGPanel (Dependency Graph)
Source: board.store — issues with depends_on[] edges
Display: ECharts graph series with pre-computed Sugiyama layout positions
Nodes: Colored by status, labeled with issue name
Edges: From dependency to dependent, curved lines
Interaction: Click node → highlight adjacency, show issue detail
Components: DAGCanvas
3. TurnReplayPanel (Agent Timeline)
Source: sessionsApi.getReplay(sessionId, role?) — fetched when session changes
Display: Left: vertical timeline of turns (role icon + turn number). Right: selected turn detail
Detail tabs: Output | Tool Calls | Prompt
Live: New turns appear from WS turn_complete events
Components: TurnTimeline, TurnDetail, TokenBadge
4. ModelRosterPanel (Role → Model Grid)
Source: events.store — last turn_start/turn_complete per role shows selected_model
Display: Grid of role cards, each showing: role name, model name, tier, activity state
Activity states: Each role card shows one of four states derived from WS events:
reading (cyan) — model is ingesting context/prompt (turn_start received, no tool calls yet)
thinking (amber pulse) — model is reasoning/generating (turn_start with active processing)
writing (green) — model is producing output or executing tool calls (tool_call events in turn)
empty (dim/muted) — role is idle, no active turn
Live: State transitions animate smoothly; glow intensity matches activity
Components: RoleCard (with activity state indicator), SeatGrid
5. GuardReviewPanel (Quality Gate Feed)
Source: events.store — filter for guard_* and runtime_verifier_completed events
Display: Reverse-chronological feed of guard decisions
Each entry: Pass (green) / Retry (amber) / Terminal Failure (red) + violations + fix_hint
Components: GuardDecisionCard, ViolationList
6. MetricsStripPanel (Hardware + Throughput)
Source: metrics.store — 3s polling of /system/metrics, token throughput from WS events
Display: 3 radial gauges (CPU, RAM, VRAM) + 1 line chart (tokens/sec over time)
Charts: ECharts gauge series + line series with area fill
Components: GaugeChart, ThroughputChart, MetricCard
7. LogConsolePanel (Streaming Logs)
Source: logs.store — ring buffer of 1000 entries, 2s polling
Display: Monospace scrollable list, color-coded by level
Filters: Session, event type, role, text search — applied via API query params
Components: LogEntry, LogFilter
8. OperatorConsole (Interactive CLI)
Source: chat.store — command/response history
API: POST /v1/system/chat-driver — driver parses natural language intent and executes actions (start runs, create cards, manage tasks, query status, manual orchestration)
Display: Terminal-style panel with monospace output. User types natural language or direct commands. Driver interprets and acts. Responses rendered as structured output (not chat bubbles — this is a CLI, not a chat).
Capabilities via driver: Kick off runs, create/update cards, halt sessions, assign tasks, query system state, manual orchestration control — anything the API surface supports, accessed through natural language
Visual style: Dark terminal aesthetic — prompt character (e.g., orket>), command echo, structured response blocks with syntax highlighting for code/JSON output
Components: OperatorTerminal (main terminal renderer), CommandInput (input line with history via up/down arrows), ResponseBlock (formatted response with collapsible sections)
9. RunHistoryPanel (Modal)
Source: sessionsApi.listRuns()
Display: PrimeVue DataTable — session_id, status, started_at, duration, issues count
Interaction: Click row → loads that run's data into all wall panels
Triggered from: TopBar button
10. SettingsPanel (Modal)
Source: systemApi.runtimePolicyOptions() + systemApi.runtimePolicy()
Display: Dynamic form — dropdowns for enum settings, toggles for booleans
Save: POST /v1/system/runtime-policy
Triggered from: TopBar button
Components: PolicyForm, SettingRow
11. SandboxMonitorPanel
Source: sandboxes.store — 5s polling
Display: List of sandbox cards with status, stop button, expandable log viewer
Components: SandboxCard, SandboxLogViewer
12. LoginScreen
Simple password field → POST /bff/login
Dark themed, centered, with Orket branding
Implementation Phases
Phase 1: Scaffold & Infrastructure
Initialize monorepo (npm workspaces, root package.json)
Scaffold Vue app with Vite (client/)
Scaffold Express BFF (server/)
All TypeScript interfaces (client/src/types/)
API client base + all API modules (client/src/api/)
BFF proxy (HTTP + WS) + auth routes
PrimeVue dark theme preset + CSS variables
ECharts registration + custom theme
CommandCenter.vue layout shell with nested Splitters (empty labeled panels)
TopBar.vue, StatusBar.vue, PanelHeader.vue
LoginScreen.vue
Result: App boots, dark themed layout with labeled empty panels, connects through BFF.

Phase 2: Data Layer
All Pinia stores with polling + WS integration
useWebSocket.ts composable (reconnection, event dispatch)
usePolling.ts composable
Wire WS events → store refresh triggers
Auth flow (login → session → proxy)
Result: App authenticates, fetches live data, receives WebSocket events.

Phase 3: Primary Panels (highest impact first)
MetricsStripPanel — gauges + throughput (validates ECharts integration)
CardFlowPanel — kanban board (core system visibility)
LogConsolePanel — streaming logs (critical for demos)
PipelineDAGPanel — dependency graph (the "wow" visual)
Result: 4 live panels on the wall showing real data.

Phase 4: Secondary Panels
TurnReplayPanel — agent reasoning timeline
ModelRosterPanel — role/model grid with live indicators
GuardReviewPanel — guard decision feed
OperatorConsole — interactive CLI to driver
Result: All 8 real-time panels functional.

Phase 5: Overlay Views & Polish
RunHistoryPanel — modal with DataTable
SettingsPanel — dynamic policy form
SandboxMonitorPanel — sandbox list
CardDetailDrawer — full card detail slide-out
Run controls (start/stop) in TopBar
Connection status indicators
Result: All 12 views complete.

Phase 6: Demo Polish
Glow effects, pulse animations on live data
Empty states for all panels
Loading skeletons
Error handling + retry indicators
Tooltips throughout
Final visual QA
Verification
BFF proxy works: Start Orket on :8082, start BFF on :3001 → curl localhost:3001/v1/health returns Orket health response without exposing API key
Auth flow: Login via UI → session cookie set → API calls succeed → logout → API calls return 401
WebSocket: Open browser, verify WS connects (StatusBar shows green dot), start an Orket run → events stream into the wall in real-time
Each panel: Start an orchestration run and verify:
Cards appear in kanban columns and move as status changes
DAG renders issue nodes with dependency edges
Turns appear in replay timeline as agents execute
Model roster shows active models with read/write/thinking/empty states
Guard decisions appear in feed
Gauges show live CPU/RAM/VRAM
Logs stream in console
Operator console accepts commands and executes via driver (start run, create card, query status)
Run History: After run completes, open history → see past run → click to load into wall
Settings: Open settings → change runtime policy → verify change persists
