# Project Brief

**Name:** Copilot Chat Playground

**Purpose:** Provide a local-first developer playground for experimenting with the GitHub Copilot Chat experience (SDK + CLI + UI), enabling safe local development, predictable Dockerized workflows, and clear operational guidance for secrets, mounts, and integration.

**Target users:** Developers building conversational agents, SDK integrators, and contributors testing Copilot integrations locally.

**Primary goals:**
- Fast local iteration (frontend + backend + copilot service) via Docker Compose and native dev commands.
- Safe-by-default secrets handling (encrypted envs, secrets-first pattern) and workspace access (read-only mounts).
- Reproducible integration patterns for Copilot SDK vs. CLI modes.

**Success criteria:**
- A documented, working Compose setup that starts frontend, backend, and copilot services locally.
- No secret keys baked into images or committed to repo; secrets are injected at runtime (secrets or mounted files).
- `README.md` and `docs/` clearly describe running the full stack and security guardrails.

**Notes:** This repository uses a Memory Bank to track designs, tasks, and progress under `/memory`.