import { useGameStore } from "../store/gameStore";

export const GameOver = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const score = useGameStore((state) => state.score);

  if (!isGameOver) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        zIndex: 9999,
      }}
    >
      <h1 style={{ fontSize: "72px", margin: 0, fontFamily: "Arial, sans-serif" }}>
        GAME OVER
      </h1>
      <p style={{ fontSize: "32px", marginTop: "20px" }}>
        Distance: {Math.floor(score)}m
      </p>
      
      <button 
        onClick={() => {
            const state = useGameStore.getState();
            state.resetGame();
            state.startGame();
        }}
        style={{
            marginTop: '30px',
            padding: '15px 40px',
            fontSize: '24px',
            background: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}
      >
        RESTART
      </button>
    </div>
  );
};
