import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";

export default defineCommand({
  meta: {
    name: "show-pat",
    description:
      "Show metadata of the active Personal Access Token (createdAt, lastUsedAt, name). Never returns the plain token — that is shown only at regeneration time.",
  },
  args: {
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const res = await apiFetch<unknown>("/auth/me/access-token");
      emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
