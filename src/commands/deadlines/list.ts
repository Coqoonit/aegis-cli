import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { ListDeadlinesQuerySchema } from "../../schemas/deadline.js";

export default defineCommand({
  meta: {
    name: "list",
    description:
      "List deadlines (offset pagination). By default excludes COMPLETED and DISMISSED — pass --include-closed or a specific --status to see them.",
  },
  args: {
    status: {
      type: "string",
      description: "UPCOMING | OVERDUE | COMPLETED | DISMISSED",
    },
    type: {
      type: "string",
      description:
        "RISK_REVIEW | VERIFICATION_RENEWAL | CASE_EXPIRY | DOCUMENT_EXPIRY | CUSTOM",
    },
    "assigned-to": { type: "string", description: "Filter by user ID" },
    "aml-case-id": { type: "string", description: "Filter by case ID" },
    "due-before": {
      type: "string",
      description: "ISO date — deadlines due before this date",
    },
    search: { type: "string", description: "Full-text search (min 1 char)" },
    "sort-by": {
      type: "string",
      description: "type | caseClient | dueDate | status | assignee",
    },
    "sort-dir": { type: "string", description: "asc | desc" },
    page: { type: "string", description: "Page number (1-based, default 1)" },
    limit: { type: "string", description: "Page size (1-100, default 20)" },
    "include-closed": {
      type: "string",
      description: "true | false — include COMPLETED and DISMISSED",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const query = ListDeadlinesQuerySchema.parse({
        status: args.status,
        type: args.type,
        assignedTo: args["assigned-to"],
        amlCaseId: args["aml-case-id"],
        dueBefore: args["due-before"],
        search: args.search,
        sortBy: args["sort-by"],
        sortDir: args["sort-dir"],
        page: args.page,
        limit: args.limit,
        includeClosed: args["include-closed"],
      });
      const serializable: Record<string, string | number | boolean | undefined> = {
        ...query,
        dueBefore: query.dueBefore ? query.dueBefore.toISOString() : undefined,
      };
      const qs = buildQueryString(serializable);
      const res = await apiFetch<unknown>(`/deadlines${qs}`);
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
