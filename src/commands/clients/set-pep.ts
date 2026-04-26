import { defineCommand } from "citty";
import { ValidationError } from "../../lib/errors.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { SetPepFlagsSchema } from "../../schemas/client.js";

function parseBool(value: string | undefined, name: string): boolean {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new ValidationError(`--${name} must be true or false`);
}

export default defineCommand({
  meta: {
    name: "set-pep",
    description:
      "Set PEP (Politically Exposed Person) flags on a client. If --is-pep is false, --is-pep-acting-as-pa is forced to false server-side.",
  },
  args: {
    id: { type: "positional", required: true, description: "Client ID" },
    "is-pep": {
      type: "string",
      required: true,
      description: "true | false — mark client as PEP",
    },
    "is-pep-acting-as-pa": {
      type: "string",
      description:
        "true | false — PEP acting as Public Administration. Ignored if is-pep=false",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const id = requireCuid(args.id, "client ID");

      const body = SetPepFlagsSchema.parse({
        isPep: parseBool(args["is-pep"], "is-pep"),
        isPepActingAsPA:
          args["is-pep-acting-as-pa"] === undefined
            ? undefined
            : parseBool(args["is-pep-acting-as-pa"], "is-pep-acting-as-pa"),
      });

      const res = await apiFetch<unknown>(
        `/clients/${encodeURIComponent(id)}/pep-flags`,
        {
          method: "PUT",
          body: JSON.stringify(body),
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit(res ?? { ok: true }, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
