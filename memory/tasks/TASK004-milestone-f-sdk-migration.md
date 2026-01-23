# [TASK004] - Milestone F: Switch to Copilot SDK

**Status:** In Progress  
**Added:** 2026-01-23  
**Updated:** 2026-01-23

## Original Request

Goal: Migrate from spawning the Copilot CLI to using `@github/copilot-sdk` for structured streaming and extensibility.

Deliverables:
- Replace the CLI wrapper with a service using `@github/copilot-sdk`
- Define a structured event/logging design and EventBus for streaming logs and exports
- Maintain the same backend/frontend API surface so UX remains stable

Acceptance criteria:
- Streaming remains functional and robust after migration
- The system becomes easier to extend for tool invocation and structured events
- Tests and documentation are updated to reflect the SDK-based approach

## Thought Process

The migration to the SDK requires several key components:

1. **EventBus Infrastructure**: A lightweight pub/sub system for structured event logging across components
2. **SDK Service Layer**: A new service that wraps the Copilot SDK with proper session management
3. **Mode Toggle**: Support both SDK and CLI modes via environment variable for flexibility
4. **Backward Compatibility**: Ensure the HTTP API surface remains unchanged
5. **Testing**: Add tests for SDK functionality without requiring live token
6. **Documentation**: Update README and create design documentation

The SDK provides structured events which are more reliable than parsing CLI output. We use `session.sendAndWait()` to simplify the async flow while still capturing streaming events.

## Implementation Plan

- [x] Install `@github/copilot-sdk` package
- [x] Create EventBus infrastructure in shared package
  - [x] Define EventBus class with typed events
  - [x] Export from shared package
- [x] Implement CopilotSDKService
  - [x] Client initialization with auto-start
  - [x] Session creation with streaming enabled
  - [x] Event handling for deltas and final messages
  - [x] Proper error handling and cleanup
  - [x] EventBus integration for structured logging
- [x] Update main service index.ts
  - [x] Add USE_COPILOT_SDK environment variable
  - [x] Route to SDK or CLI based on env var
  - [x] Add mode to health check response
  - [x] Implement graceful shutdown handlers
- [x] Add unit tests
  - [x] Test SDK service initialization
  - [x] Test token validation
  - [x] Test error handling
  - [x] Test EventBus integration
- [x] Update documentation
  - [x] Update README with SDK details
  - [x] Document mode switching
  - [x] Document EventBus
  - [x] Create design document (DES004)
- [ ] Manual verification (requires valid GH_TOKEN)
  - [ ] Start service with SDK mode
  - [ ] Send test prompt
  - [ ] Verify response quality
  - [ ] Check log output
  - [ ] Test CLI fallback mode
- [ ] Final validation
  - [ ] Verify all tests pass
  - [ ] Build succeeds
  - [ ] Lint passes (or document pre-existing issues)

## Progress Tracking

**Overall Status:** In Progress - 85%

### Subtasks

| ID  | Description                        | Status    | Updated    | Notes                              |
| --- | ---------------------------------- | --------- | ---------- | ---------------------------------- |
| 1.1 | Install SDK package                | Complete  | 2026-01-23 | Installed @github/copilot-sdk      |
| 1.2 | Create EventBus                    | Complete  | 2026-01-23 | Added to shared package            |
| 1.3 | Implement SDK service              | Complete  | 2026-01-23 | Full event handling + lifecycle    |
| 1.4 | Update main service                | Complete  | 2026-01-23 | Mode toggle + graceful shutdown    |
| 1.5 | Add tests                          | Complete  | 2026-01-23 | 16 tests passing                   |
| 1.6 | Update documentation               | Complete  | 2026-01-23 | README + design doc                |
| 1.7 | Manual verification                | Not Started | -         | Requires valid token              |
| 1.8 | Final validation                   | In Progress | 2026-01-23 | Build + tests pass, lint has pre-existing issues |

## Progress Log

### 2026-01-23

**Phase 1: Setup and Infrastructure**
- Installed `@github/copilot-sdk` version 0.1.16
- Created EventBus class in shared package with typed events
- EventBus extends Node's EventEmitter for simple pub/sub
- Exported EventBus from shared package and linked to copilot service

**Phase 2: SDK Implementation**
- Created `copilot-sdk.ts` with CopilotSDKService class
- Implemented proper SDK client initialization (no token param needed - CLI handles it)
- Added session management with `createSession` and streaming support
- Implemented event handlers for:
  - `assistant.message_delta` - streaming tokens
  - `assistant.message` - final canonical response
  - `session.idle` - turn completion
  - `session.error` - error handling
- Used `session.sendAndWait()` for simplified async flow
- Added EventBus integration for structured logging
- Proper cleanup with `session.destroy()` and `client.stop()`

**Phase 3: Integration**
- Updated `index.ts` to support both SDK and CLI modes
- Added `USE_COPILOT_SDK` environment variable (defaults to SDK)
- Added request ID generation for correlation
- Updated health check to show current mode
- Implemented graceful shutdown handlers (SIGINT, SIGTERM)
- Maintained backward compatible API surface

**Phase 4: Testing and Documentation**
- Created `copilot-sdk.test.ts` with 6 test cases
- All 16 tests pass (10 existing + 6 new)
- Updated README with:
  - SDK architecture overview
  - Mode switching instructions
  - EventBus documentation
  - Implementation details
- Created DES004 design document with:
  - Architecture diagrams
  - Component responsibilities
  - API compatibility details
  - Security considerations
  - Future enhancements

**Build and Lint Status**
- TypeScript compilation succeeds
- Tests pass (16 passed)
- Lint has 2 pre-existing errors in `copilot-cli.ts` (not related to SDK work)

**Next Steps**
- Manual verification requires a valid `GH_TOKEN`
- Should test with real Copilot API to verify end-to-end flow
- CLI fallback mode should also be tested
- Could add integration tests once manual verification confirms functionality
