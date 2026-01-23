# 02 — Node.js/TypeScript quickstart

This guide assumes you’ll run the Copilot SDK in `src/copilot` and expose a small HTTP API that your backend can call.

## Install (package)

In a pnpm workspace, install the SDK into the `src/copilot` package.

> In this repo, we haven’t wired the SDK into runtime yet; this is a learning guide for the next milestone.

## Minimal session flow

The typical flow is:

1. Create a `CopilotClient`
2. Create a session: `client.createSession({ model, streaming, ... })`
3. Subscribe to events: `session.on(handler)`
4. Send a prompt:
   - `session.sendAndWait({ prompt })` (simple)
   - or `session.send({ prompt })` + handle events
5. Cleanup:
   - `session.destroy()`
   - `client.stop()`

## Why use `sendAndWait`?

`sendAndWait` is easiest for a playground because it blocks until the SDK reports the session is idle.
You still want streaming events for the UI, but your HTTP request handler can “await completion” to decide when to close the SSE stream.

## Recommended starting model

Use the smallest model that gives you good results for a playground.
You can later add a model selector in the UI.

## Sources

- Getting started (Node examples): <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
- Node SDK README: <https://github.com/github/copilot-sdk/blob/main/nodejs/README.md>
- Cookbook (Node recipes): <https://github.com/github/copilot-sdk/blob/main/cookbook/README.md>
