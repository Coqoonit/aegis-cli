import { defineCommand } from "citty";
import dossier from "./dossier.js";
import getUrl from "./get-url.js";
import list from "./list.js";
import upload from "./upload.js";

export default defineCommand({
  meta: {
    name: "case-docs",
    description:
      "Case-level document attachments (signed PDFs, reports, dossiers). Separate from identity documents (id-docs). Scoped via --case.",
  },
  subCommands: {
    list,
    upload,
    "get-url": getUrl,
    dossier,
  },
});
