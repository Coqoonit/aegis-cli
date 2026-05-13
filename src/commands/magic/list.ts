import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List magic links for a case. Returns metadata only — the plain token is shown once at creation and never returned again (hashed at rest). To re-share a link, use `magic create` to issue a new one.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const res = await apiFetch<unknown>(
        `/magic-links/case/${encodeURIComponent(caseId)}`,
      );
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
