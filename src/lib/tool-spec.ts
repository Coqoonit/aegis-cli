import type { CommandDef } from "citty";
import type { BodySchemaRegistry } from "./manifest.js";

/**
 * Dispatch spec — the runtime metadata needed to translate an MCP tool call
 * (JSON input object) into a CLI invocation (argv array).
 *
 * Built from the same citty command tree that produces the JSON-schema manifest,
 * but kept separate because consumers have different concerns:
 *   - manifest.ts: shape advertised to the LLM (input_schema, descriptions)
 *   - tool-spec.ts: how to wire the LLM's input back into argv when it calls
 */

export type ArgKind = "string" | "boolean" | "positional";

export interface ArgSpec {
  /** Original kebab-case name as declared in the citty `args` object. */
  cliName: string;
  /** snake_case name exposed in the JSON input schema. */
  inputName: string;
  kind: ArgKind;
}

export interface DispatchSpec {
  /** Flat snake_case tool name, e.g. `aegis_clients_create`. */
  name: string;
  /** Path through citty subCommands tree, e.g. `["clients", "create"]`. */
  path: string[];
  /** Arg specs in declaration order — positionals are consumed in order on argv. */
  args: ArgSpec[];
  /** True when the command accepts a structured body via `--data <json>`. */
  hasDataFlag: boolean;
}

function kebabToSnake(s: string): string {
  return s.replace(/-/g, "_");
}

export function buildDispatchSpecs(
  root: CommandDef,
  registry: BodySchemaRegistry,
  basePath: string[] = [],
  namePrefix = "aegis",
): DispatchSpec[] {
  const sub = root.subCommands;
  if (!sub) return [];

  const out: DispatchSpec[] = [];

  for (const [cmdName, rawCmd] of Object.entries(sub)) {
    if (typeof rawCmd === "function") continue;
    const cmd = rawCmd as CommandDef;
    const path = [...basePath, cmdName];

    if (cmd.subCommands) {
      out.push(...buildDispatchSpecs(cmd, registry, path, namePrefix));
      continue;
    }

    const key = path.join(".");
    const hasDataFlag = registry[key] !== undefined;
    const name = [namePrefix, ...path].join("_").replace(/-/g, "_");

    const args: ArgSpec[] = [];
    for (const [rawName, def] of Object.entries(cmd.args ?? {})) {
      if (rawName === "pretty") continue;
      // citty also has a `data` flag when hasDataFlag is true — we serialize the
      // structured object into it ourselves, so skip it from the per-arg loop.
      if (rawName === "data" && hasDataFlag) continue;
      const argDef = def as { type: ArgKind };
      args.push({
        cliName: rawName,
        inputName: kebabToSnake(rawName),
        kind: argDef.type,
      });
    }

    out.push({ name, path, args, hasDataFlag });
  }

  return out;
}

/**
 * Translate an MCP tool input object into a CLI argv array (without the
 * leading binary path). Order: subcommand path, positional args in declaration
 * order, flag args in declaration order, optional `--data <json>` body.
 */
export function inputToCliArgs(
  input: Record<string, unknown>,
  spec: DispatchSpec,
): string[] {
  const args: string[] = [...spec.path];

  for (const a of spec.args) {
    if (a.kind !== "positional") continue;
    const v = input[a.inputName];
    if (v !== undefined && v !== null) args.push(String(v));
  }

  for (const a of spec.args) {
    if (a.kind === "string") {
      const v = input[a.inputName];
      if (v !== undefined && v !== null) args.push(`--${a.cliName}`, String(v));
    } else if (a.kind === "boolean") {
      const v = input[a.inputName];
      if (v === true) args.push(`--${a.cliName}`);
    }
  }

  if (spec.hasDataFlag && input.data !== undefined && input.data !== null) {
    args.push("--data", JSON.stringify(input.data));
  }

  return args;
}
