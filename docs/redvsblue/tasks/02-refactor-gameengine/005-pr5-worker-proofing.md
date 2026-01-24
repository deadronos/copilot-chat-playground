# PR 005 — Worker proofing & snapshot immutability

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Prepare the engine state for migration into a Web Worker by ensuring snapshots are plain serializable objects and adding tests to guarantee structured cloning works.

Objectives
----------
- Ensure GameState snapshots are free of functions, class instances with methods, DOM nodes, or circular references.
- Provide serialization helpers and tests.

Detailed tasks
--------------
1. Implement a serializer helper:
   - `src/frontend/src/redvsblue/engine/serialize.ts` that converts internal runtime structures into plain objects (`{ id, x, y, vx, vy, ... }`).
2. Update the Engine to call `gameState.setSnapshot(serialize(snapshot))` so the store always holds serializable snapshots.
3. Add tests:
   - `engine/serialize.spec.ts` that ensures `structuredClone(serialize(snapshot))` succeeds and produces deep-equal data.
4. Code audit: review all fields to ensure no functions, DOM refs, Maps, Sets, or circular refs.

Files to create/modify
---------------------
- Create: `engine/serialize.ts`
- Modify: `engine/engine.ts` to use serializer when emitting snapshots
- Tests: `engine/serialize.spec.ts`

Acceptance criteria
-------------------
- `structuredClone(snapshot)` succeeds in tests
- Worker migration step can be performed without additional data surgery

Estimated effort
----------------
- Small: 2–4 hours.

Rollback
--------
- Revert serializer usage and keep engine snapshots local until issues are resolved.
