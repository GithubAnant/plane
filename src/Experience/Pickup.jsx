import { RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import * as THREE from "three";

export const Pickup = ({ model, initialPosition, scale }) => {
  const rigidBodyRef = useRef();
  const speed = 30; // Match global speed
  const gameState = useGameStore((state) => state.gameState);
  const incrementScore = useGameStore((state) => state.incrementScore);
  const [active, setActive] = useState(true);

  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;
    if (!rigidBodyRef.current) return;

    const currentPos = rigidBodyRef.current.translation();
    const newZ = currentPos.z - speed * delta;

    // Reset to front when it passes behind camera
    if (newZ < -160) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: newZ + 1250 }, 
        true
      );
      setActive(true); // Reactivate when recycled
      rigidBodyRef.current.setEnabled(true);
    } else {
      rigidBodyRef.current.setTranslation(
        { x: currentPos.x, y: currentPos.y, z: newZ },
        true
      );
    }
    
    // Rotate the pickup for visual flair
    if (active) {
        rigidBodyRef.current.setRotation(
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, state.clock.elapsedTime * 2, 0)),
            true
        );
    }
  });

  if (!active) return null; // Or render nothing but keep RB? Better to just disable RB?

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="hull" // Use hull for better fit or ball
      sensor // Sensor means it detects collision but doesn't physically hit
      position={initialPosition}
      onIntersectionEnter={({ other }) => {
        if (active && gameState === 'PLAYING') {
            console.log("Pickup collected!");
            incrementScore(50); // Bonus points
            setActive(false);
            // We need to keep the object logic running for recycling, so we just hide it visually and disable interaction
             rigidBodyRef.current.setTranslation({x: 0, y: -100, z: 0}, true); // Move away
        }
      }}
    >
      <primitive object={model.clone()} scale={scale} />
    </RigidBody>
  );
};
