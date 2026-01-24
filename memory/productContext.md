# Product Context

**Why this project exists:**
- To provide a reproducible local environment for experimenting with GitHub Copilot Chat integrations and to document safe operational practices (secrets, mounts, compose wiring).

**Problems it solves:**
- Eliminates uncertainty in local integration testing (consistent Compose and Docker behavior).
- Reduces accidental secret leakage by enforcing a secrets-first pattern for encrypted envs (dotenvx).
- Demonstrates practical patterns for workspace file references in prompts while preserving safety boundaries.

**How it should work:**
- Developers start a local Compose stack or run services individually.
- Copilot service reads `./workspace` by default in read-only mode; secrets are provided at runtime via Docker secrets or mounted key files.
- Docs and designs live in `/memory` for discoverability and to support the Spec-Driven Workflow.

**User experience goals:**
- Quick start under 5 minutes for a new contributor.
- Clear warnings and guardrails around secrets and workspace mounts.
- Minimal friction switching between CLI and SDK integration modes.