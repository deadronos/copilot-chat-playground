# 04 — Tools (custom tools)

Tools let Copilot call *your code*.

In a playground app, tools are where things get fun:

- look up local “project state”
- access a sandboxed filesystem
- call your own APIs

## Tool shape (recommendation)

Use **structured** results:

- `resultType`: one of `success | failure | rejected | denied`
- `textResultForLlm`: what the model should see
- optional: `sessionLog` and `toolTelemetry` for debug

This keeps your app debuggable without leaking secrets.

## Safety + consistency rules

1. Never return raw stack traces to the model.
2. Put sensitive details in server logs only.
3. Prefer deterministic, small outputs. (LLMs do better with clear tool results.)

## Common tool patterns

- **Lookup tool**: `lookup_issue({ id })` returns known data
- **Compute tool**: `calc({ expression })` returns computed result
- **I/O tool**: `read_file({ path })` returns file content (be careful!)

## Sources

- Getting started (defineTool): <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
- Cookbook: <https://github.com/github/copilot-sdk/blob/main/cookbook/README.md>
