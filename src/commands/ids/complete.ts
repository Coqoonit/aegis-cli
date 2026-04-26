import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "complete",
    description:
      "Mark an identification as COMPLETED. Transitions status from IN_PROGRESS/PENDING.",
  },
  args: {
    "id-id": {
      type: "positional",
      required: true,
      description: "Identification ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const identId = requireCuid(args["id-id"], "<identification-id>");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identifications/${encodeURIComponent(identId)}/complete`,
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
