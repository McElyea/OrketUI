export class HttpError extends Error {
  status: number;
  payload: unknown;

  constructor(path: string, status: number, payload: unknown) {
    super(`${path} -> ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function sendJson<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT";
    body?: unknown;
  },
): Promise<T> {
  const response = await fetch(path, {
    method: options?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new HttpError(path, response.status, payload);
  }
  return payload as T;
}

export async function fetchJson<T>(path: string): Promise<T> {
  return await sendJson<T>(path);
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return await sendJson<T>(path, { method: "POST", body });
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  return await sendJson<T>(path, { method: "PUT", body });
}

export function getHttpErrorDetail(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    if (typeof error.payload === "string" && error.payload.trim()) {
      return error.payload;
    }
    if (
      error.payload &&
      typeof error.payload === "object" &&
      "detail" in error.payload &&
      typeof error.payload.detail === "string"
    ) {
      return error.payload.detail;
    }
    return `${fallback} (${error.status})`;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
