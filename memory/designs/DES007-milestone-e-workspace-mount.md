# [DES007] - Milestone E: Workspace Mount + Compose + Secrets

**Status:** Completed ✅
**Added:** 2026-01-23
**Updated:** 2026-01-24

## Implementation

- Milestone work completed in commits on 2026-01-23/24: implemented workspace mount, adjusted `WORKDIR`, added Compose wiring, and documented dotenvx secrets-first key handling (see commits: `886301f8`, `2a5c6a3`, `3cdb2ae`, `695bfe2`, `31a1063`, `e37b033`).
- Changes include Dockerfile and Compose updates and documentation enhancements in repo docs/ and README.

---



## Summary

Enable the copilot container to safely access a mounted `./workspace` directory at `/workspace` (read-only by default), run with `WORKDIR /workspace`, and document a secrets-first approach for dotenvx decryption keys at runtime. Provide a full Docker Compose setup and guardrails in docs. Read/write mounts are explicitly deferred to a future milestone.

## Goals

- Allow prompts to reference files in a mounted `./workspace` directory inside the copilot container.
- Default to a **read-only** mount for safety.
- Run copilot service with `WORKDIR /workspace` so CLI and SDK can see files.
- Provide Docker Compose guidance for the full stack.
- Document dotenvx usage and safe key handling (secrets-first).

## Non-goals

- Read/write access to the workspace mount (explicitly deferred).
- Full production hardening for secret management across all platforms.
- Building a CI pipeline for Docker images (optional later).

## Requirements (EARS)

1. **WHEN** the copilot container starts with a mounted `./workspace`, **THE SYSTEM SHALL** mount it at `/workspace` in read-only mode by default. **Acceptance:** container has read access; write attempts fail.
2. **WHEN** the copilot service starts in the container, **THE SYSTEM SHALL** use `WORKDIR /workspace` so file-referencing prompts resolve correctly. **Acceptance:** prompt referencing `workspace` files yields consistent results.
3. **WHEN** running via Docker Compose, **THE SYSTEM SHALL** provide a full-stack configuration (frontend, backend, copilot) with documented ports and service links. **Acceptance:** Compose starts all services with correct inter-service URLs.
4. **WHEN** dotenvx encrypted envs are used, **THE SYSTEM SHALL** accept decryption keys at runtime via secrets or mounted files, and **SHALL NOT** bake keys into images. **Acceptance:** docs describe secrets-first pattern; no keys in images.
5. **WHEN** documentation is updated, **THE SYSTEM SHALL** explain safety guardrails (read-only mount, `.env.keys` privacy, avoid logging keys). **Acceptance:** docs contain explicit warnings.

## Architecture

### Components

- **copilot service** (Node): runs in container, reads `/workspace` files, communicates with backend.
- **backend service** (Node): proxies requests to copilot service (`COPILOT_SERVICE_URL`).
- **frontend service** (Vite): UI for chat.
- **docker-compose**: orchestrates services, binds ports, mounts volumes.

### Data Flow

```mermaid
flowchart LR
  UI[Frontend] -->|HTTP| API[Backend]
  API -->|HTTP| Copilot[Copilot Service]
  Copilot -->|Read-only| Workspace[/workspace mount]
  Copilot -->|dotenvx run| Env[Encrypted .env files]
  Env -->|decrypt with secret| Secrets[(DOTENV_PRIVATE_KEY_*)]
```

### Interfaces

- **Docker Compose**
  - `copilot` service: mount `./workspace:/workspace:ro`, `working_dir: /workspace`
  - `backend` service: `COPILOT_SERVICE_URL=http://copilot:3210`
  - `frontend` service: default Vite port `5173`
  - `copilot` exposed port `3210`, `backend` port `3000`

- **Environment variables**
  - `USE_COPILOT_SDK` (true/false)
  - `COPILOT_SERVICE_URL` (backend -> copilot)
  - `DOTENV_PRIVATE_KEY_*` (dotenvx decryption at runtime)

### Data Models / Storage

- **Volume mount:** `./workspace` → `/workspace` (read-only)
- **Secret file mount (recommended):** `/run/secrets/dotenv_private_key_*`
- **No persistent data stored by copilot service** (stateless behavior)

## Error Handling Matrix

| Scenario | Expected Behavior | Surface | Mitigation |
| --- | --- | --- | --- |
| `/workspace` mount missing | Copilot warns and continues (or fails fast if configured) | Logs / startup error | Document required mount in Compose |
| Read-only violation | OS error on write | Logs | Read-only by default; future RW opt-in |
| Missing `DOTENV_PRIVATE_KEY_*` | dotenvx fails to decrypt | Logs | Document key injection steps |
| `COPILOT_SERVICE_URL` wrong | Backend cannot reach copilot | Logs / HTTP 5xx | Compose sets service name |
| dotenvx key leaked in logs | Security incident | Audit logs | Document “no debug logs” guidance |

## Security Considerations

- Read-only mount as default.
- Do not commit `.env.keys`.
- Use Docker secrets or secret manager to inject `DOTENV_PRIVATE_KEY_*`.
- Avoid `curl | sh` in production; prefer pinned versions.

## Testing Strategy

- **Manual:**
  - Start Compose and verify copilot can reference a file in `/workspace`.
  - Attempt a write to `/workspace` from copilot container; verify it fails.
  - Verify backend resolves copilot service at `http://copilot:3210`.
- **Automated (future):**
  - Add integration test to assert read-only access and prompt resolution.

## Rollout

1. Add Compose + Dockerfiles (copilot first, then full stack).
2. Update docs and README guidance.
3. Validate with a local end-to-end run.

## Deferred / Follow-up

- Read/write mounts as opt-in (new milestone).
- CI pipeline for Docker image builds.
- Secrets manager integrations beyond local Docker secrets.
