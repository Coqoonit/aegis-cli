import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "dashboard",
    description:
      "Dashboard summary: combined view of overdue + upcoming + stats. Optimized for UI landing pages.",
  },
  args: {
    limit: { type: "string", description: "Max items per section (default 20)" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const qs = buildQueryString({ limit: args.limit });
      const res = await apiFetch<unknown>(`/deadlines/dashboard${qs}`);
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
