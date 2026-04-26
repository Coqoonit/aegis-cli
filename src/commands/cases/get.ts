import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "get",
    description: "Fetch a single AML case by ID.",
  },
  args: {
    id: { type: "positional", required: true, description: "Case ID" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const id = requireCuid(args.id, "case ID");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(id)}`,
      );
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
