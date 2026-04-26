# Aegis CLI — Example Recipes

Few-shot transcripts showing realistic conversations between a user and an LLM agent driving `aegis`. Include these in your system prompt alongside `aegis docs` output to nudge the LLM toward the right workflow.

## Files

- [onboard-client-pf.md](./onboard-client-pf.md) — onboarding a natural-person client from scratch
- [onboard-client-pg.md](./onboard-client-pg.md) — onboarding a legal entity with automatic UBO resolution
- [close-case.md](./close-case.md) — risk assessment, forms signing, dossier, case approval

## How to use

```python
# Load all recipes as additional context
recipes = "\n\n---\n\n".join([
    open(f).read() for f in ["examples/onboard-client-pf.md", "examples/close-case.md"]
])
system_prompt = aegis_docs + "\n\n## Example interactions\n\n" + recipes
```

Or as individual few-shot examples in a "previous messages" array if your integration supports it.

## Notation

```
USER:        what the human says
ASSISTANT:   what the LLM replies (includes tool_use blocks inline)
TOOL:        the tool_result returned to the LLM
```

All IDs in recipes are fictional (start with `c_example_...`). Real IDs are CUIDs starting with `c` followed by 24 alphanumeric chars.
