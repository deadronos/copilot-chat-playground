# [TASK009] - Document & Validate "secrets-first" dotenvx pattern

**Status:** Pending
**Added:** 2026-01-24
**Updated:** 2026-01-24

## Original Request

Add explicit documentation and CI checks for the secrets-first pattern introduced for `dotenvx` encrypted envs. Provide examples for Docker secrets, mounted files, and a CI job that scans build context and image layers for private keys.

## Implementation Plan

- [ ] Create `docs/secrets.md` with examples for Docker Compose, Docker secrets, and local-dev fallback.
- [ ] Add a lightweight CI job that scans the build context for `.env.keys` and fails the build if found.
- [ ] Add a sample script/check to scan image layers for `.env.keys` or patterns that look like private keys.
- [ ] Link design `DES009` in docs and update `README.md` to reference the secrets guidance.
- [ ] Add a small integration test to `tests/` that runs Compose with a mounted `dotenvx` key and confirms decryption.

## Progress Tracking

**Overall Status:** Not Started - 0%

## Progress Log

### 2026-01-24

- Task created to formalize secrets-first docs and CI checks.