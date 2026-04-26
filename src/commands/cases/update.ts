import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UpdateAmlCaseSchema } from "../../schemas/case.js";

export default defineCommand({
  meta: {
    name: "update",
    description:
      "Update a case (partial). Body as JSON via --data. Only included fields are changed.",
  },
  args: {
    id: { type: "positional", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        "Partial update payload as JSON. Fields: status, engagementType, assignedTo, riskMotivation, notes, missingDocuments, participationChain.",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const id = requireCuid(args.id, "case ID");
      const raw = await readJsonData(args.data, "data");
      const body = UpdateAmlCaseSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(id)}`,
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
