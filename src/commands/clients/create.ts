import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { CreateClientSchema } from "../../schemas/client.js";

export default defineCommand({
  meta: {
    name: "create",
    description:
      "Create a new client. Provide the body as JSON via --data (string, @file, or --data=- for stdin).",
  },
  args: {
    data: {
      type: "string",
      description:
        "Client payload as JSON. Examples: --data '{\"type\":\"INDIVIDUAL\",...}', --data @client.json, --data=- (stdin)",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const raw = await readJsonData(args.data, "data");
      const body = CreateClientSchema.parse(raw);

      const res = await apiFetch<unknown>("/clients", {
        method: "POST",
        body: JSON.stringify(body),
        dryRun: args["dry-run"],
        pretty: args.pretty,
      });
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
