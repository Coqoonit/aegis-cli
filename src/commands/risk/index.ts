import { defineCommand } from "citty";
import approve from "./approve.js";
import catalog from "./catalog.js";
import create from "./create.js";
import list from "./list.js";
import setLevel from "./set-level.js";
import unapprove from "./unapprove.js";
import update from "./update.js";

export default defineCommand({
  meta: {
    name: "risk",
    description:
      "Risk assessments (CNDCEC RT 2025). Scoped via --case (except `catalog` which is global).",
  },
  subCommands: {
    list,
    create,
    update,
    "set-level": setLevel,
    approve,
    unapprove,
    catalog,
  },
});
