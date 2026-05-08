import { defineCommand } from "citty";
import { setTokens } from "../../lib/auth-store.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";
import {
  ExchangePatSchema,
  LoginResponseSchema,
} from "../../schemas/auth.js";
import type { LoginResponse } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "use-pat",
    description:
      "Authenticate with a Personal Access Token (passwordless CLI flow). Exchanges the PAT for a JWT + refresh token pair and stores them locally — subsequent commands operate as a normal authenticated session.",
  },
  args: {
    token: {
      type: "string",
      description: "Plain PAT (aegis_pat_*) issued via /auth/me/access-token/regenerate or the web UI",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const token = await promptIfMissing(args.token, {
        name: "token",
        message: "Personal Access Token:",
        secret: true,
      });

      const body = ExchangePatSchema.parse({ token });

      const res = await apiFetch<LoginResponse>("/auth/access-token/exchange", {
        method: "POST",
        body: JSON.stringify(body),
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
          user: {
            id: parsed.user.id,
            email: parsed.user.email,
            firstName: parsed.user.firstName,
            lastName: parsed.user.lastName,
            tenantId: parsed.user.tenantId,
            roles: parsed.user.roles,
          },
        },
        { pretty: args.pretty },
      );
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
