import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { ListClientsQuerySchema } from "../../schemas/client.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List clients with optional filters and cursor pagination.",
  },
  args: {
    search: { type: "string", description: "Full-text search (min 2 chars)" },
    type: { type: "string", description: "INDIVIDUAL | COMPANY" },
    status: { type: "string", description: "ACTIVE | ARCHIVED | SUSPENDED" },
    "risk-level": {
      type: "string",
      description:
        "NON_SIGNIFICATIVO | POCO_SIGNIFICATIVO | ABBASTANZA_SIGNIFICATIVO | MOLTO_SIGNIFICATIVO",
    },
    "group-id": { type: "string", description: "Filter by group id" },
    "sort-by": {
      type: "string",
      description: "name | taxCode | type | risk | nextReview | status",
    },
    "sort-dir": { type: "string", description: "asc | desc" },
    cursor: { type: "string", description: "Pagination cursor" },
    limit: { type: "string", description: "Page size (1-100, default 20)" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const query = ListClientsQuerySchema.parse({
        search: args.search,
        type: args.type,
        status: args.status,
        riskLevel: args["risk-level"],
        groupId: args["group-id"],
        sortBy: args["sort-by"],
        sortDir: args["sort-dir"],
        cursor: args.cursor,
        limit: args.limit ? Number(args.limit) : undefined,
      });

      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(`/clients${qs}`);
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
