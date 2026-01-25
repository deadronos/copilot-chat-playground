# Copilot SDK — Agent Guidance 📡

This folder documents how agents should *use, type-check, test, and mock* the `@github/copilot-sdk` integration found in the repository (`src/copilot/src/copilot-sdk.ts`). See also the SDK reference and cookbook at `/docs/library/copilot-sdk` (API reference and examples).


## Goal

- Keep agent code consistent and strongly-typed when calling the SDK.
- Standardize how system prompts are passed and tested.
- Provide quick reference examples for common patterns (streaming, events, errors, tests).


---


## Quick links

- Local SDK wrapper: `src/copilot/src/copilot-sdk.ts` ✅
- Unit tests: `tests/copilot/unit/copilot-sdk.test.ts` ✅
- Library docs (full SDK reference): `/docs/library/copilot-sdk`


---


## Key types & patterns

- **SystemMessageConfig**
  - shape: `{ content: string; mode?: 'append' | 'replace' }`
  - Use `mode: 'append'` to add content to the default persona; `mode: 'replace'` to override guardrails/persona.

- **Session creation**
  - Use `client.createSession({ model, streaming, systemMessage })` where `systemMessage` is a `SystemMessageConfig` (not a raw string).

- **Event handling (session.on)**
  - Listen for `assistant.message_delta` (stream chunk), `assistant.message` (final), `session.idle` (done), `session.error`.
  - Buffer `deltaContent` to build the final result when streaming.


---


## Usage example (agent code)

Preferred: construct an explicit `SystemMessageConfig`

```ts
const systemMessage = systemPrompt ? ({ content: systemPrompt, mode: systemMode ?? 'append' }) : undefined
const session = await client.createSession({ model: 'gpt-4o', streaming: true, ...(systemMessage && { systemMessage }) })
```

Streaming: subscribe to `session.on(event => { /* handle event.type and event.data */ })` and call `sendAndWait()` or `send()` accordingly.


---


## Error handling & auth

- Use `validateToken()` helper to enforce GH_TOKEN presence and plaintext tokens (no encrypted dotenvx values).
- Treat auth-related errors specially (`errorType: 'auth' | 'token_missing'`) and surface telemetry/logging events for observability.


---


## Testing & Mocking (recommended)

- Use Vitest + `vi.mock('@github/copilot-sdk')` to stub `CopilotClient` and `createSession`.
- Spy on `createSession` to assert `systemMessage` content and mode are forwarded (see `tests/copilot/unit/copilot-sdk.test.ts`).
- For streaming behavior, the mock session should call the handler with `assistant.message_delta` and then produce `assistant.message` and `session.idle` events in `sendAndWait()`.


---


## Security & ops notes

- Prefer using `validateToken()` before creating sessions to fail fast when GH_TOKEN is missing or invalid.
- For production or CI, prefer short-lifetime granular tokens and ensure CI rotates tokens per org policy.


---


## Where to extend

- If you need to change the system persona programmatically, pass `systemMode: 'replace'` from agents when creating or calling `CopilotSDKService.chat()`.
- Add extra integration tests in `tests/copilot/integration` if you want to run an environment-backed session using a local Copilot CLI server (requires Copilot CLI installed).


