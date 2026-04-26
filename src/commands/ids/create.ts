import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { CreateIdentificationSchema } from "../../schemas/identification.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Create an identification record on a case. Body as JSON via --data. Defaults type=ORDINARY.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        "Payload as JSON. Fields: type (CONDUCT_RULES|SIMPLIFIED|ORDINARY|ENHANCED), firstName, lastName, companyName, fiscalCode, vatNumber, identityDocumentId, assignedTo.",
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
      const body = CreateIdentificationSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identifications`,
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
