import { spawn } from "node:child_process";
import { defineCommand, type CommandDef } from "citty";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { META_COMMANDS, walkCommandTree } from "../lib/manifest.js";
import {
  buildDispatchSpecs,
  inputToCliArgs,
  type DispatchSpec,
} from "../lib/tool-spec.js";
import { BODY_SCHEMAS, OPTIONAL_BODY_COMMANDS } from "../schema-registry.js";

type MainFactory = () => CommandDef;

interface ChildResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Spawn the same CLI entry point as a child process to execute one tool call.
 * Isolates each call's process state and lets `handleError → process.exit`
 * propagate as a non-zero exit code without killing the MCP server.
 *
 * Forwards `process.execArgv` so dev-time loaders (e.g. `--import tsx`,
 * `--experimental-vm-modules`) survive into the child. Without this, running
 * the MCP server through `tsx src/index.ts mcp` would spawn a plain `node`
 * child that cannot resolve `.ts` imports.
 */
function runChild(args: string[]): Promise<ChildResult> {
  return new Promise((resolve, reject) => {
    const entry = process.argv[1];
    if (!entry) {
      reject(new Error("Cannot determine CLI entry script (process.argv[1] missing)"));
      return;
    }
    const child = spawn(
      process.execPath,
      [...process.execArgv, entry, ...args],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b: Buffer) => {
      stdout += b.toString();
    });
    child.stderr.on("data", (b: Buffer) => {
      stderr += b.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

export function defineMcpCommand(mainFactory: MainFactory) {
  return defineCommand({
    meta: {
      name: "mcp",
      description:
        'Run as an MCP (Model Context Protocol) stdio server. Exposes every aegis command as an MCP tool. Configure in Claude Desktop with: { "mcpServers": { "aegis": { "command": "aegis", "args": ["mcp"] } } }',
    },
    async run() {
      const root = mainFactory();

      const tools = walkCommandTree(
        root,
        BODY_SCHEMAS,
        OPTIONAL_BODY_COMMANDS,
      ).filter((t) => !META_COMMANDS.has(t.path[0]!));

      const specs = new Map<string, DispatchSpec>();
      for (const s of buildDispatchSpecs(root, BODY_SCHEMAS)) {
        if (META_COMMANDS.has(s.path[0]!)) continue;
        specs.set(s.name, s);
      }

      const meta = root.meta as { version?: string; name?: string } | undefined;
      const server = new Server(
        {
          name: meta?.name ?? "aegis",
          version: meta?.version ?? "0.0.0",
        },
        { capabilities: { tools: {} } },
      );

      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      }));

      server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const { name, arguments: input } = req.params;
        const spec = specs.get(name);
        if (!spec) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "UnknownTool",
                  message: `Tool ${name} is not registered`,
                }),
              },
            ],
            isError: true,
          };
        }

        const argv = inputToCliArgs(input ?? {}, spec);

        try {
          const result = await runChild(argv);
          // The CLI writes structured JSON to stdout on success and to stderr
          // on error (envelope with `error`, `message`, `code`, `hint`).
          // Forward whichever stream produced output; preserve exit semantics.
          const text =
            result.code === 0
              ? result.stdout || result.stderr || ""
              : result.stderr || result.stdout || `exit code ${result.code}`;
          return {
            content: [{ type: "text" as const, text }],
            isError: result.code !== 0,
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "SpawnError",
                  message: err instanceof Error ? err.message : String(err),
                }),
              },
            ],
            isError: true,
          };
        }
      });

      const transport = new StdioServerTransport();
      await server.connect(transport);
      // Keep the process alive — Server.connect resolves once the transport is
      // wired but the event loop must stay open for stdio messages.
    },
  });
}
