import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { AcceptTermsSchema } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "accept-terms",
    description:
      "Accept the Aegis Privacy Policy (and optionally marketing consent). Required before authenticated requests can proceed: backend gates all routes outside a small allowlist with 403 PRIVACY_CONSENT_REQUIRED until this is called. Idempotent — re-running only updates the marketing flag.",
  },
  args: {
    marketing: {
      type: "boolean",
      description:
        "Also opt in to marketing communications (default: no consent). Privacy acceptance is always required and implicit.",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const body = AcceptTermsSchema.parse({
        privacyAccepted: true,
        marketingConsent: args.marketing === true,
      });
      const res = await apiFetch<unknown>("/auth/me/accept-terms", {
        method: "POST",
        body: JSON.stringify(body),
      });
      emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
