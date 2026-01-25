# Contributing Agent Docs — Quick Guide

This short guide explains conventions for contributing to `/docs/agents`:

- File names:
  - Use a short folder per agent: `docs/agents/<agent-name>/README.md`.
  - For short snippets or usage: `USAGE.md` or `TIPS.md` inside the folder.

- Template:
  - Use `/docs/agents/TEMPLATE-playbook.md` as a starting point.

- Content checklist for PRs:
  - Purpose: Why this playbook exists (1 sentence).
  - When to consult: 2–4 situations.
  - Key files: list of repository paths to inspect.
  - Tests: reference unit/integration tests that prove behavior.
  - Example usage snippets.

- Linting:
  - Keep headings and lists separated by blank lines.
  - Run `pnpm -r lint` to validate markdown & code lint rules.

- Reviews:
  - Tag one maintainer who knows the subsystem (e.g., Copilot/RedvsBlue) and ask them to confirm any security-sensitive content (e.g., system prompt `replace` usage).

