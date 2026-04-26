import { defineCommand } from "citty";
import { buildQueryString } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { GetIdentityDocumentUrlQuerySchema } from "../../schemas/identity-document.js";

export default defineCommand({
  meta: {
    name: "get-url",
    description:
      "Get a signed S3 URL to download an identity document. Default side=front.",
  },
  args: {
    "doc-id": {
      type: "positional",
      required: true,
      description: "Identity document ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    side: { type: "string", description: "front | back (default front)" },
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
      const query = GetIdentityDocumentUrlQuerySchema.parse({
        side: args.side || "front",
      });
      const qs = buildQueryString({ ...query });
      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identity-documents/${encodeURIComponent(docId)}/url${qs}`,
        { dryRun: args["dry-run"], pretty: args.pretty },
      );
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
