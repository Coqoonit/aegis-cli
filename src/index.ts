#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand, runMain, type CommandDef } from "citty";
import auth from "./commands/auth/index.js";
import caseDocs from "./commands/case-docs/index.js";
import cases from "./commands/cases/index.js";
import clients from "./commands/clients/index.js";
import deadlines from "./commands/deadlines/index.js";
import forms from "./commands/forms/index.js";
import idDocs from "./commands/id-docs/index.js";
import ids from "./commands/ids/index.js";
import magic from "./commands/magic/index.js";
import { defineCompletionsCommand } from "./commands/completions.js";
import docs from "./commands/docs.js";
import { defineMcpCommand } from "./commands/mcp.js";
import risk from "./commands/risk/index.js";
import { defineSchemaCommand } from "./commands/schema.js";
import screenings from "./commands/screenings/index.js";
import ubos from "./commands/ubos/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
) as { version: string; description: string };

const domainCommands = {
  auth,
  clients,
  cases,
  ubos,
  ids,
  "id-docs": idDocs,
  screenings,
  risk,
  forms,
  "case-docs": caseDocs,
  magic,
  deadlines,
};

const main: CommandDef = defineCommand({
  meta: {
    name: "aegis",
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    ...domainCommands,
    schema: defineSchemaCommand(() => main),
    docs,
    completions: defineCompletionsCommand(() => main),
    mcp: defineMcpCommand(() => main),
  },
});

runMain(main);
