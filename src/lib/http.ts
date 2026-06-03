import pLimit from "p-limit";
import { clearAuth, getAccessToken, getRefreshToken, setTokens } from "./auth-store.js";
import { getApiUrl } from "./config.js";
import { ApiError, type ApiErrorResponse } from "./errors.js";

// Endpoints that don't require an Authorization header. Hitting them
// without a JWT must NOT trigger the silent refresh / clearAuth path.
// Includes the passwordless primitives: refresh, logout, magic-link
// request/verify/consume, PAT exchange.
const PUBLIC_AUTH_PATHS = new Set([
  "/auth/refresh",
  "/auth/logout",
  "/auth/login-link/request",
  "/auth/login-link/verify",
  "/auth/login-link/consume",
  "/auth/access-token/exchange",
]);

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]);

const CONCURRENCY = Math.max(
  1,
  parseInt(process.env.AEGIS_CONCURRENCY ?? "1", 10) || 1,
);
const TIMEOUT_MS = Math.max(
  1000,
  parseInt(process.env.AEGIS_TIMEOUT_MS ?? "30000", 10) || 30000,
);
const MAX_RETRIES = 3;

const limiter = pLimit(CONCURRENCY);

let refreshPromise: Promise<boolean> | null = null;

function normalizePath(path: string): string {
  return path.split("?")[0] ?? path;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 60_000);
    }
  }
  const base = 500 * 2 ** attempt;
  const jitter = Math.random() * 200;
  return Math.min(base + jitter, 10_000);
}

function buildRequestHeaders(init: RequestInit, path: string): Headers {
  const headers = new Headers(init.headers);
  const body = init.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.has(normalizePath(path));
  const accessToken = getAccessToken();

  if (!headers.has("Content-Type") && body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !isPublicAuthPath && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("User-Agent")) headers.set("User-Agent", "aegis-cli");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return headers;
}

interface RefreshResponse {
  tokens: { accessToken: string; refreshToken: string };
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    tenantId?: string;
  };
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuth();
    return false;
  }
  try {
    const data = await rawFetch<RefreshResponse>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      { refreshed: true, retry: 0 },
    );
    setTokens(data.tokens.accessToken, data.tokens.refreshToken, data.user);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface FetchState {
  refreshed: boolean;
  retry: number;
}

export interface BinaryResponse {
  buffer: Buffer;
  contentType: string;
  contentDisposition?: string;
}

async function rawFetch<T>(
  path: string,
  init: RequestInit,
  state: FetchState,
  asBuffer = false,
): Promise<T> {
  const baseUrl = getApiUrl();
  const normalized = normalizePath(path);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.has(normalized);
  const method = (init.method ?? "GET").toUpperCase();

  const headers = buildRequestHeaders(init, path);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  // Retry on 429/503 — ONLY for idempotent methods (GET/HEAD/PUT/DELETE/OPTIONS).
  // POST/PATCH are not retried: 503 may have already executed the mutation.
  if (
    (response.status === 429 || response.status === 503) &&
    IDEMPOTENT_METHODS.has(method) &&
    state.retry < MAX_RETRIES
  ) {
    const retryAfter = response.headers.get("Retry-After");
    await sleep(backoffMs(state.retry, retryAfter));
    return rawFetch<T>(
      path,
      init,
      { ...state, retry: state.retry + 1 },
      asBuffer,
    );
  }

  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({
      statusCode: response.status,
      code: "UNKNOWN_ERROR",
      message: response.statusText || "Request failed",
      timestamp: new Date().toISOString(),
    }))) as ApiErrorResponse;
    const bodyCode = errBody.code;

    const isAuthExpiry =
      response.status === 401 ||
      (response.status === 403 &&
        bodyCode !== "FORBIDDEN" &&
        bodyCode !== "SUBSCRIPTION_REQUIRED" &&
        bodyCode !== "PRIVACY_CONSENT_REQUIRED");

    if (isAuthExpiry && !isPublicAuthPath) {
      if (!state.refreshed) {
        const ok = await refreshOnce();
        if (ok) {
          return rawFetch<T>(path, init, { refreshed: true, retry: 0 }, asBuffer);
        }
        clearAuth();
      } else {
        // Already refreshed once and still auth-failed → stored tokens are dead.
        clearAuth();
      }
    }

    throw new ApiError(response.status, errBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (asBuffer) {
    const ab = await response.arrayBuffer();
    const result: BinaryResponse = {
      buffer: Buffer.from(ab),
      contentType:
        response.headers.get("content-type") ?? "application/octet-stream",
      contentDisposition:
        response.headers.get("content-disposition") ?? undefined,
    };
    return result as T;
  }

  const json = (await response.json().catch(() => null)) as unknown;
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export interface ApiFetchOptions extends RequestInit {
  /** If true, do not send the request. Print the planned request to stdout and return undefined. */
  dryRun?: boolean;
  /** Pretty-print the dry-run preview (indented). Default false (compact). */
  pretty?: boolean;
}

function safeParseBody(body: RequestInit["body"]): unknown {
  if (body == null) return undefined;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of body.entries()) {
      obj[key] =
        typeof File !== "undefined" && value instanceof File
          ? `<file: ${value.name} (${value.size} bytes)>`
          : value;
    }
    return obj;
  }
  return "<binary>";
}

function redactedHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = key.toLowerCase() === "authorization" ? "Bearer <redacted>" : value;
  });
  return out;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { dryRun, pretty, ...init } = options;

  if (dryRun) {
    const baseUrl = getApiUrl();
    const finalHeaders = buildRequestHeaders(init, path);
    const preview = {
      dryRun: true,
      method: (init.method ?? "GET").toUpperCase(),
      url: `${baseUrl}${path}`,
      headers: redactedHeaders(finalHeaders),
      body: safeParseBody(init.body ?? null),
    };
    const serialized = pretty
      ? JSON.stringify(preview, null, 2)
      : JSON.stringify(preview);
    process.stdout.write(serialized + "\n");
    return undefined as T;
  }

  return limiter(() => rawFetch<T>(path, init, { refreshed: false, retry: 0 }));
}

/**
 * Like apiFetch, but returns the response body as a Buffer (for binary endpoints
 * such as PDF generation). Does not unwrap any envelope.
 */
export async function apiFetchBinary(
  path: string,
  options: ApiFetchOptions = {},
): Promise<BinaryResponse | undefined> {
  const { dryRun, pretty, ...init } = options;

  if (dryRun) {
    const baseUrl = getApiUrl();
    const finalHeaders = buildRequestHeaders(init, path);
    const preview = {
      dryRun: true,
      method: (init.method ?? "GET").toUpperCase(),
      url: `${baseUrl}${path}`,
      headers: redactedHeaders(finalHeaders),
      body: safeParseBody(init.body ?? null),
    };
    const serialized = pretty
      ? JSON.stringify(preview, null, 2)
      : JSON.stringify(preview);
    process.stdout.write(serialized + "\n");
    return undefined;
  }

  return limiter(() =>
    rawFetch<BinaryResponse>(
      path,
      init,
      { refreshed: false, retry: 0 },
      true,
    ),
  );
}
