import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { ListIdentityDocumentAlertsQuerySchema } from "../../schemas/identity-document.js";

export default defineCommand({
  meta: {
    name: "alerts",
    description:
      "List identity-document expiry alerts across all cases (documents expiring or already expired).",
  },
  args: {
    limit: { type: "string", description: "Page size (1-100, default 20)" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const query = ListIdentityDocumentAlertsQuerySchema.parse({
        limit: args.limit ?? "20",
      });
      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(`/identity-documents/alerts${qs}`, {
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
