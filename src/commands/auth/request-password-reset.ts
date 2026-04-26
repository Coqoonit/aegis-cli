import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";
import { RequestPasswordResetSchema } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "request-password-reset",
    description: "Send a password reset email.",
  },
  args: {
    email: { type: "string", description: "Email address" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const email = await promptIfMissing(args.email, {
        name: "email",
        message: "Email:",
      });
      const body = RequestPasswordResetSchema.parse({ email });
      await apiFetch("/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify(body),
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit({ ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
