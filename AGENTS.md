# Project Description
We are building a playground for experimenting with GitHub Copilot Chat using the Copilot SDK. This project includes a frontend interface, a backend server, and integration with the Copilot SDK to facilitate interactive chat sessions with AI assistance.

## Quick Start

**This is a pnpm monorepo.** Use `pnpm` for all package management operations (not `npm` or `yarn`).

Common commands:

- `pnpm install` — Install all dependencies
- `pnpm -F @copilot-playground/frontend build` — Build frontend
- `pnpm -F @copilot-playground/backend build` — Build backend
- `pnpm -F <package-name> dev` — Run dev server for a package


## Typescript

Avoid using `any` type — prefer strict typing and leverage TypeScript's type system for safety and clarity.

## AGENTS.md

Also look at '.github/copilot-instructions.md' for overall instructions given to the AI agent.


### Where to start

- **Agent playbooks and guidance:** `docs/agents/README.md` — index of available agent playbooks and templates.
- **Library reference docs:** `docs/library/README.md` — index of library-level references (Copilot SDK, Copilot CLI).
- **Copilot SDK guidance:** `docs/agents/copilot-sdk/README.md` (quick usage, tests and patterns).

## Memory Bank

Instruction for Memory at `.github/instructions/memory-bank.instructions.md`.

We also follow `.github/instructions/spec-driven-workflow-v1.instructions.md` for spec-driven workflow. This should inform designs/specs to create in `/memory/designs/` and tasks in `/memory/tasks/`.

The Memory Bank is located in the `memory/` folder. It contains:

- `activeContext.md` — Current context and relevant information for the agent.
- `progress.md` — Ongoing progress updates and logs.

### Memory Bank Tasks

- `memory/tasks/`: Individual task files with EARS-style requirements and implementation plans.

### Memory Bank Designs

The `memory/designs/` folder contains design documents that outline the architecture and specifications for various features and components in the project.

## Agent skills

You can discover skills to progressively load from the `.github/skills/` folder. Non-exhaustive list:

- `.github/skills/frontend-design` — Skills related to designing and implementing frontend user interfaces.
- `.github/skills/typescript` — Skills focused on TypeScript programming and best practices.
- `.github/skills/vercel-react-best-practices` — Skills around best practices for React.
- `.github/skills/typescript-advanced-types` — Advanced TypeScript concepts and techniques.

and more.

## Agents in Copilot Chat Playground

We have potential agent/subagents to execute in the `.github/agents/` folder. Non-exhaustive list:

- `.github/agents/code-review-subagent.agent.md` — An agent specialized in performing code reviews on provided code snippets.
- `.github/agents/planning-subagent.agent.md` — An agent focused on planning tasks and organizing information effectively.
- `.github/agents/implement-subagent.agent.md` — An agent dedicated to implementing features or code based on given requirements.

## Library Documentation

`docs/library/` folder — technical reference & cookbooks.

### Copilot SDK Notes

We compiled documentation for using the Copilot SDK in the 'docs/library/copilot-sdk/' directory. This includes guides on installation, streaming events, tool definitions, system messages, architecture suggestions, and logging practices.

### Copilot CLI Notes

We also have notes for using the Copilot CLI in 'docs/library/copilot-cli/'. This covers installation, authentication, command usage, configuration, and troubleshooting.

### Additional Resources

If you feel something is missing or could be improved, consider proposing additional folders with structured notes in `/docs/library`.


## Agent Guidance

See `/docs/agents` for additional agent guidance and playbooks. For Red vs Blue specifics, prefer `/docs/agents/redvsblue` to learn component, engine, telemetry, and renderer patterns when in doubt. For testing guidance, see `/docs/agents/testing`.

