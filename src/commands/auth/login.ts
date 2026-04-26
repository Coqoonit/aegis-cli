import { defineCommand } from "citty";
import { setTokens } from "../../lib/auth-store.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";
import { LoginResponseSchema, LoginSchema } from "../../schemas/auth.js";
import type { LoginResponse } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "login",
    description: "Authenticate and store tokens locally.",
  },
  args: {
    email: { type: "string", description: "Email address" },
    password: { type: "string", description: "Password" },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const email = await promptIfMissing(args.email, {
        name: "email",
        message: "Email:",
      });
      const password = await promptIfMissing(args.password, {
        name: "password",
        message: "Password:",
        secret: true,
      });

      const body = LoginSchema.parse({ email, password });

      const res = await apiFetch<LoginResponse>("/auth/login", {
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
