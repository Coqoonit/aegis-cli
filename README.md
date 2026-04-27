# aegis-cli

Command-line interface for the **Aegis AML API**, designed first and foremost as a **tool layer for primary LLMs** (Claude, GPT-4, Gemini). One command emits a full tool manifest; another emits the user manual. Plug both into your model and the assistant can drive the entire AML workflow without you writing glue code.

> **Status**: under active development. Not yet published to npm. The 71 endpoints used by the Aegis web frontend are mapped 1:1.

---

## Why

Existing AML tooling assumes a human in front of a UI. If you want an agent to "open a case for Mario Rossi, run a full screening on the UBOs, and send the dichiarazione cliente to the company secretary", you need:

- A predictable interface (one command per API endpoint, no hidden side effects)
- Machine-readable schemas (the LLM has to know what to send)
- Workflow context (what comes before what, what consumes credits, what's destructive)

`aegis-cli` is exactly that — and nothing more.

---

## Features

- **71 endpoints** mapped, grouped in 12 domains (clients, cases, UBOs, identifications, identity-docs, screenings, risk, forms, case-docs, magic-links, deadlines, auth)
- **Tool manifest emitter** — `aegis schema --format anthropic|openai|raw` outputs ready-to-use JSON for Claude API or OpenAI function calling, with `x_aegis` workflow hints (prerequisites, follow-up steps, safety, credit consumption)
- **Self-documenting** — `aegis docs` prints a complete manual with domain glossary, 7 worked workflows, and 10 LLM safety rules
- **Strict input validation** — every request body and ID is validated with Zod schemas before hitting the network (CUID format, enums, refines)
- **Silent JWT refresh** with mutex on 401, just like the web client
- **Idempotency-aware retries** — 429/503 retried on GET/PUT/DELETE only, never on POST/PATCH
- **Dry-run mode** on every write command — preview the exact HTTP request before sending
- **TTY-aware safety** — destructive commands require `--yes` in non-interactive contexts
- **Structured JSON output** — stdout is pure JSON (compact by default, `--pretty` for humans), errors on stderr with exit codes
- **Concurrency limit** per process (default 1) and request timeout, both configurable via env

---

## Installation

Requires **Node.js 22+**.

```bash
# From a clone, while developing
git clone <repo-url>
cd cli
pnpm install
pnpm build
npm link        # makes `aegis` available globally
```

When published to npm:

```bash
npm install -g aegis-cli
```

---

## Quick start

```bash
# 1. Authenticate against your Aegis tenant
aegis auth login --email you@example.it
# (prompts for password if not provided)

# 2. List your clients
aegis clients list --limit 5 --pretty

# 3. Open a new case
aegis cases create --data '{
  "clientId": "c_abc...",
  "engagementType": "ASSISTENZA_TRIBUTARIA"
}'

# 4. Explore
aegis --help
aegis docs                    # full manual
aegis schema --format anthropic --pretty | head -40
```

---

## Use with an LLM

### Claude (Anthropic API)

```python
import anthropic, subprocess, json

tools  = json.loads(subprocess.check_output(["aegis", "schema", "--format", "anthropic"]))
manual = subprocess.check_output(["aegis", "docs"]).decode()

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-opus-4-7",
    system=manual,                     # full manual as system prompt
    tools=tools,                       # 70 tool definitions ready to call
    messages=[{"role": "user", "content": "List PEP-flagged clients and show their open cases."}],
)
# Your runtime executes each tool_use block as `subprocess.run(["aegis", ...])`
# and feeds the tool_result back to the model.
```

### OpenAI

Same pattern, just swap the format:

```python
tools = json.loads(subprocess.check_output(["aegis", "schema", "--format", "openai"]))
# tools is now `[{"type":"function","function":{...}}, ...]`, drop into client.chat.completions.create()
```

### Shell-capable agents (Cursor, Claude Code, etc.)

Add the following to your project's `CLAUDE.md` / `AGENTS.md`:

```markdown
## Aegis CLI
To interact with Aegis, use the `aegis` command:
- Discovery: `aegis schema --format anthropic` (JSON tools) or `aegis docs` (manual)
- Per-command help: `aegis <cmd> --help`
- Default API: `http://localhost:3000` (override via `AEGIS_API_URL`)
```

The agent will discover everything else by running `aegis docs` itself.

### Claude Desktop / any MCP client

The CLI ships with an embedded MCP (Model Context Protocol) server. After
`aegis auth login`, drop this into your MCP client config (Claude Desktop:
`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aegis": {
      "command": "aegis",
      "args": ["mcp"]
    }
  }
}
```

Restart the client. Every aegis command (70+) shows up as a native tool — no
shell access needed, no manifest copy/paste, no integration code. The server
shares the same `~/Library/Preferences/aegis/config.json` as the CLI, so login
state is unified.

Pass `AEGIS_API_URL` (and any other env var) by adding an `"env"` block to the
config above.

---

## Domain coverage

| Domain | Commands | Notes |
|---|---|---|
| `auth` | login, logout, refresh, request-password-reset, reset-password, verify-reset-token, invite | JWT + silent refresh |
| `clients` | list, get, create, update, archive, set-pep | Natural persons and legal entities |
| `cases` | list, get, create, update, approve, delete, set-risk-flags | AML "fascicoli di adeguata verifica" |
| `ubos` | list, create, resolve, delete | Manual or auto-resolution via business registry |
| `ids` | list, create, update, complete, reopen | KYC step 3 records |
| `id-docs` | list, update, get-url, upload, alerts | ID card / passport scans (multipart upload) |
| `screenings` | list, create, run-full, manual, review-result, delete-all, delete | PEP / sanctions / adverse media |
| `risk` | list, create, update, set-level, approve, unapprove, catalog | CNDCEC RT 2025 risk assessment |
| `forms` | list, create, complete, sign, reset, delete, pdf | Modulistica AML, PDF generation |
| `case-docs` | list, upload, get-url, dossier | Generic attachments + final dossier |
| `magic` | list, create, delete | External form-collection links |
| `deadlines` | list, stats, overdue, upcoming, dashboard, create, update, delete | System-generated + custom |

Plus four meta-commands: `schema`, `docs`, `completions`, `mcp`.

---

## Conventions

### Body input via `--data`

All write commands accept the request body as JSON:

```bash
aegis clients create --data '{"type":"INDIVIDUAL","firstName":"Mario","lastName":"Rossi"}'
aegis clients create --data @client.json
echo '...' | aegis clients create --data=-
```

### `--dry-run` on every write

Preview the exact HTTP call (with auth header redacted) without sending it:

```bash
aegis cases delete c_abc... --yes --dry-run --pretty
# {
#   "dryRun": true,
#   "method": "DELETE",
#   "url": "http://localhost:3000/aml-cases/c_abc...",
#   "headers": { "authorization": "Bearer <redacted>", ... }
# }
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | OK |
| 1 | Generic error |
| 2 | Not authenticated |
| 3 | Local validation error (Zod) |
| 4 | API error (non-2xx) |
| 5 | Network error |

### Output format

- **stdout** — pure JSON (compact by default, `--pretty` for indented)
- **stderr** — errors as a JSON envelope `{error, message, code, hint, traceId}`

---

## Configuration

| Environment variable | Default | Purpose |
|---|---|---|
| `AEGIS_API_URL` | `http://localhost:3000` | Gateway base URL. In production, append `/api` (e.g. `https://your-aegis-instance.example.com/api`) |
| `AEGIS_CONFIG_PATH` | OS-specific | Path to credentials/config file |
| `AEGIS_CONCURRENCY` | `1` | Max concurrent in-flight requests per process |
| `AEGIS_TIMEOUT_MS` | `30000` | Request timeout |

The config file (mode `0600`) stores `accessToken`, `refreshToken`, `user`, and an optional `apiUrl` override. Precedence: env > config > default.

---

## Documentation

- **`aegis docs`** — full manual with glossary, workflows, and LLM safety rules
- **`aegis schema --format anthropic|openai|raw`** — machine-readable tool manifest
- **[examples/](./examples/)** — three few-shot conversation transcripts:
  - [`onboard-client-pf.md`](./examples/onboard-client-pf.md) — natural person from scratch
  - [`onboard-client-pg.md`](./examples/onboard-client-pg.md) — legal entity with auto UBO resolution
  - [`close-case.md`](./examples/close-case.md) — risk assessment, form signing, dossier, case approval

---

## Shell completions

```bash
aegis completions zsh  > ~/.zsh/completions/_aegis      # zsh
aegis completions bash > ~/.bash_completion.d/aegis     # bash
```

Auto-generated from the live command tree, so they stay current as the CLI grows.

---

## Roadmap (not yet done)

- Test suite (unit + integration)
- CI / npm publish workflow
- Standalone binaries (Bun compile) for users without Node installed
- Homebrew tap

---

## License

TBD. Until a license is added, treat this as proprietary code; do not redistribute.
