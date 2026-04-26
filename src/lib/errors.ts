export const EXIT = {
  OK: 0,
  GENERIC_ERROR: 1,
  AUTH_MISSING: 2,
  VALIDATION: 3,
  API_ERROR: 4,
  NETWORK: 5,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  traceId?: string;
  timestamp?: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: ApiErrorResponse,
    public readonly hint?: string,
  ) {
    super(response.message);
    this.name = "ApiError";
  }
}

export class AuthMissingError extends Error {
  constructor() {
    super("Not authenticated. Run `aegis auth login`.");
    this.name = "AuthMissingError";
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
