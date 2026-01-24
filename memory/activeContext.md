# Active Context

**Current focus:**
- Finalize Milestone E: Workspace mount + secrets (completed 2026-01-24).  
- Continue Milestone F: switch to Copilot SDK (`TASK004`) — in progress.  
- Continue Milestone C: end-to-end streaming tests and integration (`TASK006`) — in progress.

**Recent changes:**
- 2026-01-23/24: Implemented workspace read-only mount, `WORKDIR /workspace`, Compose wiring, and dotenvx secrets-first documentation (see commits in repository history).

**Next steps:**
1. Add a small follow-up to codify secrets guidance and add automated checks (create `DES009` and `TASK009`).
2. Finish SDK migration work (complete `TASK004`) and add integration tests that exercise SDK mode in CI.
3. Add automated integration tests for workspace mount visibility and dotenvx key handling.

**Active decisions:**
- Default to read-only workspace mounts and document opt-in for read/write in a future milestone.
- Follow a secrets-first pattern: provide decryption keys at runtime and avoid baking keys into images.
