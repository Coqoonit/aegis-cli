import { defineCommand } from "citty";
import complete from "./complete.js";
import create from "./create.js";
import deleteCmd from "./delete.js";
import list from "./list.js";
import pdf from "./pdf.js";
import reset from "./reset.js";
import sign from "./sign.js";

export default defineCommand({
  meta: {
    name: "forms",
    description:
      "CNDCEC forms (modulistica AML). Workflow: create → complete → pdf → upload signed PDF → sign. Scoped via --case.",
  },
  subCommands: {
    list,
    create,
    complete,
    sign,
    reset,
    delete: deleteCmd,
    pdf,
  },
});
