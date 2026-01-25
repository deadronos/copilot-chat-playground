# Copilot SDK — Quick Usage Notes

This document contains short snippets and conventions for agents working with the Copilot SDK wrapper in this repo.

## Creating a session with a system prompt

```ts
// default append mode (recommended)
await service.chat(prompt, requestId, 'Please be concise and safe')

// explicit replace mode (overrides guardrails)
await service.chat(prompt, requestId, 'You are a focused security auditor', 'replace')
```

## Listening to streaming events

```ts
const session = await client.createSession({ model: 'gpt-4o', streaming: true, systemMessage })
session.on((ev) => {
  if (ev.type === 'assistant.message_delta') {
    // append ev.data.deltaContent to buffer
  } else if (ev.type === 'assistant.message') {
    // final content
  }
})
await session.sendAndWait({ prompt })
```

## Testing notes

- In unit tests, mock the SDK with `vi.mock('@github/copilot-sdk')` and spy on `createSession`.
- Provide a mock session that emits `assistant.message_delta`, `assistant.message` and `session.idle` inside `sendAndWait()`.

## Security

- Always call `validateToken()` before starting a session. Provide clear errors for missing/invalid tokens.

## Docs

- More detailed API reference: `/docs/library/copilot-sdk`
