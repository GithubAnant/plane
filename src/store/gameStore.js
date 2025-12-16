import { create } from 'zustand';

export const useGameStore = create((set) => ({
  gameState: 'START', // START, PLAYING, GAMEOVER
  score: 0,
  
  startGame: () => set({ gameState: 'PLAYING', score: 0, isGameOver: false }),
  setGameOver: () => set({ gameState: 'GAMEOVER', isGameOver: true }),
  incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
  resetGame: () => set({ gameState: 'START', score: 0, isGameOver: false }),
  
  // Legacy support just in case
  isGameOver: false,
}));
