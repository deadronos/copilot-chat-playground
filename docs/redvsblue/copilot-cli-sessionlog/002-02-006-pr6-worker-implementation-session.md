# Session Log — 2026-01-25

## Summary
- Refactored `RedVsBlue.tsx` into smaller components and isolated the canvas element in its own component keyed by renderer mode.
- Fixed OffscreenCanvas transfer issues in dev StrictMode by preserving the engine/offscreen across effect re-mounts and hard-resetting only on setup changes or unmount.
- Added Red vs Blue guidance docs under `docs/agents/redvsblue` and updated `AGENTS.md` to point to them.
- Added a README to index the Red vs Blue guidance docs.

## Key Changes
- New components: `RedVsBlueCanvas`, `RedVsBlueHud`, `RedVsBlueControls`, `RedVsBlueStyles`.
- `useGame.ts` offscreen handling adjusted to avoid double-transfer and detached offscreen errors.
- Guidance docs: overview, engine/simulation, rendering/workers, telemetry/stores, UI/components, and README.

## Validation
- Manual smoke test: renderer toggle, spawn/reset, UI overlay positioning (confirmed working after offscreen fixes).

## Notes
- OffscreenCanvas can only be transferred once per canvas element; StrictMode effect re-runs required preserving state across re-mounts.
- Renderer switch is keyed to force a fresh canvas element when toggling modes.
