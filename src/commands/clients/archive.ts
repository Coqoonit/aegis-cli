import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { confirmDestructive } from "../../lib/prompt.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "archive",
    description:
      "Archive a client (sets status=ARCHIVED). Requires --yes or TTY confirmation.",
  },
  args: {
    id: { type: "positional", required: true, description: "Client ID" },
    yes: { type: "boolean", description: "Skip confirmation prompt" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const id = requireCuid(args.id, "client ID");

      if (!args["dry-run"]) {
        await confirmDestructive({
          message: `Archive client ${id}?`,
          yes: args.yes,
        });
      }

      const res = await apiFetch<unknown>(
        `/clients/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "ARCHIVED" }),
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
