import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UpdateRiskAssessmentSchema } from "../../schemas/risk-assessment.js";

export default defineCommand({
  meta: {
    name: "update",
    description:
      "Update top-level fields of a risk assessment (operationDescription, relationshipType, notes). Use `set-level` to change factor levels.",
  },
  args: {
    "ra-id": {
      type: "positional",
      required: true,
      description: "Risk assessment ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    data: { type: "string", description: "Partial update payload as JSON" },
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
      const raw = await readJsonData(args.data, "data");
      const body = UpdateRiskAssessmentSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/risk-assessments/${encodeURIComponent(raId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
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
