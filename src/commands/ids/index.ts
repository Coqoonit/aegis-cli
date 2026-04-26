import { defineCommand } from "citty";
import complete from "./complete.js";
import create from "./create.js";
import list from "./list.js";
import reopen from "./reopen.js";
import update from "./update.js";

export default defineCommand({
  meta: {
    name: "ids",
    description:
      "Manage identifications (KYC step 3: record of how a client/UBO was identified). Scoped via --case.",
  },
  subCommands: {
    list,
    create,
    update,
    complete,
    reopen,
  },
});
