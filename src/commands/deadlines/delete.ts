import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { confirmDestructive } from "../../lib/prompt.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "delete",
    description:
      "Delete a deadline permanently. Backend blocks deletion of COMPLETED deadlines; all other states (UPCOMING, OVERDUE, DISMISSED) are deletable regardless of type. Requires --yes or TTY confirmation.",
  },
  args: {
    "deadline-id": {
      type: "positional",
      required: true,
      description: "Deadline ID",
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
      const deadlineId = requireCuid(args["deadline-id"], "<deadline-id>");

      if (!args["dry-run"]) {
        await confirmDestructive({
          message: `Delete deadline ${deadlineId}?`,
          yes: args.yes,
        });
      }

      await apiFetch(`/deadlines/${encodeURIComponent(deadlineId)}`, {
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
