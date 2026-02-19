/** Polling intervals in milliseconds */
export const POLL_METRICS_MS = 3000;
export const POLL_BOARD_MS = 10000;
export const POLL_LOGS_MS = 2000;
export const POLL_SANDBOXES_MS = 5000;

/** Ring buffer sizes */
export const EVENT_BUFFER_SIZE = 500;
export const LOG_BUFFER_SIZE = 1000;

/** Metrics time-series length (data points retained) */
export const METRICS_HISTORY_LENGTH = 60; // 3 minutes at 3s intervals

/** WebSocket reconnection */
export const WS_RECONNECT_MIN_MS = 1000;
export const WS_RECONNECT_MAX_MS = 30000;

/** API defaults */
export const DEFAULT_LOG_LIMIT = 100;
