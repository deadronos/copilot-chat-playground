# Milestone E — Workspace Mounts & Secret Handling

## Purpose

This document provides concise, security-focused guidance for Milestone E (workspace access / mounting) when running the project with Docker / Docker Compose.

## Key principle — secrets first

- Use a **secrets-first** workflow: keep private keys (for example, `.env.keys`) out of source control and out of container images.
- Prefer injecting keys at runtime using Docker secrets or a trusted secrets manager and mapping them to `DOTENV_PRIVATE_KEY_*` variables (see `docs/library/dotenvx/README.md`).

## Workspace mounts — caution

- **Bind-mounting a host workspace** into a container can expose host secrets (for example, `.env.keys`, `.ssh/`, or IDE settings) to the container and other services that share the mount.
- When mounting the workspace:
  - Prefer **read-only** mounts for code artifacts that don't need write access.
  - Explicitly exclude secrets from mounts (use `.dockerignore` and Compose `volumes:` carefully).
  - Never mount host secret stores (like `~/.ssh` or `~/.aws`) unless strictly required and you fully understand the risk.

### Example — read-only bind mount (Compose)

A minimal Compose snippet that mounts the project directory read-only:

```yaml
services:
  app:
    image: node:20
    working_dir: /workspace
    volumes:
      - ./src:/workspace:ro  # host ./src mounted read-only inside container
    command: sh -c "ls -la /workspace && sleep infinity"
```

### Verification steps

1. Start the service (detached):

   ```bash
   docker-compose up -d
   ```

2. Try to create a file in the mounted path (should fail):

   ```bash
   docker-compose exec app sh -c 'touch /workspace/should_fail 2>/dev/null || echo "read-only mount"'
   ```

   Expected output: `read-only mount` and no `/workspace/should_fail` file present.

3. Check that no file was created:

   ```bash
   docker-compose exec app sh -c 'if [ -f /workspace/should_fail ]; then echo "WRITE OK"; else echo "READONLY"; fi'
   ```

   Expected output: `READONLY`.

4. Optionally verify mount options from inside the container:

   ```bash
   docker-compose exec app sh -c 'grep /workspace /proc/mounts || mount | grep /workspace'
   ```

   The mount entry should include `ro` in its options showing the bind is read-only.


## Recommended patterns

- Use Docker secrets or a secrets manager for private keys:
  - Store key as a secret; mount it as `/run/secrets/<name>`.
  - At container start, export `DOTENV_PRIVATE_KEY_*` from the secret and run: `dotenvx run -f .env.* -- <cmd>`.
- For local development only (not production), `environment:` or `-e` is acceptable but less secure — **do not commit real keys**.

## Minimal checklist

- [ ] Add `.env.keys` to `.gitignore` and `.dockerignore` (do not commit keys).
- [ ] Use Compose secrets or a secret manager for production use.
- [ ] Avoid baking secrets into images.
- [ ] Prefer read-only workspace mounts where possible.

## References

- Repository `dotenvx` guidance: `docs/library/dotenvx/README.md`
- Milestone plan: `plans/milestone-e-workspace-mount-plan.md`
