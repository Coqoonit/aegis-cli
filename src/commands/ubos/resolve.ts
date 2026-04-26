import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { ResolveUBOSchema } from "../../schemas/ubo.js";

export default defineCommand({
  meta: {
    name: "resolve",
    description:
      "Automatically resolve UBOs via business registry lookup. Consumes wallet credits. Works for COMPANY clients or when --vat-number is specified.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    "vat-number": {
      type: "string",
      description:
        "Override: VAT number to resolve from (alternative to client's VAT). 11-16 chars.",
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
      const body = ResolveUBOSchema.parse({
        vatNumber: args["vat-number"] || undefined,
      });
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/ubos/resolve`,
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
