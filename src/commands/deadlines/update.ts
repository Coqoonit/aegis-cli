import { defineCommand } from "citty";
import { readJsonData } from "../../lib/data-input.js";
import { apiFetch } from "../../lib/http.js";
import { emit, handleError } from "../../lib/output.js";
import { requireCuid } from "../../lib/validation.js";
import { UpdateDeadlineSchema } from "../../schemas/deadline.js";

export default defineCommand({
  meta: {
    name: "update",
    description:
      "Update a deadline (status, assignedTo, notes). Common use: mark COMPLETED when the action is done, or DISMISSED if no longer relevant.",
  },
  args: {
    "deadline-id": {
      type: "positional",
      required: true,
      description: "Deadline ID",
    },
    data: {
      type: "string",
      description:
        'Partial update payload as JSON. Fields: status (UPCOMING|OVERDUE|COMPLETED|DISMISSED), assignedTo (user ID or null), notes.',
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the request without sending it",
    },
    pretty: { type: "boolean", description: "Pretty-print JSON output" },
  },
  async run({ args }) {
    try {
      const deadlineId = requireCuid(args["deadline-id"], "<deadline-id>");
      const raw = await readJsonData(args.data, "data");
      const body = UpdateDeadlineSchema.parse(raw);

      const res = await apiFetch<unknown>(
        `/deadlines/${encodeURIComponent(deadlineId)}`,
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
