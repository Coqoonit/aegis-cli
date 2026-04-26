import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { confirmDestructive } from "../../lib/prompt.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "delete",
    description:
      "Delete a UBO from a case. Requires --yes or TTY confirmation.",
  },
  args: {
    "ubo-id": {
      type: "positional",
      required: true,
      description: "UBO ID to delete",
    },
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
      const uboId = requireCuid(args["ubo-id"], "<ubo-id>");

      if (!args["dry-run"]) {
        await confirmDestructive({
          message: `Delete UBO ${uboId} from case ${caseId}?`,
          yes: args.yes,
        });
      }

      await apiFetch(
        `/aml-cases/${encodeURIComponent(caseId)}/ubos/${encodeURIComponent(uboId)}`,
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
