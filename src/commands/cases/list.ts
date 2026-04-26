import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { ListAmlCasesQuerySchema } from "../../schemas/case.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List AML cases with optional filters and cursor pagination.",
  },
  args: {
    "client-id": { type: "string", description: "Filter by client id" },
    status: {
      type: "string",
      description: "DRAFT | COMPLETED | APPROVED | EXPIRED | ARCHIVED",
    },
    "risk-level": {
      type: "string",
      description:
        "NON_SIGNIFICATIVO | POCO_SIGNIFICATIVO | ABBASTANZA_SIGNIFICATIVO | MOLTO_SIGNIFICATIVO",
    },
    search: { type: "string", description: "Full-text search (min 2 chars)" },
    "sort-by": {
      type: "string",
      description:
        "client | engagement | status | risk | nextReview | lastUpdated",
    },
    "sort-dir": { type: "string", description: "asc | desc" },
    cursor: { type: "string", description: "Pagination cursor" },
    limit: { type: "string", description: "Page size (1-100, default 20)" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const query = ListAmlCasesQuerySchema.parse({
        clientId: args["client-id"],
        status: args.status,
        riskLevel: args["risk-level"],
        search: args.search,
        sortBy: args["sort-by"],
        sortDir: args["sort-dir"],
        cursor: args.cursor,
        limit: args.limit ? Number(args.limit) : undefined,
      });
      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(`/aml-cases${qs}`);
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
