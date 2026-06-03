import { ZodError } from "zod";
import { ApiError, AuthMissingError, EXIT, ValidationError, type ExitCode } from "./errors.js";

/**
 * Hints mapped by backend error code. Appended to the error envelope so LLMs
 * can self-correct without round-tripping through the user.
 */
const ERROR_CODE_HINTS: Record<string, string> = {
  UNAUTHORIZED: "Run `aegis auth login` to authenticate.",
  TOKEN_EXPIRED: "Try again — automatic refresh happens on 401.",
  FORBIDDEN: "Your role does not have permission for this operation.",
  SUBSCRIPTION_REQUIRED:
    "Active subscription required. Access the billing portal in the web app.",
  PRIVACY_CONSENT_REQUIRED:
    "Privacy Policy / Terms of Service not yet accepted. Run `aegis auth accept-terms` to consent before continuing.",
  NOT_FOUND: "Verify the resource ID with a corresponding `list` or `get` command.",
  CLIENT_NOT_FOUND: "Run `aegis clients list` to see available client IDs.",
  CASE_NOT_FOUND:
    "Run `aegis cases list [--client-id <id>]` to see available case IDs.",
  UBO_NOT_FOUND: "Run `aegis ubos list --case <caseId>` to see UBO IDs.",
  IDENTIFICATION_NOT_FOUND: "Run `aegis ids list --case <caseId>` first.",
  SCREENING_NOT_FOUND: "Run `aegis screenings list --case <caseId>` first.",
  RISK_ASSESSMENT_NOT_FOUND:
    "Run `aegis risk list --case <caseId>` to see assessment IDs.",
  FORM_NOT_FOUND: "Run `aegis forms list --case <caseId>` first.",
  DEADLINE_NOT_FOUND: "Run `aegis deadlines list` to see available IDs.",
  MAGIC_LINK_NOT_FOUND: "Run `aegis magic list --case <caseId>` first.",
  INSUFFICIENT_CREDITS:
    "Wallet balance too low. Top up in the billing portal before retrying.",
  VALIDATION_ERROR:
    "Request body failed server-side validation. Check the tool's input_schema.",
  TENANT_CONTEXT_MISSING:
    "The request did not pass through the gateway. Ensure AEGIS_API_URL points to the gateway, not a downstream service.",
  DUPLICATE_FISCAL_CODE:
    "A client with this fiscal code already exists. Use `aegis clients list --search <fc>` to find it.",
  DUPLICATE_VAT_NUMBER:
    "A client with this VAT number already exists. Use `aegis clients list --search <vat>` to find it.",
  INVALID_STATE_TRANSITION:
    "The resource is in a state that doesn't allow this transition. Use the corresponding `list` / `get` to check current status.",
  RATE_LIMITED:
    "Gateway rate limit hit (per-IP). Wait a few seconds and retry, or reduce parallelism.",
};

export interface OutputOptions {
  pretty?: boolean;
}

export function emit(data: unknown, opts: OutputOptions = {}): void {
  if (data === undefined) return;
  const serialized = opts.pretty
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);
  process.stdout.write(serialized + "\n");
}

export interface ErrorEnvelope {
  error: string;
  message: string;
  status?: number;
  code?: string;
  hint?: string;
  traceId?: string;
  details?: unknown;
}

export function emitError(envelope: ErrorEnvelope, opts: OutputOptions = {}): void {
  const serialized = opts.pretty
    ? JSON.stringify(envelope, null, 2)
    : JSON.stringify(envelope);
  process.stderr.write(serialized + "\n");
}

export function log(message: string): void {
  process.stderr.write(message + "\n");
}

export function handleError(err: unknown, opts: OutputOptions = {}): never {
  const code = exitCodeFor(err);

  if (err instanceof ApiError) {
    const hint =
      err.hint ?? ERROR_CODE_HINTS[err.response.code] ?? undefined;
    emitError(
      {
        error: "ApiError",
        message: err.response.message,
        status: err.status,
        code: err.response.code,
        hint,
        traceId: err.response.traceId,
        details: err.response.details,
      },
      opts,
    );
  } else if (err instanceof AuthMissingError) {
    emitError(
      {
        error: "AuthMissingError",
        message: err.message,
        hint: "Run `aegis auth login` to authenticate.",
      },
      opts,
    );
  } else if (err instanceof ValidationError) {
    emitError(
      {
        error: "ValidationError",
        message: err.message,
        details: err.details,
      },
      opts,
    );
  } else if (err instanceof ZodError) {
    emitError(
      {
        error: "ValidationError",
        message: "Input validation failed",
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          code: e.code,
          message: e.message,
        })),
      },
      opts,
    );
  } else if (err instanceof Error && isNetworkError(err)) {
    emitError(
      {
        error: "NetworkError",
        message: networkErrorMessage(err),
        hint: "Check that the gateway is running and AEGIS_API_URL is correct.",
      },
      opts,
    );
  } else if (err instanceof Error) {
    emitError(
      {
        error: err.name || "Error",
        message: err.message,
      },
      opts,
    );
  } else {
    emitError(
      {
        error: "UnknownError",
        message: String(err),
      },
      opts,
    );
  }

  process.exit(code);
}

function exitCodeFor(err: unknown): ExitCode {
  if (err instanceof AuthMissingError) return EXIT.AUTH_MISSING;
  if (err instanceof ValidationError || err instanceof ZodError) return EXIT.VALIDATION;
  if (err instanceof ApiError) return EXIT.API_ERROR;
  if (isNetworkError(err)) return EXIT.NETWORK;
  return EXIT.GENERIC_ERROR;
}

const NETWORK_CODES = new Set([
  // POSIX
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNABORTED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "EAI_AGAIN",
  "EADDRNOTAVAIL",
  // undici / Node fetch
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_CLOSED",
  "UND_ERR_ABORTED",
  "UND_ERR_DESTROYED",
  "UND_ERR_REQ_CONTENT_LENGTH_MISMATCH",
  "UND_ERR_RES_CONTENT_LENGTH_MISMATCH",
]);

function extractCauseCodes(
  err: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): string[] {
  if (!err || typeof err !== "object" || depth > 5) return [];
  const obj = err as Record<string, unknown>;
  if (seen.has(err as object)) return [];
  seen.add(err as object);

  const codes: string[] = [];
  if (typeof obj.code === "string") codes.push(obj.code);
  if (obj.cause) codes.push(...extractCauseCodes(obj.cause, depth + 1, seen));
  if (Array.isArray(obj.errors)) {
    for (const sub of obj.errors) {
      codes.push(...extractCauseCodes(sub, depth + 1, seen));
    }
  }
  return codes;
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  const codes = extractCauseCodes(err);
  if (codes.some((c) => NETWORK_CODES.has(c))) return true;
  // Fallback: generic Node fetch failure with no propagated code.
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) return true;
  return false;
}

function networkErrorMessage(err: Error): string {
  if (err.name === "AbortError") return "Request timed out";
  const codes = extractCauseCodes(err);
  const known = codes.find((c) => NETWORK_CODES.has(c));
  if (known) return `Network error: ${known}`;
  if (codes.length > 0) return `Network error: ${codes[0]}`;
  return err.message || "Network error";
}
