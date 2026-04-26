import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "stats",
    description:
      "Return aggregate counts of deadlines by status (UPCOMING, OVERDUE, COMPLETED, DISMISSED).",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const res = await apiFetch<unknown>("/deadlines/stats");
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
