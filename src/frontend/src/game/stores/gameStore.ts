import { create } from 'zustand';

// Counter for generating unique entity IDs
let entityIdCounter = 0;

// Game entity types
export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 'red' | 'blue';
}

// Game state interface
export interface GameState {
  entities: Entity[];
  redScore: number;
  blueScore: number;
  isRunning: boolean;
  isPaused: boolean;
  
  // Actions
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  updateScore: (team: 'red' | 'blue', points: number) => void;
  setRunning: (running: boolean) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  entities: [],
  redScore: 0,
  blueScore: 0,
  isRunning: false,
  isPaused: false,
};

// Create the store
export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  addEntity: (entity) => set((state) => ({
    entities: [...state.entities, { ...entity, id: `entity-${++entityIdCounter}` }],
  })),
  
  updateEntity: (id, updates) => set((state) => ({
    entities: state.entities.map((e) => e.id === id ? { ...e, ...updates } : e),
  })),
  
  removeEntity: (id) => set((state) => ({
    entities: state.entities.filter((e) => e.id !== id),
  })),
  
  updateScore: (team, points) => set((state) => ({
    [team === 'red' ? 'redScore' : 'blueScore']: state[team === 'red' ? 'redScore' : 'blueScore'] + points,
  })),
  
  setRunning: (running) => set({ isRunning: running }),
  
  setPaused: (paused) => set({ isPaused: paused }),
  
  reset: () => set(initialState),
}));
