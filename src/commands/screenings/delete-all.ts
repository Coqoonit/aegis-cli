import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { confirmDestructive } from "../../lib/prompt.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "delete-all",
    description:
      "Delete ALL screenings on a case. Destructive, requires --yes or TTY confirmation.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    yes: { type: "boolean", description: "Skip confirmation prompt" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");

      if (!args["dry-run"]) {
        await confirmDestructive({
          message: `Delete ALL screenings on case ${caseId}?`,
          yes: args.yes,
        });
      }

      await apiFetch(
        `/aml-cases/${encodeURIComponent(caseId)}/screenings`,
        {
          method: "DELETE",
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit({ ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
