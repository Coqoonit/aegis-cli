import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";
import { ResetPasswordSchema } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "reset-password",
    description: "Reset password using a token received by email.",
  },
  args: {
    token: { type: "string", description: "Reset token from email" },
    password: { type: "string", description: "New password (min 8 chars)" },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const token = await promptIfMissing(args.token, {
        name: "token",
        message: "Reset token:",
      });
      const password = await promptIfMissing(args.password, {
        name: "password",
        message: "New password:",
        secret: true,
      });
      const body = ResetPasswordSchema.parse({ token, password });
      await apiFetch("/auth/reset-password", {
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
