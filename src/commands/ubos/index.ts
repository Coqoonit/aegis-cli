import { defineCommand } from "citty";
import create from "./create.js";
import deleteCmd from "./delete.js";
import list from "./list.js";
import resolve from "./resolve.js";

export default defineCommand({
  meta: {
    name: "ubos",
    description:
      "Manage Ultimate Beneficial Owners of a case (scoped via --case).",
  },
  subCommands: {
    list,
    create,
    resolve,
    delete: deleteCmd,
  },
});
