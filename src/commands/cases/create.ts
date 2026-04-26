import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { CreateAmlCaseSchema } from "../../schemas/case.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Open a new AML case for an existing client. Body as JSON via --data (string, @file, or --data=- for stdin).",
  },
  args: {
    data: {
      type: "string",
      description:
        "Case payload as JSON. Required fields: clientId, engagementType. Optional: assignedTo, notes.",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const raw = await readJsonData(args.data, "data");
      const body = CreateAmlCaseSchema.parse(raw);

      const res = await apiFetch<unknown>("/aml-cases", {
        method: "POST",
        body: JSON.stringify(body),
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
