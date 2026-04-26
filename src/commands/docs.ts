import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand } from "citty";
import { handleError } from "../lib/output.js";

/**
 * Resolve MANUAL.md at the package root.
 * Layout: dist/commands/docs.js  →  ../../MANUAL.md (cli/MANUAL.md)
 * Or (dev): src/commands/docs.ts  →  ../../MANUAL.md (cli/MANUAL.md)
 */
function resolveManualPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..", "MANUAL.md");
}

export default defineCommand({
  meta: {
    name: "docs",
    description:
      "Print the full MANUAL.md to stdout. Intended for LLM system prompts or quick offline reference. Combine with `aegis schema` for complete LLM integration.",
  },
  args: {},
  async run() {
    try {
      const text = await readFile(resolveManualPath(), "utf-8");
      process.stdout.write(text);
      if (!text.endsWith("\n")) process.stdout.write("\n");
    } catch (err) {
      handleError(err);
    }
  },
});
