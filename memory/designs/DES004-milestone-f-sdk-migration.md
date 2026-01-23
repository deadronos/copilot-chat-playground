# DES004 — Milestone F: Copilot SDK Migration

**Status:** In Progress  
**Created:** 2026-01-23  
**Updated:** 2026-01-23

## Overview

Migrate the copilot service from spawning the Copilot CLI to using the `@github/copilot-sdk` for structured streaming and extensibility, while maintaining the same backend/frontend API surface.

## Context

The current implementation (Milestone B) spawns the Copilot CLI as a subprocess and captures stdout/stderr. This approach works but has limitations:

- No structured event streaming
- Limited extensibility for tools and MCP servers
- Harder to handle partial responses and errors
- No built-in support for session management

The Copilot SDK provides:

- Type-safe TypeScript API
- Structured event streaming with deltas and final messages
- Built-in session lifecycle management
- Support for tools and MCP servers
- Better error handling and retries

## Requirements

### Functional Requirements

1. Replace CLI spawning with SDK-based implementation
2. Maintain backward compatibility with existing `/chat` API
3. Support both SDK and CLI modes via environment flag
4. Implement EventBus for structured logging and observability
5. Handle streaming events (deltas, final messages, errors)
6. Properly manage session lifecycle (create, send, wait, destroy)

### Non-Functional Requirements

1. No breaking changes to backend API
2. Maintain or improve response time
3. Support graceful shutdown
4. Provide clear error messages
5. Enable future extensibility for tools

## Design

### Architecture

```
┌─────────────────────────────────────────────┐
│         Copilot Service (index.ts)          │
│                                             │
│  ┌────────────────┐   ┌─────────────────┐  │
│  │   SDK Mode     │   │   CLI Mode      │  │
│  │ (copilot-sdk)  │   │ (copilot-cli)   │  │
│  └────────┬───────┘   └────────┬────────┘  │
│           │                    │           │
│           └──────────┬─────────┘           │
│                      │                     │
│           ┌──────────▼──────────┐          │
│           │     EventBus        │          │
│           │  (structured logs)  │          │
│           └─────────────────────┘          │
└─────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    @github/copilot-sdk    child_process.spawn
           │                    │
           ▼                    ▼
    Copilot CLI (JSON-RPC)  Copilot CLI (stdout)
```

### Components

#### 1. CopilotSDKService (`copilot-sdk.ts`)

**Responsibilities:**
- Initialize and manage CopilotClient
- Create and manage sessions
- Handle streaming events
- Emit structured logs via EventBus
- Manage session lifecycle

**Key Methods:**
- `initialize()` - Start the SDK client
- `chat(prompt, requestId?)` - Send prompt and wait for response
- `stop()` - Gracefully shutdown the client

**Event Handling:**
- `assistant.message_delta` - Accumulate streaming tokens
- `assistant.message` - Capture final canonical response
- `session.idle` - Detect turn completion
- `session.error` - Handle errors

#### 2. EventBus (`shared/event-bus.ts`)

**Responsibilities:**
- Provide pub/sub for structured events
- Support log aggregation
- Enable future SSE/WebSocket streaming

**Interface:**
```typescript
interface LogEvent {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  component: string;
  request_id?: string;
  session_id?: string;
  event_type: string;
  message: string;
  meta?: Record<string, unknown>;
}

class EventBus extends EventEmitter {
  emitLog(event: LogEvent): void;
  onLog(handler: (event: LogEvent) => void): void;
  offLog(handler: (event: LogEvent) => void): void;
}
```

#### 3. Main Service (`index.ts`)

**Responsibilities:**
- Route between SDK and CLI modes based on `USE_COPILOT_SDK` env var
- Maintain existing HTTP API surface
- Handle graceful shutdown

**Environment Variables:**
- `USE_COPILOT_SDK` - Set to `"false"` to use CLI mode (default: SDK mode)
- `GH_TOKEN` / `GITHUB_TOKEN` - GitHub authentication token
- `PORT` - Service port (default: 3210)

### API Compatibility

The `/chat` endpoint maintains the same request/response format:

**Request:**
```json
{
  "prompt": "What is GitHub Copilot?"
}
```

**Response (Success):**
```json
{
  "output": "GitHub Copilot is..."
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "errorType": "token_missing" | "auth" | "sdk" | "spawn" | "unknown"
}
```

### Session Management

SDK Mode:
1. Create session with `streaming: true` and `model: "gpt-4o"`
2. Register event handlers for deltas and final messages
3. Send prompt with `session.sendAndWait()`
4. Wait for `session.idle` event (handled by SDK)
5. Destroy session after response

### Error Handling

SDK Mode errors:
- Token validation failures → `token_missing`
- SDK initialization errors → `sdk`
- Authentication errors → `auth`
- Session errors → `sdk`

CLI Mode errors (unchanged):
- Token validation failures → `token_missing`
- Spawn failures → `spawn`
- Authentication errors → `auth`

## Testing Strategy

### Unit Tests

1. `copilot-sdk.test.ts`
   - Service initialization
   - Token validation
   - Error handling
   - EventBus integration

### Integration Tests

1. HTTP endpoint tests with SDK mode
2. End-to-end flow validation
3. Error response validation

### Manual Testing

1. Start service with SDK mode (default)
2. Send chat request and verify response
3. Check logs for structured events
4. Test with invalid token
5. Test CLI fallback mode

## Migration Path

1. ✅ Install `@github/copilot-sdk` package
2. ✅ Create EventBus infrastructure
3. ✅ Implement `CopilotSDKService`
4. ✅ Update main service to support both modes
5. ✅ Add unit tests
6. ✅ Update documentation
7. 🔄 Manual verification (requires token)
8. 🔄 Integration tests (requires token)

## Future Enhancements

1. **Streaming to Frontend**: Use EventBus with SSE/WebSocket to stream events to UI
2. **Tool Support**: Add tool definitions and handlers for extended functionality
3. **MCP Servers**: Integrate MCP servers for GitHub operations
4. **Log Export**: Add endpoint to export logs as NDJSON/JSON
5. **Session Persistence**: Support resuming sessions across requests
6. **Model Selection**: Allow frontend to specify model

## Security Considerations

1. Token remains server-side only
2. EventBus logs should not include sensitive data
3. Request IDs for correlation without exposing tokens
4. Graceful shutdown prevents token leaks
5. Error messages sanitized for client consumption

## References

- [Copilot SDK Documentation](../../docs/library/copilot-sdk/)
- [idea.md Milestone F](../../idea.md#milestone-f--switch-to-copilot-sdk-optional)
- [Copilot SDK GitHub Repo](https://github.com/github/copilot-sdk)
