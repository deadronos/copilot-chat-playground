import { create } from 'zustand';

// UI state interface
export interface UIState {
  showDebug: boolean;
  spawnRate: number;
  selectedTool: 'red' | 'blue' | 'none';
  
  // Actions
  setShowDebug: (show: boolean) => void;
  setSpawnRate: (rate: number) => void;
  setSelectedTool: (tool: 'red' | 'blue' | 'none') => void;
}

// Create the UI store
export const useUIStore = create<UIState>((set) => ({
  showDebug: false,
  spawnRate: 1,
  selectedTool: 'none',
  
  setShowDebug: (show) => set({ showDebug: show }),
  setSpawnRate: (rate) => set({ spawnRate: rate }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
}));
