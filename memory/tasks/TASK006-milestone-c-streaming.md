# [TASK006] - Milestone C: End-to-End Streaming

**Status:** In Progress  
**Added:** 2026-01-23  
**Updated:** 2026-01-23

## Original Request

Create a formal task for Milestone C with a TDD plan and start implementing streaming (backend + tests).

## Thought Process

Streaming is already supported in the frontend UI, but the backend still buffers responses. The backend should proxy a streaming response from the copilot service (or gracefully fall back to the buffered `/chat` endpoint). The work must keep `/api/chat` stable, add abort handling, and introduce tests that prove the backend streams from a mock copilot server.

## Implementation Plan (TDD)

1. **Red**: Add backend test that requires `/api/chat` to stream from a mock `/chat/stream` endpoint.
2. **Green**: Implement backend streaming proxy with upstream abort handling and a `/chat/stream` fallback strategy.
3. **Refactor**: Extract `createApp()` for testability and keep existing error mappings.
4. **Extend**: Add fallback test for when `/chat/stream` is unavailable.

## Progress Tracking

**Overall Status:** In Progress - 70%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Add failing backend streaming test | Complete | 2026-01-23 | Uses mock copilot stream |
| 1.2 | Implement backend streaming proxy | Complete | 2026-01-23 | Add abort handling + fallback |
| 1.3 | Add fallback test for non-streaming | Complete | 2026-01-23 | Validate buffered fallback |
| 1.4 | Refactor backend app export | Complete | 2026-01-23 | `createApp()` for tests |

## Progress Log

### 2026-01-23

- Task created and linked to DES006 for Milestone C streaming.
- Added unit tests for backend streaming and fallback behavior.
- Introduced `createApp()` for backend testability and wired entrypoint to use it.
- Implemented streaming proxy with upstream abort handling and buffered fallback.
- Extended backend unit tests to cover auth and token-missing error mappings.
- Added tests for connection failures and empty streaming responses with buffered fallback.
