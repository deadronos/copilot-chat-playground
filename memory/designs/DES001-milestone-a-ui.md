# DES001 - Milestone A UI-only (Fake Streaming)

## Analyze
- Goal: deliver the Milestone A UX with a fake streaming backend (no Copilot dependency).
- Scope: frontend prompt UI + streaming reader + backend streaming endpoint.
- Constraints: Vite/React + shadcn/ui; Node/Express backend; local-only.

## EARS Requirements
- When the app loads and no output exists, the textarea shall show a placeholder reading "Type a prompt...".
- When the user clicks Send with a non-empty prompt, the UI shall set status to waiting, disable the Send button, and show "Waiting..." in the output area.
- When the backend begins streaming, the UI shall append chunks incrementally into the output area.
- When streaming completes, the UI shall set status to done and re-enable the Send button.
- When a request fails, the UI shall set status to error and display a visible error message.
- When the backend receives a valid prompt, it shall stream a fake response in chunks roughly every 100ms.

## Design
- API: `POST /api/chat` with `{ prompt: string }` returning streamed `text/plain`.
- Frontend state: `prompt`, `output`, `status`, `error`.
- UX: bold editorial layout with distinct typography and a visible status pill.
- Streaming: use `fetch` + `ReadableStream` + `TextDecoder`, append as chunks arrive.

## Implement
- Backend: validate prompt with zod, set chunked response headers, stream in a loop, handle client disconnect.
- Frontend: form submit handler, status transitions, placeholder logic, and output streaming.
- Styling: custom font pairing and a layered background with subtle motion.

## Validate
- Manual: submit a prompt and observe waiting -> streaming -> done.
- Manual: simulate backend error (stop backend or send empty prompt) and verify error message.

## Reflect / Handoff
- Future: add abort support, docker-compose, and switch to real Copilot proxy (Milestone B).
