import { defineCommand } from "citty";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { promptIfMissing } from "../../lib/prompt.js";
import { InviteUserSchema } from "../../schemas/auth.js";

export default defineCommand({
  meta: {
    name: "invite",
    description: "Invite a new user into the current tenant (admin only).",
  },
  args: {
    email: { type: "string", description: "Invitee email" },
    "first-name": { type: "string", description: "First name" },
    "last-name": { type: "string", description: "Last name" },
    "role-id": {
      type: "string",
      description: "Role ID to assign (optional)",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const email = await promptIfMissing(args.email, {
        name: "email",
        message: "Email:",
      });
      const firstName = await promptIfMissing(args["first-name"], {
        name: "first-name",
        message: "First name:",
      });
      const lastName = await promptIfMissing(args["last-name"], {
        name: "last-name",
        message: "Last name:",
      });

      const body = InviteUserSchema.parse({
        email,
        firstName,
        lastName,
        roleId: args["role-id"] || undefined,
      });

      const res = await apiFetch<unknown>("/auth/invite", {
        method: "POST",
        body: JSON.stringify(body),
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
