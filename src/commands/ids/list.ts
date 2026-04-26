import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "list",
    description:
      "List identifications (KYC step 3 records) for a case. Backend returns all records, no pagination.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identifications`,
      );
      emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
