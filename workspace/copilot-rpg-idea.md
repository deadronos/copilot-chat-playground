# Clockwork Cores

## Premise
A compact 2D pixel RPG called **"Clockwork Cores"** where a tinkerer-AI (Copilot) explores deterministic, modular dungeons to recover stolen AI cores. Gameplay uses turn-based movement, gadgets, dialogue, and light crafting. Encounters blend combat, environmental puzzles, and hacking minigames so planning and long-horizon reasoning matter.

## Interface & Rules

- The game is grid-based and **fully observable** to the agent via a JSON state each turn, containing:
  - map viewport
  - entities (id, HP, status)
  - inventory
  - quest flags
  - available actions list
  - RNG seed
- The agent responds with a single action token from a small, fixed set:
  - `move_n` / `move_s` / `move_e` / `move_w`
  - `interact` / `hack` / `wait`
  - `craft:<recipe>` / `use:<item>` / `talk:<id>`
- All mechanics are deterministic given the RNG seed, so the agent can simulate outcomes reliably.

## Objectives & Evaluation

- **Primary objective:** recover N stolen AI cores.
- **Secondary objectives:** complete side quests and discover crafting unlocks.
- **Scoring:** based on turns taken (fewer is better), cores recovered, and side-quests completed.

## Benchmark Scenarios

Short scripted scenarios to evaluate planning and decision-making:

- **Tutorial:** basic movement, interaction, and simple crafting.
- **Trap puzzle:** requires path planning and timing to avoid hazards.
- **Negotiation:** uses dialogue and choice consequences to resolve encounters non-violently.
- **Multi-room planning:** tests long-horizon planning and resource management across rooms.
- **Hacking minigame:** deterministic puzzle rewarding non-combat solutions.

## Notes

- Keep action tokens compact to limit the decision space and make agent simulation tractable.
- Use the scenarios above to benchmark Copilot's planning, exploration, and long-horizon decision-making.
