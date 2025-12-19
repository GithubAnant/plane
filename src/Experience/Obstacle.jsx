import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePartyKitStore } from "../hooks";
import { useGameStore } from "../store/gameStore";

export const Obstacle = ({ model, initialPosition, scale }) => {
  const rigidBodyRef = useRef();
  const speed = 30;

  const gameState = useGameStore((state) => state.gameState);

  useEffect(() => {
    if (gameState === 'START' && rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation(
            { x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] },
            true
        );
    }
  }, [gameState, initialPosition]);
  
  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;
    
    // We can rely on global state or still use PartyKit if we want to sync start? 
    // But PlayerController handles start. Obstacles just move when playing.
    if (!rigidBodyRef.current) return;

    const currentPos = rigidBodyRef.current.translation();
    const newZ = currentPos.z - speed * delta;

    // Reset to front when it passes behind camera
    if (newZ < -160) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: newZ + 1250 }, // Reset to end of queue (50 obs * 25 spacing)
        true
      );
    } else {
      rigidBodyRef.current.setTranslation(
        { x: currentPos.x, y: currentPos.y, z: newZ },
        true
      );
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="cuboid"
      position={initialPosition}
    >
      <primitive object={model.clone()} scale={scale} />
    </RigidBody>
  );
};
