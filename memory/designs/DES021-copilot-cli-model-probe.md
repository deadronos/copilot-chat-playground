# DES021 — Copilot CLI Model Probe & /models Endpoint 📡

**Status:** Proposed
**Created:** 2026-01-25

## Overview

Provide a best-effort, discoverable way to learn which models the local Copilot CLI advertises on the current environment. The service will probe the installed `copilot` binary (if available) and expose results over a small HTTP endpoint `/models`. This helps the UI and operators understand which concrete provider models are available and explain fallbacks (e.g., when requested model `gpt-4o` is mapped to `claude-sonnet-4.5`).

## Goals

- Surface the list of *advertised* models from the installed Copilot CLI.
- Be non-invasive and safe (no secrets passed, short timeouts, cached results).
- Provide deterministic fallback behavior when CLI is absent or output unparsable.
- Instrument probe attempts with structured logs and minimal metrics.

## Requirements (EARS)

- WHEN a caller requests `GET /models`, THE SYSTEM SHALL probe the local Copilot CLI for supported models and RETURN a structured JSON list with source and TTL information. [Acceptance: `GET /models` returns {source, models, cachedUntil} in tests and in a running dev container].

- WHEN the CLI is unavailable or the probe fails, THE SYSTEM SHALL respond with `{ source: 'error', error: <message> }` and emit a warn log event. [Acceptance: test simulates ENOENT and asserts `source === 'error'` and a log with `event_type: 'cli.models.error'` was emitted].

- WHEN a model mismatch is detected between requested and reported provider model, THE SYSTEM SHALL increment a `model_mismatch_count` metric and emit `sdk.model.mismatch` (already implemented). [Acceptance: existing metric + log tests pass].

## Design

1. Probe strategy (best-effort, prioritized):
   - First, try `copilot --model list --json` (or `copilot --model list` if JSON not supported) and parse output. If the command returns JSON, parse it and extract model ids.
   - If the above fails or returns an error message listing allowed choices (like `Allowed choices are ...`), invoke `copilot --model INVALID_PROBE` (intentional invalid) and parse stderr for a substring matching `Allowed choices are: <model1>, <model2>, ...`.
   - If still unsuccessful, try `copilot --help` and look for patterns that list models.
   - If no CLI available or parse fails, fallback to inspecting `node_modules/@github/copilot/package.json` for any documented models or return a curated default list (best-effort), and mark source accordingly (`cache`, `fallback`).

1. Parsing details

- Primary regex: `/Allowed choices are\s*:?\s*(.*)/i` → split on `,` and trim entries; also handle parenthetical notes and trailing punctuation.
- JSON mode: parse and normalize model ids (trim). Keep stable ordering.

1. Caching & TTL

- Cache successful probe results in-process for a small TTL (default 60s, overridable via env `COPILOT_MODELS_TTL_SECONDS`).
- Subsequent `GET /models` within TTL returns cached data with `cached: true` and `ttlExpiresAt` timestamp.

1. Endpoint contract

- GET /models → 200
  {
    source: 'cli' | 'cache' | 'fallback' | 'error',
    models: string[],
    cached: boolean,
    ttlExpiresAt?: string,
    error?: string
  }

1. Logs & metrics

- Emit structured events:
  - `cli.models.probe.start` (debug)
  - `cli.models.probe.success` (info) with `count` and `source` meta
  - `cli.models.probe.parsed` (debug) with `models` meta
  - `cli.models.probe.error` (warn/error) with `error` meta
- Increment `model_probe_count` and `model_probe_failure_count` metrics.

1. Security & Safety

- Do not include tokens or sensitive environment variables in logs.
- Use short timeouts (e.g., 5s) for spawn calls and a small process output cap to prevent memory blow-up.

## Error handling

- ENOENT: return `source: 'error'` with message `copilot binary not found` and log `cli.models.probe.error`.
- Auth errors: return `source: 'error'` and include terse message about auth if detected, but avoid logging token contents.
- Parse errors: return `source: 'fallback'` with curated list (if available) or empty list.

## Tests

- Unit tests (mock spawn):
  - CLI returns `Allowed choices are a, b, c` on stderr → assert endpoint returns parsed models.
  - CLI returns JSON listing of models → assert JSON parsing path.
  - CLI missing / ENOENT → assert error response and emitLog called with `cli.models.probe.error`.
  - Timeout or unexpected output → assert fallback behavior and a warning log.

- Integration test (if `copilot` exists on CI runner): run `copilot --model INVALID_PROBE` and validate that the endpoint returns a `cli` source and non-empty models array. Mark this test skipIf(copilot missing).

## Implementation plan / tasks

1. Add `src/copilot/src/cli-models-probe.ts`:
   - Export `async function probeCliModels(): Promise<{ source: string; models: string[] }>` implementing the strategy above.
   - Use existing `getCopilotCandidatePaths()` to locate binaries for more deterministic probing.
   - Use `spawn` helper with timeout.
2. Add API handler `GET /models` in `src/copilot/src/index.ts` that uses probe + caching.
3. Add metrics increments to `src/copilot/src/metrics.ts` (`model_probe_count`, `model_probe_failure_count`).
4. Add unit tests (`tests/copilot/unit/cli-models-probe.test.ts` and `tests/copilot/unit/http-models.test.ts`) mocking `spawn` to cover parsing and errors. Update existing `/metrics` test if needed.
5. Document the behavior in `docs/library/copilot-sdk/README.md` and add a short note in `src/copilot/README.md`.

## Acceptance criteria

- Unit tests for parsing, error, and caching paths pass.
- `GET /models` responds with structured JSON and caching behaviour.
- Logs emitted for success and failures as described.

## Notes / Future enhancements

- Consider reaching out to provider APIs (Anthropic/OpenAI) if BYOK is configured to get authoritative model lists.
- Optionally expose `/models?refresh=true` to force probe ignoring cache (requires rate-limiting and permission guard).

---

End of spec — DES021
