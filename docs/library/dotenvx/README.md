# dotenvx (Docker + secrets guidance)

## Purpose in this repo

`dotenvx` is recommended when you want encrypted `.env` files and runtime decryption in containers. The encrypted `.env` files can be committed, while private keys **must** remain out of source control and out of container images.

This guidance is tailored for the copilot container and Docker Compose workflows in this repo.

## Encrypted env workflow (recommended)

1. Encrypt env files (e.g., `.env.production`) with `dotenvx`.
2. Commit the encrypted `.env.production` to the repo.
3. Keep `.env.keys` **private** (local secret store, secrets manager, or Docker secrets). **Never commit it.**
4. At runtime, inject the appropriate `DOTENV_PRIVATE_KEY_*` environment variable so `dotenvx run --` can decrypt.

> The private key name must match the env file suffix:
>
> - `.env` → `DOTENV_PRIVATE_KEY`
> - `.env.production` → `DOTENV_PRIVATE_KEY_PRODUCTION`

## Docker/Compose runtime key injection (secrets-first)

### Recommended (production-safe)

Use a **secret manager** or **Docker secrets** and map the private key to `DOTENV_PRIVATE_KEY_*` at runtime. Avoid baking keys into images or passing them via CLI flags for production.

Suggested pattern:

- Store the key as a secret (Docker secrets, Kubernetes secrets, cloud secret manager).
- Mount the secret as a file whose **filename matches the env var**, e.g. `/run/secrets/DOTENV_PRIVATE_KEY_PRODUCTION`.
- At container start, read the file and export `DOTENV_PRIVATE_KEY_PRODUCTION` before running the app.

Example entrypoint pattern (conceptual):

- Read `/run/secrets/DOTENV_PRIVATE_KEY_PRODUCTION`.
- Export `DOTENV_PRIVATE_KEY_PRODUCTION` using the file contents.
- Run: `dotenvx run -f .env.production -- <your command>`.

### Local dev (acceptable, but not for production)

Passing `DOTENV_PRIVATE_KEY_*` via `environment:` in Compose or `-e` is convenient but less secure. Only use this locally and never commit real keys.

## Safe install guidance

Prefer a **pinned, reviewable install** method:

- Install as a dependency: `@dotenvx/dotenvx` (recommended for Node projects)
- Download from GitHub Releases (pinned version)

The `curl | sh` installer is convenient for demos, but should be reviewed and pinned before production use.

## Guardrails

- **Never** commit `.env.keys`.
- **Never** bake private keys into container images.
- **Avoid** logging `DOTENV_PRIVATE_KEY_*` or decrypted values.
- **Do** commit encrypted `.env.*` files when using dotenvx.

## References

- [Docker guide](https://dotenvx.com/docs/platforms/docker)
- [Install options](https://dotenvx.com/docs/install)
- [`.env` format](https://dotenvx.com/docs/env-file)
- [`.env.keys` format](https://dotenvx.com/docs/env-keys-file)
