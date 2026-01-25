# [TASK022] — Implement Copilot CLI Model Probe (/models endpoint)

**Status:** Not Started  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request

Implement DES021: add a best-effort probe of the local `copilot` CLI to discover provider-advertised models and expose the result via `GET /models` with caching, structured logs, metrics, and unit tests.

## Thought Process

- The Copilot CLI (`copilot --model ...`) already lists allowed models in error messages and may support JSON output. A robust probe should try JSON output first, then intentionally send an invalid model and parse the `Allowed choices are ...` error message when necessary.

- We must be careful about timeouts, avoid leaking sensitive data in logs, and cache results to limit probing frequency.

- Tests should simulate spawn results and errors so implementation is deterministic for CI.

## Implementation Plan (subtasks)

1. Core probe implementation (src/copilot/src/cli-models-probe.ts) ✅ Not Started
   - [ ] Create `probeCliModels()` which attempts the following in order:
     - [ ] Run `copilot --model list --json` (timeout 5s). If JSON returned and valid, parse models.
     - [ ] If JSON unsupported or returns non-JSON, run `copilot --model INVALID_PROBE` and parse stderr for `Allowed choices are ...` using regex `/Allowed choices are\s*:?\s*(.*)/i`.
     - [ ] If that fails, run `copilot --help` and search for model list patterns.
     - [ ] If still unsuccessful, inspect `node_modules/@github/copilot/package.json` for documentation or return an empty array with `source: 'fallback'`.
   - [ ] Use `getCopilotCandidatePaths()` to try absolute binary paths when `copilot` is not on PATH.
   - [ ] Respect a spawn timeout and cap output size (avoid memory blow-up).
   - [ ] Normalize and deduplicate model ids, return { source: 'cli'|'fallback'|'error', models: string[], error?: string }.
   - [ ] Emit logs `cli.models.probe.start`, `cli.models.probe.parsed`, `cli.models.probe.success`, `cli.models.probe.error` using `eventBus` when available.
   - [ ] Increment metrics `model_probe_count` and on failure `model_probe_failure_count` using `metrics.incrementMetric`.

2. Add caching wrapper (src/copilot/src/cli-models-probe.ts) ✅ Not Started
   - [ ] Implement an in-memory cache with TTL (env `COPILOT_MODELS_TTL_SECONDS`, default 60s).
   - [ ] Provide a `refresh` flag to force re-probe.
   - [ ] Export `getCachedModels()` that returns `{ source, models, cached, ttlExpiresAt }`.

3. Add HTTP endpoint (src/copilot/src/index.ts) ✅ Not Started
   - [ ] Add `GET /models` (and optional `?refresh=true`) which calls the cache/probe and returns JSON:
     - `{ source, models, cached, ttlExpiresAt, error? }` with status 200 for success/fallback and 500 for probe internal errors.
   - [ ] Emit structured logs for incoming requests and probe results.

4. Tests ✅ Not Started
   - [ ] Unit tests for `probeCliModels()` mocking `spawn` to simulate outputs:
     - Allowed choices stderr path
     - JSON output path
     - ENOENT / binary missing
     - Timeout & parse failure (fallback)
   - [ ] Unit tests for caching behavior (TTL respects, `refresh=true` forces probe)
   - [ ] HTTP endpoint tests (start app via `createApp()` and assert responses) with mocking probe function.
   - [ ] Integration test (optional, skipIf copilot missing) that runs the real `copilot` binary and expects `source: 'cli'` with non-empty `models`.

5. Documentation ✅ Not Started
   - [ ] Add docs entry to `docs/library/copilot-sdk/README.md` describing `/models`, usage, TTL, and caveats.
   - [ ] Add a short note to `src/copilot/README.md` describing the endpoint and how to force refresh.

6. Observability & Telemetry ✅ Not Started
   - [ ] Increment `model_probe_count` on each attempt and `model_probe_failure_count` on failures using `metrics.ts`.
   - [ ] If desired, add a metric exposure to `/metrics` (existing) and include these metrics.

7. Security & rate-limiting ✅ Not Started
   - [ ] Ensure `/models` has a reasonable rate limit (simple in-process guard to avoid repeated probes, optionally make rate-limiting policy configurable).

8. PR & Handoff ✅ Not Started
   - [ ] Prepare a concise PR with the spec reference (`DES021`), tests, and a short changelog.
   - [ ] Add PR description with acceptance checklist and testing instructions.

## Progress Log

### 2026-01-25

- Created spec DES021 and task file TASK022. Planned implementation and test strategy.

## Acceptance Criteria

- All unit tests pass for parsing and error scenarios.

- `GET /models` returns `{ source, models, cached, ttlExpiresAt }` and respects `refresh=true`.

- Logs and metrics emitted as described.

---

Assign to: @you (or leave unassigned)

Priority: Medium


