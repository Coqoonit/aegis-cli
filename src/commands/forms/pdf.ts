import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineCommand } from "citty";
import { ValidationError } from "../../lib/errors.js";
import { apiFetchBinary } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";

/** Extract filename from `Content-Disposition: inline; filename="<name>"` */
function parseFilename(contentDisposition: string | undefined): string | undefined {
  if (!contentDisposition) return undefined;
  const match =
    contentDisposition.match(/filename\*?="?([^";]+)"?/i) ??
    contentDisposition.match(/filename=([^;]+)/i);
  return match?.[1]?.replace(/^"|"$/g, "").trim();
}

export default defineCommand({
  meta: {
    name: "pdf",
    description:
      "Generate the PDF for a form and save it to --output. Returns JSON metadata on stdout (the PDF bytes go to the file, not stdout).",
  },
  args: {
    "form-id": {
      type: "positional",
      required: true,
      description: "Form ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    output: {
      type: "string",
      required: true,
      description: "Path where the PDF file will be written",
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
      if (!args.output) throw new ValidationError("Missing --output <path>");
      const outputPath = resolve(args.output);

      const res = await apiFetchBinary(
        `/aml-cases/${encodeURIComponent(caseId)}/forms/${encodeURIComponent(formId)}/pdf`,
        {
          method: "POST",
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );

      if (args["dry-run"]) return;
      if (!res) throw new ValidationError("Empty response from server");

      await writeFile(outputPath, res.buffer);

      emit(
        {
          ok: true,
          path: outputPath,
          bytes: res.buffer.length,
          contentType: res.contentType,
          filename: parseFilename(res.contentDisposition),
        },
        { pretty: args.pretty },
      );
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
