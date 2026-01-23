# 03 — Streaming & events

## The event stream in plain English

With `streaming: true`, the SDK emits events as the assistant works:

- **Delta events**: partial tokens for message/reasoning
- **Final events**: completed message/reasoning
- **Tool events**: tool started/ended
- **Session events**: idle / error

### Practical UI rule

- Render deltas live as they arrive
- Treat the final `assistant.message` as canonical
- Consider `session.idle` the “turn complete” marker

## Suggested event handling strategy

Maintain per-session state:

- `currentMessageId` (when you see deltas)
- `bufferByMessageId[messageId]` for `assistant.message_delta`
- `finalMessages[]` when `assistant.message` arrives

This prevents weird UI issues when:

- multiple messages exist in history
- you resume a session
- you implement “enqueue” mode

## Abort vs timeout

- A timeout on waiting for completion is not the same as aborting.
- Prefer explicit `session.abort()` when the user presses Cancel.

## Sources

- Copilot SDK getting started (streaming events): <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
- Copilot SDK cookbook (error handling + multiple sessions): <https://github.com/github/copilot-sdk/blob/main/cookbook/README.md>
