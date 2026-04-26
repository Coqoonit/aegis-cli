import { readFile } from "node:fs/promises";
import { ValidationError } from "./errors.js";

/**
 * Read a JSON body from:
 *   - `-`      → stdin
 *   - `@path`  → file contents
 *   - anything else → parse as JSON string
 */
export async function readJsonData(
  raw: string | undefined,
  flagName = "data",
): Promise<unknown> {
  if (!raw || raw === "") {
    throw new ValidationError(
      `--${flagName} is required (JSON string, @file, or -)`,
    );
  }

  let text: string;
  if (raw === "-") {
    text = await readStdin();
  } else if (raw.startsWith("@")) {
    const path = raw.slice(1);
    try {
      text = await readFile(path, "utf-8");
    } catch (err) {
      throw new ValidationError(
        `Cannot read --${flagName} file: ${path}`,
        err instanceof Error ? err.message : String(err),
      );
    }
  } else {
    text = raw;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new ValidationError(
      `--${flagName} is not valid JSON`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new ValidationError(
      "--data=- requires piped input (stdin), not an interactive TTY. Use --data '<json>' or --data @file.json instead.",
    );
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/** Build a querystring from an object, skipping undefined/null/empty values. */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
