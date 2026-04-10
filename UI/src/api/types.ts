export type ObservedPath = "primary" | "fallback" | "degraded" | "blocked";
export type ObservedResult = "success" | "failure" | "partial success" | "environment blocker";

export interface StatusSummary {
  primary_status: string;
  degraded: boolean;
  summary: string;
  reason_codes: string[];
  next_action: string;
}

export interface WriteActionStatus {
  action: string;
  status: string;
  reason: string;
}

export interface DesignTab {
  tab_id: string;
  has_screen_png: boolean;
  has_code_html: boolean;
  has_design_md: boolean;
}

export interface MetaResponse {
  ok: boolean;
  extension_id: string;
  host_base_url: string;
  api_key_configured: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  write_actions: WriteActionStatus[];
  write_actions_blocked?: WriteActionStatus[];
  routes: Record<string, string[]>;
  design_tabs: DesignTab[];
}

export interface HostFailure {
  seam: string;
  base_url: string;
  code: string;
  detail: string;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
}

export interface SystemOverviewData {
  health?: Record<string, unknown>;
  version?: { version?: string; api?: string };
  heartbeat?: Record<string, unknown>;
  health_view?: Record<string, unknown> & Partial<StatusSummary>;
  provider_status?: Record<string, unknown> & Partial<StatusSummary>;
}

export interface SystemOverviewResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  host_base_url: string;
  api_key_configured: boolean;
  data: SystemOverviewData;
  failures: Record<string, HostFailure>;
}

export interface CardListItemView extends StatusSummary {
  card_id: string;
  session_id: string;
  build_id: string;
  title: string;
  seat: string;
  raw_status: string;
  filter_bucket: string;
  last_run: Record<string, unknown> | null;
}

export interface CardsListPayload {
  items: CardListItemView[];
  limit: number;
  offset?: number;
  count: number;
  total?: number;
  filters?: Record<string, string | null>;
}

export interface CardsResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  cards: CardsListPayload;
  source_refs: Record<string, string>;
  error?: HostFailure;
}

export interface PromptSource {
  source_label: string;
  source_kind: string;
  source_text: string;
}

export interface RawCard {
  id: string;
  summary?: string;
  note?: string | null;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CardDetailResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  card_id: string;
  view?: Record<string, unknown>;
  raw?: RawCard;
  prompt_source: PromptSource;
  failures: Record<string, HostFailure>;
  source_refs: Record<string, string>;
}

export interface RunHistoryItemView extends StatusSummary {
  session_id: string;
  raw_status: string;
  lifecycle_category: string;
  execution_profile?: string | null;
  stop_reason?: string | null;
  verification_status?: string;
  verification_summary?: string;
  issue_count: number;
}

export interface RunsListPayload {
  items: RunHistoryItemView[];
  count: number;
  limit: number;
}

export interface RunsResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  runs: RunsListPayload;
  source_refs: Record<string, string>;
  error?: HostFailure;
}

export interface ExecutionGraph {
  session_id: string;
  node_count: number;
  edge_count: number;
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
}

export interface RunDetailResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  session_id: string;
  view?: Record<string, unknown>;
  execution_graph?: ExecutionGraph;
  failures: Record<string, HostFailure>;
  source_refs: Record<string, string>;
}

export interface PromptReforgerContextResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  supported_result_classes: string[];
  source_prompt: PromptSource;
  status_note: string;
  card_id?: string;
  card_view?: Record<string, unknown>;
  failures?: Record<string, HostFailure>;
}

export interface FlowListItem {
  flow_id: string;
  revision_id: string;
  name: string;
  description: string;
  node_count: number;
  edge_count: number;
  updated_at: string;
}

export interface FlowsResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  items: FlowListItem[];
  count: number;
  limit: number;
  offset: number;
  source_refs: Record<string, string>;
  error?: HostFailure;
}

export interface CardDraftPayload {
  name: string;
  purpose: string;
  card_kind: string;
  prompt: string;
  inputs: string[];
  expected_outputs: string[];
  expected_output_type: string;
  display_category: string;
  notes: string;
  constraints: string[];
  approval_expectation: string;
  artifact_expectation: string;
}

export interface CardValidationResponse {
  ok?: boolean;
  observed_path?: ObservedPath;
  observed_result?: ObservedResult;
  source_refs?: Record<string, string>;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
  reason_codes: string[];
}

export interface CardWriteResponse {
  ok?: boolean;
  observed_path?: ObservedPath;
  observed_result?: ObservedResult;
  source_refs?: Record<string, string>;
  card_id: string;
  revision_id: string;
  saved_at: string;
  validation: CardValidationResponse;
  degraded: boolean;
  summary: string;
  reason_codes: string[];
}

export interface FlowNodeWritePayload {
  node_id: string;
  kind: string;
  label: string;
  assigned_card_id: string | null;
  notes: string;
}

export interface FlowEdgeWritePayload {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  condition_label: string;
}

export interface FlowDefinitionPayload {
  name: string;
  description: string;
  nodes: FlowNodeWritePayload[];
  edges: FlowEdgeWritePayload[];
}

export interface FlowDetailResponse {
  ok: boolean;
  observed_path: ObservedPath;
  observed_result: ObservedResult;
  source_refs: Record<string, string>;
  flow_id: string;
  revision_id: string;
  name: string;
  description: string;
  nodes: FlowNodeWritePayload[];
  edges: FlowEdgeWritePayload[];
  created_at: string;
  updated_at: string;
}

export interface FlowValidationResponse {
  ok?: boolean;
  observed_path?: ObservedPath;
  observed_result?: ObservedResult;
  source_refs?: Record<string, string>;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
  reason_codes: string[];
}

export interface FlowWriteResponse {
  ok?: boolean;
  observed_path?: ObservedPath;
  observed_result?: ObservedResult;
  source_refs?: Record<string, string>;
  flow_id: string;
  revision_id: string;
  saved_at: string;
  validation: FlowValidationResponse;
  degraded: boolean;
  summary: string;
  reason_codes: string[];
}

export interface FlowRunAcceptedResponse {
  ok?: boolean;
  observed_path?: ObservedPath;
  observed_result?: ObservedResult;
  source_refs?: Record<string, string>;
  flow_id: string;
  revision_id: string;
  session_id: string;
  accepted_at: string;
  summary: string;
}
