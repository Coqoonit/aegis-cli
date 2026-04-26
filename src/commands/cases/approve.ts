import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "approve",
    description:
      "Approve an AML case. Transitions status to APPROVED. Requires that all required case steps are complete.",
  },
  args: {
    id: { type: "positional", required: true, description: "Case ID" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const id = requireCuid(args.id, "case ID");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(id)}/approve`,
        {
          method: "POST",
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
