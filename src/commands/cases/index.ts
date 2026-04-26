import { defineCommand } from "citty";
import approve from "./approve.js";
import create from "./create.js";
import deleteCmd from "./delete.js";
import get from "./get.js";
import list from "./list.js";
import setRiskFlags from "./set-risk-flags.js";
import update from "./update.js";

export default defineCommand({
  meta: {
    name: "cases",
    description: "Manage AML cases (fascicoli di adeguata verifica).",
  },
  subCommands: {
    list,
    get,
    create,
    update,
    approve,
    delete: deleteCmd,
    "set-risk-flags": setRiskFlags,
  },
});
