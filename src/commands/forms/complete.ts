import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "complete",
    description:
      "Mark a form as COMPLETED (ready for signature). Requires form to be in DRAFT.",
  },
  args: {
    "form-id": {
      type: "positional",
      required: true,
      description: "Form ID",
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
      const formId = requireCuid(args["form-id"], "<form-id>");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/forms/${encodeURIComponent(formId)}/complete`,
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
