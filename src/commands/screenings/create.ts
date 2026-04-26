import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { CreateScreeningSchema } from "../../schemas/screening.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Create a single screening (one type at a time). Consumes wallet credits. For all types at once use `run-full`.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        "Payload as JSON. Required: type (SANCTIONS|PEP|ADVERSE_MEDIA), personType (CLIENT|LEGAL_REPRESENTATIVE|UBO|COMPANY), searchTerm. UBO requires uboId; non-UBO must NOT set uboId.",
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
      const body = CreateScreeningSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/screenings`,
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
