import { defineCommand, type CommandDef } from "citty";
import {
  emitAnthropic,
  emitOpenAI,
  emitRaw,
  walkCommandTree,
  type ManifestFormat,
} from "../lib/manifest.js";
import { ValidationError } from "../lib/errors.js";
import { emit, handleError } from "../lib/output.js";
import { BODY_SCHEMAS } from "../schema-registry.js";

type MainFactory = () => CommandDef;

/**
 * The schema command is passed the root command reference via a factory so it can
 * walk the full command tree. We avoid circular imports by resolving at runtime.
 */
export function defineSchemaCommand(mainFactory: MainFactory) {
  return defineCommand({
    meta: {
      name: "schema",
      description:
        "Emit a tool manifest describing every aegis command as a structured JSON schema. Useful for LLM tool-use: pass the output to Claude's `tools` or OpenAI's `tools` field. Default format: anthropic.",
    },
    args: {
      format: {
        type: "string",
        description: "anthropic | openai | raw (default: anthropic)",
      },
      pretty: { type: "boolean", description: "Pretty-print JSON output" },
    },
    async run({ args }) {
      try {
        const format = (args.format || "anthropic") as ManifestFormat;
        if (!["anthropic", "openai", "raw"].includes(format)) {
          throw new ValidationError(
            `Invalid --format: ${format}. Expected anthropic | openai | raw.`,
          );
        }

        const root = mainFactory();
        const tools = walkCommandTree(root, BODY_SCHEMAS);

        // Drop meta commands (schema, docs) from the manifest — they don't hit the API.
        const filtered = tools.filter(
          (t) => t.path[0] !== "schema" && t.path[0] !== "docs",
        );

        let output: unknown;
        switch (format) {
          case "anthropic":
            output = emitAnthropic(filtered);
            break;
          case "openai":
            output = emitOpenAI(filtered);
            break;
          case "raw":
            output = emitRaw(filtered);
            break;
        }

        emit(output, { pretty: args.pretty });
      } catch (err) {
        handleError(err, { pretty: args.pretty });
      }
    },
  });
}
