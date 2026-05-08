import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "revoke-pat",
    description:
      "Revoke the active Personal Access Token. Idempotent: succeeds even if no PAT is set. Existing JWT/refresh sessions are NOT affected — they expire normally.",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      await apiFetch("/auth/me/access-token", { method: "DELETE" });
      emit({ ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
