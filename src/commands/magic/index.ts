import { defineCommand } from "citty";
import create from "./create.js";
import deleteCmd from "./delete.js";
import list from "./list.js";

export default defineCommand({
  meta: {
    name: "magic",
    description:
      "Magic links: one-time URLs that let external users (UBOs, clients) fill a form without logging in. Authenticated endpoints only — the public submit endpoint is out of CLI scope.",
  },
  subCommands: {
    list,
    create,
    delete: deleteCmd,
  },
});
