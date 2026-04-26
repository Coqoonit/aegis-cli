import { defineCommand } from "citty";
import create from "./create.js";
import deleteCmd from "./delete.js";
import deleteAll from "./delete-all.js";
import list from "./list.js";
import manual from "./manual.js";
import reviewResult from "./review-result.js";
import runFull from "./run-full.js";

export default defineCommand({
  meta: {
    name: "screenings",
    description:
      "AML screenings (PEP, sanctions, adverse media) against third-party providers or manual. Scoped via --case.",
  },
  subCommands: {
    list,
    create,
    "run-full": runFull,
    manual,
    "review-result": reviewResult,
    "delete-all": deleteAll,
    delete: deleteCmd,
  },
});
