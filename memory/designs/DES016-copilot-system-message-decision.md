# DES016 — Copilot SDK: SystemMessageConfig Decision

**Status:** Approved ✅

**Date:** 2026-01-25


## Decision

When creating SDK sessions, agents should pass an explicit `SystemMessageConfig` object instead of a raw string. The default behavior will be `mode: 'append'` (append system content to SDK-managed guardrails), and agents may opt-in to `mode: 'replace'` to fully override the defaults (use carefully).


## Context

- The `@github/copilot-sdk` exposes a `createSession({ systemMessage?: SystemMessageConfig })` option. The simple earlier approach cast a string into the type which bypassed the SDK's intended structure.

- Explicitly constructing a typed `SystemMessageConfig` improves readability, maintainability, and correctness. It also makes it trivial to change behavior (append vs replace) without ad-hoc casting.


## Options considered

- A: Continue casting a string to `SystemMessageConfig` (fast, but brittle).

- B: Always require callers to pass a full `SystemMessageConfig` object (safer, explicit).

- C: Keep backward-compatible helper that accepts string but converts into `SystemMessageConfig` internally (chosen).


## Rationale

- Option C provides a pragmatic migration path: agents can pass either a string or call the helper method `CopilotSDKService.chat(prompt, requestId, systemPrompt?, systemMode?)` which builds the explicit object. This keeps call sites simple while ensuring the SDK receives the correct shape.

- Defaulting to `mode: 'append'` preserves guardrails and is the safest default for most agents.


## Implementation Notes

- `CopilotSDKService.chat(prompt, requestId?, systemPrompt?, systemMode?)` constructs:

  - `const systemMessage = systemPrompt ? ({ content: systemPrompt, mode: systemMode ?? 'append' } as SystemMessageConfig) : undefined`

- Tests should assert that `createSession` receives `systemMessage.content` and `systemMessage.mode` when provided.

- Add agent docs in `docs/agents/copilot-sdk/README.md` and `USAGE.md` (done).


## Acceptance Criteria

- Unit tests assert that `createSession` was called with a `systemMessage` object with `content` matching the passed string and `mode` matching the provided mode.

- Integration with SDK does not change default guardrail behavior (append) unless `mode: 'replace'` is explicitly passed.


## Risks & Mitigations

- Risk: Agents might inadvertently override guardrails with `mode: 'replace'`. Mitigation: Document risk in agent README and ensure reviewers confirm intent when `replace` is used.


## Rollback

- Revert the `CopilotSDKService.chat` change and restore prior casting behavior if necessary, but this reduces type safety and is not recommended.


---

**Author:** GitHub Copilot (agent-assisted) — implemented and tested 2026-01-25
