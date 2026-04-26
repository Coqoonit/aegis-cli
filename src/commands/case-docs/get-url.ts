import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

export default defineCommand({
  meta: {
    name: "get-url",
    description:
      "Get a signed S3 URL to download a case document.",
  },
  args: {
    "doc-id": {
      type: "positional",
      required: true,
      description: "Case document ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const docId = requireCuid(args["doc-id"], "<doc-id>");
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/url`,
        { dryRun: args["dry-run"], pretty: args.pretty },
      );
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
