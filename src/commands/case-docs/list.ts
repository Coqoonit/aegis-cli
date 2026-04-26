import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { ListCaseDocumentsQuerySchema } from "../../schemas/case-document.js";

export default defineCommand({
  meta: {
    name: "list",
    description:
      "List case documents (generic file attachments: signed forms, screening reports, dossier, etc).",
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
      const query = ListCaseDocumentsQuerySchema.parse({
        cursor: args.cursor,
        limit: args.limit ?? "100",
      });
      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/documents${qs}`,
      );
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
