import { defineCommand } from "citty";
import { ValidationError } from "../../lib/errors.js";
import { loadFileAsBlob } from "../../lib/file-upload.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UploadCaseDocumentMetaSchema } from "../../schemas/case-document.js";

export default defineCommand({
  meta: {
    name: "upload",
    description:
      "Upload a generic document to a case (multipart/form-data). Use for signed PDFs, screening reports, risk reports, dossiers, or OTHER attachments.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    file: {
      type: "string",
      required: true,
      description: "Path to file (required)",
    },
    category: {
      type: "string",
      description:
        "IDENTIFICATION_FORM | SIGNED_FORM | SCREENING_REPORT | RISK_REPORT | DOSSIER | OTHER (default OTHER)",
    },
    notes: { type: "string", description: "Notes (max 1000 chars)" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const caseId = requireCuid(args.case, "--case");
      if (!args.file) throw new ValidationError("Missing --file <path>");

      const meta = UploadCaseDocumentMetaSchema.parse({
        category: args.category,
        notes: args.notes || undefined,
      });

      const fileInfo = await loadFileAsBlob(args.file);

      const fd = new FormData();
      fd.append("category", meta.category);
      if (meta.notes) fd.append("notes", meta.notes);
      fd.append("file", fileInfo.file);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/documents`,
        {
          method: "POST",
          body: fd,
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
