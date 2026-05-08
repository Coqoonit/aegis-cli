import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { RegeneratePatSchema } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "regenerate-pat",
    description:
      "Generate a new Personal Access Token. Atomically revokes the previous PAT (only one active per user). The plain token is returned ONCE — store it securely; it cannot be recovered later.",
  },
  args: {
    name: {
      type: "string",
      description: "Optional human-readable label (e.g. 'macbook-cli')",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const body = RegeneratePatSchema.parse({ name: args.name });
      const res = await apiFetch<unknown>("/auth/me/access-token/regenerate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
