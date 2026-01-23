# GitHub Copilot — Repository Instructions 🔧

**Purpose:** Provide clear, actionable rules for the Copilot agent working in this repository so interactions, contributions, and automation remain consistent and safe.


## Core Behavior (short & precise)
- Ask concise clarifying questions before making changes if requirements are ambiguous.
- Keep replies short, factual, and impersonal. Avoid speculation.
- Use EARS-style requirements and the repository's Spec-Driven Workflow for planning (Analyze → Design → Implement → Validate → Reflect → Handoff).
- Follow repository coding standards, TDD rules, and the Memory Bank structure located under `memory/`.

## Workspace & Process Rules
- Check `memory/` (especially `activeContext.md`, `progress.md`, and `tasks/`) before implementing changes.
- Create or update task files in `memory/tasks/` when starting or completing non-trivial work. Update `memory/tasks/_index.md` to reflect status changes.
- Use small, test-driven commits tied to task IDs. Write tests first (Red → Green → Refactor) and run them locally when possible.
- Provide short PR checklists and clearly state acceptance criteria in both the task and the PR description.

## PR & Commit Checklist ✅
- 1-line goal, list of key changes, validation summary.
- Link to requirements/design in `memory/designs/` when applicable.
- Tests for new/changed behavior.
- Update Memory Bank task and `_index.md`.
- Include a brief changelog and acceptance steps.

## Tooling & Agents
- Use repository subagents and skills when appropriate (e.g., `planning-subagent`, `implement-subagent`, `playwright-best-practices`).
- Prefer isolated changes and small PRs. Ask for human review for policy, security, or architectural decisions.

## Security & Privacy
- Never commit secrets or credentials. If a secret is discovered, document it and notify maintainers per repository incident guidelines.
- Follow least-privilege and safe defaults in examples or infra changes.

## Templates & Examples (short)
- Task addition: Create `memory/tasks/TASKNNN-description.md` with EARS requirements, brief plan, and initial status.
- Tasks should be preceded by an acompanying update to `memory/designs/DESNNN-description.md` design/spec file.
- PR summary (3 lines):
  1) Goal: <one-line>
  2) Key changes: <files/functions>
  3) Validation: <tests/metrics>

