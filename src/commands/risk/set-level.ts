import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { SetRiskFactorLevelSchema } from "../../schemas/risk-assessment.js";

export default defineCommand({
  meta: {
    name: "set-level",
    description:
      "Set a risk factor level on a risk assessment. Two modes: (a) legacy single-level (`selectedLevel` 1-4), (b) multi-definition (`selectedDefinitionIds` array). At least one required.",
  },
  args: {
    "ra-id": {
      type: "positional",
      required: true,
      description: "Risk assessment ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        'Payload as JSON. Required: categoryCode. Optional: selectedLevel (1-4), selectedDefinitionIds (array), note. Example: --data \'{"categoryCode":"A.1","selectedLevel":2}\'',
    },
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
      const body = SetRiskFactorLevelSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/risk-assessments/${encodeURIComponent(raId)}/levels`,
        {
          method: "PUT",
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
