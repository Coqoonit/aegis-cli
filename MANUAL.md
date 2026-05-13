# Aegis CLI — Manual

CLI for interacting with the Aegis AML API. Designed for end-users driving workflows via primary LLMs (Claude, GPT-4, Gemini) with tool use.

> **Tool manifest for LLMs**: `aegis schema --format anthropic|openai|raw` emits a structured JSON definition of all 70 commands. Load it into your LLM client and the model can call any tool without parsing `--help`.

---

## Quick start

```bash
# Install (once published)
npm install -g aegis-cli

# Authenticate (passwordless — Personal Access Token)
aegis auth use-pat --token aegis_pat_<...>
# or via single-use email magic link:
#   aegis auth request-login-link --email you@example.it
#   aegis auth consume-login-link --token <hex-from-email-fragment>

# Explore
aegis --help
aegis clients list --help
aegis docs          # prints this manual
```

---

## Configuration

All via environment variables or the persisted config file.

| Variable | Default | Purpose |
|---|---|---|
| `AEGIS_API_URL` | `http://localhost:3000` | Gateway base URL. In production, typically include the `/api` suffix (e.g. `https://your-aegis-instance.example.com/api`). |
| `AEGIS_CONFIG_PATH` | OS-specific (`~/.config/aegis/config.json` on Linux/macOS) | Config & token storage |
| `AEGIS_CONCURRENCY` | `1` | Max concurrent in-flight requests per process |
| `AEGIS_TIMEOUT_MS` | `30000` | Request timeout in milliseconds |

Config file shape:
```json
{
  "apiUrl": "https://your-aegis-instance.example.com/api",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "tenantId": "..." }
}
```

Precedence for `apiUrl`: `AEGIS_API_URL` env > `config.apiUrl` > default.

---

## Authentication

Aegis is **passwordless** — there is no password to type. Two bootstrap flows:

### A. Personal Access Token (recommended for CLI / agent / unattended)

A PAT is a long-lived `aegis_pat_<64hex>` credential bound to your user. Exactly **one active PAT per user** — regenerating atomically invalidates the previous one. The plain token is shown ONCE at generation; only its SHA-256 hash is persisted.

```bash
# 1. Generate (web UI: Impostazioni → Personal Access Token, or — once
#    already authenticated — `aegis auth regenerate-pat`)
aegis auth regenerate-pat --name "macbook-cli"

# 2. Exchange for a JWT + refresh-token pair, stored locally
aegis auth use-pat --token aegis_pat_<...>     # explicit
aegis auth use-pat                             # interactive secret prompt

# 3. PAT lifecycle
aegis auth show-pat                            # metadata (createdAt, lastUsedAt, name) — no token
aegis auth regenerate-pat --name "ci-runner"   # rotate (old PAT invalidated)
aegis auth revoke-pat                          # delete (idempotent)
```

### B. Magic link (interactive, fully CLI)

```bash
aegis auth request-login-link --email you@x.it    # always 200 (no email enumeration)
# Open the email, copy the token from the URL fragment (after `#token=`)
aegis auth consume-login-link --token <hex>       # mints JWT + refresh
```

### Session management

```bash
aegis auth refresh   # manual refresh — automatic happens on 401
aegis auth logout    # clears local JWT + refresh (PAT in DB is untouched)
```

**Silent refresh**: on any 401 or auth-related 403, the CLI refreshes once and retries. If the retry still fails auth, local credentials are cleared — next command prompts re-login.

**Public auth endpoints** (no token required, used during bootstrap):
`request-login-link`, `verify-login-link`, `consume-login-link`, `access-token/exchange` (`use-pat`), `refresh`, `logout`.

---

## Output conventions

- **stdout** — data (JSON). Default: compact; `--pretty` for indented.
- **stderr** — logs and errors (JSON envelope). Never mix with data.
- All commands emit valid JSON on success, making output pipeable to `jq` and machine-parseable by LLMs.
- Destructive / empty responses emit `{"ok":true}`.

### Error envelope

```json
{"error":"ApiError","message":"Client not found","status":404,"code":"CLIENT_NOT_FOUND","traceId":"abc"}
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | OK |
| 1 | Generic error |
| 2 | Not authenticated — run `aegis auth use-pat` (PAT) or `aegis auth request-login-link` (magic link) |
| 3 | Local validation error (Zod) |
| 4 | API error (non-2xx from backend) |
| 5 | Network error (DNS, connection refused, timeout) |

---

## The `--data` convention

Commands that accept a JSON body use `--data` rather than individual flags for each field. Three forms:

```bash
# Inline JSON
aegis clients create --data '{"type":"INDIVIDUAL","firstName":"Mario","lastName":"Rossi","fiscalCode":"RSSMRA80A01H501U"}'

# From file
aegis clients create --data @client.json

# From stdin (note: --data=- with equals; --data - is interpreted as two flags)
echo '{"type":"INDIVIDUAL",...}' | aegis clients create --data=-
```

This mirrors the HTTP request body 1:1 and makes the same shape usable by LLM tool-use (the body field in the manifest is the full Zod schema, not a flat flag list).

---

## `--dry-run`

Available on every write command. Prints a JSON preview of the HTTP request (method, URL, headers with auth redacted, body) **without sending it**.

```bash
aegis clients create --data '{"type":"INDIVIDUAL",...}' --dry-run --pretty
# {
#   "dryRun": true,
#   "method": "POST",
#   "url": "http://localhost:3000/clients",
#   "headers": { "content-type": "application/json", "authorization": "Bearer <redacted>", ... },
#   "body": { "type": "INDIVIDUAL", ... }
# }
```

**Recommended for LLM agents**: before any destructive or costly operation (screenings, dossier generation, bulk updates), issue a dry-run first to verify.

---

## Pagination

Two styles depending on endpoint:

- **Cursor** (most list endpoints): `--cursor <c> --limit <n>`. Response has `pagination.nextCursor` and `pagination.hasNextPage`.
- **Offset** (`deadlines list`): `--page <n> --limit <n>`. Response has `pagination.page`, `pagination.total`, `pagination.totalPages`.

Some list endpoints (e.g. `screenings list`, `forms list`, `risk list`, `ids list`) return all items without pagination.

---

## Concurrency & retry

- Default **concurrency = 1** per-process. Requests are serialized.
- Override with `AEGIS_CONCURRENCY=5` if you explicitly want parallelism.
- Automatic retry on `429` and `503`: up to 3 attempts, exponential backoff, honors `Retry-After` header.
- **Retry only on idempotent methods** (GET, HEAD, PUT, DELETE, OPTIONS). POST/PATCH are not retried — a `503` might mean the mutation already executed.
- Network errors (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, ...) are reported with exit code 5 and a hint.

**Gateway note**: the Aegis gateway has a per-IP rate limit. Multiple processes from the same machine share it. Avoid `xargs -P`, GNU `parallel`, or similar burst patterns.

---

## Safety — destructive operations

Commands with permanent effects (`delete`, `archive`, `delete-all`) require confirmation:

- **Interactive (TTY)**: prompt yes/no
- **Non-interactive**: `--yes` flag required, otherwise exits with validation error

```bash
aegis clients archive c123... --yes           # ok in script
aegis cases delete c456...                    # fails in non-TTY without --yes
```

---

## LLM integration

### Scenario A — primary LLM with tool use (script-based)

```python
import anthropic, subprocess, json

tools = json.loads(subprocess.check_output(["aegis", "schema", "--format", "anthropic"]))
manual = subprocess.check_output(["aegis", "docs"]).decode()

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-opus-4-7",
    system=manual,         # ← this manual as system prompt
    tools=tools,           # ← 70 tool definitions
    messages=[{"role": "user", "content": "mostra i clienti con rischio alto"}],
)
# Your script executes tool_use blocks as `subprocess.run(["aegis", ...])`
# and feeds tool_result back to the model.
```

### Scenario B — shell-capable agent (Cursor, Claude Code, etc)

Add to your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
## Aegis CLI
To interact with Aegis, use the `aegis` command:
- Discovery: `aegis schema --format anthropic` (JSON tools) or `aegis docs` (manual)
- Per-command help: `aegis <cmd> --help`
- Default API: `http://localhost:3000` (override via `AEGIS_API_URL`)
```

### Scenario C — MCP server (built-in)

The CLI doubles as a Model Context Protocol stdio server. Run `aegis mcp` and
the process speaks JSON-RPC over stdin/stdout — every aegis command is exposed
as a native MCP tool. The same input schemas, descriptions, and `x_aegis`
hints that `aegis schema` returns are advertised over MCP.

Wire it into Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

Auth is shared with the CLI: bootstrap once via `aegis auth use-pat` (or the
magic-link flow) and the MCP server reuses the same credential file. Override
the API URL or other env vars by adding an `"env"` block in the config.

Internally, each tool call spawns a child `aegis <subcommand>` process. This
means the same retry, timeout, refresh, and error-envelope behavior the CLI
provides applies to MCP calls verbatim — including non-zero exit codes that
are surfaced as `isError: true` MCP responses with the JSON envelope as the
`text` content.

---

## Domain glossary

Aegis covers the Italian AML workflow (D.Lgs. 231/2007 + CNDCEC RT 2025). Key concepts:

### Cliente (Client)
A person or entity the studio has a professional relationship with. Two types:
- **INDIVIDUAL (PF)** — persona fisica. Key fields: `firstName`, `lastName`, `fiscalCode`.
- **COMPANY (PG)** — persona giuridica. Key fields: `companyName`, `vatNumber`, `legalForm`.

Clients have a `status` (`ACTIVE | ARCHIVED | SUSPENDED`) and a propagated `riskLevel` from their latest approved risk assessment.

### Fascicolo AML (AML Case)
A single "adeguata verifica" instance tied to one client and one engagement type. A client can have multiple cases over time (one per engagement or periodic re-verification).

Statuses: `DRAFT → COMPLETED → APPROVED` (or `EXPIRED`, `ARCHIVED`).

### UBO — Ultimate Beneficial Owner
The natural person(s) ultimately controlling a legal entity (≥25% ownership or effective control). Relevant only for `COMPANY` clients.

Resolution can be **manual** (`aegis ubos create`) or **automatic** (`aegis ubos resolve` — uses business registry lookup, consumes wallet credits).

Control types: `DIRECT`, `INDIRECT`, `INDIRECT_INCOMPLETE`, `CONTROL_OF_FACT`, `LEGAL_REPRESENTATIVE`.

### Identification (KYC step 3)
Structured record of how a subject (client, UBO, legal representative) was identified. Types:
- `CONDUCT_RULES` — "regole di condotta" (very low risk engagements)
- `SIMPLIFIED` — adeguata verifica semplificata
- `ORDINARY` — adeguata verifica ordinaria (default)
- `ENHANCED` — adeguata verifica rafforzata (PEP, high-risk third country)

Lifecycle: `PENDING → IN_PROGRESS → COMPLETED` (may be `reopen`ed → `PENDING`).

### Identity Documents
Photos/scans of ID cards, passports, etc. Uploaded per case; may be attached to the client or to a UBO (`--ubo <uboId>` on upload).

Types: `CARTA_IDENTITA`, `PATENTE`, `PASSAPORTO`, `PERMESSO_SOGGIORNO`, `DOCUMENTO_ESTERO`.

Expiry alerts: the backend surfaces documents about to expire via `aegis id-docs alerts`.

### Screening
Lookup of a subject against PEP/sanctions/adverse media lists.

Types: `SANCTIONS`, `PEP`, `ADVERSE_MEDIA`. Person types: `CLIENT`, `LEGAL_REPRESENTATIVE`, `UBO`, `COMPANY` (UBO requires `uboId`).

Three commands:
- `create` — single screening, one type at a time
- `run-full` — all three types in one call (3 credits consumed)
- `manual` — operator-performed lookup, no wallet credits

Results carry a `reviewStatus`: starts `PENDING_REVIEW`; must be moved to `CONFIRMED_MATCH | FALSE_POSITIVE | ESCALATED` via `review-result`.

### Risk Assessment
CNDCEC RT 2025 structured risk scoring. Categories: RI (inherent), A.1-A.4 (specific, table A), B.1-B.6 (specific, table B). Flags at case level (`skipSectionB`, `involvesHighRiskThirdCountry`, `isTab1RT2Service`) and client level (`isPep`, `isPepActingAsPA`).

Two ways to set a factor level:
- **Legacy**: `selectedLevel: 1-4` directly.
- **Definition-based**: `selectedDefinitionIds: [...]` — score computed server-side as max of definition levels.

Lifecycle: `DRAFT → COMPLETED → APPROVED`. Approval propagates risk level back to the client.

### Forms (Modulistica CNDCEC)
Structured forms to fulfil AML obligations. Types:
- `FASCICOLO_CHECKLIST` — cover checklist
- `ISTRUTTORIA` — internal investigation notes
- `DICHIARAZIONE_CLIENTE` — client self-declaration
- `CONTROLLO_COSTANTE` — ongoing monitoring
- `ASTENSIONE` — abstention decision
- `SEGNALAZIONE_CONTANTE` — cash report
- `DELEGA` — delegation form
- `COMUNICAZIONE_MEF` — notification to MEF

Workflow:
```
create  →  complete  →  pdf  →  upload signed PDF  →  sign
                                (case-docs upload)   (forms sign --signed-document-id)
```

### Case Documents
Generic file attachments on a case. Categories: `IDENTIFICATION_FORM`, `SIGNED_FORM`, `SCREENING_REPORT`, `RISK_REPORT`, `DOSSIER`, `OTHER`. Separate from identity documents (`id-docs`).

### Dossier
The final PDF aggregating all forms, screenings, risk assessment, and documents of a case. Generated with `aegis case-docs dossier --case <id>`.

### Deadlines
Time-based reminders. Two origins:
- **System-generated**: `RISK_REVIEW` (next review cycle), `VERIFICATION_RENEWAL`, `CASE_EXPIRY`, `DOCUMENT_EXPIRY` (ID docs expiring).
- **User-created** (via `aegis deadlines create`): type must be `CUSTOM`.

Statuses: `UPCOMING | OVERDUE | COMPLETED | DISMISSED`. By default `aegis deadlines list` excludes `COMPLETED` and `DISMISSED`.

### Magic Links
Short-lived URLs that let an external user (typically a UBO) fill in a specific form without logging into Aegis. Default expiry 72h, max 720h (30 days). The external submit endpoint is public and out of CLI scope — CLI covers only the authenticated management endpoints (`create`, `list`, `delete`).

---

## Typical workflows

All examples assume you've already authenticated (`aegis auth use-pat` or the magic-link flow — see the [Authentication](#authentication) section).

### 1. Onboard a natural-person client

```bash
# Create client anagraphics
aegis clients create --data '{
  "type": "INDIVIDUAL",
  "firstName": "Mario",
  "lastName": "Rossi",
  "fiscalCode": "RSSMRA80A01H501U",
  "email": "mario@example.it"
}'
# → { "id": "c_abc...", ... }

# Open an AML case
aegis cases create --data '{
  "clientId": "c_abc...",
  "engagementType": "ASSISTENZA_TRIBUTARIA"
}'
# → { "id": "case_def...", ... }

# Upload identity document
aegis id-docs upload --case case_def... \
  --type CARTA_IDENTITA \
  --file ./ci-front.jpg --file-back ./ci-back.jpg \
  --document-number "AB1234567" \
  --expires-at "2030-06-15"

# Run full screening
aegis screenings run-full --case case_def... --data '{
  "personType": "CLIENT",
  "searchTerm": "Mario Rossi"
}'
```

### 2. Onboard a legal-entity client with automatic UBO resolution

```bash
# Create company
aegis clients create --data '{
  "type": "COMPANY",
  "companyName": "Acme SRL",
  "vatNumber": "01234567890"
}'

# Open case
aegis cases create --data '{
  "clientId": "c_acme...",
  "engagementType": "REVISIONE_LEGALE"
}'

# Auto-resolve UBOs via business registry
aegis ubos resolve --case case_xyz...
# → { "created": 3, "ubos": [...], "missingEntities": [...] }

# Screen each UBO (example for first one)
aegis screenings run-full --case case_xyz... --data '{
  "personType": "UBO",
  "uboId": "ubo_111",
  "searchTerm": "Luigi Bianchi"
}'
```

### 3. Complete risk assessment

```bash
# Set preliminary case flags (influence calculator)
aegis cases set-risk-flags case_xyz... \
  --involves-high-risk-third-country false \
  --is-tab1-rt2-service false

# Create the assessment
aegis risk create --case case_xyz... --data '{
  "operationDescription": "Revisione legale bilancio 2026",
  "relationshipType": "CONTINUOUS"
}'
# → { "id": "ra_123", ... }

# Fetch the CNDCEC catalog (for valid categoryCodes and definitionIds)
aegis risk catalog

# Set each factor level (example for A.1 — client type)
aegis risk set-level ra_123 --case case_xyz... --data '{
  "categoryCode": "A.1",
  "selectedLevel": 2
}'
# Repeat for A.2, A.3, A.4, B.1-B.6, RI

# Approve
aegis risk approve ra_123 --case case_xyz...
```

### 4. Fill, sign and file a form

```bash
# Create the form
aegis forms create --case case_xyz... --data '{
  "type": "ISTRUTTORIA",
  "data": {
    "operationPurpose": "Revisione legale annuale",
    "fundOrigin": "Attività d'impresa"
  }
}'
# → { "id": "form_456", ... }

# Mark ready to sign
aegis forms complete form_456 --case case_xyz...

# Generate PDF
aegis forms pdf form_456 --case case_xyz... --output /tmp/istruttoria.pdf
# → { "ok": true, "path": "/tmp/istruttoria.pdf", "bytes": 34128, ... }

# The user prints, signs, scans. Upload the signed PDF:
aegis case-docs upload --case case_xyz... \
  --file /tmp/istruttoria-firmata.pdf \
  --category SIGNED_FORM \
  --notes "Firmata 2026-04-24"
# → { "id": "doc_789", ... }

# Link the signed document to the form
aegis forms sign form_456 --case case_xyz... --signed-document-id doc_789
```

### 5. Close the case

```bash
# Generate the full dossier
aegis case-docs dossier --case case_xyz...
# → { "id": "doc_dossier", "downloadUrl": "...", ... }

# Approve the case (propagates to client risk status)
aegis cases approve case_xyz...
```

### 6. Monitor deadlines

```bash
aegis deadlines dashboard                          # overview
aegis deadlines overdue                            # only overdue
aegis deadlines upcoming                           # next window
aegis deadlines list --status OVERDUE --page 1     # paginated
aegis deadlines update dl_123 --data '{"status":"COMPLETED","notes":"Done"}'
```

### 7. External form collection via magic link

```bash
# Create a link for a UBO to fill a "dichiarazione cliente" form
aegis magic create --data '{
  "amlCaseId": "case_xyz...",
  "formType": "DICHIARAZIONE_CLIENTE",
  "uboId": "ubo_111",
  "targetEmail": "ubo@example.it",
  "targetName": "Luigi Bianchi",
  "expiryHours": 168
}'
# → { "id": "ml_222", "token": "<64-char hex>", "formType": "...", "expiresAt": "..." }
#
# The plain `token` is ONLY returned here — it's stored hashed (SHA-256) at
# rest and `magic list` never returns it. If you lose it, regenerate the link.
# Build the shareable URL with the fragment form:
#   https://app.aegis.example/magic#token=<token>
# (Fragment — not path — so the token doesn't leak to access logs / Referer.)
# `targetEmail` triggers a best-effort email; the URL above is for manual sharing.

# When the recipient submits (public endpoint, out of CLI scope), the form
# is populated automatically.

# Revoke early if needed
aegis magic delete ml_222 --yes
```

---

## Safety guidelines for LLM agents

When an LLM drives the CLI, follow these rules to avoid costly or destructive mistakes:

1. **No shell parallelism** — do **not** use `xargs -P`, GNU `parallel`, background jobs, or concurrent subprocess pools. The backend has a per-IP rate limit and concurrent bursts trigger 429s for other users of the same machine. Use sequential loops only.

2. **Confirm bulk operations** — before iterating over more than ~50 entities, ask the user for explicit confirmation. Example: "You asked to archive all clients matching X — that's 73 clients. Confirm?"

3. **Always `--dry-run` first on destructive commands** — for `delete`, `archive`, `delete-all`, `cases delete`, `forms delete`, `screenings delete-all`: print the dry-run output, get user approval, then run without `--dry-run --yes`.

4. **Prefer idempotent ops** — `list`, `get`, `update`, `set-level` can safely be retried. `create` and `approve` cannot — check existence first when possible.

5. **Check wallet before expensive ops** — `ubos resolve`, `screenings run-full`, `screenings create` consume wallet credits. If you have access to wallet state, verify balance before.

6. **Use `--output <path>` for binary outputs** — `forms pdf` writes a PDF file; don't try to capture the output as JSON.

7. **Never commit tokens to VCS** — the config file in `~/.aegis/config.json` is chmod 0600. Don't copy it to repos.

8. **On ambiguity, ask** — the tool manifest gives you 70 commands. If two fit the user's request, ask rather than guess (e.g. `cases delete` vs `cases approve` — very different).

9. **Chain with care** — for multi-step flows (onboard → screen → risk → forms), complete one step fully and check the output before starting the next. Don't queue up multiple write commands blindly.

10. **Use `aegis docs` and `aegis schema`** — they're the authoritative discovery surfaces. `--help` is human-oriented; prefer the structured versions for reasoning.

---

## Reference

- Tool manifest: `aegis schema --format anthropic|openai|raw`
- Per-command help: `aegis <domain> <cmd> --help`
- Source: see the project's repository (URL set at publish time)
- Report issues: same repo's issues page
