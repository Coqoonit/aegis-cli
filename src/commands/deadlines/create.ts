import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { CreateDeadlineSchema } from "../../schemas/deadline.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Create a custom deadline attached to a case (type=CUSTOM). System deadlines (RISK_REVIEW, CASE_EXPIRY, etc) are auto-generated and cannot be created via this endpoint.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        'Payload as JSON. Required: type (must be "CUSTOM"), dueDate (ISO 8601). Optional: assignedTo, notes. Example: --data \'{"type":"CUSTOM","dueDate":"2026-06-30","notes":"Rivedi documenti"}\'',
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
      const body = CreateDeadlineSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/deadlines/case/${encodeURIComponent(caseId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            ...body,
            dueDate: body.dueDate.toISOString(),
          }),
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
