import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { CreateUBOSchema } from "../../schemas/ubo.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Add a UBO (Ultimate Beneficial Owner) to a case manually. Body as JSON via --data.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        "UBO payload as JSON. Required: firstName, lastName, controlType. Optional: fiscalCode, birthDate, birthPlace, nationality, ownershipPercentage, directShare, indirectShare, sourceEntityName, sourceEntityFiscalCode, depth, isPep, pepDetails, highRiskCountry, notes, participationChain, isLegalRepresentative (mark as AV.4 art.22 signer; at least one LR is required per case for the dossier).",
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
      const raw = await readJsonData(args.data, "data");
      const body = CreateUBOSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/ubos`,
        {
          method: "POST",
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
