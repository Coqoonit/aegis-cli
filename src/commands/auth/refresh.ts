import { defineCommand } from "citty";
import { getRefreshToken, setTokens } from "../../lib/auth-store.js";
import { AuthMissingError } from "../../lib/errors.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { LoginResponseSchema } from "../../schemas/auth.js";
import type { LoginResponse } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "refresh",
    description:
      "Manually refresh access token using the stored refresh token. (Automatic refresh happens on 401.)",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new AuthMissingError();

      const res = await apiFetch<LoginResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      const parsed = LoginResponseSchema.parse(res);

      setTokens(parsed.tokens.accessToken, parsed.tokens.refreshToken, {
        id: parsed.user.id,
        email: parsed.user.email,
        firstName: parsed.user.firstName ?? undefined,
        lastName: parsed.user.lastName ?? undefined,
        tenantId: parsed.user.tenantId,
      });

      emit(
        {
          ok: true,
          expiresIn: parsed.tokens.expiresIn,
          user: { id: parsed.user.id, email: parsed.user.email },
        },
        { pretty: args.pretty },
      );
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
