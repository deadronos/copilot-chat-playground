# [DES009] - Secrets-first: dotenvx & encrypted envs

**Status:** Draft
**Added:** 2026-01-24
**Updated:** 2026-01-24

## Summary

Document and formalize the "secrets-first" pattern for using `dotenvx` encrypted environment artifacts with Docker Compose and local development. Provide examples for Docker secrets, mounted key files, and CI-safe handling to ensure keys are never baked into images or committed.

## Goals
- Provide concrete examples for injecting `DOTENV_PRIVATE_KEY_*` at runtime (Docker secrets, `/run/secrets` files, mounted files).
- Add checks/examples to CI to detect accidental key inclusion in images or commits.
- Provide migration steps for teams using plaintext `.env` or alternate secret management.

## Requirements (EARS)
1. WHEN encrypted `.env` is used, THE SYSTEM SHALL require decryption keys to be provided at runtime via secrets or mounted files. **Acceptance:** docs and examples demonstrate Docker secrets and mounted-file use.
2. WHEN building images, THE SYSTEM SHALL NOT include private keys in image layers. **Acceptance:** CI job scans images for `.env.keys` and fails if found.
3. WHEN documentation is updated, THE SYSTEM SHALL include a step-by-step local dev guide and a CI checklist. **Acceptance:** `docs/` contains example snippets and a CI job sample.

## Testing & Validation
- Manual: start Compose with secret mounted and verify app decrypts envs.
- Automated: add a simple CI check that scans build context and image layers for `.env.key` patterns (see `TASK009`).

## Notes
- This design is intentionally narrow and focused on local and CI developer workflows.
