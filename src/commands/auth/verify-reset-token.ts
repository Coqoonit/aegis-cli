import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";

export default defineCommand({
  meta: {
    name: "verify-reset-token",
    description: "Check whether a password reset token is still valid.",
  },
  args: {
    token: { type: "string", description: "Reset token from email" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const token = await promptIfMissing(args.token, {
        name: "token",
        message: "Reset token:",
      });
      const res = await apiFetch<unknown>(
        `/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
      );
      emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
