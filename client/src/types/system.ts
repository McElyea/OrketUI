import type { CardStatus, IssueMetrics } from './cards';

// --- Health & Heartbeat ---

export interface HealthResponse {
  status: string;
}

export interface VersionResponse {
  version: string;
}

export interface HeartbeatResponse {
  active_task_count: number;
}

// --- Hardware Metrics ---

export interface HardwareMetrics {
  cpu_percent: number;
  ram_percent: number;
  vram_gb_used: number;
  vram_total_gb: number;
  timestamp: string;
}

export interface HardwareProfile {
  cpu_cores: number;
  ram_gb: number;
  vram_gb: number;
  has_nvidia: boolean;
}

// --- Board Hierarchy ---

export interface BoardIssue {
  id: string;
  name: string;
  seat: string;
  priority: number;
  status: CardStatus;
  depends_on: string[];
  retry_count: number;
  max_retries: number;
  verification?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface BoardEpic {
  id: string;
  name: string;
  description?: string;
  status: CardStatus;
  team?: string;
  environment?: string;
  issues: BoardIssue[];
  error?: string;
}

export interface BoardRock {
  id: string;
  name: string;
  description?: string;
  status: CardStatus;
  epics: BoardEpic[];
}

export interface BoardAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  action_required?: string;
}

export interface Board {
  rocks: BoardRock[];
  orphaned_epics: BoardEpic[];
  orphaned_issues: BoardIssue[];
  artifacts: string[];
  alerts: BoardAlert[];
}

// --- Runtime Policy ---

export interface RuntimePolicyOption {
  env_var: string;
  aliases: string[];
  type: string;
}

export interface RuntimePolicyOptions {
  [key: string]: RuntimePolicyOption;
}

export interface RuntimePolicy {
  architecture_mode?: string;
  frontend_framework_mode?: string;
  project_surface_profile?: string;
  small_project_builder_variant?: string;
  state_backend_mode?: string;
  gitea_state_pilot_enabled?: boolean;
}

// --- Organization ---

export interface BrandingConfig {
  colorscheme: Record<string, string>;
  fonts: string[];
  logo_path?: string;
  design_dos: string[];
  design_donts: string[];
}

export interface ArchitecturePrescription {
  idesign_threshold: number;
  preferred_stack: Record<string, string>;
  cicd_rules: string[];
}

export interface OrganizationConfig {
  schema_version: string;
  name: string;
  vision: string;
  ethos: string;
  branding: BrandingConfig;
  architecture: ArchitecturePrescription;
  departments: string[];
  process_rules: Record<string, unknown>;
}

// --- Teams & Roles ---

export interface SeatConfig {
  name: string;
  roles: string[];
}

export interface RoleConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  intent?: string;
  responsibilities?: string[];
  tools: string[];
  capabilities: Record<string, unknown>;
  prompt_metadata: Record<string, unknown>;
}

export interface TeamConfig {
  name: string;
  description?: string;
  seats: Record<string, SeatConfig>;
  roles?: Record<string, RoleConfig>;
}

// --- Configs ---

export interface EpicConfig {
  id: string;
  name: string;
  type: string;
  status: CardStatus;
  team: string;
  environment: string;
  iterations: number;
  handshake_enabled: boolean;
  issues: BoardIssue[];
  requirements?: string;
  architecture_governance?: {
    idesign: boolean;
    pattern: string;
    reasoning?: string;
  };
  metrics?: IssueMetrics;
}

export interface RockConfig {
  id: string;
  name: string;
  type: string;
  status: CardStatus;
  task?: string;
  epics: Array<{ epic: string; department: string }>;
  metrics?: IssueMetrics;
}

// --- Calendar ---

export interface CalendarResponse {
  current_sprint?: {
    name: string;
    start: string;
    end: string;
  };
}
