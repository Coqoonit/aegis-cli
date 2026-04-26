import { defineCommand } from "citty";
import { clearAuth, getRefreshToken } from "../../lib/auth-store.js";
import { apiFetch } from "../../lib/http.js";
import { ApiError } from "../../lib/errors.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "logout",
    description: "Revoke refresh token on server and clear local credentials.",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await apiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
        } catch (err) {
          // Ignore server-side errors — always clear local creds.
          if (!(err instanceof ApiError)) throw err;
        }
      }
      clearAuth();
      emit({ ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
