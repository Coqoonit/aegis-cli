import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UpdateIdentityDocumentSchema } from "../../schemas/identity-document.js";

export default defineCommand({
  meta: {
    name: "update",
    description:
      "Update identity document metadata (type, documentNumber, issuedBy, issuedAt, expiresAt, isPrimary).",
  },
  args: {
    "doc-id": {
      type: "positional",
      required: true,
      description: "Identity document ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    data: { type: "string", description: "Partial update payload as JSON" },
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
      const raw = await readJsonData(args.data, "data");
      const body = UpdateIdentityDocumentSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/identity-documents/${encodeURIComponent(docId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
