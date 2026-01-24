# Red vs Blue — Documentation Summary

Date: 2026-01-24T12:50:19.044Z

## Overview
- The original `redvsblue.html` game (src/frontend/redvsblue.html) was extracted into a React component at `src/frontend/src/redvsblue/RedVsBlue.tsx`.
- The component mounts a full-screen canvas and reimplements the original classes (Particle, Bullet, Ship) and the game loop inside a React `useEffect` hook; counts are tracked with React state and UI controls call spawn/reset functions via refs.

## Implementation details
- Game state: `ships[]`, `bullets[]`, `particles[]`, `stars[]`.
- Classes preserved: `Particle`, `Bullet`, `Ship` with same physics, AI, and collision code.
- Rendering: `requestAnimationFrame` loop updates and draws game objects and handles collisions.
- UI: top-bar shows RED/BLUE counts and controls to spawn or reset the simulation.

## Copilot SDK integration points
- Telemetry hooks: instrument `spawnShip()` (spawn), bullet collision handling (hit), ship death (death), and `resetSimulation()` (round start/end) to emit structured JSON events.
- Streaming pattern: send events via WebSocket or Server-Sent Events to a backend Copilot agent which can maintain per-round stats and return announcements, summaries, or TTS payloads.
- Feature ideas enabled: Battle Announcer (real-time play-by-play and per-round summaries), Strategy Advisor, Automated Highlights, Coach Mode, and Scenario/Balance Generator.

## Suggested next steps
- Extract the game engine into a `useGame` hook and define explicit TypeScript interfaces for ships/bullets/particles.
- Decouple AI, physics, and rendering to simplify testing and instrument telemetry points.
- Add an event emitter to the client and prototype a simple backend endpoint (WebSocket/SSE + Copilot SDK) to validate Battle Announcer and TTS flows.

## How to run
- Import `RedVsBlue` and mount in the app: `import RedVsBlue from './src/redvsblue/RedVsBlue';` then render `<RedVsBlue />` in your App or a route.

## Session log (brief)
- 2026-01-24T12:34:22.772Z: Reviewed original file and identified telemetry points.
- 2026-01-24T12:36:28.358Z: Saved integration ideas to `/plans/redvsblue/idea.md`.
- 2026-01-24T12:50:19.044Z: Extracted code and created React component at `src/frontend/src/redvsblue/RedVsBlue.tsx`; wrote this summary.
