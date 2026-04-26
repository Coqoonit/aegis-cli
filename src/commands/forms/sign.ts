import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { SignCaseFormSchema } from "../../schemas/case-form.js";

export default defineCommand({
  meta: {
    name: "sign",
    description:
      "Mark a form as SIGNED with proof: link to an existing case document (the signed PDF upload). Transitions COMPLETED → SIGNED.",
  },
  args: {
    "form-id": {
      type: "positional",
      required: true,
      description: "Form ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    "signed-document-id": {
      type: "string",
      required: true,
      description:
        "ID of the uploaded signed-PDF case document (upload first via `case-docs upload`).",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      const formId = requireCuid(args["form-id"], "<form-id>");
      const signedDocumentId = requireCuid(
        args["signed-document-id"],
        "--signed-document-id",
      );
      const body = SignCaseFormSchema.parse({ signedDocumentId });

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/forms/${encodeURIComponent(formId)}/sign`,
        {
          method: "POST",
          body: JSON.stringify(body),
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
