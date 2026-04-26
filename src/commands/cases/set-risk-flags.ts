import { defineCommand } from "citty";
import { ValidationError } from "../../lib/errors.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { SetCaseRiskFlagsSchema } from "../../schemas/case.js";

function parseOptBool(value: string | undefined, name: string): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new ValidationError(`--${name} must be true or false`);
}

export default defineCommand({
  meta: {
    name: "set-risk-flags",
    description:
      "Set preliminary risk-assessment flags on a case (skipSectionB, involvesHighRiskThirdCountry, isTab1RT2Service). At least one flag required. Triggers risk score recalculation.",
  },
  args: {
    id: { type: "positional", required: true, description: "Case ID" },
    "skip-section-b": {
      type: "string",
      description:
        "true | false — skip CNDCEC Section B (for conduct-rules engagements)",
    },
    "involves-high-risk-third-country": {
      type: "string",
      description: "true | false — operation involves high-risk third country",
    },
    "is-tab1-rt2-service": {
      type: "string",
      description: "true | false — service listed in Tab.1 RT2",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const id = requireCuid(args.id, "case ID");

      const input: Record<string, boolean> = {};
      const skip = parseOptBool(args["skip-section-b"], "skip-section-b");
      if (skip !== undefined) input.skipSectionB = skip;
      const highRisk = parseOptBool(
        args["involves-high-risk-third-country"],
        "involves-high-risk-third-country",
      );
      if (highRisk !== undefined) input.involvesHighRiskThirdCountry = highRisk;
      const tab1 = parseOptBool(
        args["is-tab1-rt2-service"],
        "is-tab1-rt2-service",
      );
      if (tab1 !== undefined) input.isTab1RT2Service = tab1;

      const body = SetCaseRiskFlagsSchema.parse(input);

      const res = await apiFetch<unknown>(
        `/aml-cases/${encodeURIComponent(id)}/risk-flags`,
        {
          method: "PUT",
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
