import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { RiskCatalogQuerySchema } from "../../schemas/risk-assessment.js";

export default defineCommand({
  meta: {
    name: "catalog",
    description:
      "Fetch the risk factor catalog (categories, definitions, levels) from CNDCEC RT 2025. If --version-id is omitted, returns the currently active version.",
  },
  args: {
    "version-id": {
      type: "string",
      description: "Specific catalog version ID (default: active version)",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const query = RiskCatalogQuerySchema.parse({
        versionId: args["version-id"],
      });
      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(`/risk-catalog${qs}`, {
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
