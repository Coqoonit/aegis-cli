import { defineCommand } from "citty";
import alerts from "./alerts.js";
import getUrl from "./get-url.js";
import list from "./list.js";
import update from "./update.js";
import upload from "./upload.js";

export default defineCommand({
  meta: {
    name: "id-docs",
    description:
      "Manage identity documents (ID card, passport, etc) attached to clients and UBOs. Scoped via --case.",
  },
  subCommands: {
    list,
    update,
    "get-url": getUrl,
    upload,
    alerts,
  },
});
