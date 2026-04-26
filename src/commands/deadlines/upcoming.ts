import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "upcoming",
    description:
      "List upcoming deadlines (next N days, configurable server-side).",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const res = await apiFetch<unknown>("/deadlines/upcoming");
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
