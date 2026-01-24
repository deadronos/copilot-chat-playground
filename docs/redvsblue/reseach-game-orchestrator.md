# Research: AI Game Orchestration Architecture
**Project:** Red vs. Blue Space Combat Orchestrator  
**Date:** January 2026

## 1. Executive Summary
This document explores the architectural patterns for integrating an AI "Director" into a Dockerized game environment. By utilizing the Copilot SDK, the system transitions from a static simulation to a dynamic, reactive experience where an AI agent analyzes game states and issues strategic commands.

---

## 2. The Architectural Patterns

### Pattern A: The "Passive Observer"
The AI receives state updates but has no write-access to the game. It only generates "Radio Chatter" or narrative toasts.
* **Pros:** Safe; low risk of breaking game logic; zero impact on game balance.
* **Cons:** Limited engagement; the AI cannot "help" a losing team.

### Pattern B: The "Active Dungeon Master" (Recommended)
The AI receives the state and returns structured instructions (JSON) that the Game Engine executes directly.
* **Pros:** High player immersion; dynamic difficulty adjustment; infinite replayability.
* **Cons:** Requires strict validation to prevent the AI from spawning 1,000 ships and crashing the client.

### Pattern C: The "Middleware Referee"
The AI suggests an action (e.g., "Spawn 5 ships"), but a backend logic layer checks if that action is "legal" (e.g., does the AI have enough points/mana?).
* **Pros:** Most stable; prevents AI "cheating" or hallucinations.
* **Cons:** More complex code on the backend server.

---

## 3. Communication Strategy: JSON Snapshots
To keep the AI focused, we use **Lossy Serialization**. Instead of every coordinate, we send a strategic summary.

**Example Payload:**
```json
{
  "gameState": {
    "red_ships": 3,
    "blue_ships": 15,
    "winning_team": "blue",
    "last_major_event": "Red Flagship destroyed"
  },
  "objective": "Determine if Red needs reinforcements to stay competitive."
}