import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { ReviewScreeningResultSchema } from "../../schemas/screening.js";

export default defineCommand({
  meta: {
    name: "review-result",
    description:
      "Review a screening result: set final reviewStatus (CONFIRMED_MATCH | FALSE_POSITIVE | ESCALATED). PENDING_REVIEW is the initial state and not settable.",
  },
  args: {
    "result-id": {
      type: "positional",
      required: true,
      description: "Screening result ID",
    },
    case: { type: "string", required: true, description: "Case ID" },
    screening: {
      type: "string",
      required: true,
      description: "Parent screening ID (--screening <id>)",
    },
    data: {
      type: "string",
      description:
        "Payload as JSON. Required: reviewStatus. Optional: notes (max 5000 chars).",
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
      const screeningId = requireCuid(args.screening, "--screening");
      const resultId = requireCuid(args["result-id"], "<result-id>");

      const raw = await readJsonData(args.data, "data");
      const body = ReviewScreeningResultSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(caseId)}/screenings/${encodeURIComponent(screeningId)}/results/${encodeURIComponent(resultId)}`,
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
