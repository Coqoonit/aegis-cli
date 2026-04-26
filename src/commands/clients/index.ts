import { defineCommand } from "citty";
import archive from "./archive.js";
import create from "./create.js";
import get from "./get.js";
import list from "./list.js";
import setPep from "./set-pep.js";
import update from "./update.js";

export default defineCommand({
  meta: {
    name: "clients",
    description: "Manage clients (natural persons and legal entities).",
  },
  subCommands: {
    list,
    get,
    create,
    update,
    archive,
    "set-pep": setPep,
  },
});
