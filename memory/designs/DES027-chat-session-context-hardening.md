# DES027 - Chat session context hardening

**Status:** Implemented
**Related tasks:** TASK032

## Summary

Polish the conversation-history persistence PR so stored chat state is safer and more useful. The design hardens client-side persistence, ensures the latest prompt is included in submitted conversation context, and teaches the backend to accept and consume `sessionId`/`messages` for context-aware prompting.

## Goals

- Preserve chat history without crashing when storage access is blocked.
- Ensure the latest in-flight prompt is included in the conversation context sent to the backend.
- Allow the backend chat endpoint to validate and consume `sessionId` and `messages`.
- Restore backend observability coverage that was dropped during refactoring.

## Design

- Add safe storage helpers that lazily resolve `localStorage` and gracefully fail closed when access is unavailable or writes are rejected.
- Build request messages from the existing timeline plus the current prompt before state updates, avoiding React state timing races.
- Extend `ChatRequestSchema` with `sessionId` and `messages` and convert those values into a contextual prompt string before calling the copilot service.
- Re-add observability unit tests and extend frontend/backend tests to cover the new behavior.

## Acceptance criteria

- Chat persistence no longer throws when storage access is blocked; failed writes are treated as non-fatal.
- The submitted conversation context includes the current prompt even before the timeline state update lands.
- Backend chat requests accept `sessionId` and `messages` and incorporate them into the generated prompt.
- Observability tests are restored and all targeted frontend/backend tests pass.

---

Created: 2026-03-15
