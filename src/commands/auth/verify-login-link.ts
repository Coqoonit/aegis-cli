import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";

export default defineCommand({
  meta: {
    name: "verify-login-link",
    description:
      "Read-only check that a magic-link token is still valid (not used, not expired). Useful for the frontend landing page; consume with `consume-login-link` to actually log in.",
  },
  args: {
    token: { type: "string", description: "Login link token from email" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const token = await promptIfMissing(args.token, {
        name: "token",
        message: "Login link token:",
      });
      const res = await apiFetch<unknown>("/auth/login-link/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
