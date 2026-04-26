import type { CommandDef } from "citty";
import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { inferSafety, TOOL_HINTS, type XAegisHints } from "../hints-registry.js";

export type ManifestFormat = "anthropic" | "openai" | "raw";

interface JsonSchemaObject {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolManifestEntry {
  /** Flat snake_case name, e.g. aegis_clients_create */
  name: string;
  /** Citty command path, e.g. ["clients", "create"] */
  path: string[];
  description: string;
  inputSchema: JsonSchemaObject;
  /** x_aegis metadata: non-standard hints ignored by strict Anthropic/OpenAI validators */
  xAegis: Required<Pick<XAegisHints, "safety">> & XAegisHints;
}

/**
 * Map from command path ("clients.create") to the Zod schema that validates the --data body.
 * Only included commands have a structured body; others take flags only.
 */
export type BodySchemaRegistry = Record<string, ZodTypeAny>;

/** Convert "--first-name" → "first_name" for JSON schema property names. */
function kebabToSnake(s: string): string {
  return s.replace(/-/g, "_");
}

/**
 * Enforce the Anthropic/OpenAI tool-name contract:
 *   - pattern: /^[a-zA-Z0-9_-]{1,64}$/
 *   - max length: 64 chars
 * Both vendors reject tools that don't match.
 */
const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function assertValidToolName(name: string): void {
  if (!TOOL_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid tool name "${name}" (${name.length} chars). ` +
        "Must match /^[a-zA-Z0-9_-]{1,64}$/ per Anthropic/OpenAI tool-use spec.",
    );
  }
}

function argsToProperties(
  args: NonNullable<CommandDef["args"]>,
): { properties: Record<string, unknown>; required: string[] } {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [rawName, def] of Object.entries(args)) {
    // Skip citty-managed/output-only flags — not useful to the LLM.
    if (rawName === "pretty") continue;

    const propName = kebabToSnake(rawName);
    const argDef = def as {
      type: "string" | "boolean" | "positional";
      description?: string;
      required?: boolean;
      default?: unknown;
    };

    if (argDef.type === "boolean") {
      properties[propName] = {
        type: "boolean",
        description: argDef.description,
      };
    } else {
      // positional or string — both are string-typed inputs
      properties[propName] = {
        type: "string",
        description: argDef.description,
      };
    }

    if (argDef.required) required.push(propName);
  }

  return { properties, required };
}

function buildInputSchema(
  cmd: CommandDef,
  bodySchema: ZodTypeAny | undefined,
): JsonSchemaObject {
  const args = cmd.args ?? {};
  const { properties, required } = argsToProperties(args);

  if (bodySchema) {
    // Replace the raw "data" string property with the structured Zod → JSON schema.
    const converted = zodToJsonSchema(bodySchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;
    // Strip top-level $schema key (not needed nested)
    delete converted.$schema;
    properties.data = converted;
  }

  const schema: JsonSchemaObject = {
    type: "object",
    properties,
    additionalProperties: false,
  };
  if (required.length > 0) schema.required = required;
  return schema;
}

/** Walk citty subCommands tree; returns list of leaf commands. */
export function walkCommandTree(
  root: CommandDef,
  registry: BodySchemaRegistry,
  basePath: string[] = [],
  namePrefix = "aegis",
): ToolManifestEntry[] {
  const sub = root.subCommands;
  if (!sub) return [];

  const entries: ToolManifestEntry[] = [];

  for (const [cmdName, rawCmd] of Object.entries(sub)) {
    if (typeof rawCmd === "function") {
      // Lazy subcommand — not used in aegis-cli
      continue;
    }
    const cmd = rawCmd as CommandDef;
    const path = [...basePath, cmdName];

    if (cmd.subCommands) {
      entries.push(...walkCommandTree(cmd, registry, path, namePrefix));
      continue;
    }

    const key = path.join(".");
    const bodySchema = registry[key];
    const name = [namePrefix, ...path].join("_").replace(/-/g, "_");
    assertValidToolName(name);
    const description =
      (cmd.meta as { description?: string } | undefined)?.description ?? "";

    const hints = TOOL_HINTS[key] ?? {};
    const xAegis = {
      safety: hints.safety ?? inferSafety(path),
      ...(hints.idempotent !== undefined && { idempotent: hints.idempotent }),
      ...(hints.prerequisites && { prerequisites: hints.prerequisites }),
      ...(hints.typically_followed_by && {
        typically_followed_by: hints.typically_followed_by,
      }),
      ...(hints.consumes_credits !== undefined && {
        consumes_credits: hints.consumes_credits,
      }),
    };

    entries.push({
      name,
      path,
      description,
      inputSchema: buildInputSchema(cmd, bodySchema),
      xAegis,
    });
  }

  return entries;
}

export function emitAnthropic(tools: ToolManifestEntry[]): unknown {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
    x_aegis: t.xAegis,
  }));
}

export function emitOpenAI(tools: ToolManifestEntry[]): unknown {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
      x_aegis: t.xAegis,
    },
  }));
}

export function emitRaw(tools: ToolManifestEntry[]): unknown {
  return tools.map((t) => ({
    name: t.name,
    path: t.path,
    description: t.description,
    input_schema: t.inputSchema,
    x_aegis: t.xAegis,
  }));
}
