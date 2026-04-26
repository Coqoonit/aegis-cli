import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UpdateClientSchema } from "../../schemas/client.js";

export default defineCommand({
  meta: {
    name: "update",
    description:
      "Update a client (partial). Body provided as JSON via --data. Only included fields are changed.",
  },
  args: {
    id: { type: "positional", required: true, description: "Client ID" },
    data: {
      type: "string",
      description:
        "Partial update payload as JSON. Example: --data '{\"email\":\"new@example.com\"}', --data @update.json, --data=- (stdin)",
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
      const raw = await readJsonData(args.data, "data");
      const body = UpdateClientSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/clients/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
          dryRun: args["dry-run"],
          pretty: args.pretty,
        },
      );
      if (!args["dry-run"]) emit(res, { pretty: args.pretty });
    } catch (err) {
      handleError(err, { pretty: args.pretty });
    }
  },
});
