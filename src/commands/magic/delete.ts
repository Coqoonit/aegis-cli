import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { confirmDestructive } from "../../lib/prompt.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "delete",
    description:
      "Revoke a magic link. Any outstanding URL becomes invalid immediately. Requires --yes or TTY confirmation.",
  },
  args: {
    "magic-id": {
      type: "positional",
      required: true,
      description: "Magic link ID",
    },
    yes: { type: "boolean", description: "Skip confirmation prompt" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const magicId = requireCuid(args["magic-id"], "<magic-id>");

      if (!args["dry-run"]) {
        await confirmDestructive({
          message: `Revoke magic link ${magicId}?`,
          yes: args.yes,
        });
      }

      await apiFetch(`/magic-links/${encodeURIComponent(magicId)}`, {
        method: "DELETE",
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit({ ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
