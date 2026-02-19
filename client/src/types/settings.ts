export interface Setting {
  key: string;
  value: unknown;
  source: 'default' | 'user' | 'environment' | 'process';
}

export interface SettingsResponse {
  [key: string]: Setting;
}

export interface Sandbox {
  sandbox_id: string;
  status: 'running' | 'stopped';
  created_at: string;
  issue_id?: string;
  service?: string;
}

export interface SandboxLogs {
  sandbox_id: string;
  logs: string[];
}

export interface ChatDriverRequest {
  message: string;
}

export interface ChatDriverResponse {
  response: string;
}

export interface RunActiveRequest {
  path?: string;
  build_id?: string;
  type?: string;
  issue_id?: string;
}

export interface ArchiveCardsRequest {
  card_ids?: string[];
  build_id?: string;
  related_tokens?: string[];
  reason?: string;
  archived_by?: string;
}
