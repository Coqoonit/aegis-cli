import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UpdateIdentificationSchema } from "../../schemas/identification.js";

export default defineCommand({
  meta: {
    name: "update",
    description:
      "Update an identification (partial). Body as JSON via --data. Many fields supported (PF/PG/operation/compliance).",
  },
  args: {
    "id-id": {
      type: "positional",
      required: true,
      description: "Identification ID",
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
      const identId = requireCuid(args["id-id"], "<identification-id>");
      const raw = await readJsonData(args.data, "data");
      const body = UpdateIdentificationSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identifications/${encodeURIComponent(identId)}`,
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
