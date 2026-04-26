import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "overdue",
    description: "List overdue deadlines (dueDate < today, status != terminal).",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const res = await apiFetch<unknown>("/deadlines/overdue");
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
