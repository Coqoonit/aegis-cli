import { defineCommand } from "citty";
import { ValidationError } from "../../lib/errors.js";
import { loadFileAsBlob } from "../../lib/file-upload.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { optionalCuid, requireCuid } from "../../lib/validation.js";
import { UploadIdentityDocumentMetaSchema } from "../../schemas/identity-document.js";

function parseOptBool(value: string | undefined, name: string): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new ValidationError(`--${name} must be true or false`);
}

export default defineCommand({
  meta: {
    name: "upload",
    description:
      "Upload an identity document (multipart/form-data). Attaches to a UBO if --ubo is set, otherwise to the case's client.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    ubo: {
      type: "string",
      description: "UBO ID (if uploading a UBO's document instead of client's)",
    },
    type: {
      type: "string",
      required: true,
      description:
        "CARTA_IDENTITA | PATENTE | PASSAPORTO | PERMESSO_SOGGIORNO | DOCUMENTO_ESTERO",
    },
    file: {
      type: "string",
      required: true,
      description: "Path to front-side file (required)",
    },
    "file-back": { type: "string", description: "Path to back-side file (optional)" },
    "document-number": { type: "string", description: "Document number" },
    "issued-by": { type: "string", description: "Issuing authority" },
    "issued-at": { type: "string", description: "Issue date (ISO 8601)" },
    "expires-at": { type: "string", description: "Expiry date (ISO 8601)" },
    "is-primary": {
      type: "string",
      description: "true | false — mark as primary document",
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
      const uboId = optionalCuid(args.ubo, "--ubo");
      if (!args.file) throw new ValidationError("Missing --file <path>");

      const meta = UploadIdentityDocumentMetaSchema.parse({
        type: args.type,
        documentNumber: args["document-number"] || undefined,
        issuedBy: args["issued-by"] || undefined,
        issuedAt: args["issued-at"] || undefined,
        expiresAt: args["expires-at"] || undefined,
        isPrimary: parseOptBool(args["is-primary"], "is-primary"),
      });

      const front = await loadFileAsBlob(args.file);
      const back = args["file-back"]
        ? await loadFileAsBlob(args["file-back"])
        : undefined;

      const fd = new FormData();
      fd.append("type", meta.type);
      if (meta.documentNumber) fd.append("documentNumber", meta.documentNumber);
      if (meta.issuedBy) fd.append("issuedBy", meta.issuedBy);
      if (meta.issuedAt) fd.append("issuedAt", meta.issuedAt.toISOString());
      if (meta.expiresAt) fd.append("expiresAt", meta.expiresAt.toISOString());
      if (meta.isPrimary !== undefined) {
        fd.append("isPrimary", String(meta.isPrimary));
      }
      fd.append("file", front.file);
      if (back) fd.append("fileBack", back.file);

      const path = uboId
        ? `/aml-cases/${encodeURIComponent(caseId)}/identity-documents/ubos/${encodeURIComponent(uboId)}`
        : `/aml-cases/${encodeURIComponent(caseId)}/identity-documents`;

      const res = await apiFetch<unknown>(path, {
        method: "POST",
        body: fd,
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
