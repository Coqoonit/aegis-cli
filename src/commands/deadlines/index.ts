import { defineCommand } from "citty";
import create from "./create.js";
import dashboard from "./dashboard.js";
import deleteCmd from "./delete.js";
import list from "./list.js";
import overdue from "./overdue.js";
import stats from "./stats.js";
import upcoming from "./upcoming.js";
import update from "./update.js";

export default defineCommand({
  meta: {
    name: "deadlines",
    description:
      "Deadlines across all cases in the tenant. Mix of system-generated (RISK_REVIEW, VERIFICATION_RENEWAL, CASE_EXPIRY, DOCUMENT_EXPIRY) and user-created (CUSTOM).",
  },
  subCommands: {
    list,
    stats,
    overdue,
    upcoming,
    dashboard,
    create,
    update,
    delete: deleteCmd,
  },
});
