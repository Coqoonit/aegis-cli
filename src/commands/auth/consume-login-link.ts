import { defineCommand } from "citty";
import { setTokens } from "../../lib/auth-store.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";
import {
  ConsumeLoginLinkSchema,
  LoginResponseSchema,
} from "../../schemas/auth.js";
import type { LoginResponse } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "consume-login-link",
    description:
      "Consume a magic-link token and store auth tokens locally. Single-use: the same token cannot be redeemed twice.",
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

      const body = ConsumeLoginLinkSchema.parse({ token });

      const res = await apiFetch<LoginResponse>("/auth/login-link/consume", {
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
