# PR3: CanvasRenderer, useGame Hook, and Zustand Stores

## Objective

Refactor the Red vs Blue game to introduce a clean architecture with:
1. **CanvasRenderer** - Dedicated rendering class that reads from Zustand without causing React re-renders
2. **useGame Hook** - Orchestrates GameEngine and CanvasRenderer lifecycle
3. **Zustand Stores** - Centralized state management for game and UI state

## Requirements

### Functional Requirements
- ✅ Visual parity with baseline (canvas renders red/blue zones, entities, scores)
- ✅ Renderer reads from Zustand without causing React re-renders
- ✅ UI controls operate through useGame hook
- ✅ Game supports start, pause, resume, stop, reset operations
- ✅ Entities can be spawned for red and blue teams
- ✅ Collision detection between entities
- ✅ Score tracking when entities reach opposite side
- ✅ Debug mode to show entity count

### Technical Requirements
- ✅ Use Zustand for state management (not React state)
- ✅ CanvasRenderer subscribes directly to stores via `store.subscribe()`
- ✅ GameEngine interacts with stores via `getState()` and actions
- ✅ useGame hook exposes clean API for UI controls
- ✅ Separate concerns: engine (logic), renderer (display), hook (orchestration)

## Architecture

### Directory Structure
```
src/frontend/src/game/
├── stores/
│   ├── gameStore.ts      # Game entities, scores, state
│   └── uiStore.ts        # UI controls, debug mode
├── engine/
│   └── GameEngine.ts     # Game logic and physics
├── renderer/
│   └── CanvasRenderer.ts # Canvas rendering
├── hooks/
│   └── useGame.ts        # Orchestration hook
└── RedVsBlue.tsx         # Main component
```

### Data Flow

```
User Interaction
      ↓
UI Component (RedVsBlue)
      ↓
useGame Hook
      ↓
GameEngine ←→ Zustand Stores ←→ CanvasRenderer
      ↓                              ↓
   Updates                        Renders
```

### Key Design Decisions

1. **Zustand for State**: All game state (entities, scores, running status) lives in Zustand stores, not React state.

2. **Renderer Independence**: CanvasRenderer runs its own requestAnimationFrame loop and reads store state directly via `getState()`. It subscribes to changes but doesn't trigger React re-renders.

3. **Hook Orchestration**: useGame initializes both engine and renderer, manages their lifecycle, and exposes a clean API to React components.

4. **Separation of Concerns**:
   - GameEngine: Pure game logic (physics, collisions, scoring)
   - CanvasRenderer: Pure rendering (drawing to canvas)
   - useGame: Lifecycle and coordination
   - Stores: State management

## Implementation Details

### GameEngine
- Manages game loop with requestAnimationFrame
- Updates entity positions based on velocity
- Handles wall bouncing
- Detects collisions between entities
- Updates scores when entities reach goals
- Interacts with Zustand via `useGameStore.getState()` and action methods

### CanvasRenderer
- Runs independent render loop (60fps)
- Subscribes to Zustand stores via `store.subscribe()` for change notifications
- Reads state directly via `store.getState()` (no React re-renders)
- Renders: background zones, center line, entities, scores, debug info

### useGame Hook
- Initializes GameEngine and CanvasRenderer in useEffect
- Manages canvas ref setup
- Provides memoized control functions: start, pause, resume, stop, reset, spawnRed, spawnBlue
- Returns Zustand-subscribed values for React: isRunning, isPaused, redScore, blueScore
- Handles cleanup on unmount

### Zustand Stores

**gameStore.ts**:
- State: entities[], redScore, blueScore, isRunning, isPaused
- Actions: addEntity, updateEntity, removeEntity, updateScore, setRunning, setPaused, reset

**uiStore.ts**:
- State: showDebug, spawnRate, selectedTool
- Actions: setShowDebug, setSpawnRate, setSelectedTool

## Testing

### Manual Testing Performed
✅ Game starts and runs smoothly at 60fps  
✅ Pause/resume functionality works correctly  
✅ Stop and reset clear game state  
✅ Entities spawn from correct positions  
✅ Entities move across canvas  
✅ Collisions remove both entities  
✅ Scoring works when entities reach opposite side  
✅ Debug mode displays entity count  
✅ All UI controls are responsive  
✅ No React re-renders caused by canvas animation  

### Performance Characteristics
- Canvas updates at 60fps independent of React render cycle
- Game logic updates match animation frames
- No unnecessary React re-renders from game state changes (only from UI-relevant state)

## Acceptance Criteria

All acceptance criteria met:

✅ **Visual Parity**: Game looks and behaves as expected  
✅ **No React Re-renders from Renderer**: CanvasRenderer uses direct store access  
✅ **UI Controls via useGame**: All interactions go through the hook API  
✅ **Zustand State Management**: All state centralized in stores  
✅ **Clean Architecture**: Clear separation of concerns  

## Screenshots

See PR description for visual verification screenshots showing:
- Initial game state with canvas zones
- Game running with entities and scores
- Debug mode enabled

## Future Enhancements

Potential improvements for future PRs:
- Add entity types (different speeds, sizes)
- Implement power-ups or obstacles
- Add sound effects
- Persist high scores
- Add multiplayer support
- Implement AI-controlled spawning

## Related Documentation

- Zustand documentation: https://zustand-demo.pmnd.rs/
- Zustand game patterns: `.github/skills/zustand-game-patterns/SKILL.md`
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
