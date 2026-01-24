# Docker Setup Guide — Copilot Chat Playground 🔧

## TL;DR ⚡

Quick: install Docker & Compose, then run the full stack with `docker compose up --build`. Use **secrets-first** patterns (Docker secrets or secret manager) for dotenvx keys; keep `.env.keys` out of the repo.

---

## Prerequisites ✅

- Docker (Engine) and Docker Compose (v2+ recommended)
- Corepack + pnpm for local build consistency (optional for builds inside Docker)
  - Example: `corepack enable && pnpm install`
- Familiarity with `docker compose` commands and basic Docker troubleshooting

---

## Quick start (dev) ▶️

1. Build & run full stack (frontend + backend + copilot):

   ```bash
   docker compose up --build
   ```

2. Run in detached mode:

   ```bash
   docker compose up -d --build
   ```

3. Verify services:

   ```bash
   docker compose ps
   docker compose logs -f copilot
   ```

### Endpoints

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Copilot service: `http://localhost:3210`

> Note: The backend is configured to use the service DNS name for Copilot: `COPILOT_SERVICE_URL=http://copilot:3210` in Compose.

---

## Run individual services

- Start only Copilot: `docker compose up -d copilot`
- Start only Backend: `docker compose up -d backend`
- Rebuild a single service: `docker compose up -d --build copilot`

---

## Secrets & dotenvx (secrets-first) 🔒

- **Do not** bake `.env.keys` into images or commit them to Git. Use Docker secrets or an external secret manager to inject `DOTENV_PRIVATE_KEY_*` at runtime.
- Example (compose snippet):

```yaml
services:
  copilot:
    secrets:
      - DOTENV_PRIVATE_KEY_PRODUCTION
secrets:
  DOTENV_PRIVATE_KEY_PRODUCTION:
    file: ./secrets/DOTENV_PRIVATE_KEY_PRODUCTION
```

- The copilot image entrypoint reads `/run/secrets/DOTENV_PRIVATE_KEY_*` and exports `DOTENV_PRIVATE_KEY_*` for `dotenvx` usage. See `docs/library/dotenvx/README.md` for details.

> Tip: For local dev (not production), you can pass env values via `environment:` in Compose for convenience, but never commit real keys.

---

## Workspace mounts & safety (read-only recommended) 🗂️

- Default, safe mount in Compose (example):

```yaml
services:
  copilot:
    volumes:
      - ./workspace:/workspace:ro
    working_dir: /workspace
```

- Verify read-only mount inside container:

```bash
docker compose exec copilot sh -c 'touch /workspace/should_fail 2>/dev/null || echo "read-only mount"'
# Expected: prints "read-only mount"
```

- Check mount options:

```bash
docker compose exec copilot sh -c 'grep /workspace /proc/mounts || mount | grep /workspace'
# Look for `ro` in the mount options
```

- Warning: Bind mounts can expose host secrets (e.g., `.env.keys`, `.ssh/`) — ensure `.dockerignore` and Compose exclude those paths.

See also `docs/milestone-e-workspace-mount.md` for more guardrails and verification steps.

---

## Troubleshooting & tips 🛠️

- Healthcheck failures: the copilot image exposes a health endpoint; check `docker compose logs` and ensure the container has the required runtime files.
- Volume masking: bind-mounting the project over `/workspace` can hide built files and `node_modules` copied into the image. Use named volumes for `node_modules` or run `pnpm install` at container start in dev scenarios.
- Windows mounts: Windows can behave differently for permissions. If tests show write permission problems, verify mount flags and try using WSL2.
- Ports already in use: change the host mapping in `docker-compose.yml` or stop the process holding the port.

---

## Production & build notes 🏗️

- Use deterministic installs in Dockerfile:

```dockerfile
RUN corepack enable && pnpm install --frozen-lockfile --prod
```

- Keep `pnpm-lock.yaml` available to Docker builds for reproducible images.
- Prefer non-root runtime user in production and avoid publishing service ports unless needed.

---

## Minimal checklist before deploying ✅

- [ ] `.env.keys` NOT present in repo and listed in `.gitignore` / `.dockerignore`
- [ ] Secrets injected at runtime (Docker secrets or secret manager)
- [ ] Workspace mounts are read-only unless write access is explicitly required
- [ ] `pnpm-lock.yaml` used for deterministic builds
- [ ] Healthchecks and logging verified for each service

---

## References 🔗

- Milestone E workspace mount doc: `docs/milestone-e-workspace-mount.md`
- dotenvx guidance: `docs/library/dotenvx/README.md`
- Repo root README: `README.md`

---

If you want, I can add a short `docker` section to `README.md` linking this guide and add a small verification script or CI check for secrets. ✨
