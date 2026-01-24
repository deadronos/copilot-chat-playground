# System Patterns

**Architecture:**
- Three primary services: `frontend` (Vite), `backend` (Node API), `copilot` (Node service with CLI/SDK integration).  
- Docker Compose orchestrates the stack in local dev with service DNS for inter-service calls.

**Design patterns:**
- Secrets-first: encrypted `.env` artifacts (dotenvx) and runtime key injection via Docker secrets or mounted files.
- Read-only workspace mount pattern to enable file-based prompts without granting write access by default.
- Interface-first testing: small integration tests that exercise HTTP boundaries between services; unit tests for core logic.

**Operational guardrails:**
- Avoid committing `.env.keys` and prevent keys from being baked into images.
- Default mounts are read-only; opt-in read/write is a documented future milestone.
- Prefer explicit service names for internal communication (example: `http://copilot:3210`).

**Testing & validation:**
- Manual validation of the Compose stack and mount behavior.
- Add CI integration tests for SDK mode and secrets-handling checks (planned `TASK009`).
