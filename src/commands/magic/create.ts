import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { CreateMagicLinkSchema } from "../../schemas/magic-link.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Create a magic link to let an external user (e.g. UBO) fill a form without logging in. Returns the URL to share. Default expiry 72h, max 720h (30 days).",
  },
  args: {
    data: {
      type: "string",
      description:
        'Payload as JSON. Required: amlCaseId, formType. Optional: uboId, targetEmail, targetName, expiryHours (1-720). Example: --data \'{"amlCaseId":"c...","formType":"DICHIARAZIONE_CLIENTE","targetEmail":"c@r.it","expiryHours":72}\'',
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const raw = await readJsonData(args.data, "data");
      const body = CreateMagicLinkSchema.parse(raw);

      const res = await apiFetch<unknown>("/magic-links", {
        method: "POST",
        body: JSON.stringify(body),
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
