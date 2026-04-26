import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "approve",
    description:
      "Approve a completed risk assessment. Propagates risk level to the client.",
  },
  args: {
    "ra-id": {
      type: "positional",
      required: true,
      description: "Risk assessment ID",
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
      const raId = requireCuid(args["ra-id"], "<ra-id>");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/risk-assessments/${encodeURIComponent(raId)}/approve`,
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
