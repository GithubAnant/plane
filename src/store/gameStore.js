import { create } from 'zustand';

export const useGameStore = create((set) => ({
  isGameOver: false,
  score: 0,
  setGameOver: (gameOver) => set({ isGameOver: gameOver }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  resetGame: () => set({ isGameOver: false, score: 0 }),
}));
