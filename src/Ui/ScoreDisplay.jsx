import { useGameStore } from "../store/gameStore";

export const ScoreDisplay = () => {
  const score = useGameStore((state) => state.score);
  const isGameOver = useGameStore((state) => state.isGameOver);

  if (isGameOver) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "40px",
        right: "40px",
        fontSize: "48px",
        fontFamily: "monospace",
        fontWeight: "bold",
        color: "white",
        textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
        zIndex: 100,
      }}
    >
      {Math.floor(score)}m
    </div>
  );
};
