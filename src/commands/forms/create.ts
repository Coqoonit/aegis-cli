import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { CreateCaseFormSchema } from "../../schemas/case-form.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Create a CNDCEC form on a case. Starts in DRAFT. Types: FASCICOLO_CHECKLIST, ISTRUTTORIA, DICHIARAZIONE_CLIENTE, CONTROLLO_COSTANTE, ASTENSIONE, SEGNALAZIONE_CONTANTE, DELEGA, COMUNICAZIONE_MEF.",
  },
  args: {
    case: { type: "string", required: true, description: "Case ID" },
    data: {
      type: "string",
      description:
        'Payload as JSON. Required: type. Optional: data (form payload object), notes. Example: --data \'{"type":"ISTRUTTORIA","data":{}}\'',
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
      const raw = await readJsonData(args.data, "data");
      const body = CreateCaseFormSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/forms`,
        {
          method: "POST",
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
