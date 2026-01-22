# Copilot CLI Local Playground – Idea & Milestones

A small **local-only learning project** with:

- **Vite + React** frontend using **shadcn/ui**
- A **Node.js backend** that streams responses to the browser
- A separate **Copilot CLI container** that runs `copilot -p "<prompt>"` and streams stdout back to the backend
- Everything orchestrated via **Docker Compose**

> Goal: start *very basic* (input + send + textarea) and grow toward streaming + (optional) tool invocation and workspace access.

---

## Architecture

**Three services (containers):**

1) **frontend** (Vite/React + shadcn/ui)  
   - UI: prompt input, Send button, textarea output
   - Shows states: empty / waiting / streaming / done / error

2) **backend** (Node.js)  
   - Exposes `POST /api/chat`
   - Streams response to the browser (chunked fetch streaming first; SSE later optional)
   - Talks to the copilot container via the Docker network

3) **copilot** (Copilot CLI wrapper)  
   - Runs Copilot CLI installed via npm (Node 22+)
   - Exposes a small internal HTTP endpoint that:
     - accepts `{ prompt }`
     - spawns `copilot -p "<prompt>"`
     - streams stdout back to the caller

**Data flow:**

Browser → `frontend` → `backend` → `copilot` → Copilot CLI → `copilot` → `backend` → Browser

---

## Repo Layout (Monorepo)

```
copilot-playground/
  apps/
    web/                 # Vite + React + shadcn/ui
  services/
    backend/             # Node API streaming bridge
    copilot/             # HTTP wrapper around Copilot CLI
  workspace/             # optional host-mounted working dir (later)
  docker-compose.yml
  .env.example
  .gitignore
  idea.md
```

---

## Environment & Secrets

Create a local `.env` (not committed) based on `.env.example`.

- `GH_TOKEN=<fine-grained PAT>`  
  Recommended to use a fine-grained PAT that has **Copilot Requests** permission.  
  Keep this out of the repo and never bake it into images.

`.env.example`:

```
GH_TOKEN=__PASTE_YOUR_TOKEN_HERE__
```

---

## Container Responsibilities

### Frontend (Vite/React + shadcn/ui)

**UI components:**
- `Input` for the prompt
- `Button` to send
- `Textarea` read-only to display output

**State shape (suggestion):**
- `prompt: string`
- `output: string`
- `status: 'empty' | 'waiting' | 'streaming' | 'done' | 'error'`
- `error?: string`

**Streaming approach (recommended first):**
- `fetch("http://localhost:3000/api/chat", { method: "POST", body: ... })`
- Read `response.body` stream with `ReadableStream` and append chunks to `output`

---

### Backend (Node.js streaming bridge)

Expose:

- `POST /api/chat`  
  Body: `{ prompt: string }`  
  Response: streamed text

Backend responsibilities:
- Validate input
- Call the copilot service: `http://copilot:3210/chat`
- Pipe chunks from copilot to the browser
- Add safe defaults:
  - max prompt length
  - minimal logging
  - simple error handling
  - (later) rate limiting

---

### Copilot Container (CLI + wrapper API)

- Node 22 base image
- Install Copilot CLI via npm: `npm i -g @github/copilot`
- Receive `GH_TOKEN` via env
- Start a tiny server (e.g., Express) that:
  - `POST /chat` with `{ prompt }`
  - uses `spawn("copilot", ["-p", prompt])`
  - streams stdout (and optionally stderr) back

**Later upgrades:**
- Mount `workspace/` into `/workspace` and run with `WORKDIR /workspace`
- Persist Copilot config under a volume (e.g., `copilot_config:/root/.copilot`)

---

## Docker Compose Sketch

Ports (example):
- frontend: `5173:5173`
- backend: `3000:3000`
- copilot: internal only (optional `3210:3210` for debugging)

Volumes:
- hot reload mounts for frontend/backend
- optional `./workspace:/workspace`

---

## Milestones

### Milestone A — UI only (fake streaming)
**Goal:** frontend UX + streaming logic without any Copilot dependency.

**Deliverables:**
- Vite/React app with shadcn/ui input/button/textarea
- Backend that returns a fake streamed response (e.g., chunks every 100ms)

**Acceptance criteria:**
- Empty state: textarea shows a placeholder like “Type a prompt…”
- On Send: status becomes `waiting`, button disables, textarea shows “Waiting…”
- While streaming: output fills incrementally (chunked appends)
- On complete: status becomes `done`, button re-enables
- On error: status becomes `error`, error message visible

---

### Milestone B — Real Copilot (non-streaming first)
**Goal:** verify authentication + basic connectivity.

**Deliverables:**
- Copilot container builds and runs with `GH_TOKEN`
- Backend calls copilot wrapper and returns the final output (buffered)

**Acceptance criteria:**
- A simple prompt returns a response end-to-end
- Errors are readable (auth errors, missing token, etc.)
- Token remains server-side only

---

### Milestone C — End-to-end streaming (real stdout streaming)
**Goal:** stream Copilot’s stdout live into the UI.

**Deliverables:**
- Copilot wrapper uses `spawn()` and streams stdout chunk-by-chunk
- Backend pipes stream to the browser
- Frontend appends chunks in near real-time
- Capture stdout/stderr as structured log events tagged with `request_id` and stream them to the frontend log panel; persist NDJSON logs for optional export

**Acceptance criteria:**

- Large responses update progressively in the textarea
- Cancel/abort supported (optional but nice):
  - Frontend uses `AbortController`
  - Backend handles aborted connections cleanly
- Logs are visible in the UI log panel and can be exported as NDJSON/JSON for a session

---

### Milestone D — Safety toggles & UX polish

**Goal:** make it usable without becoming complex.

**Deliverables:**

- “Mode” selector in UI:
  - **Explain-only** (default; minimal/no tool usage)
  - **Project helper** (later; allows more)
- Basic token/error display improvements
- Clear loading indicators

**Acceptance criteria:**

- Mode is visible and changes backend flags (if any)
- Clear “what is happening” UI messaging

---

### Milestone E — Workspace access (optional)

**Goal:** allow prompts to reference files in a mounted directory.

**Deliverables:**

- `./workspace` mounted into copilot container at `/workspace`
- Wrapper runs in `/workspace` so CLI can read files if needed
- Guardrails:
  - start with read-only mount (optional)
  - or keep write disabled until you trust the flow

**Acceptance criteria:**

- Prompt can reference files present in `workspace/`
- System remains safe by default

---

### Milestone F — Switch to Copilot SDK (optional)

**Goal:** structured streaming/events and future extensibility.

**Deliverables:**

- Replace “spawn CLI” wrapper with a service that uses `@github/copilot-sdk`
- Keep the same backend/front-end interface so UX stays stable
- Define a structured event/logging design and EventBus to enable streaming logs and exports

**Acceptance criteria:**

- Streaming remains functional
- You can extend tool invocation more cleanly

---

## Suggested “First Session” Checklist

1) Create repo structure
2) Implement Milestone A:
   - frontend: input/button/textarea + states
   - backend: fake streaming endpoint
3) Add docker-compose for frontend + backend (no copilot yet)
4) Validate hot reload and streaming UI
5) Add copilot service and wire Milestone B

---

## Nice-to-have (Later)

- request history panel
- copy-to-clipboard
- prompt templates
- basic markdown rendering (optional)

### Logging & Eventbus 🔧

Add a lightweight logging service in each component (frontend, backend, copilot) that emits structured NDJSON events with fields: `timestamp`, `level`, `component`, `request_id`, `session_id`, `event_type`, `message`, and `meta`. Propagate a `request_id`/`session_id` from frontend → backend → copilot to stitch logs across components. Use an in-process EventBus (e.g., Node's `EventEmitter`) in the backend to decouple producers (HTTP handlers, process manager, streaming layer) from sinks (SSE publisher, file writer).

Transport options: SSE for simple server→browser streaming or WebSocket for two-way control (abort/export). UI features: a live log panel with filters (level, component, event_type) and an **Export logs** button to download NDJSON/JSON for a session. Persist logs to local NDJSON files or a lightweight DB (sqlite) for export and retention; implement rotation/TTL. Mask or scrub sensitive data and make telemetry opt-in.
