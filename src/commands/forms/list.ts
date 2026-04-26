import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "list",
    description:
      "List CNDCEC forms generated for a case (checklist, istruttoria, dichiarazione cliente, etc).",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/forms`,
      );
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
