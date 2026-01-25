# Agent Playbooks — `/docs/agents`

This directory contains guidance, playbooks, and templates for agents operating in this repository. Use these documents when you need to implement agent behavior, tests, or operational practices tied to a component (e.g., Copilot SDK, RedVsBlue).

Quick start

- Start here: `/docs/agents/README.md` (this file) — an index of agent playbooks.
- Per-agent playbooks provide: purpose, when to consult, key files, tests, and example usage.

Agent playbooks

- `/docs/agents/copilot-sdk/README.md` — How to call the Copilot SDK safely and tests/mocks for the SDK. (See `/docs/library/copilot-sdk` for deeper reference.)
- `/docs/agents/redvsblue/README.md` — Playbook for Red vs Blue agents (engine, renderer, telemetry patterns). (If missing, add a short playbook.)
- `/docs/agents/testing/README.md` — Testing playbook and patterns for writing deterministic agent tests (mocking streaming SDKs, fixtures).

Contributing agent docs

See `/docs/agents/_CONTRIBUTING.md` for guidance on naming conventions, templates, and a short checklist for PRs that add or update agent docs.

Templates

- `/docs/agents/TEMPLATE-playbook.md` — Basic playbook template to create a new agent guide.

Notes

- Keep playbooks short (1–2 pages) and actionable.
- Link to `/docs/library/` for deeper technical references and API docs.
