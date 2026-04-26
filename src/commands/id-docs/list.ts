import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { ListIdentityDocumentsQuerySchema } from "../../schemas/identity-document.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List identity documents uploaded to a case.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    cursor: { type: "string", description: "Pagination cursor" },
    limit: { type: "string", description: "Page size (1-100, default 100)" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const query = ListIdentityDocumentsQuerySchema.parse({
        cursor: args.cursor,
        limit: args.limit ?? "100",
      });
      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identity-documents${qs}`,
      );
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
