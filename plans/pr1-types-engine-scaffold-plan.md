## Plan: Red vs Blue PR1 - Types & Engine Scaffold

Create strict TypeScript type definitions and minimal engine scaffold for the Red vs Blue game, extracting types from the existing RedVsBlue.tsx component while maintaining buildability. This establishes a foundation for future engine refactoring PRs and backend/Copilot server integration for game orchestration.

**Phases: 3**

### 1. **Phase 1: Core Type Definitions**
   - **Objective:** Create types.ts with all game entity interfaces, Vector2D type, Team union, and the Engine interface with event emitter/telemetry hooks
   - **Files/Functions to Modify/Create:** 
     - Create `src/frontend/src/redvsblue/types.ts`
     - Create `tests/frontend/unit/redvsblue/types.test.ts`
   - **Tests to Write:**
     - `should export all required types`
     - `should define Team as string union type`
     - `should define Vector2D interface with x and y properties`
     - `should define Engine interface with telemetry hooks`
   - **Steps:**
     1. Write test file in tests/frontend/unit/redvsblue/types.test.ts that imports and validates type exports exist
     2. Run test with `pnpm test` to see it fail (types don't exist yet)
     3. Create src/frontend/src/redvsblue/types.ts with:
        - Team type as `'red' | 'blue'` union
        - Vector2D interface with x, y number properties
        - Ship interface with id, team, position, velocity, angle, health, etc.
        - Bullet interface with id, team, position, velocity, etc.
        - Particle interface for visual effects
        - Star interface for background stars
        - GameState interface with ships, bullets, particles, stars arrays
        - EngineConfig interface with game configuration options
        - TelemetryEvent interface for backend communication
        - Engine interface with init, update, destroy methods and event emitter hooks for telemetry
     4. Add comprehensive JSDoc comments for all fields, especially those used by renderer and telemetry
     5. Run test to verify it passes
     6. Run `pnpm -F @copilot-playground/frontend build` to ensure TypeScript compilation succeeds

### 2. **Phase 2: Engine Scaffold**
   - **Objective:** Create engine module that re-exports types and provides createEngine stub for future implementation
   - **Files/Functions to Modify/Create:**
     - Create `src/frontend/src/redvsblue/engine/index.ts`
     - Create `tests/frontend/unit/redvsblue/engine.test.ts`
   - **Tests to Write:**
     - `should export createEngine function`
     - `should re-export all types from types.ts`
     - `should return Engine stub with all required methods`
     - `should accept optional EngineConfig parameter`
   - **Steps:**
     1. Write test in tests/frontend/unit/redvsblue/engine.test.ts that imports createEngine and verifies it returns an Engine interface
     2. Run test to see it fail
     3. Create src/frontend/src/redvsblue/engine/index.ts that re-exports all types from ../types
     4. Implement createEngine(config?: EngineConfig): Engine function returning minimal Engine interface implementation with stub methods
     5. Add TODO comments indicating this is a placeholder for future PRs that will implement:
        - Full game loop
        - Physics engine
        - AI logic
        - Backend/Copilot server integration for game orchestration
     6. Ensure all Engine interface methods are present but return empty/default values
     7. Run test to verify it passes
     8. Run build to ensure module resolution works correctly

### 3. **Phase 3: Build Verification**
   - **Objective:** Verify all tests pass, project builds successfully, and dev server starts without errors
   - **Files/Functions to Modify/Create:**
     - No new files (verification only)
   - **Tests to Write:**
     - No new tests (verification phase)
   - **Steps:**
     1. Run full test suite: `pnpm test` to ensure all tests pass
     2. Run TypeScript compilation: `pnpm -F @copilot-playground/frontend build` to verify no compilation errors
     3. Verify dev server starts without errors: `pnpm -F @copilot-playground/frontend dev` (check it compiles cleanly, then stop)
     4. Confirm no runtime behavior changes in existing RedVsBlue component
     5. Run lint if configured: `pnpm lint` to ensure code style compliance

**Decisions Made:**

1. ✅ Team type: String union `'red' | 'blue'` for simplicity
2. ✅ Vector2D: Dedicated interface type for clarity and reusability
3. ✅ Constants: Include in types.ts for now (can be extracted later)
4. ✅ Engine interface: Include event emitter/telemetry hooks (interface only, no implementation) for future backend/Copilot server integration
